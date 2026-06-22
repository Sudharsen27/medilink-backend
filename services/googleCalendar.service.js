const { google } = require("googleapis");

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";
const DEFAULT_DURATION_MINUTES = 30;

const isOAuthConfigured = () =>
  Boolean(
    process.env.GOOGLE_CALENDAR_ID &&
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_CALENDAR_REFRESH_TOKEN
  );

const isServiceAccountConfigured = () =>
  Boolean(
    process.env.GOOGLE_CALENDAR_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  );

const isConfigured = () => isOAuthConfigured() || isServiceAccountConfigured();

/** Google Meet via API needs OAuth on personal Gmail; service accounts get calendar-only. */
const canCreateMeet = () => isOAuthConfigured();

const getAuthClient = () => {
  if (isOAuthConfigured()) {
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_OAUTH_REDIRECT_URI || "http://localhost:5000/oauth2callback"
    );
    oauth2.setCredentials({
      refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
    });
    return oauth2;
  }

  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  const options = {
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: [CALENDAR_SCOPE],
  };

  if (process.env.GOOGLE_CALENDAR_IMPERSONATE_EMAIL) {
    options.subject = process.env.GOOGLE_CALENDAR_IMPERSONATE_EMAIL;
  }

  return new google.auth.JWT(options);
};

const getCalendarClient = () => {
  const auth = getAuthClient();
  return google.calendar({ version: "v3", auth });
};

const extractMeetLink = (event) => {
  const videoEntry = event?.conferenceData?.entryPoints?.find(
    (entry) => entry.entryPointType === "video"
  );
  return videoEntry?.uri || event?.hangoutLink || null;
};

const normalizeDate = (value) => {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }

  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getUTCFullYear();
    const m = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const d = String(parsed.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return null;
};

const normalizeTime = (value) => {
  if (!value) return null;
  return String(value).slice(0, 8);
};

const toRfc3339 = (date, time, timezone) => {
  const datePart = normalizeDate(date);
  const timePart = normalizeTime(time);
  const normalizedTime = timePart.length === 5 ? `${timePart}:00` : timePart;
  return { dateTime: `${datePart}T${normalizedTime}`, timeZone: timezone };
};

const addMinutes = (date, time, minutes) => {
  const datePart = normalizeDate(date);
  const timePart = normalizeTime(time).slice(0, 5);
  const start = new Date(`${datePart}T${timePart}:00`);
  start.setMinutes(start.getMinutes() + minutes);

  return {
    date: start.toISOString().slice(0, 10),
    time: start.toTimeString().slice(0, 8),
  };
};

const isMeetConferenceError = (error) => {
  const message = error?.message || "";
  const apiMessage = error?.response?.data?.error?.message || "";
  return (
    message.includes("Invalid conference type") ||
    apiMessage.includes("Invalid conference type")
  );
};

const buildEventBody = ({
  summary,
  description,
  date,
  time,
  attendeeEmails,
  requestId,
  withMeet,
  timezone,
  includeAttendees,
}) => {
  const end = addMinutes(date, time, DEFAULT_DURATION_MINUTES);

  const body = {
    summary,
    description,
    start: toRfc3339(date, time, timezone),
    end: toRfc3339(end.date, end.time, timezone),
    reminders: { useDefault: true },
  };

  if (includeAttendees && attendeeEmails.length) {
    body.attendees = attendeeEmails.filter(Boolean).map((email) => ({ email }));
  }

  if (withMeet) {
    body.conferenceData = {
      createRequest: {
        requestId: requestId || `medilink-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  return body;
};

const createMeetingEvent = async ({
  summary,
  description,
  date,
  time,
  attendeeEmails = [],
  requestId,
}) => {
  if (!isConfigured()) {
    return null;
  }

  const timezone = process.env.GOOGLE_CALENDAR_TIMEZONE || "Asia/Kolkata";
  const calendar = getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const wantMeet = canCreateMeet();
  const includeAttendees = isOAuthConfigured();

  const insertEvent = async (withMeet) =>
    calendar.events.insert({
      calendarId,
      conferenceDataVersion: withMeet ? 1 : 0,
      sendUpdates: includeAttendees && attendeeEmails.length ? "all" : "none",
      requestBody: buildEventBody({
        summary,
        description,
        date,
        time,
        attendeeEmails,
        requestId,
        withMeet,
        timezone,
        includeAttendees,
      }),
    });

  try {
    const response = await insertEvent(wantMeet);
    return {
      eventId: response.data.id,
      meetLink: extractMeetLink(response.data),
      calendarLink: response.data.htmlLink,
    };
  } catch (error) {
    if (wantMeet && isMeetConferenceError(error)) {
      console.warn(
        "Google Meet not available with current credentials; creating calendar event without Meet."
      );
      const response = await insertEvent(false);
      return {
        eventId: response.data.id,
        meetLink: null,
        calendarLink: response.data.htmlLink,
      };
    }
    throw error;
  }
};

const updateMeetingEvent = async ({
  eventId,
  summary,
  description,
  date,
  time,
}) => {
  if (!isConfigured() || !eventId) {
    return null;
  }

  const timezone = process.env.GOOGLE_CALENDAR_TIMEZONE || "Asia/Kolkata";
  const calendar = getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  const response = await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: {
      summary,
      description,
      start: toRfc3339(date, time, timezone),
      end: toRfc3339(
        addMinutes(date, time, DEFAULT_DURATION_MINUTES).date,
        addMinutes(date, time, DEFAULT_DURATION_MINUTES).time,
        timezone
      ),
    },
  });

  return {
    eventId: response.data.id,
    meetLink: extractMeetLink(response.data),
    calendarLink: response.data.htmlLink,
  };
};

const cancelMeetingEvent = async (eventId) => {
  if (!isConfigured() || !eventId) {
    return false;
  }

  const calendar = getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  await calendar.events.delete({
    calendarId,
    eventId,
  });

  return true;
};

module.exports = {
  isConfigured,
  canCreateMeet,
  isOAuthConfigured,
  createMeetingEvent,
  updateMeetingEvent,
  cancelMeetingEvent,
  extractMeetLink,
};
