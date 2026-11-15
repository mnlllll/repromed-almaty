import React, { useState } from 'react';
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  FileText,
  LogOut,
  MessageCircle,
  Phone,
  Plus,
  Send,
  User,
  X,
} from 'lucide-react';
import {
  CLINIC_BRANCHES,
  REPROMED_CONTACTS,
  buildWhatsAppUrl,
  formatKzt,
} from '../data/clinicData';
import type { PushPermissionState } from '../lib/notifications';
import type {
  AppointmentRecord,
  BranchId,
  InAppNotification,
  LabResultRecord,
  PatientAccount,
} from '../types/clinic';
import type { LegalDocTab } from './LegalDocumentsModal';

interface PatientCabinetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientAccount | null;
  appointments: AppointmentRecord[];
  labResults: LabResultRecord[];
  notifications: InAppNotification[];
  pushPermission: PushPermissionState;
  onLoginSuccess: (payload: {
    token: string;
    patient: PatientAccount;
    appointments: AppointmentRecord[];
    labResults: LabResultRecord[];
  }) => void;
  onLogout: () => void;
  onUpdateAppointment: (id: string, patch: Partial<AppointmentRecord>) => Promise<void>;
  onUpdateProfile: (patch: Partial<PatientAccount>) => Promise<void>;
  onRequestPushPermission: () => Promise<void>;
  onTriggerTestPush: (delaySeconds?: number) => Promise<void>;
  onOpenBooking: () => void;
  onOpenLegal: (tab: LegalDocTab) => void;
}

type CabinetTab = 'visits' | 'results' | 'push' | 'profile';
type AuthMode = 'login' | 'register';

