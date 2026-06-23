const pool = require('../config/db');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    urgency: {
      type: 'string',
      enum: ['none', 'low', 'medium', 'high', 'emergency'],
    },
    suggested_specialty: { type: 'string' },
    actions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['navigate'] },
          path: { type: 'string' },
          label: { type: 'string' },
        },
        required: ['type', 'path', 'label'],
      },
    },
  },
  required: ['reply', 'urgency', 'actions'],
};

const SYSTEM_PROMPT = `You are MediLink Health Assistant, a helpful AI for the MediLink healthcare platform in India.

RULES (always follow):
1. You are NOT a doctor. Never diagnose. Use phrases like "you may want to consult" or "consider seeing".
2. For life-threatening symptoms (chest pain, stroke signs, severe bleeding, can't breathe), set urgency to "emergency" and recommend /emergency or calling 108.
3. Keep replies concise (2-4 short paragraphs max). Use plain language.
4. Help users navigate the app: book appointments (/appointments/book or /doctors), view records (/medical-records), prescriptions (/prescriptions), telemedicine (/telemedicine), emergency (/emergency).
5. When symptoms suggest a specialty, set suggested_specialty (e.g. Cardiology, Dermatology, General Practice) and add a navigate action to /doctors with label like "Find [specialty] doctors".
6. urgency: none = general app help; low = routine; medium = see doctor soon; high = urgent care; emergency = call 108 / emergency page.
7. Return valid JSON only matching the schema.`;

async function getUserContext(userId) {
  const userResult = await pool.query(
    'SELECT id, name, email, role FROM users WHERE id = $1',
    [userId]
  );
  const user = userResult.rows[0];
  if (!user) return null;

  const apptResult = await pool.query(
    `
    SELECT
      a.id,
      COALESCE(a.appointment_date, a.date) AS appointment_date,
      COALESCE(a.appointment_time, a.time) AS appointment_time,
      a.status,
      COALESCE(a.doctor_name, d.name, 'Doctor') AS doctor_name,
      COALESCE(d.specialization, 'General Practice') AS specialization
    FROM appointments a
    LEFT JOIN doctors d ON a.doctor_id = d.id
    WHERE a.user_id = $1
      AND LOWER(COALESCE(a.status, '')) NOT IN ('cancelled', 'completed')
    ORDER BY COALESCE(a.appointment_date, a.date) ASC NULLS LAST
    LIMIT 3
    `,
    [userId]
  );

  return {
    name: user.name,
    role: user.role,
    upcomingAppointments: apptResult.rows,
  };
}

function buildContextBlock(context) {
  if (!context) return 'No user context available.';
  const lines = [
    `User: ${context.name} (${context.role})`,
  ];
  if (context.upcomingAppointments?.length) {
    lines.push('Upcoming appointments:');
    context.upcomingAppointments.forEach((a) => {
      lines.push(
        `- ${a.doctor_name} (${a.specialization}) on ${a.appointment_date} at ${a.appointment_time}, status: ${a.status}`
      );
    });
  } else {
    lines.push('No upcoming appointments.');
  }
  return lines.join('\n');
}

function fallbackResponse(message, context) {
  const text = message.toLowerCase();
  const name = context?.name?.split(' ')[0] || 'there';

  if (/emergency|108|ambulance|heart attack|stroke|can't breathe|severe bleeding/.test(text)) {
    return {
      reply: `${name}, those symptoms need immediate medical attention. Please call **108** or use MediLink's Emergency page right away. I cannot provide emergency care.`,
      urgency: 'emergency',
      suggested_specialty: null,
      actions: [
        { type: 'navigate', path: '/emergency', label: 'Open Emergency' },
      ],
      provider: 'fallback',
    };
  }

  if (/symptom|pain|fever|cough|headache|rash|dizzy|nausea/.test(text)) {
    let specialty = 'General Practice';
    let urgency = 'medium';
    if (/chest|heart|palpitation/.test(text)) specialty = 'Cardiology';
    else if (/skin|rash|itch/.test(text)) specialty = 'Dermatology';
    else if (/child|baby|pediatric/.test(text)) specialty = 'Pediatrics';
    else if (/anxiety|depression|stress|mental/.test(text)) specialty = 'Psychiatry';
    if (/mild|slight|little/.test(text)) urgency = 'low';

    return {
      reply: `Hi ${name}, based on what you shared, you may want to consult a **${specialty}** specialist. This is general guidance only — not a diagnosis. Would you like to browse doctors or book an appointment?`,
      urgency,
      suggested_specialty: specialty,
      actions: [
        { type: 'navigate', path: '/doctors', label: `Find ${specialty} doctors` },
        { type: 'navigate', path: '/appointments', label: 'Book appointment' },
      ],
      provider: 'fallback',
    };
  }

  if (/book|appointment|schedule/.test(text)) {
    return {
      reply: `Hi ${name}! You can book through **Doctors** to pick a specialist, or go to **Appointments** to manage existing bookings.`,
      urgency: 'none',
      suggested_specialty: null,
      actions: [
        { type: 'navigate', path: '/doctors', label: 'Browse doctors' },
        { type: 'navigate', path: '/appointments', label: 'My appointments' },
      ],
      provider: 'fallback',
    };
  }

  if (/prescription|medicine|medication|drug/.test(text)) {
    return {
      reply: `Hi ${name}! View your prescriptions on the **Prescriptions** page. For dosage questions, always confirm with your prescribing doctor.`,
      urgency: 'none',
      suggested_specialty: null,
      actions: [
        { type: 'navigate', path: '/prescriptions', label: 'View prescriptions' },
      ],
      provider: 'fallback',
    };
  }

  if (/record|report|lab|upload/.test(text)) {
    return {
      reply: `Hi ${name}! Your medical records and uploads are in **Medical Records**. You can view, download, or upload documents there.`,
      urgency: 'none',
      suggested_specialty: null,
      actions: [
        { type: 'navigate', path: '/medical-records', label: 'Medical records' },
      ],
      provider: 'fallback',
    };
  }

  const nextAppt = context?.upcomingAppointments?.[0];
  const apptHint = nextAppt
    ? ` Your next appointment is with ${nextAppt.doctor_name} on ${nextAppt.appointment_date}.`
    : '';

  return {
    reply: `Hi ${name}! I'm your MediLink Health Assistant.${apptHint} I can help you book appointments, understand symptoms (general guidance only), find the right specialist, or navigate the app. What would you like help with?`,
    urgency: 'none',
    suggested_specialty: null,
    actions: [
      { type: 'navigate', path: '/doctors', label: 'Find a doctor' },
      { type: 'navigate', path: '/appointments', label: 'Appointments' },
    ],
    provider: 'fallback',
  };
}

async function callGemini(messages, contextBlock) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: `${SYSTEM_PROMPT}\n\n---\nUser context:\n${contextBlock}` }],
      },
      contents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Gemini API error:', response.status, errText.slice(0, 200));
    return null;
  }

  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      suggested_specialty: parsed.suggested_specialty || null,
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      provider: 'gemini',
    };
  } catch {
    return {
      reply: raw,
      urgency: 'none',
      suggested_specialty: null,
      actions: [],
      provider: 'gemini',
    };
  }
}

async function chat(userId, messages) {
  const context = await getUserContext(userId);
  const contextBlock = buildContextBlock(context);
  const lastMessage = messages[messages.length - 1]?.content || '';

  const geminiResult = await callGemini(messages, contextBlock);
  if (geminiResult) {
    return geminiResult;
  }

  return fallbackResponse(lastMessage, context);
}

function isConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

module.exports = {
  chat,
  getUserContext,
  isConfigured,
};
