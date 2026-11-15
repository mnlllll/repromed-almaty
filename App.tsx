import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  UserCheck,
  X,
} from 'lucide-react';
import { BookingModal } from './components/BookingModal';
import { Embryo3DViewport } from './components/Embryo3DViewport';
import { LegalDocumentsModal, type LegalDocTab } from './components/LegalDocumentsModal';
import { PatientCabinetDrawer } from './components/PatientCabinetDrawer';
import {
  CLINIC_BRANCHES,
  CLINIC_DOCTORS,
  CLINIC_LAB_IMAGE,
  CLINIC_SERVICES,
  PATIENT_REVIEWS,
  REPROMED_CONTACTS,
  buildWhatsAppUrl,
  formatKzt,
} from './data/clinicData';
import {
  dispatchClinicPushNotification,
  getPushPermissionState,
  registerClinicServiceWorker,
  requestPushPermission,
  type ClinicPushPayload,
  type PushPermissionState,
} from './lib/notifications';
import type {
  AppointmentRecord,
  BranchId,
  ClinicReview,
  InAppNotification,
  LabResultRecord,
  PatientAccount,
  ServiceCategory,
} from './types/clinic';

const TOKEN_STORAGE_KEY = 'repromed_almaty_token';
const COOKIE_NOTICE_KEY = 'repromed_cookie_notice_v1';

const SERVICE_TABS: Array<{ id: ServiceCategory; label: string }> = [
  { id: 'all', label: 'Все услуги' },
  { id: 'ultrasound', label: 'Все виды УЗИ' },
  { id: 'biopsy_genetics', label: 'Биопсия и кариотип' },
  { id: 'gynecology', label: 'Гинекология' },
  { id: 'andrology', label: 'Уролог-андролог' },
  { id: 'procedures_massage', label: 'Процедуры и массаж' },
];

