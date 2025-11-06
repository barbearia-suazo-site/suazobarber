import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEYFILEPATH = path.join(__dirname, "../suazo-calendar-key.json"); // o arquivo JSON baixado
const SCOPES = ["https://www.googleapis.com/auth/calendar"];

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

const calendar = google.calendar({ version: "v3", auth });

// ✅ Função para criar evento no Google Calendar
export async function createBooking({ name, email, service, startTime, endTime }) {
  const event = {
    summary: `💈 ${service} - ${name}`,
    description: `Reserva automática para ${service}. Cliente: ${name} (${email})`,
    start: { dateTime: startTime, timeZone: "Europe/Madrid" },
    end: { dateTime: endTime, timeZone: "Europe/Madrid" },
  };

  const res = await calendar.events.insert({
    calendarId: "primary",
    resource: event,
  });

  return res.data;
}
