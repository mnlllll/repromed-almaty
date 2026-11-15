import React, { useEffect, useState } from 'react';
import { Bell, Calendar, CheckCircle2, MessageCircle, Phone, X } from 'lucide-react';
import {
  CLINIC_BRANCHES,
  CLINIC_DOCTORS,
  CLINIC_SERVICES,
  REPROMED_CONTACTS,
  buildWhatsAppUrl,
  formatKzt,
} from '../data/clinicData';
import type { AppointmentRecord, BranchId, PatientAccount } from '../types/clinic';
import type { LegalDocTab } from './LegalDocumentsModal';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBranchId?: BranchId;
  initialServiceId?: string;
  initialDoctorId?: string;
  patient: PatientAccount | null;
  authToken: string | null;
  onBookingCreated: (appointment: AppointmentRecord) => void;
  onOpenCabinet: () => void;
  onRequestPushSetup: () => Promise<void>;
  onOpenLegal: (tab: LegalDocTab) => void;
}

const DEFAULT_SLOTS = ['09:30', '10:30', '12:00', '14:30', '16:00', '17:30'];

function getUpcomingDates(): Array<{ iso: string; label: string }> {
  const result: Array<{ iso: string; label: string }> = [];
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const prefix = i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : '';
    const formatted = formatter.format(d);
    result.push({
      iso,
      label: prefix ? `${prefix} · ${formatted}` : formatted,
    });
  }
  return result;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  initialBranchId = 'reproduction',
  initialServiceId = 'srv-ultrasound-all',
  initialDoctorId = '',
  patient,
  authToken,
  onBookingCreated,
  onOpenCabinet,
  onRequestPushSetup,
  onOpenLegal,
}) => {
  const dates = getUpcomingDates();
  const [branchId, setBranchId] = useState<BranchId>(initialBranchId);
  const [serviceId, setServiceId] = useState<string>(initialServiceId);
  const [doctorId, setDoctorId] = useState<string>(initialDoctorId);
  const [dateISO, setDateISO] = useState<string>(dates[1]?.iso || dates[0].iso);
  const [timeSlot, setTimeSlot] = useState<string>('11:30');
  const [patientName, setPatientName] = useState<string>(patient?.fullName || '');
  const [patientPhone, setPatientPhone] = useState<string>(patient?.phone || '+7 (7');
  const [notes, setNotes] = useState<string>('');
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(true);
  const [reminderLeadMinutes, setReminderLeadMinutes] = useState<number>(120);
  const [consentAccepted, setConsentAccepted] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdAppointment, setCreatedAppointment] = useState<AppointmentRecord | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setBranchId(initialBranchId);
    setServiceId(initialServiceId);
    setDoctorId(initialDoctorId);
    setPatientName(patient?.fullName || '');
    setPatientPhone(patient?.phone || '+7 (7');
    setConsentAccepted(Boolean(patient));
    setErrorMsg(null);
    setCreatedAppointment(null);
  }, [isOpen, initialBranchId, initialServiceId, initialDoctorId, patient]);

  if (!isOpen) return null;

  const selectedBranch = CLINIC_BRANCHES.find((b) => b.id === branchId) || CLINIC_BRANCHES[0];
  const selectedService = CLINIC_SERVICES.find((s) => s.id === serviceId) || CLINIC_SERVICES[0];
  const branchDoctors = CLINIC_DOCTORS.filter((d) => d.branchId === branchId);
  const selectedDoctor = CLINIC_DOCTORS.find((d) => d.id === doctorId) || null;
  const slots = selectedDoctor ? selectedDoctor.availableSlots : DEFAULT_SLOTS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (patientName.trim().length < 2) {
      setErrorMsg('Укажите фамилию и имя пациента.');
      return;
    }
    const digits = patientPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      setErrorMsg('Введите корректный номер телефона Казахстана (+7 7XX XXX-XX-XX).');
      return;
    }
    if (!consentAccepted) {
      setErrorMsg('Необходимо дать согласие на обработку персональных данных.');
      return;
    }

    setSubmitting(true);
    try {
      if (reminderEnabled) {
        await onRequestPushSetup();
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          patientName: patientName.trim(),
          patientPhone: patientPhone.trim(),
          branchId,
          serviceId: selectedService.id,
          serviceTitle: selectedService.title,
          doctorId: selectedDoctor?.id || 'any',
          doctorName: selectedDoctor?.name || 'Дежурный специалист Репро-Мед',
          dateISO,
          timeSlot,
          priceKzt: selectedDoctor ? selectedDoctor.priceKzt : selectedService.priceKzt,
          reminderEnabled,
          reminderLeadMinutes,
          notes: notes.trim(),
        }),
      });

      const data = (await res.json()) as { appointment?: AppointmentRecord; error?: string };
      if (!res.ok || !data.appointment) {
        throw new Error(data.error || 'Не удалось создать запись.');
      }

      setCreatedAppointment(data.appointment);
      onBookingCreated(data.appointment);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Ошибка соединения с сервером.');
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappBookingHref = buildWhatsAppUrl(
    REPROMED_CONTACTS.whatsappDigits,
    `Здравствуйте! Хочу записаться в МЦ «Репро-Мед» (пр. Райымбека, 150) на услугу: ${selectedService.title}, дата ${dateISO}, время ${timeSlot}.`
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="text-xs font-medium text-[#0D9488]">
              Онлайн-запись · Репро-Мед (Алматы, пр. Райымбека, 150)
            </div>
            <h2 id="booking-modal-title" className="mt-1 text-xl font-bold text-[#0B2545]">
              {createdAppointment ? 'Запись подтверждена' : 'Запись на прием к специалисту'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно записи"
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {createdAppointment ? (
          <div className="mt-5 space-y-5">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="flex items-center gap-2.5 text-emerald-800">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span className="font-semibold">
                  Талон #{createdAppointment.id} успешно оформлен
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <div>
                  <span className="text-slate-500">Адрес:</span> г. Алматы, пр. Райымбека, 150
                </div>
                <div>
                  <span className="text-slate-500">Дата и время:</span>{' '}
                  <span className="font-mono tabular-nums">
                    {createdAppointment.dateISO} · {createdAppointment.timeSlot}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Услуга:</span> {createdAppointment.serviceTitle}
                </div>
                <div>
                  <span className="text-slate-500">Врач:</span> {createdAppointment.doctorName}
                </div>
              </div>
              {createdAppointment.reminderEnabled && (
                <div className="mt-3 flex items-center gap-2 border-t border-emerald-200/70 pt-2.5 text-xs text-emerald-900">
                  <Bell className="h-4 w-4 shrink-0" />
                  <span>
                    Push-напоминание о визите активно (за {createdAppointment.reminderLeadMinutes} мин до приема).
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCabinet();
                }}
                className="rounded-xl bg-[#0B2545] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#133866]"
              >
                Открыть в личном кабинете
              </button>
              <a
                href={whatsappBookingHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#16A34A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#15803D]"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Продублировать в WhatsApp</span>
              </a>
              <a
                href={REPROMED_CONTACTS.registryHref}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 font-mono text-sm font-medium text-slate-700 tabular-nums hover:bg-slate-50"
              >
                <Phone className="h-4 w-4" />
                <span>{REPROMED_CONTACTS.registryDisplay}</span>
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-600">Отделение клиники</label>
                <select
                  value={branchId}
                  onChange={(e) => {
                    const nextBranch = e.target.value as BranchId;
                    setBranchId(nextBranch);
                    setDoctorId('');
                  }}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none"
                >
                  {CLINIC_BRANCHES.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.city} — {b.phoneDisplay}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600">Услуга или обследование</label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none"
                >
                  {CLINIC_SERVICES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({formatKzt(s.priceKzt)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600">Врач-специалист (стаж 10–25+ лет)</label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none"
              >
                <option value="">Любой свободный специалист ({selectedBranch.city})</option>
                {branchDoctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} · стаж {doc.experienceYears} лет ({formatKzt(doc.priceKzt)})
                  </option>
                ))}
                {CLINIC_DOCTORS.filter((d) => d.branchId !== branchId).map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} · {doc.role}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-600">Дата приема</label>
                <div className="relative mt-1.5">
                  <Calendar className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-slate-400" />
                  <select
                    value={dateISO}
                    onChange={(e) => setDateISO(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-3 pl-9 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none"
                  >
                    {dates.map((d) => (
                      <option key={d.iso} value={d.iso}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600">Свободное время</label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTimeSlot(slot)}
                      className={`rounded-lg border px-2.5 py-2 font-mono text-xs tabular-nums transition-colors ${
                        timeSlot === slot
                          ? 'border-[#0B2545] bg-[#0B2545] text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-600">ФИО пациента</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Серикова Алина"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600">Телефон (Казахстан)</label>
                <input
                  type="tel"
                  required
                  placeholder="+7 (701) 760-85-20"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm text-slate-900 tabular-nums focus:border-[#0D9488] focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-[#0B2545]">
                  <input
                    type="checkbox"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#0D9488]"
                  />
                  <span>Включить push-напоминание о визите</span>
                </label>

                {reminderEnabled && (
                  <select
                    value={reminderLeadMinutes}
                    onChange={(e) => setReminderLeadMinutes(Number(e.target.value))}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
                  >
                    <option value={1440}>За 24 часа</option>
                    <option value={120}>За 2 часа</option>
                    <option value={30}>За 30 минут</option>
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600">Комментарий для регистратуры (необязательно)</label>
              <input
                type="text"
                placeholder="Уточнение по анализам, сроку беременности или процедуре"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] p-3 text-xs leading-relaxed text-slate-600">
              <input
                type="checkbox"
                checked={consentAccepted}
                onChange={(e) => setConsentAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[#0D9488]"
              />
              <span>
                Я даю{' '}
                <button
                  type="button"
                  onClick={() => onOpenLegal('pdn')}
                  className="font-semibold text-[#0B2545] underline hover:text-[#0D9488]"
                >
                  согласие на обработку персональных данных
                </button>{' '}
                и соглашаюсь с{' '}
                <button
                  type="button"
                  onClick={() => onOpenLegal('privacy')}
                  className="font-semibold text-[#0B2545] underline hover:text-[#0D9488]"
                >
                  Политикой конфиденциальности
                </button>{' '}
                и{' '}
                <button
                  type="button"
                  onClick={() => onOpenLegal('terms')}
                  className="font-semibold text-[#0B2545] underline hover:text-[#0D9488]"
                >
                  Пользовательским соглашением
                </button>{' '}
                (Закон РК № 94-V).
              </span>
            </label>

            {errorMsg && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                {errorMsg}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="text-sm">
                <span className="text-slate-500">Стоимость приема: </span>
                <span className="font-mono font-semibold text-[#0B2545] tabular-nums">
                  {formatKzt(selectedDoctor ? selectedDoctor.priceKzt : selectedService.priceKzt)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={whatsappBookingHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#16A34A]/30 bg-[#16A34A]/10 px-3.5 py-2.5 text-xs font-semibold text-[#15803D] hover:bg-[#16A34A]/15"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={REPROMED_CONTACTS.registryHref}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-xs font-medium text-slate-700 tabular-nums hover:bg-slate-50"
                >
                  <Phone className="h-4 w-4" />
                  <span>{REPROMED_CONTACTS.registryDisplay}</span>
                </a>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#0D9488] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0F766E] disabled:opacity-60"
                >
                  {submitting ? 'Сохраняем...' : 'Подтвердить запись'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
