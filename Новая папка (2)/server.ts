import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import type {
  AppointmentRecord,
  BranchId,
  ClinicReview,
  LabResultRecord,
  NotificationSettings,
  PatientAccount,
} from './src/types/clinic.ts';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'clinic-store.json');
const DGIS_FIRM_ID = '9429940000850084';

interface StoredPatient extends PatientAccount {
  passwordHash: string;
}

interface ClinicStore {
  patients: StoredPatient[];
  sessions: Record<string, string>;
  appointments: AppointmentRecord[];
  labResultsByPatient: Record<string, LabResultRecord[]>;
  reviews?: ClinicReview[];
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function addDaysISO(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}

function createInitialStore(): ClinicStore {
  const demoPatientId = 'pat-demo-01';
  const demoPatient: StoredPatient = {
    id: demoPatientId,
    fullName: 'Нурланова Айгерим Маратовна',
    phone: '+7 (701) 760-85-20',
    email: 'aigerim.n@example.kz',
    iin: '920415450821',
    preferredBranch: 'reproduction',
    passwordHash: hashPassword('repromed2026'),
    notificationSettings: {
      pushEnabled: true,
      leadMinutes: 120,
      notifyOnBooking: true,
      notifyOnResults: true,
    },
  };

  const demoAppointments: AppointmentRecord[] = [
    {
      id: 'apt-1001',
      patientId: demoPatientId,
      patientName: demoPatient.fullName,
      patientPhone: demoPatient.phone,
      branchId: 'diagnostics',
      branchCity: 'Репро-Мед · пр. Райымбека, 150',
      serviceId: 'srv-ultrasound-all',
      serviceTitle: 'Все виды УЗИ и пренатальный скрининг',
      doctorId: 'doc-sailaukhan',
      doctorName: 'Сайлаухан Гульназ Сайлауханкызы',
      dateISO: addDaysISO(1),
      timeSlot: '11:30',
      priceKzt: 7000,
      status: 'confirmed',
      reminderEnabled: true,
      reminderLeadMinutes: 120,
      reminderSent: false,
      notes: 'УЗИ органов малого таза и контроль фолликулогенеза, 1-й этаж',
      createdAt: new Date(Date.now() - 86400_000 * 3).toISOString(),
    },
    {
      id: 'apt-1002',
      patientId: demoPatientId,
      patientName: demoPatient.fullName,
      patientPhone: demoPatient.phone,
      branchId: 'reproduction',
      branchCity: 'Репро-Мед · пр. Райымбека, 150',
      serviceId: 'srv-gynecology',
      serviceTitle: 'Прием гинеколога',
      doctorId: 'doc-baibossynova',
      doctorName: 'Байбосынова Марьям Бежановна',
      dateISO: addDaysISO(-10),
      timeSlot: '15:30',
      priceKzt: 10000,
      status: 'completed',
      reminderEnabled: true,
      reminderLeadMinutes: 1440,
      reminderSent: true,
      notes: 'Назначено кариотипирование и контрольное УЗИ',
      createdAt: new Date(Date.now() - 86400_000 * 12).toISOString(),
    },
  ];

  const demoResults: LabResultRecord[] = [
    {
      id: 'res-01',
      title: 'Кариотипирование супружеских пар (3–5 дней)',
      dateLabel: '12 ноя 2026',
      doctorName: 'Аяпова С. К.',
      value: '46, XX',
      unit: 'Норма',
      referenceRange: 'Без структурных перестроек',
      status: 'ready',
      statusLabel: 'Готово за 3–5 дней',
      comment: 'Нормальный женский кариотип, хромосомных аномалий не выявлено.',
    },
    {
      id: 'res-02',
      title: 'Биопсия плода / ИПД (результат в тот же день)',
      dateLabel: '10 ноя 2026',
      doctorName: 'Байбосынова М. Б.',
      value: 'Без патологий',
      unit: '',
      referenceRange: 'Норма',
      status: 'normal',
      statusLabel: 'Готово в тот же день',
      comment: 'По итогам исследования хромосомных отклонений не обнаружено.',
    },
    {
      id: 'res-03',
      title: 'Все виды УЗИ малого таза',
      dateLabel: '08 ноя 2026',
      doctorName: 'Сайлаухан Г. С.',
      value: '9.2',
      unit: 'мм (эндометрий)',
      referenceRange: '8.0 – 13.0 мм',
      status: 'normal',
      statusLabel: 'В норме',
      comment: 'Состояние органов малого таза в пределах нормы.',
    },
  ];

  const defaultReviews: ClinicReview[] = [
    {
      id: 'rev-2gis-1',
      author: 'Айгуль и Марат С.',
      rating: 5,
      dateLabel: 'Октябрь 2026',
      program: 'Кариотипирование супружеских пар · 3–5 дней',
      doctor: 'Аяпова С. К.',
      text: 'Обратились в «Репро-Мед» на Райымбека, 150. Кариотипирование сделали за 3–5 дней, Сауле Калкамановна подробно все разъяснила, а цена оказалась очень доступной.',
      source: '2gis',
    },
    {
      id: 'rev-2gis-2',
      author: 'Камилла Т.',
      rating: 5,
      dateLabel: 'Сентябрь 2026',
      program: 'Биопсия плода (ИПД) и УЗИ',
      doctor: 'Байбосынова М. Б.',
      text: 'Очень переживала перед процедурой ИПД, но врачи и медсестры отнеслись максимально бережно. Результат выдали в тот же день, все чисто и стерильно.',
      source: '2gis',
    },
    {
      id: 'rev-2gis-3',
      author: 'Динара К.',
      rating: 5,
      dateLabel: 'Август 2026',
      program: 'Все виды УЗИ · Процедурный кабинет и массаж',
      doctor: 'Сайлаухан Г. С.',
      text: 'Проходила УЗИ всех органов, курс капельниц и массаж — очень удобно, что процедурный кабинет работает ежедневно без выходных и перерыва с 08:00 до 20:00.',
      source: '2gis',
    },
  ];

  return {
    patients: [demoPatient],
    sessions: {},
    appointments: demoAppointments,
    labResultsByPatient: {
      [demoPatientId]: demoResults,
    },
    reviews: defaultReviews,
  };
}

let writeQueue = Promise.resolve();

async function ensureStore(): Promise<ClinicStore> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as ClinicStore;
    if (!parsed.patients?.[0]?.preferredBranch || !CITY_MAP[parsed.patients[0].preferredBranch]) {
      const fresh = createInitialStore();
      await fs.writeFile(DB_FILE, JSON.stringify(fresh, null, 2), 'utf-8');
      return fresh;
    }
    if (
      !parsed.reviews ||
      parsed.reviews.length === 0 ||
      parsed.reviews.some((r) => r.program.includes('Уролог-андролог') || r.text.includes('Samsung'))
    ) {
      parsed.reviews = createInitialStore().reviews;
      await fs.writeFile(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    return parsed;
  } catch {
    const initial = createInitialStore();
    await fs.writeFile(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

async function mutateStore<T>(fn: (store: ClinicStore) => T): Promise<T> {
  const task = writeQueue.then(async () => {
    const store = await ensureStore();
    const result = fn(store);
    await fs.writeFile(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
    return result;
  });
  writeQueue = task.then(
    () => undefined,
    () => undefined
  );
  return task;
}

function sanitizePatient(p: StoredPatient): PatientAccount {
  const { passwordHash: _ignored, ...safe } = p;
  return safe;
}

function extractToken(req: express.Request): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return null;
}

const CITY_MAP: Record<BranchId, string> = {
  reproduction: 'Репродукция и гинекология · пр. Райымбека, 150',
  diagnostics: 'УЗИ, биопсия и генетика · пр. Райымбека, 150',
  procedures: 'Процедурный кабинет и массаж · пр. Райымбека, 150',
};

function resolvePort(): number {
  const argIdx = process.argv.indexOf('--port');
  if (argIdx !== -1 && process.argv[argIdx + 1]) {
    const parsed = Number(process.argv[argIdx + 1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  const envPort = Number(process.env.PORT);
  const nginxPort = Number(process.env.NGINX_PORT);
  if (Number.isFinite(envPort) && envPort > 0 && envPort !== nginxPort) {
    return envPort;
  }
  return Number(process.env.DEFAULT_APP_PORT) || 3000;
}

async function startServer() {
  await ensureStore();

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'emirmed-repro' });
  });

  app.post('/api/auth/demo', async (_req, res) => {
    const result = await mutateStore((store) => {
      const demo = store.patients[0];
      const token = crypto.randomUUID();
      store.sessions[token] = demo.id;
      return {
        token,
        patient: sanitizePatient(demo),
        appointments: store.appointments.filter((a) => a.patientId === demo.id),
        labResults: store.labResultsByPatient[demo.id] || [],
      };
    });
    res.json(result);
  });

  app.post('/api/auth/login', async (req, res) => {
    const { identifier, password } = req.body as { identifier?: string; password?: string };
    if (!identifier || !password) {
      res.status(400).json({ error: 'Укажите телефон или email и пароль.' });
      return;
    }

    const cleanId = identifier.trim().toLowerCase();
    const digitsOnly = identifier.replace(/\D/g, '');
    const pwHash = hashPassword(password);

    const result = await mutateStore((store) => {
      const patient = store.patients.find((p) => {
        const phoneDigits = p.phone.replace(/\D/g, '');
        return (
          (p.email.toLowerCase() === cleanId || (digitsOnly.length >= 7 && phoneDigits.endsWith(digitsOnly.slice(-10)))) &&
          p.passwordHash === pwHash
        );
      });
      if (!patient) return null;
      const token = crypto.randomUUID();
      store.sessions[token] = patient.id;
      return {
        token,
        patient: sanitizePatient(patient),
        appointments: store.appointments.filter((a) => a.patientId === patient.id),
        labResults: store.labResultsByPatient[patient.id] || [],
      };
    });

    if (!result) {
      res.status(401).json({ error: 'Неверный телефон/email или пароль.' });
      return;
    }
    res.json(result);
  });

  app.post('/api/auth/register', async (req, res) => {
    const { fullName, phone, email, iin, password, preferredBranch } = req.body as {
      fullName?: string;
      phone?: string;
      email?: string;
      iin?: string;
      password?: string;
      preferredBranch?: BranchId;
    };

    if (!fullName || !phone || !password || password.length < 4) {
      res.status(400).json({ error: 'Заполните ФИО, казахстанский номер телефона и пароль (от 4 символов).' });
      return;
    }

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      res.status(400).json({ error: 'Введите корректный номер телефона Казахстана (+7 ...).' });
      return;
    }

    const created = await mutateStore((store) => {
      const exists = store.patients.find(
        (p) =>
          p.phone.replace(/\D/g, '').slice(-10) === digits.slice(-10) ||
          (email && p.email.toLowerCase() === email.trim().toLowerCase())
      );
      if (exists) return null;

      const patientId = `pat-${crypto.randomUUID().slice(0, 8)}`;
      const newPatient: StoredPatient = {
        id: patientId,
        fullName: fullName.trim().slice(0, 120),
        phone: phone.trim().slice(0, 32),
        email: (email || '').trim().slice(0, 120),
        iin: (iin || '').replace(/\D/g, '').slice(0, 12),
        preferredBranch: preferredBranch && CITY_MAP[preferredBranch] ? preferredBranch : 'reproduction',
        passwordHash: hashPassword(password),
        notificationSettings: {
          pushEnabled: true,
          leadMinutes: 120,
          notifyOnBooking: true,
          notifyOnResults: true,
        },
      };

      store.patients.push(newPatient);
      store.labResultsByPatient[patientId] = [
        {
          id: `res-${crypto.randomUUID().slice(0, 6)}`,
          title: 'Первичный профиль пациента',
          dateLabel: 'Сегодня',
          doctorName: 'Дежурный репродуктолог',
          value: 'Карта открыта',
          unit: '',
          referenceRange: 'Готово к приему',
          status: 'ready',
          statusLabel: 'Активно',
          comment: 'После первого визита здесь появятся протоколы УЗИ, гормональные панели и отчет эмбриолога.',
        },
      ];

      const token = crypto.randomUUID();
      store.sessions[token] = patientId;

      return {
        token,
        patient: sanitizePatient(newPatient),
        appointments: [] as AppointmentRecord[],
        labResults: store.labResultsByPatient[patientId],
      };
    });

    if (!created) {
      res.status(409).json({ error: 'Пациент с таким телефоном или email уже зарегистрирован.' });
      return;
    }
    res.status(201).json(created);
  });

  app.get('/api/auth/me', async (req, res) => {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: 'Требуется авторизация.' });
      return;
    }

    const store = await ensureStore();
    const patientId = store.sessions[token];
    const patient = store.patients.find((p) => p.id === patientId);
    if (!patient) {
      res.status(401).json({ error: 'Сессия истекла.' });
      return;
    }

    res.json({
      patient: sanitizePatient(patient),
      appointments: store.appointments.filter((a) => a.patientId === patient.id),
      labResults: store.labResultsByPatient[patient.id] || [],
    });
  });

  app.patch('/api/patient/profile', async (req, res) => {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: 'Требуется авторизация.' });
      return;
    }

    const { fullName, phone, email, iin, preferredBranch, notificationSettings } = req.body as Partial<
      PatientAccount & { notificationSettings: Partial<NotificationSettings> }
    >;

    const updated = await mutateStore((store) => {
      const patientId = store.sessions[token];
      const patient = store.patients.find((p) => p.id === patientId);
      if (!patient) return null;

      if (typeof fullName === 'string' && fullName.trim()) patient.fullName = fullName.trim().slice(0, 120);
      if (typeof phone === 'string' && phone.trim()) patient.phone = phone.trim().slice(0, 32);
      if (typeof email === 'string') patient.email = email.trim().slice(0, 120);
      if (typeof iin === 'string') patient.iin = iin.replace(/\D/g, '').slice(0, 12);
      if (preferredBranch && CITY_MAP[preferredBranch]) patient.preferredBranch = preferredBranch;
      if (notificationSettings) {
        patient.notificationSettings = {
          ...patient.notificationSettings,
          ...notificationSettings,
        };
      }
      return sanitizePatient(patient);
    });

    if (!updated) {
      res.status(401).json({ error: 'Сессия не найдена.' });
      return;
    }
    res.json({ patient: updated });
  });

  app.post('/api/appointments', async (req, res) => {
    const token = extractToken(req);
    const body = req.body as {
      patientName?: string;
      patientPhone?: string;
      branchId?: BranchId;
      serviceId?: string;
      serviceTitle?: string;
      doctorId?: string;
      doctorName?: string;
      dateISO?: string;
      timeSlot?: string;
      priceKzt?: number;
      reminderEnabled?: boolean;
      reminderLeadMinutes?: number;
      notes?: string;
    };

    if (!body.patientName || !body.patientPhone || !body.dateISO || !body.timeSlot || !body.serviceTitle) {
      res.status(400).json({ error: 'Заполните имя, телефон, услугу, дату и время приема.' });
      return;
    }

    const created = await mutateStore((store) => {
      const sessionPatientId = token ? store.sessions[token] : undefined;
      const branchId: BranchId = body.branchId && CITY_MAP[body.branchId] ? body.branchId : 'reproduction';

      const record: AppointmentRecord = {
        id: `apt-${crypto.randomUUID().slice(0, 6)}`,
        patientId: sessionPatientId || 'guest',
        patientName: body.patientName!.trim().slice(0, 120),
        patientPhone: body.patientPhone!.trim().slice(0, 32),
        branchId,
        branchCity: CITY_MAP[branchId],
        serviceId: (body.serviceId || 'srv-repro-consult').slice(0, 64),
        serviceTitle: body.serviceTitle!.trim().slice(0, 160),
        doctorId: (body.doctorId || 'any').slice(0, 64),
        doctorName: (body.doctorName || 'Дежурный репродуктолог').trim().slice(0, 120),
        dateISO: body.dateISO!.slice(0, 10),
        timeSlot: body.timeSlot!.slice(0, 10),
        priceKzt: Number(body.priceKzt) || 14000,
        status: 'confirmed',
        reminderEnabled: body.reminderEnabled !== false,
        reminderLeadMinutes: Number(body.reminderLeadMinutes) || 120,
        reminderSent: false,
        notes: body.notes ? body.notes.trim().slice(0, 300) : undefined,
        createdAt: new Date().toISOString(),
      };

      store.appointments.unshift(record);
      return record;
    });

    res.status(201).json({ appointment: created });
  });

  app.patch('/api/appointments/:id', async (req, res) => {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: 'Требуется авторизация.' });
      return;
    }

    const { id } = req.params;
    const { status, dateISO, timeSlot, reminderEnabled, reminderLeadMinutes, reminderSent } = req.body as Partial<
      AppointmentRecord
    >;

    const updated = await mutateStore((store) => {
      const patientId = store.sessions[token];
      if (!patientId) return 'unauthorized' as const;

      const apt = store.appointments.find((a) => a.id === id && a.patientId === patientId);
      if (!apt) return null;

      if (status && ['upcoming', 'confirmed', 'completed', 'cancelled'].includes(status)) {
        apt.status = status;
      }
      if (typeof dateISO === 'string' && dateISO.length >= 8) apt.dateISO = dateISO.slice(0, 10);
      if (typeof timeSlot === 'string' && timeSlot.length >= 4) apt.timeSlot = timeSlot.slice(0, 10);
      if (typeof reminderEnabled === 'boolean') apt.reminderEnabled = reminderEnabled;
      if (typeof reminderLeadMinutes === 'number') apt.reminderLeadMinutes = reminderLeadMinutes;
      if (typeof reminderSent === 'boolean') apt.reminderSent = reminderSent;

      return apt;
    });

    if (updated === 'unauthorized') {
      res.status(401).json({ error: 'Сессия не найдена.' });
      return;
    }
    if (!updated) {
      res.status(404).json({ error: 'Запись не найдена.' });
      return;
    }
    res.json({ appointment: updated });
  });

  let cachedDgisReviews: {
    fetchedAt: number;
    rating: number;
    reviewsCount: number;
    reviews: ClinicReview[];
  } | null = null;

  app.get('/api/reviews', async (_req, res) => {
    const store = await ensureStore();
    const localReviews = store.reviews || [];
    const apiKey = process.env.DGIS_REVIEWS_KEY?.trim();

    if (apiKey) {
      if (cachedDgisReviews && Date.now() - cachedDgisReviews.fetchedAt < 15 * 60_000) {
        res.json({
          mode: 'live_api',
          firmId: DGIS_FIRM_ID,
          rating: cachedDgisReviews.rating,
          reviewsCount: cachedDgisReviews.reviewsCount,
          reviews: [...cachedDgisReviews.reviews, ...localReviews.filter((r) => r.source === 'clinic')],
        });
        return;
      }

      try {
        const url = `https://public-api.reviews.2gis.com/2.0/branches/${DGIS_FIRM_ID}/reviews?limit=12&is_advertiser=false&fields=meta.branch_rating,meta.branch_reviews_count,reviews.is_verified&rated=true&sort_by=date_edited&key=${encodeURIComponent(apiKey)}&locale=ru_KZ`;
        const resp = await fetch(url, { headers: { Accept: 'application/json' } });
        if (resp.ok) {
          const payload = (await resp.json()) as {
            meta?: { branch_rating?: number; branch_reviews_count?: number };
            reviews?: Array<{
              id?: string;
              rating?: number;
              text?: string;
              date_created?: string;
              user?: { name?: string };
            }>;
          };

          const liveReviews: ClinicReview[] = (payload.reviews || [])
            .filter((r) => Boolean(r.text))
            .slice(0, 9)
            .map((r, idx) => ({
              id: `2gis-${r.id || idx}`,
              author: r.user?.name || 'Пациент 2ГИС',
              rating: r.rating || 5,
              dateLabel: r.date_created
                ? new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(
                    new Date(r.date_created)
                  )
                : '2ГИС Алматы',
              program: 'Проверенный отзыв в 2ГИС',
              text: r.text || '',
              source: '2gis',
            }));

          const rating = payload.meta?.branch_rating || 4.9;
          const reviewsCount = payload.meta?.branch_reviews_count || 286;
          cachedDgisReviews = { fetchedAt: Date.now(), rating, reviewsCount, reviews: liveReviews };

          res.json({
            mode: 'live_api',
            firmId: DGIS_FIRM_ID,
            rating,
            reviewsCount,
            reviews: [...liveReviews, ...localReviews.filter((r) => r.source === 'clinic')],
          });
          return;
        }
      } catch (err) {
        console.warn('2GIS API fetch fallback:', err);
      }
    }

    res.json({
      mode: 'widget_and_verified',
      firmId: DGIS_FIRM_ID,
      rating: 4.9,
      reviewsCount: 286,
      reviews: localReviews,
    });
  });

  app.post('/api/reviews', async (req, res) => {
    const { author, rating, program, doctor, text } = req.body as {
      author?: string;
      rating?: number;
      program?: string;
      doctor?: string;
      text?: string;
    };

    if (!author || !text || text.trim().length < 8) {
      res.status(400).json({ error: 'Укажите имя и текст отзыва (минимум 8 символов).' });
      return;
    }

    const review: ClinicReview = {
      id: `rev-${crypto.randomUUID().slice(0, 6)}`,
      author: author.trim().slice(0, 80),
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      dateLabel: new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date()),
      program: (program || 'Прием в МЦ «Репро-Мед»').trim().slice(0, 100),
      doctor: doctor ? doctor.trim().slice(0, 80) : undefined,
      text: text.trim().slice(0, 600),
      source: 'clinic',
    };

    await mutateStore((store) => {
      if (!store.reviews) store.reviews = [];
      store.reviews.unshift(review);
    });

    res.status(201).json({ review });
  });

  const port = resolvePort();

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vitePromise = (async () => {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
        },
        appType: 'spa',
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

  app.listen(port, '0.0.0.0', () => {
    console.log(`EmirMed Reproduction server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
