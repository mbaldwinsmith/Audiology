export interface RawCsvRow {
  'Care Home'?: string;
  'Post Code'?: string;
  'Appointment Date'?: string;
  'DOB'?: string;
  'Audiologist'?: string;
  'Resident First Name'?: string;
  'Resident Surname'?: string;
  'Seen?'?: string;
  'Reason not seen'?: string;
  'Screening?'?: string;
  'Full Hearing Test?'?: string;
  'Audiogram?'?: string;
  'Left Ear Wax?'?: string;
  'Right Ear Wax'?: string;
  'Notes'?: string;
  [key: string]: string | undefined;
}

export interface PatientRow {
  id: string; // Unique row ID in-memory
  careHome: string;
  postCode: string;
  appointmentDate: string; // Normalized DD/MM/YYYY
  dob: string; // Normalized DD/MM/YYYY
  audiologist: string;
  residentFirstName: string;
  residentSurname: string;
  residentFullName: string;
  seen: boolean;
  reasonNotSeen: string;
  screening: boolean;
  audiogram: boolean;
  leftEarWax: boolean;
  rightEarWax: boolean;
  hasEarWax: boolean; // left || right
  notes: string;
  
  // Deterministic generated fields
  reportRef: string;
  invoiceNo: string;
  careHomeInitials: string;
  patientInitials: string;
  
  // Billing & Payment fields
  dueDate: string; // DD/MM/YYYY (appointmentDate + 7 days)
  lineItems: InvoiceLineItem[];
  totalAmount: number; // in GBP (£)
  isPaid?: boolean;
  paymentMethod?: string; // 'SumUp Card Reader' | 'BACS Bank Transfer' | 'Cash' | 'Cheque' | 'Care Home Account' | string
  paymentDate?: string; // DD/MM/YYYY
  paymentRef?: string; // Transaction auth or bank ref

  // Clinical customization fields (for interactive live edit)
  leftEarFinding?: string;
  rightEarFinding?: string;
  hearingTestResult?: string;
  recommendations?: string;
  nextStep?: string;
  audiogramImageUrl?: string; // Client-side object URL or Base64 data URL
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number; // in GBP
  vatRate: number; // 0 for 0%
  amount: number; // in GBP
}

export interface CareHomeSummary {
  careHome: string;
  postCode: string;
  appointmentDate: string;
  audiologist: string;
  totalPatients: number;
  seenPatientsCount: number;
  unseenPatientsCount: number;
  totalRevenue: number;
  totalPaidRevenue: number;
  totalPendingRevenue: number;
  paidInvoicesCount: number;
  unpaidInvoicesCount: number;
  screeningsCount: number;
  audiogramsCount: number;
  waxRemovalCount: number;
  seenPatients: PatientRow[];
  unseenPatients: PatientRow[];
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  type: 'error' | 'warning';
}

export interface ParseResult {
  careHomeSummary: CareHomeSummary | null;
  patients: PatientRow[];
  seenPatients: PatientRow[];
  unseenPatients: PatientRow[];
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface CompanyDetails {
  name: string;
  regNo: string;
  subtitle: string;
  address: string;
  phone: string;
  email: string;
  bankName: string;
  sortCode: string;
  accountNo: string;
  swift: string;
  iban: string;
}
