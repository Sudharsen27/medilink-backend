// const formatDate = (date) =>
//   new Date(date).toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });

// exports.appointmentStatusTemplate = ({
//   name,
//   status,
//   doctor,
//   date,
//   time,
// }) => {
//   const statusColor =
//     status === "confirmed"
//       ? "#16a34a"
//       : status === "cancelled"
//       ? "#dc2626"
//       : "#2563eb";

//   const statusText = status.toUpperCase();

//   return `
//   <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px">
//     <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden">
      
//       <!-- Header -->
//       <div style="background:#2563eb; color:white; padding:16px; text-align:center">
//         <h2 style="margin:0">Medilink</h2>
//         <p style="margin:4px 0 0; font-size:14px">Healthcare Appointment System</p>
//       </div>

//       <!-- Body -->
//       <div style="padding:24px; color:#333">
//         <p>Hello <b>${name}</b>,</p>

//         <p>
//           Your appointment has been 
//           <b style="color:${statusColor}">${statusText}</b>.
//         </p>

//         <div style="background:#f9fafb; padding:16px; border-radius:6px; margin:16px 0">
//           <p><b>👨‍⚕️ Doctor:</b> ${doctor}</p>
//           <p><b>📅 Date:</b> ${formatDate(date)}</p>
//           <p><b>⏰ Time:</b> ${time}</p>
//         </div>

//         ${
//           status === "cancelled"
//             ? `<p style="color:#dc2626">
//                 You may rebook your appointment anytime from the app.
//                </p>`
//             : ""
//         }

//         <p style="margin-top:24px">
//           Thank you for choosing <b>Medilink</b>.
//         </p>
//       </div>

//       <!-- Footer -->
//       <div style="background:#f1f5f9; padding:12px; text-align:center; font-size:12px; color:#555">
//         © ${new Date().getFullYear()} Medilink. All rights reserved.
//       </div>
//     </div>
//   </div>
//   `;
// };

// // utils
// const formatDate = (date) =>
//   new Date(date).toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });

// // shared layout wrapper
// const emailWrapper = (title, subtitle, bodyContent) => `
//   <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px">
//     <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden">

//       <!-- Header -->
//       <div style="background:#2563eb; color:white; padding:16px; text-align:center">
//         <h2 style="margin:0">Medilink</h2>
//         <p style="margin:4px 0 0; font-size:14px">${subtitle}</p>
//       </div>

//       <!-- Body -->
//       <div style="padding:24px; color:#333">
//         ${bodyContent}
//       </div>

//       <!-- Footer -->
//       <div style="background:#f1f5f9; padding:12px; text-align:center; font-size:12px; color:#555">
//         © ${new Date().getFullYear()} Medilink. All rights reserved.
//       </div>

//     </div>
//   </div>
// `;

// /* =====================================================
//    Appointment Status Template
// ===================================================== */
// exports.appointmentStatusTemplate = ({
//   name,
//   status,
//   doctor,
//   date,
//   time,
// }) => {
//   const statusColor =
//     status === "confirmed"
//       ? "#16a34a"
//       : status === "cancelled"
//       ? "#dc2626"
//       : "#2563eb";

//   const statusText = status.toUpperCase();

//   return emailWrapper(
//     "Appointment Status",
//     "Healthcare Appointment Update",
//     `
//       <p>Hello <b>${name}</b>,</p>

//       <p>
//         Your appointment has been
//         <b style="color:${statusColor}">${statusText}</b>.
//       </p>

//       <div style="background:#f9fafb; padding:16px; border-radius:6px; margin:16px 0">
//         <p><b>👨‍⚕️ Doctor:</b> ${doctor}</p>
//         <p><b>📅 Date:</b> ${formatDate(date)}</p>
//         <p><b>⏰ Time:</b> ${time}</p>
//       </div>

//       ${
//         status === "cancelled"
//           ? `<p style="color:#dc2626">
//               You can rebook your appointment anytime from the Medilink app.
//             </p>`
//           : ""
//       }

//       <p style="margin-top:24px">
//         Thank you for choosing <b>Medilink</b>.
//       </p>
//     `
//   );
// };

// /* =====================================================
//    Appointment Reschedule Template
// ===================================================== */
// exports.appointmentRescheduleTemplate = ({
//   name,
//   doctor,
//   oldDate,
//   oldTime,
//   newDate,
//   newTime,
// }) => {
//   return emailWrapper(
//     "Appointment Rescheduled",
//     "Schedule Update Notification",
//     `
//       <p>Hello <b>${name}</b>,</p>

//       <p>Your appointment has been <b style="color:#2563eb">RESCHEDULED</b>.</p>