export default function App() {
  const [authToken, setAuthToken] = useState<string | null>(() =>
    typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_STORAGE_KEY) : null
  );
  const [patient, setPatient] = useState<PatientAccount | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [labResults, setLabResults] = useState<LabResultRecord[]>([]);

  const [serviceFilter, setServiceFilter] = useState<ServiceCategory>('all');
  const [doctorDeptFilter, setDoctorDeptFilter] = useState<'all' | BranchId>('all');

  const [quickBranch, setQuickBranch] = useState<BranchId>('reproduction');
  const [quickService, setQuickService] = useState<string>('srv-ultrasound-all');

  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingDefaults, setBookingDefaults] = useState<{
    branchId: BranchId;
    serviceId: string;
    doctorId: string;
  }>({
    branchId: 'reproduction',
    serviceId: 'srv-ultrasound-all',
    doctorId: '',
  });

  const [cabinetOpen, setCabinetOpen] = useState(false);
  const [pushPermission, setPushPermission] = useState<PushPermissionState>(() =>
    getPushPermissionState()
  );
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [activeToast, setActiveToast] = useState<ClinicPushPayload | null>(null);
  const firedRemindersRef = useRef<Set<string>>(new Set());

  const [reviews, setReviews] = useState<ClinicReview[]>(() =>
    PATIENT_REVIEWS.map((r) => ({
      id: r.id,
      author: r.author,
      rating: 5,
      dateLabel: r.date,
      program: r.program,
      doctor: r.doctor,
      text: r.text,
      source: '2gis',
    }))
  );
  const [dgisRating, setDgisRating] = useState<number>(4.9);
  const [dgisReviewsCount, setDgisReviewsCount] = useState<number>(286);
  const [reviewsMode, setReviewsMode] = useState<'live_api' | 'widget_and_verified'>('widget_and_verified');
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewProgram, setReviewProgram] = useState('Все виды УЗИ (Samsung H-60)');
  const [reviewDoctor, setReviewDoctor] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [reviewConsentAccepted, setReviewConsentAccepted] = useState(false);

  const [legalModalTab, setLegalModalTab] = useState<LegalDocTab | null>(null);
  const [cookieNoticeAccepted, setCookieNoticeAccepted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(COOKIE_NOTICE_KEY) === '1';
  });

  const handleAcceptCookieNotice = () => {
    window.localStorage.setItem(COOKIE_NOTICE_KEY, '1');
    setCookieNoticeAccepted(true);
  };

  const showToastAndLog = useCallback(
    (payload: ClinicPushPayload, kind: InAppNotification['kind'] = 'reminder') => {
      setActiveToast(payload);
      const nowLabel = new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date());

      setNotifications((prev) => [
        {
          id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: payload.title,
          body: payload.body,
          timestamp: nowLabel,
          read: false,
          kind,
        },
        ...prev.slice(0, 19),
      ]);
    },
    []
  );

  // Register Service Worker + listen for SW notification clicks
  useEffect(() => {
    registerClinicServiceWorker();

    if ('serviceWorker' in navigator) {
      const onSwMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OPEN_CABINET') {
          setCabinetOpen(true);
        }
      };
      navigator.serviceWorker.addEventListener('message', onSwMessage);
      return () => navigator.serviceWorker.removeEventListener('message', onSwMessage);
    }
    return undefined;
  }, []);

  // Load 2GIS & clinic reviews
  useEffect(() => {
    let cancelled = false;
    fetch('/api/reviews')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Reviews fetch failed'))))
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.reviews) && data.reviews.length > 0) {
          setReviews(data.reviews);
        }
        if (typeof data.rating === 'number') setDgisRating(data.rating);
        if (typeof data.reviewsCount === 'number') setDgisReviewsCount(data.reviewsCount);
        if (data.mode === 'live_api' || data.mode === 'widget_and_verified') {
          setReviewsMode(data.mode);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  // Restore session if token exists
  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Unauthorized'))))
      .then((data) => {
        if (cancelled) return;
        setPatient(data.patient);
        setAppointments(data.appointments || []);
        setLabResults(data.labResults || []);
      })
      .catch(() => {
        if (cancelled) return;
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        setAuthToken(null);
      });

    return () => {
      cancelled = true;
    };
  }, [authToken]);

  // Automatic visit reminder scheduler
  useEffect(() => {
    if (appointments.length === 0) return;

    const checkUpcomingVisits = () => {
      const now = Date.now();
      for (const apt of appointments) {
        if (
          !apt.reminderEnabled ||
          apt.reminderSent ||
          apt.status === 'cancelled' ||
          apt.status === 'completed' ||
          firedRemindersRef.current.has(apt.id)
        ) {
          continue;
        }

        const visitTime = new Date(`${apt.dateISO}T${apt.timeSlot}:00`).getTime();
        if (Number.isNaN(visitTime)) continue;

        const leadMs = apt.reminderLeadMinutes * 60_000;
        const msUntilVisit = visitTime - now;

        if (msUntilVisit > 0 && msUntilVisit <= leadMs) {
          firedRemindersRef.current.add(apt.id);
          dispatchClinicPushNotification(
            {
              title: 'Напоминание о визите · МЦ «Репро-Мед»',
              body: `${apt.dateISO} в ${apt.timeSlot} — ${apt.serviceTitle} (${apt.doctorName}, пр. Райымбека, 150)`,
              tag: `visit-${apt.id}`,
              url: '/#cabinet',
            },
            (p) => showToastAndLog(p, 'reminder')
          );

          if (authToken) {
            fetch(`/api/appointments/${apt.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({ reminderSent: true }),
            }).catch(() => undefined);
          }
        }
      }
    };

    checkUpcomingVisits();
    const timer = window.setInterval(checkUpcomingVisits, 30_000);
    return () => window.clearInterval(timer);
  }, [appointments, authToken, showToastAndLog]);

  useEffect(() => {
    if (!activeToast) return;
    const t = window.setTimeout(() => setActiveToast(null), 7000);
    return () => window.clearTimeout(t);
  }, [activeToast]);

  const handleRequestPushSetup = async () => {
    const state = await requestPushPermission();
    setPushPermission(state);
    if (state === 'granted') {
      await dispatchClinicPushNotification(
        {
          title: 'МЦ «Репро-Мед» · Уведомления включены',
          body: 'Мы заранее напомним о визите по адресу пр. Райымбека, 150 и готовности анализов.',
          tag: 'repromed-push-enabled',
        },
        (p) => showToastAndLog(p, 'reminder')
      );
    }
  };

  const handleTriggerTestPush = async (delaySeconds = 0) => {
    if (pushPermission === 'default') {
      const state = await requestPushPermission();
      setPushPermission(state);
    }

    const nextVisit = appointments.find(
      (a) => a.status !== 'cancelled' && a.status !== 'completed'
    );

    const payload: ClinicPushPayload = nextVisit
      ? {
          title: 'Напоминание о приеме · МЦ «Репро-Мед»',
          body: `${nextVisit.dateISO} в ${nextVisit.timeSlot} — ${nextVisit.doctorName}. Алматы, пр. Райымбека, 150.`,
          tag: `test-${Date.now()}`,
        }
      : {
          title: 'Напоминание о визите · МЦ «Репро-Мед»',
          body: 'Завтра в 11:30 — Прием и УЗИ экспертного класса (пр. Райымбека, 150, 1-й этаж).',
          tag: `test-${Date.now()}`,
        };

    if (delaySeconds > 0) {
      window.setTimeout(() => {
        dispatchClinicPushNotification(payload, (p) => showToastAndLog(p, 'reminder'));
      }, delaySeconds * 1000);
    } else {
      await dispatchClinicPushNotification(payload, (p) => showToastAndLog(p, 'reminder'));
    }
  };

  const openBookingWith = (opts?: { branchId?: BranchId; serviceId?: string; doctorId?: string }) => {
    setBookingDefaults({
      branchId: opts?.branchId || quickBranch,
      serviceId: opts?.serviceId || quickService,
      doctorId: opts?.doctorId || '',
    });
    setBookingOpen(true);
  };

  const handleBookingCreated = (appointment: AppointmentRecord) => {
    setAppointments((prev) => [appointment, ...prev]);
    dispatchClinicPushNotification(
      {
        title: 'Запись подтверждена · МЦ «Репро-Мед»',
        body: `${appointment.dateISO} в ${appointment.timeSlot} — ${appointment.serviceTitle}. пр. Райымбека, 150.`,
        tag: `booking-${appointment.id}`,
      },
      (p) => showToastAndLog(p, 'booking')
    );
  };

  const handleLoginSuccess = (payload: {
    token: string;
    patient: PatientAccount;
    appointments: AppointmentRecord[];
    labResults: LabResultRecord[];
  }) => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, payload.token);
    setAuthToken(payload.token);
    setPatient(payload.patient);
    setAppointments(payload.appointments);
    setLabResults(payload.labResults);
  };

  const handleLogout = () => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setAuthToken(null);
    setPatient(null);
    setAppointments([]);
    setLabResults([]);
  };

  const handleUpdateAppointment = async (id: string, patch: Partial<AppointmentRecord>) => {
    if (!authToken) return;
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = await res.json();
      setAppointments((prev) => prev.map((a) => (a.id === id ? data.appointment : a)));
    }
  };

  const handleUpdateProfile = async (patch: Partial<PatientAccount>) => {
    if (!authToken) return;
    const res = await fetch('/api/patient/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = await res.json();
      setPatient(data.patient);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    setReviewSuccess(null);

    if (reviewAuthor.trim().length < 2 || reviewText.trim().length < 8) {
      setReviewError('Пожалуйста, укажите имя и текст отзыва (минимум 8 символов).');
      return;
    }
    if (!reviewConsentAccepted) {
      setReviewError('Подтвердите согласие на публикацию отзыва и обработку данных.');
      return;
    }

    setReviewSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: reviewAuthor.trim(),
          rating: reviewRating,
          program: reviewProgram.trim(),
          doctor: reviewDoctor || undefined,
          text: reviewText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.error || 'Не удалось сохранить отзыв.');
        return;
      }
      setReviews((prev) => [data.review, ...prev]);
      setDgisReviewsCount((prev) => prev + 1);
      setReviewAuthor('');
      setReviewText('');
      setReviewDoctor('');
      setReviewRating(5);
      setReviewSuccess('Спасибо! Ваш отзыв сохранен и добавлен на страницу клиники.');
      setReviewFormOpen(false);
    } catch {
      setReviewError('Ошибка сети при отправке отзыва.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const filteredServices = useMemo(() => {
    if (serviceFilter === 'all') return CLINIC_SERVICES;
    return CLINIC_SERVICES.filter((s) => s.category === serviceFilter);
  }, [serviceFilter]);

  const filteredDoctors = useMemo(() => {
    if (doctorDeptFilter === 'all') return CLINIC_DOCTORS;
    return CLINIC_DOCTORS.filter((d) => d.branchId === doctorDeptFilter);
  }, [doctorDeptFilter]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Top Bar Contract: 3 zones, gap-8, 1-line controls */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-8 px-6 py-3.5">
          {/* Zone 1: Single clean wordmark */}
          <a
            href="#top"
            className="font-display text-lg font-extrabold tracking-tight text-[#0B2545] whitespace-nowrap shrink-0"
          >
            Репро-Мед Алматы
          </a>

          {/* Zone 2: 5 concise single-line text nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#services" className="hover:text-[#0B2545] transition-colors whitespace-nowrap shrink-0">
              Услуги и цены
            </a>
            <a href="#doctors" className="hover:text-[#0B2545] transition-colors whitespace-nowrap shrink-0">
              Врачи
            </a>
            <a href="#atlas-3d" className="hover:text-[#0B2545] transition-colors whitespace-nowrap shrink-0">
              3D Атлас
            </a>
            <a href="#branches" className="hover:text-[#0B2545] transition-colors whitespace-nowrap shrink-0">
              Контакты
            </a>
            <a href="#reviews" className="hover:text-[#0B2545] transition-colors whitespace-nowrap shrink-0">
              Отзывы
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setCabinetOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B2545] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#133866] whitespace-nowrap shrink-0"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Личный кабинет</span>
            </button>
          </div>
        </div>
      </header>

      {/* Live Push Notification Toast */}
      {activeToast && (
        <div
          role="status"
          className="fixed top-20 right-4 z-50 w-[calc(100%-32px)] max-w-sm rounded-xl border border-[#0D9488]/30 bg-white p-4 shadow-lg"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 rounded-lg bg-[#0D9488]/10 p-1.5 text-[#0D9488]">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0B2545]">{activeToast.title}</div>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{activeToast.body}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveToast(null)}
              aria-label="Скрыть уведомление"
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <main id="top">
        {/* Hero Section + 3D Embryology Viewport */}
        <section id="atlas-3d" className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1280px] px-6 py-10 lg:py-14">
            <div className="grid items-stretch gap-8 lg:grid-cols-12">
              {/* Left Column */}
              <div className="flex flex-col justify-between lg:col-span-5">
                <div>
                  <div className="text-xs font-medium text-[#0D9488]">
                    Алматы, проспект Райымбека, 150 · На рынке с 2009 года · @repro.med
                  </div>

                  <h1 className="mt-3 font-display text-[clamp(2.15rem,3.6vw,3.2rem)] leading-[1.1] font-extrabold tracking-tight text-[#0B2545]">
                    Медицинский центр «Репро-Мед» — репродукция и диагностика
                  </h1>

                  <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
                    Квалифицированные врачи со стажем более 10 лет: все виды УЗИ (Samsung H-60),
                    биопсия с результатом в тот же день, кариотипирование за 5 дней, гинекология,
                    уролог-андролог, процедурный кабинет и массаж по выгодным ценам.
                  </p>

                  {/* Primary + Kazakhstan WhatsApp / Phone Call CTAs */}
                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => openBookingWith()}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0D9488] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#0F766E] whitespace-nowrap"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Записаться на прием</span>
                    </button>

                    <a
                      href={buildWhatsAppUrl(
                        REPROMED_CONTACTS.whatsappDigits,
                        'Здравствуйте! Хочу записаться в медицинский центр «Репро-Мед» (проспект Райымбека, 150).'
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#16A34A] px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#15803D] whitespace-nowrap"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>WhatsApp {REPROMED_CONTACTS.whatsappDisplay}</span>
                    </a>

                    <a
                      href={REPROMED_CONTACTS.registryHref}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-mono text-sm font-semibold text-[#0B2545] tabular-nums transition-colors hover:bg-slate-50 whitespace-nowrap"
                    >
                      <Phone className="h-4 w-4 text-[#0D9488]" />
                      <span>{REPROMED_CONTACTS.registryDisplay}</span>
                    </a>
                  </div>
                </div>

                {/* Push Reminder Activation Bar */}
                <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-[#0B2545]">
                        Push-напоминания о визитах и готовности анализов
                      </div>
                      <div className="mt-0.5 text-xs text-slate-600">
                        {pushPermission === 'granted'
                          ? 'Push-сервис активен: уведомления придут автоматически'
                          : 'Напоминание о приеме, биопсии (1 день) и кариотипировании (5 дней)'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={
                        pushPermission === 'granted'
                          ? () => handleTriggerTestPush(0)
                          : handleRequestPushSetup
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-[#0B2545] hover:bg-slate-100 whitespace-nowrap"
                    >
                      <Bell className="h-3.5 w-3.5 text-[#0D9488]" />
                      <span>
                        {pushPermission === 'granted' ? 'Проверить push' : 'Включить напоминания'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive 3D Design */}
              <div className="lg:col-span-7">
                <Embryo3DViewport />
              </div>
            </div>

            {/* Full-width 4-Column KPI Strip below hero split */}
            <div className="mt-10 grid gap-4 border-t border-slate-200 pt-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                <div className="font-mono text-2xl font-bold text-[#0B2545] tabular-nums">с 2009 г.</div>
                <div className="mt-1 text-xs font-medium text-slate-600">
                  На рынке медицинских услуг Алматы · Врачи со стажем 10–25+ лет
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                <div className="font-mono text-2xl font-bold text-[#0B2545] tabular-nums">1 день</div>
                <div className="mt-1 text-xs font-medium text-slate-600">
                  Биопсия с выдачей результата в тот же день обращения
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                <div className="font-mono text-2xl font-bold text-[#0B2545] tabular-nums">5 дней</div>
                <div className="mt-1 text-xs font-medium text-slate-600">
                  Кариотипирование и генетический скрининг хромосом
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                <div className="font-mono text-2xl font-bold text-[#0D9488] tabular-nums">7 дней</div>
                <div className="mt-1 text-xs font-medium text-slate-600">
                  Процедурный кабинет без выходных · Пн–Сб до 20:00, Вс до 15:00
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Booking Bar (emirmed.kz style) */}
        <section className="border-b border-slate-200 bg-[#0B2545] py-6 text-white">
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="grid items-end gap-4 md:grid-cols-12">
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-slate-300">Отделение (пр. Райымбека, 150)</label>
                <select
                  value={quickBranch}
                  onChange={(e) => setQuickBranch(e.target.value as BranchId)}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-sm text-white focus:border-[#14B8A6] focus:outline-none"
                >
                  {CLINIC_BRANCHES.map((b) => (
                    <option key={b.id} value={b.id} className="text-slate-900">
                      {b.city} — {b.phoneDisplay}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-5">
                <label className="block text-xs font-medium text-slate-300">Выберите услугу или диагностику</label>
                <select
                  value={quickService}
                  onChange={(e) => setQuickService(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-sm text-white focus:border-[#14B8A6] focus:outline-none"
                >
                  {CLINIC_SERVICES.map((s) => (
                    <option key={s.id} value={s.id} className="text-slate-900">
                      {s.title} — {formatKzt(s.priceKzt)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <button
                  type="button"
                  onClick={() => openBookingWith({ branchId: quickBranch, serviceId: quickService })}
                  className="w-full rounded-xl bg-[#0D9488] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#14B8A6]"
                >
                  Подобрать время приема
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 01. Services & Transparent Pricing */}
        <section id="services" className="mx-auto max-w-[1280px] px-6 py-16">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="text-xs font-semibold tracking-wide text-[#0D9488]">
                01. Услуги и акции центра
              </div>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#0B2545]">
                Направления медицинского центра «Репро-Мед»
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-200/70 p-1">
              {SERVICE_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setServiceFilter(t.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    serviceFilter === t.id
                      ? 'bg-white text-[#0B2545] shadow-sm'
                      : 'text-slate-600 hover:text-[#0B2545]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((srv) => (
              <div
                key={srv.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span>
                      {srv.code}. {srv.categoryLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                      <Clock className="h-3.5 w-3.5" />
                      {srv.durationMinutes} мин
                    </span>
                  </div>

                  <h3 className="mt-2.5 font-display text-lg font-bold text-[#0B2545]">
                    {srv.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{srv.subtitle}</p>

                  <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-3.5 text-xs text-slate-600">
                    {srv.includes.map((item) => (
                      <li key={item}>— {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <span className="font-mono text-xl font-bold text-[#0B2545] tabular-nums">
                        {formatKzt(srv.priceKzt)}
                      </span>
                      {srv.oldPriceKzt && (
                        <span className="ml-2 font-mono text-xs text-slate-400 line-through tabular-nums">
                          {formatKzt(srv.oldPriceKzt)}
                        </span>
                      )}
                    </div>
                    {srv.oldPriceKzt && (
                      <span className="text-xs font-semibold text-[#0D9488]">Акция</span>
                    )}
                  </div>

                  <div className="mt-3.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openBookingWith({ serviceId: srv.id })}
                      className="flex-1 rounded-xl bg-[#0B2545] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#133866]"
                    >
                      Записаться
                    </button>
                    <a
                      href={buildWhatsAppUrl(
                        REPROMED_CONTACTS.whatsappDigits,
                        `Здравствуйте! Подскажите подробнее об услуге в «Репро-Мед»: ${srv.title} (${formatKzt(srv.priceKzt)}).`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-[#15803D] hover:bg-emerald-50"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 02. Doctors Grid */}
        <section id="doctors" className="border-y border-slate-200 bg-white py-16">
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <div className="text-xs font-semibold tracking-wide text-[#0D9488]">
                  02. Врачи со стажем более 10 лет
                </div>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#0B2545]">
                  Специалисты клиники «Репро-Мед»
                </h2>
              </div>

              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                {[
                  { id: 'all', label: 'Все врачи' },
                  { id: 'reproduction', label: 'Гинекология и андрология' },
                  { id: 'diagnostics', label: 'УЗИ и генетика' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setDoctorDeptFilter(f.id as 'all' | BranchId)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                      doctorDeptFilter === f.id
                        ? 'bg-white text-[#0B2545] shadow-sm'
                        : 'text-slate-600 hover:text-[#0B2545]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filteredDoctors.map((doc) => (
                <article
                  key={doc.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-[#F8FAFC]"
                >
                  <div>
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-200">
                      <img
                        src={doc.imageUrl}
                        alt={doc.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover object-top"
                      />
                    </div>

                    <div className="p-5">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        {doc.isTop && <span className="font-semibold text-[#0D9488]">ТОП-врач</span>}
                        {doc.isTop && <span aria-hidden="true">·</span>}
                        <span className="inline-flex items-center gap-1 font-mono text-slate-700 tabular-nums">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {doc.rating.toFixed(1)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{doc.reviewsCount} отзывов</span>
                      </div>

                      <h3 className="mt-2 font-display text-base font-bold text-[#0B2545]">
                        {doc.name}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">{doc.role}</p>

                      <div className="mt-3 space-y-1 text-xs text-slate-500">
                        <div>
                          Стаж <span className="font-mono font-semibold text-slate-700 tabular-nums">{doc.experienceYears} лет</span> · пр. Райымбека, 150
                        </div>
                        <div>Ближайшее окно: {doc.nearestSlot}</div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200/80 bg-white px-5 py-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-xs text-slate-500">Прием</span>
                      <span className="font-mono font-bold text-[#0B2545] tabular-nums">
                        {formatKzt(doc.priceKzt)}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openBookingWith({ branchId: doc.branchId, doctorId: doc.id })
                        }
                        className="flex-1 rounded-xl bg-[#0D9488] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0F766E]"
                      >
                        Записаться
                      </button>
                      <a
                        href={buildWhatsAppUrl(
                          REPROMED_CONTACTS.whatsappDigits,
                          `Здравствуйте! Хочу записаться в «Репро-Мед» к врачу: ${doc.name}.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Написать в WhatsApp по поводу записи к ${doc.name}`}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-[#15803D] hover:bg-emerald-50"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 03. Diagnostics Proof + Patient Testimonials */}
        <section id="reviews" className="mx-auto max-w-[1280px] px-6 py-16">
          <div className="grid items-stretch gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <img
                  src={CLINIC_LAB_IMAGE}
                  alt="Диагностическая лаборатория медицинского центра Репро-Мед Алматы"
                  referrerPolicy="no-referrer"
                  className="h-full min-h-[320px] w-full object-cover"
                />
              </div>
            </div>

            <div className="flex flex-col justify-between lg:col-span-6">
              <div>
                <div className="text-xs font-semibold tracking-wide text-[#0D9488]">
                  03. Опыт с 2009 года
                </div>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#0B2545]">
                  Точная диагностика и сохранение репродуктивного здоровья
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Медицинский центр «Репро-Мед» работает в Алматы с 2009 года. Мы объединили
                  консультации опытных гинекологов, генетиков, урологов-андрологов, экспертное УЗИ
                  на аппарате Samsung H-60, ускоренную биопсию за 1 день и кариотипирование за 5 дней.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="font-mono text-lg font-bold text-[#0B2545] tabular-nums">
                      Samsung H-60
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      Экспертный аппарат УЗИ для пренатального скрининга и всех видов диагностики
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="font-mono text-lg font-bold text-[#0B2545] tabular-nums">
                      1 день / 5 дней
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      Биопсия с ответом в день обращения и кариотипирование за 5 рабочих дней
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCabinetOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0B2545] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#133866]"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Демо личного кабинета пациента</span>
                </button>
                <a
                  href={REPROMED_CONTACTS.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-[#0B2545] hover:bg-slate-50"
                >
                  <span>Instagram @repro.med</span>
                </a>
              </div>
            </div>
          </div>

          {/* 2GIS Header + Actions */}
          <div className="mt-14 flex flex-col justify-between gap-4 border-t border-slate-200 pt-10 md:flex-row md:items-end">
            <div>
              <div className="text-xs font-semibold tracking-wide text-[#0D9488]">
                Отзывы пациентов · 2ГИС Алматы
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 font-display text-2xl font-bold text-[#0B2545] tabular-nums">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  {dgisRating.toFixed(1)}
                </span>
                <span className="text-sm text-slate-600 tabular-nums">
                  из 5 · {dgisReviewsCount}+ оценок в 2ГИС
                </span>
                <span className="text-xs text-slate-400" aria-hidden="true">
                  /
                </span>
                <span className="text-xs text-slate-500">
                  {reviewsMode === 'live_api'
                    ? 'Синхронизировано по API 2ГИС'
                    : 'Карточка 2ГИС № 9429940000850084'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setReviewFormOpen((v) => !v);
                  setReviewError(null);
                  setReviewSuccess(null);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-[#0B2545] transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                <span>{reviewFormOpen ? 'Скрыть форму' : 'Оставить отзыв'}</span>
              </button>
              <a
                href={REPROMED_CONTACTS.dgisReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0D9488] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#0F766E] whitespace-nowrap shrink-0"
              >
                <span>Все отзывы в 2ГИС</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {reviewSuccess && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
              {reviewSuccess}
            </div>
          )}

          {reviewFormOpen && (
            <form
              onSubmit={handleReviewSubmit}
              className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-display text-base font-bold text-[#0B2545]">
                  Оставить отзыв о МЦ «Репро-Мед»
                </h3>
                <button
                  type="button"
                  onClick={() => setReviewFormOpen(false)}
                  aria-label="Закрыть форму отзыва"
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {reviewError && (
                <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {reviewError}
                </div>
              )}

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600">Ваше имя</label>
                  <input
                    type="text"
                    required
                    value={reviewAuthor}
                    onChange={(e) => setReviewAuthor(e.target.value)}
                    placeholder="Например, Динара К."
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A] focus:border-[#0D9488] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600">Оценка</label>
                  <div className="mt-1.5 flex h-[38px] items-center gap-1.5 rounded-xl border border-slate-200 bg-[#F8FAFC] px-3">
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setReviewRating(starVal)}
                        aria-label={`Оценка ${starVal}`}
                        className="p-0.5"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            starVal <= reviewRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-1 font-mono text-xs text-slate-600 tabular-nums">
                      {reviewRating}.0
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600">Услуга</label>
                  <select
                    value={reviewProgram}
                    onChange={(e) => setReviewProgram(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A] focus:border-[#0D9488] focus:outline-none"
                  >
                    <option value="Все виды УЗИ (Samsung H-60)">Все виды УЗИ (Samsung H-60)</option>
                    <option value="Биопсия (результат в тот же день)">Биопсия (1 день)</option>
                    <option value="Кариотипирование (результат 5 дней)">Кариотипирование (5 дней)</option>
                    <option value="Гинекология и репродуктология">Гинекология и репродуктология</option>
                    <option value="Уролог-андролог">Уролог-андролог</option>
                    <option value="Процедурный кабинет и массаж">Процедурный кабинет и массаж</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600">Врач (необязательно)</label>
                  <select
                    value={reviewDoctor}
                    onChange={(e) => setReviewDoctor(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A] focus:border-[#0D9488] focus:outline-none"
                  >
                    <option value="">Без привязки к врачу</option>
                    {CLINIC_DOCTORS.map((doc) => (
                      <option key={doc.id} value={doc.name}>
                        {doc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-medium text-slate-600">Текст отзыва</label>
                <textarea
                  required
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Поделитесь впечатлениями о приеме, диагностике или работе регистратуры..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A] focus:border-[#0D9488] focus:outline-none"
                />
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={reviewConsentAccepted}
                    onChange={(e) => setReviewConsentAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[#0D9488]"
                  />
                  <span>
                    Согласен на публикацию отзыва и{' '}
                    <button
                      type="button"
                      onClick={() => setLegalModalTab('privacy')}
                      className="font-semibold text-[#0B2545] underline hover:text-[#0D9488]"
                    >
                      обработку данных
                    </button>{' '}
                    (Закон РК № 94-V).
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="rounded-xl bg-[#0B2545] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#133866] disabled:opacity-60 whitespace-nowrap shrink-0"
                >
                  {reviewSubmitting ? 'Публикация...' : 'Опубликовать отзыв'}
                </button>
              </div>
            </form>
          )}

          {/* Reviews Grid */}
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {reviews.slice(0, 6).map((rev) => (
              <article
                key={rev.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <div className="inline-flex items-center gap-0.5" aria-label={`Оценка ${rev.rating} из 5`}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span>
                      {rev.source === '2gis' ? '2ГИС Алматы' : 'Отзыв на сайте'} · {rev.dateLabel}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">«{rev.text}»</p>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <div className="text-sm font-semibold text-[#0B2545]">{rev.author}</div>
                  <div className="mt-0.5 text-xs text-[#0D9488]">
                    {rev.program}
                    {rev.doctor ? ` · Врач: ${rev.doctor}` : ''}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Official Live 2GIS Firm & Map Widget */}
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center">
              <div>
                <div className="font-display text-sm font-bold text-[#0B2545]">
                  Официальная карточка «Репро-Мед» в 2ГИС Алматы
                </div>
                <div className="text-xs text-slate-500">
                  пр. Райымбека, 150 (уг. ул. Чайковского) · Вход, отзывы и построение маршрута
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={REPROMED_CONTACTS.dgisFirmUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#0B2545] hover:bg-slate-100 whitespace-nowrap shrink-0"
                >
                  <span>Открыть в 2ГИС</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href={REPROMED_CONTACTS.dgisReviewsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2545] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#133866] whitespace-nowrap shrink-0"
                >
                  <span>Написать отзыв в 2ГИС</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
            <div className="h-[340px] w-full bg-slate-100">
              <iframe
                title="Медицинский центр Репро-Мед на карте 2ГИС Алматы"
                src={REPROMED_CONTACTS.dgisWidgetUrl}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>

        {/* 04. Departments & Direct Phone / WhatsApp Contacts */}
        <section id="branches" className="border-t border-slate-200 bg-white py-16">
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold tracking-wide text-[#0D9488]">
                04. Контакты и запись · Алматы
              </div>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#0B2545]">
                Проспект Райымбека, 150 — телефоны и WhatsApp
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Позвоните в регистратуру или по мобильному номеру в Казахстане, либо напишите в
                WhatsApp на {REPROMED_CONTACTS.whatsappDisplay} для быстрой записи.
              </p>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {CLINIC_BRANCHES.map((branch) => (
                <div
                  key={branch.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-[#0D9488]">{branch.city}</span>
                      <span>{branch.coordinatesLabel}</span>
                    </div>

                    <h3 className="mt-2 font-display text-lg font-bold text-[#0B2545]">
                      {branch.name}
                    </h3>

                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <span>{branch.address}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <span>{branch.hours}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2.5 border-t border-slate-200 pt-4">
                    <a
                      href={branch.phoneHref}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-mono text-sm font-semibold text-[#0B2545] tabular-nums transition-colors hover:bg-slate-100"
                    >
                      <Phone className="h-4 w-4 text-[#0D9488]" />
                      <span>Позвонить {branch.phoneDisplay}</span>
                    </a>

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={buildWhatsAppUrl(
                          branch.whatsappDigits,
                          `Здравствуйте! Хочу записаться в «Репро-Мед» (${branch.city}, пр. Райымбека, 150).`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#16A34A] px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#15803D]"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => openBookingWith({ branchId: branch.id })}
                        className="rounded-xl bg-[#0B2545] px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#133866]"
                      >
                        Записаться
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer with Legal & Privacy Compliance */}
      <footer className="border-t border-slate-200 bg-[#0B2545] py-10 text-slate-300">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="font-display text-base font-bold text-white">
                Медицинский центр «Репро-Мед»
              </div>
              <div className="mt-1 text-xs text-slate-400">
                г. Алматы, проспект Райымбека, 150 (уг. ул. Чайковского) · Работаем с 2009 года · Instagram @repro.med
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <a
                href={REPROMED_CONTACTS.registryHref}
                className="font-mono text-white tabular-nums hover:underline"
              >
                {REPROMED_CONTACTS.registryDisplay}
              </a>
              <span aria-hidden="true">·</span>
              <a
                href={REPROMED_CONTACTS.mobileHref}
                className="font-mono text-white tabular-nums hover:underline"
              >
                {REPROMED_CONTACTS.mobileDisplay}
              </a>
              <span aria-hidden="true">·</span>
              <a
                href={buildWhatsAppUrl(
                  REPROMED_CONTACTS.whatsappDigits,
                  'Здравствуйте! Вопрос с сайта МЦ «Репро-Мед».'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-300 hover:underline"
              >
                WhatsApp {REPROMED_CONTACTS.whatsappDisplay}
              </a>
              <span aria-hidden="true">·</span>
              <a
                href={REPROMED_CONTACTS.taplinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-200 hover:underline"
              >
                taplink.cc/repro.med
              </a>
            </div>
          </div>

          <div className="mt-6 flex flex-col justify-between gap-4 border-t border-white/10 pt-5 text-xs text-slate-400 lg:flex-row lg:items-center">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <button
                type="button"
                onClick={() => setLegalModalTab('privacy')}
                className="text-left text-slate-300 hover:text-white hover:underline"
              >
                Политика конфиденциальности
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => setLegalModalTab('pdn')}
                className="text-left text-slate-300 hover:text-white hover:underline"
              >
                Согласие на обработку ПДн и ИИН
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => setLegalModalTab('terms')}
                className="text-left text-slate-300 hover:text-white hover:underline"
              >
                Пользовательское соглашение
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => setLegalModalTab('cookies')}
                className="text-left text-slate-300 hover:text-white hover:underline"
              >
                Cookies и Push
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => setLegalModalTab('medical')}
                className="text-left text-slate-300 hover:text-white hover:underline"
              >
                Мед. дисклеймер и 18+
              </button>
            </div>

            <div className="max-w-lg text-[11px] leading-relaxed text-slate-400">
              Имеются противопоказания. Необходима очная консультация врача. Сведения и 3D-модели носят ознакомительный характер. Экстренная помощь: 103 / 112.
            </div>
          </div>
        </div>
      </footer>

      {/* Discreet Bottom-Left Cookie & LocalStorage Notice */}
      {!cookieNoticeAccepted && (
        <div
          role="region"
          aria-label="Уведомление об использовании cookies и локального хранилища"
          className="fixed bottom-4 left-4 z-30 w-[calc(100%-32px)] max-w-sm rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur-sm"
        >
          <div className="text-xs font-semibold text-[#0B2545]">
            Конфиденциальность, Cookies и Push
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Сайт использует техническое хранилище браузера (<code className="font-mono text-[11px]">localStorage</code>) для работы личного кабинета и Service Worker для напоминаний о визитах.
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setLegalModalTab('cookies')}
              className="text-xs font-semibold text-[#0D9488] underline hover:text-[#0F766E]"
            >
              Подробнее о ПДн и Cookies
            </button>
            <button
              type="button"
              onClick={handleAcceptCookieNotice}
              className="rounded-lg bg-[#0B2545] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#133866]"
            >
              Понятно
            </button>
          </div>
        </div>
      )}

      {/* Compact Floating Kazakhstan Quick-Contact Dock */}
      <div className="fixed right-4 bottom-4 z-30 flex items-center gap-2">
        <a
          href={buildWhatsAppUrl(
            REPROMED_CONTACTS.whatsappDigits,
            'Здравствуйте! Нужна консультация и запись в МЦ «Репро-Мед» (пр. Райымбека, 150).'
          )}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Написать в WhatsApp"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[#16A34A] px-4 text-xs font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] hover:bg-[#15803D]"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
        <a
          href={REPROMED_CONTACTS.mobileHref}
          aria-label="Позвонить в Репро-Мед"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[#0B2545] px-4 text-xs font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] hover:bg-[#133866]"
        >
          <Phone className="h-4 w-4" />
          <span className="hidden sm:inline font-mono tabular-nums">
            {REPROMED_CONTACTS.mobileDisplay}
          </span>
        </a>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        initialBranchId={bookingDefaults.branchId}
        initialServiceId={bookingDefaults.serviceId}
        initialDoctorId={bookingDefaults.doctorId}
        patient={patient}
        authToken={authToken}
        onBookingCreated={handleBookingCreated}
        onOpenCabinet={() => setCabinetOpen(true)}
        onRequestPushSetup={handleRequestPushSetup}
        onOpenLegal={(tab) => setLegalModalTab(tab)}
      />

      {/* Patient Personal Account Drawer */}
      <PatientCabinetDrawer
        isOpen={cabinetOpen}
        onClose={() => setCabinetOpen(false)}
        patient={patient}
        appointments={appointments}
        labResults={labResults}
        notifications={notifications}
        pushPermission={pushPermission}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        onUpdateAppointment={handleUpdateAppointment}
        onUpdateProfile={handleUpdateProfile}
        onRequestPushPermission={handleRequestPushSetup}
        onTriggerTestPush={handleTriggerTestPush}
        onOpenBooking={() => openBookingWith()}
        onOpenLegal={(tab) => setLegalModalTab(tab)}
      />

      {/* Legal & Privacy Documents Modal */}
      <LegalDocumentsModal
        activeTab={legalModalTab}
        onSelectTab={setLegalModalTab}
        onClose={() => setLegalModalTab(null)}
      />
    </div>
  );
}
