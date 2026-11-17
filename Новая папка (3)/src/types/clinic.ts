export type BranchId = 'reproduction' | 'diagnostics' | 'procedures';

export type ServiceCategory =
  | 'all'
  | 'ultrasound'
  | 'biopsy_genetics'
  | 'gynecology'
  | 'procedures_massage';

export interface ClinicBranch {
  id: BranchId;
  city: string;
  name: string;
  address: string;
  hours: string;
  phoneDisplay: string;
  phoneHref: string;
  whatsappDigits: string;
  coordinatesLabel: string;
}

export interface ClinicService {
  id: string;
  code: string;
  category: Exclude<ServiceCategory, 'all'>;
  categoryLabel: string;
  title: string;
  subtitle: string;
  durationMinutes: number;
  priceKzt: number;
  priceFrom?: boolean;
  oldPriceKzt?: number;
  includes: string[];
}

export interface DoctorProfile {
  id: string;
  name: string;
  role: string;
  specialtyKey: 'genetics' | 'gynecology' | 'ultrasound';
  experienceYears: number;
  experienceLabel?: string;
  rating: number;
  reviewsCount: number;
  isTop: boolean;
  branchId: BranchId;
  branchCity: string;
  priceKzt: number;
  nearestSlot: string;
  education: string;
  imageUrl?: string;
  availableSlots: string[];
}

export type AppointmentStatus = 'upcoming' | 'confirmed' | 'completed' | 'cancelled';

export interface AppointmentRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  branchId: BranchId;
  branchCity: string;
  serviceId: string;
  serviceTitle: string;
  doctorId: string;
  doctorName: string;
  dateISO: string;
  timeSlot: string;
  priceKzt: number;
  status: AppointmentStatus;
  reminderEnabled: boolean;
  reminderLeadMinutes: number;
  reminderSent: boolean;
  notes?: string;
  createdAt: string;
}

export interface LabResultRecord {
  id: string;
  title: string;
  dateLabel: string;
  doctorName: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'attention' | 'ready';
  statusLabel: string;
  comment: string;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  leadMinutes: number;
  notifyOnBooking: boolean;
  notifyOnResults: boolean;
}

export interface PatientAccount {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  iin: string;
  preferredBranch: BranchId;
  notificationSettings: NotificationSettings;
}

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  kind: 'reminder' | 'booking' | 'result';
}

export interface ClinicReview {
  id: string;
  author: string;
  rating: number;
  dateLabel: string;
  program: string;
  doctor?: string;
  text: string;
  source: '2gis' | 'clinic';
}