//       <div style="background:#f9fafb; padding:16px; border-radius:6px; margin:16px 0">
//         <h4 style="margin:0 0 8px">Previous Schedule</h4>
//         <p>📅 ${formatDate(oldDate)} | ⏰ ${oldTime}</p>
//       </div>

//       <div style="background:#f0fdf4; padding:16px; border-radius:6px; margin:16px 0">
//         <h4 style="margin:0 0 8px">New Schedule</h4>
//         <p>📅 ${formatDate(newDate)} | ⏰ ${newTime}</p>
//       </div>

//       <p style="margin-top:16px">
//         👨‍⚕️ Doctor: <b>${doctor}</b>
//       </p>

//       <p style="margin-top:24px">
//         Thank you for using <b>Medilink</b>.
//       </p>
//     `
//   );
// };


/* =====================================================
   Utils
===================================================== */

// ✅ Safe date formatter (NO Invalid Date ever)
const formatDate = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

// ✅ Safe text fallback
const safe = (value) => (value ? value : "—");

// =====================================================
// Shared Email Wrapper
// =====================================================
const emailWrapper = (title, subtitle, bodyContent) => `
  <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px">
    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden">

      <!-- Header -->
      <div style="background:#2563eb; color:white; padding:16px; text-align:center">
        <h2 style="margin:0">Medilink</h2>
        <p style="margin:4px 0 0; font-size:14px">${subtitle}</p>
      </div>

      <!-- Body -->
      <div style="padding:24px; color:#333">
        ${bodyContent}
      </div>

      <!-- Footer -->
      <div style="background:#f1f5f9; padding:12px; text-align:center; font-size:12px; color:#555">
        © ${new Date().getFullYear()} Medilink. All rights reserved.
      </div>

    </div>
  </div>
`;

/* =====================================================
   Appointment Status Template
===================================================== */
exports.appointmentStatusTemplate = ({
  name,
  status,
  doctor,
  date,
  time,
  meetLink,
}) => {
  const statusColor =
    status === "confirmed"
      ? "#16a34a"
      : status === "cancelled"
      ? "#dc2626"
      : "#2563eb";

  const statusText = safe(status).toUpperCase();

  return emailWrapper(
    "Appointment Status",
    "Healthcare Appointment Update",
    `
      <p>Hello <b>${safe(name)}</b>,</p>

      <p>
        Your appointment has been
        <b style="color:${statusColor}"> ${statusText}</b>.
      </p>

      <div style="background:#f9fafb; padding:16px; border-radius:6px; margin:16px 0">
        <p><b>👨‍⚕️ Doctor:</b> ${safe(doctor)}</p>
        <p><b>📅 Date:</b> ${formatDate(date)}</p>
        <p><b>⏰ Time:</b> ${safe(time)}</p>
      </div>

      ${
        meetLink && status === "confirmed"
          ? `<p style="margin:16px 0">
              <a href="${safe(meetLink)}"
                 style="display:inline-block;background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
                Join Google Meet
              </a>
            </p>`
          : ""
      }

      ${
        status === "cancelled"
          ? `<p style="color:#dc2626">
              You can rebook your appointment anytime from the Medilink app.
            </p>`
          : ""
      }

      <p style="margin-top:24px">
        Thank you for choosing <b>Medilink</b>.
      </p>
    `
  );
};

/* =====================================================
   Appointment Reschedule Template
===================================================== */
exports.appointmentRescheduleTemplate = ({
  name,
  doctor,
  oldDate,
  oldTime,
  newDate,
  newTime,
}) => {
  return emailWrapper(
    "Appointment Rescheduled",
    "Schedule Update Notification",
    `
      <p>Hello <b>${safe(name)}</b>,</p>

      <p>
        Your appointment has been
        <b style="color:#2563eb"> RESCHEDULED</b>.
      </p>

      <div style="background:#f9fafb; padding:16px; border-radius:6px; margin:16px 0">
        <h4 style="margin:0 0 8px">Previous Schedule</h4>
        <p>📅 ${formatDate(oldDate)} | ⏰ ${safe(oldTime)}</p>
      </div>

      <div style="background:#f0fdf4; padding:16px; border-radius:6px; margin:16px 0">
        <h4 style="margin:0 0 8px">New Schedule</h4>
        <p>📅 ${formatDate(newDate)} | ⏰ ${safe(newTime)}</p>
      </div>

      <p style="margin-top:16px">
        👨‍⚕️ Doctor: <b>${safe(doctor)}</b>
      </p>

      <p style="margin-top:24px">
        Thank you for using <b>Medilink</b>.
      </p>
    `
  );
};
