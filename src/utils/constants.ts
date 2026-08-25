import { CompanyDetails } from '../types/audiology';

export const COMPANY_DETAILS: CompanyDetails = {
  name: 'EliteSight HomeCare Ltd',
  regNo: '16396660',
  subtitle: 'Professional Eye & Hearing Care, Delivered to Your Door',
  address: '60B Green End Road, Cambridge, England, CB4 1RY',
  phone: '0800 865 4488',
  email: 'info@elitesighthomecare.com',
  bankName: 'SUMUP LIMITED',
  sortCode: '04-14-50',
  accountNo: '63846695',
  swift: 'SUPAGB2LXXX',
  iban: 'GB65SUPA04145063846695',
};

export const PRICING = {
  SCREENING: 0.0,
  AUDIOGRAM: 50.0,
  FULL_HEARING_TEST: 50.0,
  EAR_WAX_REMOVAL: 80.0,
  PAYMENT_TERMS_DAYS: 7,
  VAT_RATE: 0.0, // 0% VAT
};

export const CSV_REQUIRED_COLUMNS = [
  'Care Home',
  'Post Code',
  'Appointment Date',
  'DOB',
  'Audiologist',
  'Resident First Name',
  'Resident Surname',
  'Seen?',
  'Reason not seen',
  'Screening?',
  'Full Hearing Test?',
  'Left Ear Wax?',
  'Right Ear Wax',
  'Notes',
] as const;

