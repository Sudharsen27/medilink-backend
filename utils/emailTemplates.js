const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

exports.appointmentStatusTemplate = ({
  name,
  status,
  doctor,
  date,
  time,
}) => {
  const statusColor =
    status === "confirmed"
      ? "#16a34a"
      : status === "cancelled"
      ? "#dc2626"
      : "#2563eb";

  const statusText = status.toUpperCase();

  return `
  <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px">
    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden">
      
      <!-- Header -->
      <div style="background:#2563eb; color:white; padding:16px; text-align:center">
        <h2 style="margin:0">Medilink</h2>
        <p style="margin:4px 0 0; font-size:14px">Healthcare Appointment System</p>
      </div>

      <!-- Body -->
      <div style="padding:24px; color:#333">
        <p>Hello <b>${name}</b>,</p>

        <p>
          Your appointment has been 
          <b style="color:${statusColor}">${statusText}</b>.
        </p>

        <div style="background:#f9fafb; padding:16px; border-radius:6px; margin:16px 0">
          <p><b>👨‍⚕️ Doctor:</b> ${doctor}</p>
          <p><b>📅 Date:</b> ${formatDate(date)}</p>
          <p><b>⏰ Time:</b> ${time}</p>
        </div>

        ${
          status === "cancelled"
            ? `<p style="color:#dc2626">
                You may rebook your appointment anytime from the app.
               </p>`
            : ""
        }

        <p style="margin-top:24px">
          Thank you for choosing <b>Medilink</b>.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f1f5f9; padding:12px; text-align:center; font-size:12px; color:#555">
        © ${new Date().getFullYear()} Medilink. All rights reserved.
      </div>
    </div>
  </div>
  `;
};