export const PatientCabinetDrawer: React.FC<PatientCabinetDrawerProps> = ({
  isOpen,
  onClose,
  patient,
  appointments,
  labResults,
  notifications,
  pushPermission,
  onLoginSuccess,
  onLogout,
  onUpdateAppointment,
  onUpdateProfile,
  onRequestPushPermission,
  onTriggerTestPush,
  onOpenBooking,
  onOpenLegal,
}) => {
  const [tab, setTab] = useState<CabinetTab>('visits');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [identifier, setIdentifier] = useState('+7 (701) 760-85-20');
  const [password, setPassword] = useState('repromed2026');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('+7 (7');
  const [regEmail, setRegEmail] = useState('');
  const [regIin, setRegIin] = useState('');
  const [regBranch, setRegBranch] = useState<BranchId>('reproduction');
  const [regPassword, setRegPassword] = useState('');
  const [regConsentAccepted, setRegConsentAccepted] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [scheduledToast, setScheduledToast] = useState<string | null>(null);

  const [editName, setEditName] = useState(patient?.fullName || '');
  const [editPhone, setEditPhone] = useState(patient?.phone || '');
  const [editBranch, setEditBranch] = useState<BranchId>(patient?.preferredBranch || 'reproduction');
  const [profileSaved, setProfileSaved] = useState(false);

  if (!isOpen) return null;

  const handleDemoLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка входа');
      onLoginSuccess(data);
      setEditName(data.patient.fullName);
      setEditPhone(data.patient.phone);
      setEditBranch(data.patient.preferredBranch);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Ошибка сервера');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (authMode === 'register' && !regConsentAccepted) {
      setAuthError(
        'Для создания карты пациента подтвердите согласие на обработку персональных данных и ИИН.'
      );
      return;
    }

    setAuthLoading(true);

    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body =
        authMode === 'login'
          ? { identifier, password }
          : {
              fullName: regName,
              phone: regPhone,
              email: regEmail,
              iin: regIin,
              preferredBranch: regBranch,
              password: regPassword,
            };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка авторизации');
      onLoginSuccess(data);
      setEditName(data.patient.fullName);
      setEditPhone(data.patient.phone);
      setEditBranch(data.patient.preferredBranch);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Ошибка соединения');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateProfile({
      fullName: editName || patient?.fullName,
      phone: editPhone || patient?.phone,
      preferredBranch: editBranch,
    });
    setProfileSaved(true);
    window.setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleSchedule5Sec = async () => {
    setScheduledToast('Напоминание запланировано — придет через 5 секунд');
    await onTriggerTestPush(5);
    window.setTimeout(() => setScheduledToast(null), 5500);
  };

  const handleExportMyData = () => {
    if (!patient) return;
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      clinic: 'Медицинский центр «Репро-Мед» (Алматы, пр. Райымбека, 150)',
      patient,
      appointments,
      labResults,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `repromed-patient-data-${patient.id}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const statusText = (status: AppointmentRecord['status']) => {
    switch (status) {
      case 'confirmed':
        return { label: 'Подтверждена', cls: 'text-emerald-700' };
      case 'upcoming':
        return { label: 'Ожидает визита', cls: 'text-[#0D9488]' };
      case 'completed':
        return { label: 'Прием завершен', cls: 'text-slate-500' };
      case 'cancelled':
        return { label: 'Отменена', cls: 'text-rose-600' };
    }
  };

  const permissionLabel =
    pushPermission === 'granted'
      ? 'Разрешены в браузере'
      : pushPermission === 'denied'
        ? 'Заблокированы в браузере (активен режим в кабинете)'
        : pushPermission === 'unsupported'
          ? 'Встроенный центр уведомлений активен'
          : 'Ожидают подтверждения';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#0B2545]/50"
      role="dialog"
      aria-modal="true"
      aria-label="Личный кабинет пациента"
    >
      <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <div className="text-xs font-medium text-[#0D9488]">
              МЦ «Репро-Мед» · Алматы, пр. Райымбека, 150
            </div>
            <h2 className="text-lg font-bold text-[#0B2545]">
              {patient ? patient.fullName : 'Личный кабинет пациента'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {patient && (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Выйти</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть личный кабинет"
              className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        {!patient ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="text-sm font-semibold text-[#0B2545]">
                Быстрый вход в демо-карту пациента
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Просмотрите записи в МЦ «Репро-Мед», результаты кариотипирования (5 дней), биопсии
                и УЗИ, а также протестируйте push-уведомления о визитах в 1 клик.
              </p>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={authLoading}
                className="mt-3.5 w-full rounded-xl bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0F766E] disabled:opacity-60"
              >
                Войти как демо-пациент (Нурланова Айгерим)
              </button>
            </div>

            <div className="mt-6 flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                }}
                className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
                  authMode === 'login' ? 'bg-white text-[#0B2545] shadow-sm' : 'text-slate-600'
                }`}
              >
                Вход по телефону / Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError(null);
                }}
                className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
                  authMode === 'register' ? 'bg-white text-[#0B2545] shadow-sm' : 'text-slate-600'
                }`}
              >
                Регистрация пациента
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="mt-5 space-y-4">
              {authMode === 'login' ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-600">
                      Телефон Казахстана или Email
                    </label>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#0D9488] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600">Пароль</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#0D9488] focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-600">ФИО полностью</label>
                    <input
                      type="text"
                      required
                      placeholder="Касымова Динара Бериковна"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#0D9488] focus:outline-none"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-600">Телефон (+7)</label>
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-sm tabular-nums focus:border-[#0D9488] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600">ИИН (12 цифр, опционально)</label>
                      <input
                        type="text"
                        maxLength={12}
                        placeholder="950101400123"
                        value={regIin}
                        onChange={(e) => setRegIin(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-sm tabular-nums focus:border-[#0D9488] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-600">Email</label>
                      <input
                        type="email"
                        placeholder="patient@mail.kz"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#0D9488] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600">Отделение</label>
                      <select
                        value={regBranch}
                        onChange={(e) => setRegBranch(e.target.value as BranchId)}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#0D9488] focus:outline-none"
                      >
                        {CLINIC_BRANCHES.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.city}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600">Придумайте пароль</label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#0D9488] focus:outline-none"
                    />
                  </div>
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                    <input
                      type="checkbox"
                      checked={regConsentAccepted}
                      onChange={(e) => setRegConsentAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[#0D9488]"
                    />
                    <span>
                      Даю{' '}
                      <button
                        type="button"
                        onClick={() => onOpenLegal('pdn')}
                        className="font-semibold text-[#0B2545] underline hover:text-[#0D9488]"
                      >
                        согласие на обработку ПДн, ИИН и сведений врачебной тайны
                      </button>{' '}
                      и принимаю{' '}
                      <button
                        type="button"
                        onClick={() => onOpenLegal('privacy')}
                        className="font-semibold text-[#0B2545] underline hover:text-[#0D9488]"
                      >
                        Политику конфиденциальности
                      </button>{' '}
                      (Закон РК № 94-V).
                    </span>
                  </label>
                </>
              )}

              {authError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-xl bg-[#0B2545] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#133866] disabled:opacity-60"
              >
                {authLoading ? 'Выполняем вход...' : authMode === 'login' ? 'Войти в кабинет' : 'Создать карту пациента'}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="border-b border-slate-200 px-6 pt-3">
              <div className="flex gap-1 overflow-x-auto pb-3">
                {[
                  { id: 'visits', label: 'Мои визиты', icon: CalendarClock },
                  { id: 'results', label: 'Анализы и УЗИ', icon: FileText },
                  { id: 'push', label: 'Push-напоминания', icon: Bell },
                  { id: 'profile', label: 'Профиль', icon: User },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id as CabinetTab)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                        active
                          ? 'bg-[#0B2545] text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-[#0B2545]'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {tab === 'visits' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-[#0B2545]">Записи на прием</h3>
                      <p className="text-xs text-slate-500">
                        Управляйте визитами на пр. Райымбека, 150 и включайте push-напоминания
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenBooking();
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D9488] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0F766E]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Новая запись</span>
                    </button>
                  </div>

                  {appointments.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                      У вас пока нет активных записей. Запишитесь на консультацию или УЗИ онлайн.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {appointments.map((apt) => {
                        const st = statusText(apt.status);
                        return (
                          <div
                            key={apt.id}
                            className="rounded-xl border border-slate-200 bg-white p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <div className="text-xs text-slate-500">
                                  Алматы, пр. Райымбека, 150 ·{' '}
                                  <span className="font-mono tabular-nums">
                                    {apt.dateISO} в {apt.timeSlot}
                                  </span>
                                </div>
                                <div className="mt-1 text-sm font-semibold text-[#0B2545]">
                                  {apt.serviceTitle}
                                </div>
                                <div className="mt-0.5 text-xs text-slate-600">{apt.doctorName}</div>
                              </div>
                              <div className="text-right">
                                <div className={`text-xs font-semibold ${st.cls}`}>{st.label}</div>
                                <div className="mt-1 font-mono text-xs font-medium text-slate-700 tabular-nums">
                                  {formatKzt(apt.priceKzt)}
                                </div>
                              </div>
                            </div>

                            {apt.notes && (
                              <p className="mt-2.5 text-xs text-slate-600">{apt.notes}</p>
                            )}

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={apt.reminderEnabled}
                                  disabled={apt.status === 'cancelled' || apt.status === 'completed'}
                                  onChange={(e) =>
                                    onUpdateAppointment(apt.id, { reminderEnabled: e.target.checked })
                                  }
                                  className="h-3.5 w-3.5 accent-[#0D9488]"
                                />
                                <span>
                                  Push-напоминание (за {apt.reminderLeadMinutes} мин)
                                </span>
                              </label>

                              <div className="flex items-center gap-2">
                                <a
                                  href={buildWhatsAppUrl(
                                    REPROMED_CONTACTS.whatsappDigits,
                                    `Здравствуйте! По записи #${apt.id} (${apt.dateISO} ${apt.timeSlot}) к врачу ${apt.doctorName}.`
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-[#15803D] hover:bg-emerald-50"
                                >
                                  <MessageCircle className="h-3 w-3" />
                                  <span>WhatsApp</span>
                                </a>
                                {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                                  <button
                                    type="button"
                                    onClick={() => onUpdateAppointment(apt.id, { status: 'cancelled' })}
                                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                                  >
                                    Отменить
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {tab === 'results' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-[#0B2545]">Результаты обследований</h3>
                    <p className="text-xs text-slate-500">
                      Кариотипирование (5 дней), биопсия (в тот же день) и экспертное УЗИ
                    </p>
                  </div>

                  <div className="space-y-3">
                    {labResults.map((res) => (
                      <div key={res.id} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="text-xs text-slate-500">
                              {res.dateLabel} · {res.doctorName}
                            </div>
                            <div className="mt-1 text-sm font-semibold text-[#0B2545]">{res.title}</div>
                          </div>
                          <span
                            className={`text-xs font-semibold ${
                              res.status === 'attention' ? 'text-amber-600' : 'text-emerald-700'
                            }`}
                          >
                            ● {res.statusLabel}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                          <div>
                            <span className="font-mono text-lg font-bold text-[#0B2545] tabular-nums">
                              {res.value}
                            </span>
                            {res.unit && (
                              <span className="ml-1.5 font-mono text-xs text-slate-500">{res.unit}</span>
                            )}
                          </div>
                          <div className="font-mono text-xs text-slate-500 tabular-nums">
                            Норма: {res.referenceRange}
                          </div>
                        </div>

                        <p className="mt-2.5 text-xs leading-relaxed text-slate-600">{res.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'push' && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[#0B2545]">
                          Статус push-уведомлений
                        </div>
                        <div className="mt-0.5 text-xs text-slate-600">{permissionLabel}</div>
                      </div>
                      <button
                        type="button"
                        onClick={onRequestPushPermission}
                        className="rounded-xl bg-[#0B2545] px-4 py-2 text-xs font-semibold text-white hover:bg-[#133866]"
                      >
                        {pushPermission === 'granted' ? 'Сервис активен' : 'Разрешить push-уведомления'}
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 border-t border-slate-200/80 pt-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-600">
                          Напоминать до приема за:
                        </label>
                        <select
                          value={patient.notificationSettings.leadMinutes}
                          onChange={(e) =>
                            onUpdateProfile({
                              notificationSettings: {
                                ...patient.notificationSettings,
                                leadMinutes: Number(e.target.value),
                              },
                            })
                          }
                          className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                        >
                          <option value={1440}>24 часа до визита</option>
                          <option value={120}>2 часа до визита</option>
                          <option value={30}>30 минут до визита</option>
                        </select>
                      </div>

                      <div className="flex flex-col justify-end gap-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => onTriggerTestPush(0)}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#0D9488] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0F766E]"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>Тест сейчас</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleSchedule5Sec}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-[#0B2545] hover:bg-slate-100"
                          >
                            <Bell className="h-3.5 w-3.5" />
                            <span>Через 5 сек</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {scheduledToast && (
                      <div className="mt-3 flex items-center gap-2 text-xs font-medium text-[#0D9488]">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{scheduledToast}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-[#0B2545]">Журнал отправленных напоминаний</h4>
                    <div className="mt-2.5 space-y-2">
                      {notifications.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-500">
                          Нажмите «Тест сейчас» или «Через 5 сек», чтобы проверить доставку напоминания о визите.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="rounded-xl border border-slate-200 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-[#0B2545]">{n.title}</span>
                              <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                                {n.timestamp}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-600">{n.body}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600">ФИО пациента</label>
                    <input
                      type="text"
                      value={editName || patient.fullName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-600">Телефон (Казахстан)</label>
                      <input
                        type="tel"
                        value={editPhone || patient.phone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-sm tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600">ИИН</label>
                      <input
                        type="text"
                        disabled
                        value={patient.iin || 'Не указан'}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-500 tabular-nums"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600">Предпочитаемое отделение</label>
                    <select
                      value={editBranch}
                      onChange={(e) => setEditBranch(e.target.value as BranchId)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm"
                    >
                      {CLINIC_BRANCHES.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.city} — {b.phoneDisplay}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      className="rounded-xl bg-[#0B2545] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#133866]"
                    >
                      Сохранить изменения
                    </button>
                    {profileSaved && (
                      <span className="text-xs font-medium text-emerald-700">Профиль обновлен</span>
                    )}
                  </div>

                  <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold text-[#0B2545]">
                      Связаться с регистратурой «Репро-Мед» (пр. Райымбека, 150)
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2.5">
                      <a
                        href={buildWhatsAppUrl(
                          REPROMED_CONTACTS.whatsappDigits,
                          `Здравствуйте! Пишу из личного кабинета МЦ «Репро-Мед» (${patient.fullName}).`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#16A34A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#15803D]"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>WhatsApp {REPROMED_CONTACTS.whatsappDisplay}</span>
                      </a>
                      <a
                        href={REPROMED_CONTACTS.registryHref}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 font-mono text-xs font-medium text-[#0B2545] tabular-nums hover:bg-slate-100"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>{REPROMED_CONTACTS.registryDisplay}</span>
                      </a>
                      <a
                        href={REPROMED_CONTACTS.mobileHref}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 font-mono text-xs font-medium text-[#0B2545] tabular-nums hover:bg-slate-100"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>{REPROMED_CONTACTS.mobileDisplay}</span>
                      </a>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold text-[#0B2545]">
                      Конфиденциальность и права пациента (Закон РК № 94-V)
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      Ваши визиты, ИИН и результаты анализов защищены врачебной тайной (ст. 273
                      Кодекса РК «О здоровье народа»). Вы можете выгрузить копию данных или
                      обратиться в регистратуру для удаления учетной записи.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleExportMyData}
                        className="rounded-lg border border-slate-300 bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#0B2545] hover:bg-slate-100"
                      >
                        Скачать мои данные (JSON)
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenLegal('privacy')}
                        className="text-xs font-semibold text-[#0D9488] underline hover:text-[#0F766E]"
                      >
                        Политика конфиденциальности
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenLegal('pdn')}
                        className="text-xs font-semibold text-[#0D9488] underline hover:text-[#0F766E]"
                      >
                        Обработка ПДн и ИИН
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
