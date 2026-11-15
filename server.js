// server.ts
import express from "express";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
dotenv.config();
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var DATA_DIR = path.join(__dirname, "data");
var DB_FILE = path.join(DATA_DIR, "clinic-store.json");
var DGIS_FIRM_ID = "9429940000850084";
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}
function addDaysISO(daysOffset) {
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}
function createInitialStore() {
  const demoPatientId = "pat-demo-01";
  const demoPatient = {
    id: demoPatientId,
    fullName: "\u041D\u0443\u0440\u043B\u0430\u043D\u043E\u0432\u0430 \u0410\u0439\u0433\u0435\u0440\u0438\u043C \u041C\u0430\u0440\u0430\u0442\u043E\u0432\u043D\u0430",
    phone: "+7 (701) 760-85-20",
    email: "aigerim.n@example.kz",
    iin: "920415450821",
    preferredBranch: "reproduction",
    passwordHash: hashPassword("repromed2026"),
    notificationSettings: {
      pushEnabled: true,
      leadMinutes: 120,
      notifyOnBooking: true,
      notifyOnResults: true
    }
  };
  const demoAppointments = [
    {
      id: "apt-1001",
      patientId: demoPatientId,
      patientName: demoPatient.fullName,
      patientPhone: demoPatient.phone,
      branchId: "diagnostics",
      branchCity: "\u0420\u0435\u043F\u0440\u043E-\u041C\u0435\u0434 \xB7 \u043F\u0440. \u0420\u0430\u0439\u044B\u043C\u0431\u0435\u043A\u0430, 150",
      serviceId: "srv-ultrasound-all",
      serviceTitle: "\u042D\u043A\u0441\u043F\u0435\u0440\u0442\u043D\u043E\u0435 \u0423\u0417\u0418 (Samsung H-60) \u0438 \u043F\u0440\u0435\u043D\u0430\u0442\u0430\u043B\u044C\u043D\u044B\u0439 \u0441\u043A\u0440\u0438\u043D\u0438\u043D\u0433",
      doctorId: "doc-sailaukhan",
      doctorName: "\u0421\u0430\u0439\u043B\u0430\u0443\u0445\u0430\u043D \u0413\u0443\u043B\u044C\u043D\u0430\u0437 \u0421\u0430\u0439\u043B\u0430\u0443\u0445\u0430\u043D\u043A\u044B\u0437\u044B",
      dateISO: addDaysISO(1),
      timeSlot: "11:30",
      priceKzt: 9e3,
      status: "confirmed",
      reminderEnabled: true,
      reminderLeadMinutes: 120,
      reminderSent: false,
      notes: "\u0423\u0417\u0418 \u043E\u0440\u0433\u0430\u043D\u043E\u0432 \u043C\u0430\u043B\u043E\u0433\u043E \u0442\u0430\u0437\u0430 \u0438 \u043A\u043E\u043D\u0442\u0440\u043E\u043B\u044C \u0444\u043E\u043B\u043B\u0438\u043A\u0443\u043B\u043E\u0433\u0435\u043D\u0435\u0437\u0430, 1-\u0439 \u044D\u0442\u0430\u0436",
      createdAt: new Date(Date.now() - 864e5 * 3).toISOString()
    },
    {
      id: "apt-1002",
      patientId: demoPatientId,
      patientName: demoPatient.fullName,
      patientPhone: demoPatient.phone,
      branchId: "reproduction",
      branchCity: "\u0420\u0435\u043F\u0440\u043E-\u041C\u0435\u0434 \xB7 \u043F\u0440. \u0420\u0430\u0439\u044B\u043C\u0431\u0435\u043A\u0430, 150",
      serviceId: "srv-gynecology",
      serviceTitle: "\u041F\u0440\u0438\u0435\u043C \u0433\u0438\u043D\u0435\u043A\u043E\u043B\u043E\u0433\u0430-\u0440\u0435\u043F\u0440\u043E\u0434\u0443\u043A\u0442\u043E\u043B\u043E\u0433\u0430 \u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u0431\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u043E\u0441\u0442\u0438",
      doctorId: "doc-baibossynova",
      doctorName: "\u0411\u0430\u0439\u0431\u043E\u0441\u044B\u043D\u043E\u0432\u0430 \u041C\u0430\u0440\u044C\u044F\u043C \u0411\u0435\u0436\u0430\u043D\u043E\u0432\u043D\u0430",
      dateISO: addDaysISO(-10),
      timeSlot: "15:30",
      priceKzt: 11e3,
      status: "completed",
      reminderEnabled: true,
      reminderLeadMinutes: 1440,
      reminderSent: true,
      notes: "\u041D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u043E \u043A\u0430\u0440\u0438\u043E\u0442\u0438\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0438 \u043A\u043E\u043D\u0442\u0440\u043E\u043B\u044C\u043D\u043E\u0435 \u0423\u0417\u0418",
      createdAt: new Date(Date.now() - 864e5 * 12).toISOString()
    }
  ];
  const demoResults = [
    {
      id: "res-01",
      title: "\u041A\u0430\u0440\u0438\u043E\u0442\u0438\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 (\u0445\u0440\u043E\u043C\u043E\u0441\u043E\u043C\u043D\u044B\u0439 \u0430\u043D\u0430\u043B\u0438\u0437, 5 \u0434\u043D\u0435\u0439)",
      dateLabel: "12 \u043D\u043E\u044F 2026",
      doctorName: "\u0410\u044F\u043F\u043E\u0432\u0430 \u0421. \u041A.",
      value: "46, XX",
      unit: "\u041D\u043E\u0440\u043C\u0430",
      referenceRange: "\u0411\u0435\u0437 \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u043D\u044B\u0445 \u043F\u0435\u0440\u0435\u0441\u0442\u0440\u043E\u0435\u043A",
      status: "ready",
      statusLabel: "\u0413\u043E\u0442\u043E\u0432\u043E \u0437\u0430 5 \u0434\u043D\u0435\u0439",
      comment: "\u041D\u043E\u0440\u043C\u0430\u043B\u044C\u043D\u044B\u0439 \u0436\u0435\u043D\u0441\u043A\u0438\u0439 \u043A\u0430\u0440\u0438\u043E\u0442\u0438\u043F, \u0445\u0440\u043E\u043C\u043E\u0441\u043E\u043C\u043D\u044B\u0445 \u0430\u043D\u043E\u043C\u0430\u043B\u0438\u0439 \u043D\u0435 \u0432\u044B\u044F\u0432\u043B\u0435\u043D\u043E."
    },
    {
      id: "res-02",
      title: "\u0411\u0438\u043E\u043F\u0441\u0438\u044F \u044D\u043D\u0434\u043E\u043C\u0435\u0442\u0440\u0438\u044F (\u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u0432 \u0442\u043E\u0442 \u0436\u0435 \u0434\u0435\u043D\u044C)",
      dateLabel: "10 \u043D\u043E\u044F 2026",
      doctorName: "\u0411\u0430\u0439\u0431\u043E\u0441\u044B\u043D\u043E\u0432\u0430 \u041C. \u0411.",
      value: "\u041F\u0440\u043E\u043B\u0438\u0444\u0435\u0440\u0430\u0446\u0438\u044F",
      unit: "",
      referenceRange: "\u0411\u0435\u0437 \u0430\u0442\u0438\u043F\u0438\u0438",
      status: "normal",
      statusLabel: "\u0413\u043E\u0442\u043E\u0432\u043E \u0432 \u0434\u0435\u043D\u044C \u0441\u0434\u0430\u0447\u0438",
      comment: "\u0410\u0442\u0438\u043F\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u043A\u043B\u0435\u0442\u043A\u0438 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0442, \u044D\u043D\u0434\u043E\u043C\u0435\u0442\u0440\u0438\u0439 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u0444\u0430\u0437\u0435 \u0446\u0438\u043A\u043B\u0430."
    },
    {
      id: "res-03",
      title: "\u042D\u043A\u0441\u043F\u0435\u0440\u0442\u043D\u043E\u0435 \u0423\u0417\u0418 \u043C\u0430\u043B\u043E\u0433\u043E \u0442\u0430\u0437\u0430 (Samsung H-60)",
      dateLabel: "08 \u043D\u043E\u044F 2026",
      doctorName: "\u0421\u0430\u0439\u043B\u0430\u0443\u0445\u0430\u043D \u0413. \u0421.",
      value: "9.2",
      unit: "\u043C\u043C (\u044D\u043D\u0434\u043E\u043C\u0435\u0442\u0440\u0438\u0439)",
      referenceRange: "8.0 \u2013 13.0 \u043C\u043C",
      status: "normal",
      statusLabel: "\u0412 \u043D\u043E\u0440\u043C\u0435",
      comment: "\u0422\u0440\u0435\u0445\u0441\u043B\u043E\u0439\u043D\u0430\u044F \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430 \u044D\u043D\u0434\u043E\u043C\u0435\u0442\u0440\u0438\u044F, \u0444\u043E\u043B\u043B\u0438\u043A\u0443\u043B\u044F\u0440\u043D\u044B\u0439 \u0430\u043F\u043F\u0430\u0440\u0430\u0442 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D."
    }
  ];
  const defaultReviews = [
    {
      id: "rev-2gis-1",
      author: "\u0410\u0439\u0433\u0443\u043B\u044C \u0438 \u041C\u0430\u0440\u0430\u0442 \u0421.",
      rating: 5,
      dateLabel: "\u041E\u043A\u0442\u044F\u0431\u0440\u044C 2026",
      program: "\u041A\u0430\u0440\u0438\u043E\u0442\u0438\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \xB7 5 \u0434\u043D\u0435\u0439",
      doctor: "\u0410\u044F\u043F\u043E\u0432\u0430 \u0421. \u041A.",
      text: "\u041E\u0431\u0440\u0430\u0442\u0438\u043B\u0438\u0441\u044C \u0432 \xAB\u0420\u0435\u043F\u0440\u043E-\u041C\u0435\u0434\xBB \u043D\u0430 \u0420\u0430\u0439\u044B\u043C\u0431\u0435\u043A\u0430, 150 \u043F\u043E\u0441\u043B\u0435 \u0434\u043E\u043B\u0433\u043E\u0433\u043E \u043F\u043E\u0438\u0441\u043A\u0430 \u043F\u0440\u0438\u0447\u0438\u043D\u044B \u043D\u0435\u0432\u044B\u043D\u0430\u0448\u0438\u0432\u0430\u043D\u0438\u044F. \u041A\u0430\u0440\u0438\u043E\u0442\u0438\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0441\u0434\u0435\u043B\u0430\u043B\u0438 \u0437\u0430 5 \u0434\u043D\u0435\u0439, \u0421\u0430\u0443\u043B\u0435 \u041A\u0430\u043B\u043A\u0430\u043C\u0430\u043D\u043E\u0432\u043D\u0430 \u043F\u043E\u0434\u0440\u043E\u0431\u043D\u043E \u0432\u0441\u0435 \u0440\u0430\u0437\u044A\u044F\u0441\u043D\u0438\u043B\u0430, \u0430 \u0446\u0435\u043D\u044B \u043E\u043A\u0430\u0437\u0430\u043B\u0438\u0441\u044C \u043D\u0438\u0436\u0435, \u0447\u0435\u043C \u0432 \u0434\u0440\u0443\u0433\u0438\u0445 \u0446\u0435\u043D\u0442\u0440\u0430\u0445.",
      source: "2gis"
    },
    {
      id: "rev-2gis-2",
      author: "\u041A\u0430\u043C\u0438\u043B\u043B\u0430 \u0422.",
      rating: 5,
      dateLabel: "\u0421\u0435\u043D\u0442\u044F\u0431\u0440\u044C 2026",
      program: "\u0411\u0438\u043E\u043F\u0441\u0438\u044F \u0438 \u043F\u0440\u0435\u043D\u0430\u0442\u0430\u043B\u044C\u043D\u043E\u0435 \u0423\u0417\u0418",
      doctor: "\u0411\u0430\u0439\u0431\u043E\u0441\u044B\u043D\u043E\u0432\u0430 \u041C. \u0411.",
      text: "\u041E\u0447\u0435\u043D\u044C \u043F\u0435\u0440\u0435\u0436\u0438\u0432\u0430\u043B\u0430 \u043F\u0435\u0440\u0435\u0434 \u0431\u0438\u043E\u043F\u0441\u0438\u0435\u0439 \u0432\u043E\u0440\u0441\u0438\u043D \u0445\u043E\u0440\u0438\u043E\u043D\u0430, \u043D\u043E \u0432\u0440\u0430\u0447\u0438 \u0438 \u043C\u0435\u0434\u0441\u0435\u0441\u0442\u0440\u044B \u043E\u0442\u043D\u0435\u0441\u043B\u0438\u0441\u044C \u043C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u043E \u0431\u0435\u0440\u0435\u0436\u043D\u043E. \u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u0432\u044B\u0434\u0430\u043B\u0438 \u0432 \u0442\u043E\u0442 \u0436\u0435 \u0434\u0435\u043D\u044C, \u0432\u0441\u0435 \u0447\u0438\u0441\u0442\u043E \u0438 \u0441\u0442\u0435\u0440\u0438\u043B\u044C\u043D\u043E.",
      source: "2gis"
    },
    {
      id: "rev-2gis-3",
      author: "\u0420\u0443\u0441\u043B\u0430\u043D \u041D.",
      rating: 5,
      dateLabel: "\u0410\u0432\u0433\u0443\u0441\u0442 2026",
      program: "\u0423\u0440\u043E\u043B\u043E\u0433-\u0430\u043D\u0434\u0440\u043E\u043B\u043E\u0433 \xB7 \u041F\u0440\u043E\u0446\u0435\u0434\u0443\u0440\u043D\u044B\u0439 \u043A\u0430\u0431\u0438\u043D\u0435\u0442",
      doctor: "\u0410\u0440\u0435\u043F\u044C\u0435\u0432 \u0412. \u042D.",
      text: "\u041F\u0440\u043E\u0445\u043E\u0434\u0438\u043B \u043E\u0431\u0441\u043B\u0435\u0434\u043E\u0432\u0430\u043D\u0438\u0435 \u0443 \u0443\u0440\u043E\u043B\u043E\u0433\u0430-\u0430\u043D\u0434\u0440\u043E\u043B\u043E\u0433\u0430 \u0438 \u043A\u0443\u0440\u0441 \u043A\u0430\u043F\u0435\u043B\u044C\u043D\u0438\u0446 \u0432 \u043F\u0440\u043E\u0446\u0435\u0434\u0443\u0440\u043D\u043E\u043C \u043A\u0430\u0431\u0438\u043D\u0435\u0442\u0435 \u2014 \u0443\u0434\u043E\u0431\u043D\u043E, \u0447\u0442\u043E \u043A\u0430\u0431\u0438\u043D\u0435\u0442 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0434\u043E \u0432\u0435\u0447\u0435\u0440\u0430 \u0438 \u043F\u043E \u0432\u043E\u0441\u043A\u0440\u0435\u0441\u0435\u043D\u044C\u044F\u043C.",
      source: "2gis"
    }
  ];
  return {
    patients: [demoPatient],
    sessions: {},
    appointments: demoAppointments,
    labResultsByPatient: {
      [demoPatientId]: demoResults
    },
    reviews: defaultReviews
  };
}
var writeQueue = Promise.resolve();
async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed.patients?.[0]?.preferredBranch || !CITY_MAP[parsed.patients[0].preferredBranch]) {
      const fresh = createInitialStore();
      await fs.writeFile(DB_FILE, JSON.stringify(fresh, null, 2), "utf-8");
      return fresh;
    }
    if (!parsed.reviews || parsed.reviews.length === 0) {
      parsed.reviews = createInitialStore().reviews;
    }
    return parsed;
  } catch {
    const initial = createInitialStore();
    await fs.writeFile(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}
async function mutateStore(fn) {
  const task = writeQueue.then(async () => {
    const store = await ensureStore();
    const result = fn(store);
    await fs.writeFile(DB_FILE, JSON.stringify(store, null, 2), "utf-8");
    return result;
  });
  writeQueue = task.then(
    () => void 0,
    () => void 0
  );
  return task;
}
function sanitizePatient(p) {
  const { passwordHash: _ignored, ...safe } = p;
  return safe;
}
function extractToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }
  return null;
}
var CITY_MAP = {
  reproduction: "\u0420\u0435\u043F\u0440\u043E\u0434\u0443\u043A\u0446\u0438\u044F \u0438 \u0433\u0438\u043D\u0435\u043A\u043E\u043B\u043E\u0433\u0438\u044F \xB7 \u043F\u0440. \u0420\u0430\u0439\u044B\u043C\u0431\u0435\u043A\u0430, 150",
  diagnostics: "\u0423\u0417\u0418, \u0431\u0438\u043E\u043F\u0441\u0438\u044F \u0438 \u0433\u0435\u043D\u0435\u0442\u0438\u043A\u0430 \xB7 \u043F\u0440. \u0420\u0430\u0439\u044B\u043C\u0431\u0435\u043A\u0430, 150",
  procedures: "\u041F\u0440\u043E\u0446\u0435\u0434\u0443\u0440\u043D\u044B\u0439 \u043A\u0430\u0431\u0438\u043D\u0435\u0442 \u0438 \u043C\u0430\u0441\u0441\u0430\u0436 \xB7 \u043F\u0440. \u0420\u0430\u0439\u044B\u043C\u0431\u0435\u043A\u0430, 150"
};
function resolvePort() {
  const argIdx = process.argv.indexOf("--port");
  if (argIdx !== -1 && process.argv[argIdx + 1]) {
    const parsed = Number(process.argv[argIdx + 1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  const envPort = Number(process.env.PORT);
  const nginxPort = Number(process.env.NGINX_PORT);
  if (Number.isFinite(envPort) && envPort > 0 && envPort !== nginxPort) {
    return envPort;
  }
  return Number(process.env.DEFAULT_APP_PORT) || 3e3;
}
async function startServer() {
  await ensureStore();
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "emirmed-repro" });
  });
  app.post("/api/auth/demo", async (_req, res) => {
    const result = await mutateStore((store) => {
      const demo = store.patients[0];
      const token = crypto.randomUUID();
      store.sessions[token] = demo.id;
      return {
        token,
        patient: sanitizePatient(demo),
        appointments: store.appointments.filter((a) => a.patientId === demo.id),
        labResults: store.labResultsByPatient[demo.id] || []
      };
    });
    res.json(result);
  });
  app.post("/api/auth/login", async (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      res.status(400).json({ error: "\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u0442\u0435\u043B\u0435\u0444\u043E\u043D \u0438\u043B\u0438 email \u0438 \u043F\u0430\u0440\u043E\u043B\u044C." });
      return;
    }
    const cleanId = identifier.trim().toLowerCase();
    const digitsOnly = identifier.replace(/\D/g, "");
    const pwHash = hashPassword(password);
    const result = await mutateStore((store) => {
      const patient = store.patients.find((p) => {
        const phoneDigits = p.phone.replace(/\D/g, "");
        return (p.email.toLowerCase() === cleanId || digitsOnly.length >= 7 && phoneDigits.endsWith(digitsOnly.slice(-10))) && p.passwordHash === pwHash;
      });
      if (!patient) return null;
      const token = crypto.randomUUID();
      store.sessions[token] = patient.id;
      return {
        token,
        patient: sanitizePatient(patient),
        appointments: store.appointments.filter((a) => a.patientId === patient.id),
        labResults: store.labResultsByPatient[patient.id] || []
      };
    });
    if (!result) {
      res.status(401).json({ error: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0442\u0435\u043B\u0435\u0444\u043E\u043D/email \u0438\u043B\u0438 \u043F\u0430\u0440\u043E\u043B\u044C." });
      return;
    }
    res.json(result);
  });
  app.post("/api/auth/register", async (req, res) => {
    const { fullName, phone, email, iin, password, preferredBranch } = req.body;
    if (!fullName || !phone || !password || password.length < 4) {
      res.status(400).json({ error: "\u0417\u0430\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u0424\u0418\u041E, \u043A\u0430\u0437\u0430\u0445\u0441\u0442\u0430\u043D\u0441\u043A\u0438\u0439 \u043D\u043E\u043C\u0435\u0440 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430 \u0438 \u043F\u0430\u0440\u043E\u043B\u044C (\u043E\u0442 4 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432)." });
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      res.status(400).json({ error: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u043D\u043E\u043C\u0435\u0440 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430 \u041A\u0430\u0437\u0430\u0445\u0441\u0442\u0430\u043D\u0430 (+7 ...)." });
      return;
    }
    const created = await mutateStore((store) => {
      const exists = store.patients.find(
        (p) => p.phone.replace(/\D/g, "").slice(-10) === digits.slice(-10) || email && p.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (exists) return null;
      const patientId = `pat-${crypto.randomUUID().slice(0, 8)}`;
      const newPatient = {
        id: patientId,
        fullName: fullName.trim().slice(0, 120),
        phone: phone.trim().slice(0, 32),
        email: (email || "").trim().slice(0, 120),
        iin: (iin || "").replace(/\D/g, "").slice(0, 12),
        preferredBranch: preferredBranch && CITY_MAP[preferredBranch] ? preferredBranch : "reproduction",
        passwordHash: hashPassword(password),
        notificationSettings: {
          pushEnabled: true,
          leadMinutes: 120,
          notifyOnBooking: true,
          notifyOnResults: true
        }
      };
      store.patients.push(newPatient);
      store.labResultsByPatient[patientId] = [
        {
          id: `res-${crypto.randomUUID().slice(0, 6)}`,
          title: "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043F\u0440\u043E\u0444\u0438\u043B\u044C \u043F\u0430\u0446\u0438\u0435\u043D\u0442\u0430",
          dateLabel: "\u0421\u0435\u0433\u043E\u0434\u043D\u044F",
          doctorName: "\u0414\u0435\u0436\u0443\u0440\u043D\u044B\u0439 \u0440\u0435\u043F\u0440\u043E\u0434\u0443\u043A\u0442\u043E\u043B\u043E\u0433",
          value: "\u041A\u0430\u0440\u0442\u0430 \u043E\u0442\u043A\u0440\u044B\u0442\u0430",
          unit: "",
          referenceRange: "\u0413\u043E\u0442\u043E\u0432\u043E \u043A \u043F\u0440\u0438\u0435\u043C\u0443",
          status: "ready",
          statusLabel: "\u0410\u043A\u0442\u0438\u0432\u043D\u043E",
          comment: "\u041F\u043E\u0441\u043B\u0435 \u043F\u0435\u0440\u0432\u043E\u0433\u043E \u0432\u0438\u0437\u0438\u0442\u0430 \u0437\u0434\u0435\u0441\u044C \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F \u043F\u0440\u043E\u0442\u043E\u043A\u043E\u043B\u044B \u0423\u0417\u0418, \u0433\u043E\u0440\u043C\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0435 \u043F\u0430\u043D\u0435\u043B\u0438 \u0438 \u043E\u0442\u0447\u0435\u0442 \u044D\u043C\u0431\u0440\u0438\u043E\u043B\u043E\u0433\u0430."
        }
      ];
      const token = crypto.randomUUID();
      store.sessions[token] = patientId;
      return {
        token,
        patient: sanitizePatient(newPatient),
        appointments: [],
        labResults: store.labResultsByPatient[patientId]
      };
    });
    if (!created) {
      res.status(409).json({ error: "\u041F\u0430\u0446\u0438\u0435\u043D\u0442 \u0441 \u0442\u0430\u043A\u0438\u043C \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u043E\u043C \u0438\u043B\u0438 email \u0443\u0436\u0435 \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D." });
      return;
    }
    res.status(201).json(created);
  });
  app.get("/api/auth/me", async (req, res) => {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F." });
      return;
    }
    const store = await ensureStore();
    const patientId = store.sessions[token];
    const patient = store.patients.find((p) => p.id === patientId);
    if (!patient) {
      res.status(401).json({ error: "\u0421\u0435\u0441\u0441\u0438\u044F \u0438\u0441\u0442\u0435\u043A\u043B\u0430." });
      return;
    }
    res.json({
      patient: sanitizePatient(patient),
      appointments: store.appointments.filter((a) => a.patientId === patient.id),
      labResults: store.labResultsByPatient[patient.id] || []
    });
  });
  app.patch("/api/patient/profile", async (req, res) => {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F." });
      return;
    }
    const { fullName, phone, email, iin, preferredBranch, notificationSettings } = req.body;
    const updated = await mutateStore((store) => {
      const patientId = store.sessions[token];
      const patient = store.patients.find((p) => p.id === patientId);
      if (!patient) return null;
      if (typeof fullName === "string" && fullName.trim()) patient.fullName = fullName.trim().slice(0, 120);
      if (typeof phone === "string" && phone.trim()) patient.phone = phone.trim().slice(0, 32);
      if (typeof email === "string") patient.email = email.trim().slice(0, 120);
      if (typeof iin === "string") patient.iin = iin.replace(/\D/g, "").slice(0, 12);
      if (preferredBranch && CITY_MAP[preferredBranch]) patient.preferredBranch = preferredBranch;
      if (notificationSettings) {
        patient.notificationSettings = {
          ...patient.notificationSettings,
          ...notificationSettings
        };
      }
      return sanitizePatient(patient);
    });
    if (!updated) {
      res.status(401).json({ error: "\u0421\u0435\u0441\u0441\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430." });
      return;
    }
    res.json({ patient: updated });
  });
  app.post("/api/appointments", async (req, res) => {
    const token = extractToken(req);
    const body = req.body;
    if (!body.patientName || !body.patientPhone || !body.dateISO || !body.timeSlot || !body.serviceTitle) {
      res.status(400).json({ error: "\u0417\u0430\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u0438\u043C\u044F, \u0442\u0435\u043B\u0435\u0444\u043E\u043D, \u0443\u0441\u043B\u0443\u0433\u0443, \u0434\u0430\u0442\u0443 \u0438 \u0432\u0440\u0435\u043C\u044F \u043F\u0440\u0438\u0435\u043C\u0430." });
      return;
    }
    const created = await mutateStore((store) => {
      const sessionPatientId = token ? store.sessions[token] : void 0;
      const branchId = body.branchId && CITY_MAP[body.branchId] ? body.branchId : "reproduction";
      const record = {
        id: `apt-${crypto.randomUUID().slice(0, 6)}`,
        patientId: sessionPatientId || "guest",
        patientName: body.patientName.trim().slice(0, 120),
        patientPhone: body.patientPhone.trim().slice(0, 32),
        branchId,
        branchCity: CITY_MAP[branchId],
        serviceId: (body.serviceId || "srv-repro-consult").slice(0, 64),
        serviceTitle: body.serviceTitle.trim().slice(0, 160),
        doctorId: (body.doctorId || "any").slice(0, 64),
        doctorName: (body.doctorName || "\u0414\u0435\u0436\u0443\u0440\u043D\u044B\u0439 \u0440\u0435\u043F\u0440\u043E\u0434\u0443\u043A\u0442\u043E\u043B\u043E\u0433").trim().slice(0, 120),
        dateISO: body.dateISO.slice(0, 10),
        timeSlot: body.timeSlot.slice(0, 10),
        priceKzt: Number(body.priceKzt) || 14e3,
        status: "confirmed",
        reminderEnabled: body.reminderEnabled !== false,
        reminderLeadMinutes: Number(body.reminderLeadMinutes) || 120,
        reminderSent: false,
        notes: body.notes ? body.notes.trim().slice(0, 300) : void 0,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      store.appointments.unshift(record);
      return record;
    });
    res.status(201).json({ appointment: created });
  });
  app.patch("/api/appointments/:id", async (req, res) => {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F." });
      return;
    }
    const { id } = req.params;
    const { status, dateISO, timeSlot, reminderEnabled, reminderLeadMinutes, reminderSent } = req.body;
    const updated = await mutateStore((store) => {
      const patientId = store.sessions[token];
      if (!patientId) return "unauthorized";
      const apt = store.appointments.find((a) => a.id === id && a.patientId === patientId);
      if (!apt) return null;
      if (status && ["upcoming", "confirmed", "completed", "cancelled"].includes(status)) {
        apt.status = status;
      }
      if (typeof dateISO === "string" && dateISO.length >= 8) apt.dateISO = dateISO.slice(0, 10);
      if (typeof timeSlot === "string" && timeSlot.length >= 4) apt.timeSlot = timeSlot.slice(0, 10);
      if (typeof reminderEnabled === "boolean") apt.reminderEnabled = reminderEnabled;
      if (typeof reminderLeadMinutes === "number") apt.reminderLeadMinutes = reminderLeadMinutes;
      if (typeof reminderSent === "boolean") apt.reminderSent = reminderSent;
      return apt;
    });
    if (updated === "unauthorized") {
      res.status(401).json({ error: "\u0421\u0435\u0441\u0441\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430." });
      return;
    }
    if (!updated) {
      res.status(404).json({ error: "\u0417\u0430\u043F\u0438\u0441\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430." });
      return;
    }
    res.json({ appointment: updated });
  });
  let cachedDgisReviews = null;
  app.get("/api/reviews", async (_req, res) => {
    const store = await ensureStore();
    const localReviews = store.reviews || [];
    const apiKey = process.env.DGIS_REVIEWS_KEY?.trim();
    if (apiKey) {
      if (cachedDgisReviews && Date.now() - cachedDgisReviews.fetchedAt < 15 * 6e4) {
        res.json({
          mode: "live_api",
          firmId: DGIS_FIRM_ID,
          rating: cachedDgisReviews.rating,
          reviewsCount: cachedDgisReviews.reviewsCount,
          reviews: [...cachedDgisReviews.reviews, ...localReviews.filter((r) => r.source === "clinic")]
        });
        return;
      }
      try {
        const url = `https://public-api.reviews.2gis.com/2.0/branches/${DGIS_FIRM_ID}/reviews?limit=12&is_advertiser=false&fields=meta.branch_rating,meta.branch_reviews_count,reviews.is_verified&rated=true&sort_by=date_edited&key=${encodeURIComponent(apiKey)}&locale=ru_KZ`;
        const resp = await fetch(url, { headers: { Accept: "application/json" } });
        if (resp.ok) {
          const payload = await resp.json();
          const liveReviews = (payload.reviews || []).filter((r) => Boolean(r.text)).slice(0, 9).map((r, idx) => ({
            id: `2gis-${r.id || idx}`,
            author: r.user?.name || "\u041F\u0430\u0446\u0438\u0435\u043D\u0442 2\u0413\u0418\u0421",
            rating: r.rating || 5,
            dateLabel: r.date_created ? new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(
              new Date(r.date_created)
            ) : "2\u0413\u0418\u0421 \u0410\u043B\u043C\u0430\u0442\u044B",
            program: "\u041F\u0440\u043E\u0432\u0435\u0440\u0435\u043D\u043D\u044B\u0439 \u043E\u0442\u0437\u044B\u0432 \u0432 2\u0413\u0418\u0421",
            text: r.text || "",
            source: "2gis"
          }));
          const rating = payload.meta?.branch_rating || 4.9;
          const reviewsCount = payload.meta?.branch_reviews_count || 286;
          cachedDgisReviews = { fetchedAt: Date.now(), rating, reviewsCount, reviews: liveReviews };
          res.json({
            mode: "live_api",
            firmId: DGIS_FIRM_ID,
            rating,
            reviewsCount,
            reviews: [...liveReviews, ...localReviews.filter((r) => r.source === "clinic")]
          });
          return;
        }
      } catch (err) {
        console.warn("2GIS API fetch fallback:", err);
      }
    }
    res.json({
      mode: "widget_and_verified",
      firmId: DGIS_FIRM_ID,
      rating: 4.9,
      reviewsCount: 286,
      reviews: localReviews
    });
  });
  app.post("/api/reviews", async (req, res) => {
    const { author, rating, program, doctor, text } = req.body;
    if (!author || !text || text.trim().length < 8) {
      res.status(400).json({ error: "\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u0438\u043C\u044F \u0438 \u0442\u0435\u043A\u0441\u0442 \u043E\u0442\u0437\u044B\u0432\u0430 (\u043C\u0438\u043D\u0438\u043C\u0443\u043C 8 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432)." });
      return;
    }
    const review = {
      id: `rev-${crypto.randomUUID().slice(0, 6)}`,
      author: author.trim().slice(0, 80),
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      dateLabel: new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(/* @__PURE__ */ new Date()),
      program: (program || "\u041F\u0440\u0438\u0435\u043C \u0432 \u041C\u0426 \xAB\u0420\u0435\u043F\u0440\u043E-\u041C\u0435\u0434\xBB").trim().slice(0, 100),
      doctor: doctor ? doctor.trim().slice(0, 80) : void 0,
      text: text.trim().slice(0, 600),
      source: "clinic"
    };
    await mutateStore((store) => {
      if (!store.reviews) store.reviews = [];
      store.reviews.unshift(review);
    });
    res.status(201).json({ review });
  });
  const port = resolvePort();
  if (process.env.NODE_ENV === "production") {
    const distDir = path.join(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  } else {
    const vitePromise = (async () => {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false
        },
        appType: "spa"
      });
      return vite;
    })();
    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  }
  app.listen(port, "0.0.0.0", () => {
    console.log(`EmirMed Reproduction server listening on http://0.0.0.0:${port}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
