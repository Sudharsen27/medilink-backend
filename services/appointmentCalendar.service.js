const pool = require("../config/db");
const googleCalendar = require("./googleCalendar.service");

let columnsReady = false;

const VIDEO_TYPES = new Set(["video", "telemedicine"]);

const ensureCalendarColumns = async () => {
  if (columnsReady) return;

  await pool.query(`
    ALTER TABLE appointments
      ADD COLUMN IF NOT EXISTS google_event_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS meet_link TEXT,
      ADD COLUMN IF NOT EXISTS calendar_link TEXT,
      ADD COLUMN IF NOT EXISTS calendar_synced_at TIMESTAMPTZ
  `);

  columnsReady = true;
};

const isVideoAppointment = (appointment) => {
  const type = String(
    appointment.appointment_type || appointment.consultationType || ""
  ).toLowerCase();
  return VIDEO_TYPES.has(type);
};

const shouldCreateOnBook = () =>
  process.env.GOOGLE_CALENDAR_CREATE_ON_BOOK === "true";

const buildEventMeta = (appointment) => {
  const doctor = appointment.doctor_name || "Doctor";
  const patient = appointment.patient_name || appointment.name || "Patient";
  const date = appointment.date || appointment.appointment_date;
  const time = appointment.time || appointment.appointment_time;

  return {
    summary: `MediLink: ${patient} with Dr. ${doctor}`,
    description: [
      "MediLink healthcare appointment",
      `Patient: ${patient}`,
      `Doctor: ${doctor}`,
      appointment.patient_phone ? `Phone: ${appointment.patient_phone}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    date,
    time,
    attendeeEmails: [appointment.email].filter(Boolean),
    requestId: `medilink-appt-${appointment.id}-${Date.now()}`,
  };
};

const persistCalendarSync = async (
  appointmentId,
  { eventId, meetLink, calendarLink }
) => {
  const { rows } = await pool.query(
    `UPDATE appointments
     SET google_event_id = $1,
         meet_link = $2,
         calendar_link = $3,
         calendar_synced_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING *`,
    [eventId, meetLink, calendarLink, appointmentId]
  );

  return rows[0] || null;
};

const clearCalendarSync = async (appointmentId) => {
  const { rows } = await pool.query(
    `UPDATE appointments
     SET google_event_id = NULL,
         meet_link = NULL,
         calendar_link = NULL,
         calendar_synced_at = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [appointmentId]
  );

  return rows[0] || null;
};

const syncAppointmentCalendar = async (appointment, { force = false } = {}) => {
  if (!googleCalendar.isConfigured()) {
    return appointment;
  }

  if (!force && !isVideoAppointment(appointment)) {
    return appointment;
  }

  if (appointment.google_event_id && !force) {
    return appointment;
  }

  try {
    await ensureCalendarColumns();

    const meta = buildEventMeta(appointment);
    if (!meta.date || !meta.time) {
      return appointment;
    }

    const created = await googleCalendar.createMeetingEvent(meta);
    if (!created?.eventId) {
      return appointment;
    }

    return (
      (await persistCalendarSync(appointment.id, {
        eventId: created.eventId,
        meetLink: created.meetLink,
        calendarLink: created.calendarLink,
      })) || appointment
    );
  } catch (error) {
    console.error("Google Calendar sync failed:", error.message);
    if (error.response?.data?.error) {
      console.error(error.response.data.error.message);
    }
    return appointment;
  }
};

const updateAppointmentCalendar = async (appointment) => {
  if (!googleCalendar.isConfigured() || !appointment.google_event_id) {
    return syncAppointmentCalendar(appointment, { force: true });
  }

  try {
    await ensureCalendarColumns();

    const meta = buildEventMeta(appointment);
    const updated = await googleCalendar.updateMeetingEvent({
      eventId: appointment.google_event_id,
      ...meta,
    });

    if (!updated) {
      return appointment;
    }

    return (
      (await persistCalendarSync(appointment.id, {
        eventId: updated.eventId,
        meetLink: updated.meetLink || appointment.meet_link,
        calendarLink: updated.calendarLink || appointment.calendar_link,
      })) || appointment
    );
  } catch (error) {
    console.error("Google Calendar update failed:", error.message);
    return appointment;
  }
};

const cancelAppointmentCalendar = async (appointment) => {
  if (!googleCalendar.isConfigured() || !appointment.google_event_id) {
    return appointment;
  }

  try {
    await googleCalendar.cancelMeetingEvent(appointment.google_event_id);
    return (await clearCalendarSync(appointment.id)) || appointment;
  } catch (error) {
    console.error("Google Calendar cancel failed:", error.message);
    return appointment;
  }
};

const maybeSyncOnCreate = async (appointment) => {
  if (!shouldCreateOnBook()) {
    return appointment;
  }
  return syncAppointmentCalendar(appointment);
};

const maybeSyncOnConfirm = async (appointment) => {
  if (appointment.status !== "confirmed") {
    return appointment;
  }
  return syncAppointmentCalendar(appointment, {
    force: !appointment.google_event_id,
  });
};

module.exports = {
  ensureCalendarColumns,
  isVideoAppointment,
  syncAppointmentCalendar,
  updateAppointmentCalendar,
  cancelAppointmentCalendar,
  maybeSyncOnCreate,
  maybeSyncOnConfirm,
};
