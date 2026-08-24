# TASKS.md: EliteSight HomeCare Audiology Portal & Batch Generator

## Project Overview
Build a high-performance, client-side Progressive Web App (PWA) hosted on GitHub Pages for **EliteSight HomeCare**. The app ingests care home patient CSVs, cleans and validates data, calculates automated billing/pricing, auto-generates deterministic reference/invoice hashes, and outputs three distinct document types (Care Home Summary, Individual Patient Ear & Hearing Care Summaries, and Invoices) with zero-retention GDPR compliance (in-memory state only).

---

## Brand & Document Styling Rules
- **Primary Navy:** `#0a2569` (Headers, main title blocks, primary buttons)
- **Accent Blue:** `#0052cc` (Subheadings, borders, active tabs, total badges)
- **Soft Blue Tint:** `#e8f0fe` (Table subheaders, metadata ribbons)
- **Typography:** Clean sans-serif (`Inter` or `system-ui`)
- **Print Optimization:** Exact A4 dimensions (`210mm x 297mm`), `@media print` rules with `-webkit-print-color-adjust: exact`, CSS page breaks (`break-after: page;`) between documents, clean header/footer borders.
- **Fixed Company Details:**
  - Company: **EliteSight HomeCare Ltd** (Co. Reg. No.: `16396660`)
  - Subtitle: *Professional Eye & Hearing Care, Delivered to Your Door* / *OPTICIANS & AUDIOLOGY*
  - Address: `60B Green End Road, Cambridge, England, CB4 1RY`
  - Contact: `0800 865 4488` | `info@elitesighthomecare.com`
  - Bank: `SUMUP LIMITED` | Sort Code: `04-14-50` | Account: `63846695` | SWIFT: `SUPAGB2LXXX` | IBAN: `GB65SUPA04145063846695`

---

## Technical Stack
- **Framework:** React 18 / 19 + TypeScript + Vite
- **PWA Tooling:** `vite-plugin-pwa` (service worker, offline manifest)
- **Styling:** Tailwind CSS + Lucide React icons
- **Data Ingestion:** `PapaParse`
- **PDF & Batch Export:** Native print stylesheets + `@media print` multi-page triggers (optional `html2canvas` / `jsPDF` / `jszip` client-side zip download)
- **Deployment:** GitHub Pages via GitHub Actions workflow (`.github/workflows/deploy.yml`)

---

## Domain Models & Business Logic

### 1. CSV Schema & Cleaning
**Columns Required:**
`Care Home`, `Post Code`, `Appointment Date`, `DOB`, `Audiologist`, `Resident First Name`, `Resident Surname`, `Seen?`, `Reason not seen`, `Screening?`, `Audiogram?`, `Left Ear Wax?`, `Right Ear Wax`, `Notes`

**Cleaning Rules:**
- `Resident First Name`, `Resident Surname`, `Care Home` -> Converted to `TitleCase` (handles hyphens, apostrophes, and trims whitespace).
- Dates (`Appointment Date`, `DOB`) -> Normalized to `DD/MM/YYYY`.
- Booleans (`Seen?`, `Screening?`, `Audiogram?`, `Left Ear Wax?`, `Right Ear Wax`) -> Accept `Yes/No`, `true/false`, `Y/N`, case-insensitive.

### 2. Pricing & Invoicing Logic
- **Screening:** £0.00 (Free)
- **Audiogram:** £50.00
- **Ear Wax Removal:** £80.00 (Flat fee covering one or both ears; triggered if `Left Ear Wax? = Yes` OR `Right Ear Wax = Yes`)
- **Due Date:** Exactly 7 days after `Appointment Date`.
- **Exclusion Rule:** If `Seen? = No`, DO NOT generate an Individual Patient Summary or Invoice. Include them only on the Care Home Report with `Reason not seen`.

### 3. Deterministic Hash Rules
- **Care Home Initials:** Derived from uppercase leading letters (e.g., "Colne View Care Home" -> `CV`).
- **Patient Initials:** First letter of First Name + First letter of Surname (e.g., "Melanie Dudman" -> `MD`).
- **Report Ref:** `{CareHomeInitials}-{ShortHash(PatientInitials + DOB + AppointmentDate)}` (e.g., `CV-MD3012-A1`)
- **Invoice No:** `{CareHomeInitials}-{ShortHash(PatientInitials + DOB + DueDate)}` (e.g., `CV-MD3012-INV1`)
*(Use a lightweight deterministic hash function like CRC32/Murmur or simple alphanumeric digest to keep references clean, professional, and consistent).*

---

## Document Output Specifications

### Document 1: Care Home Report (Summary Overview)
- **Header:** Care Home Name, Post Code, Appointment Date, Audiologist Name, Total Patients Listed.
- **Section 1 (Financial & Billing Summary):**
  - Table of all seen patients, generated Invoice IDs, itemized actions taken, and total billable amount.
  - Care home grand total sum in GBP.
- **Section 2 (Clinical Diagnostic Breakdown):**
  - Summary of screening outcomes, audiograms performed, and wax removal candidates.
- **Section 3 (Exceptions & Discharges):**
  - Patients who were not seen (with `Reason not seen`).
  - Patients seen who require no further treatment / discharged.

### Document 2: Individual Ear and Hearing Care Summary
- **Header:** EliteSight HomeCare Logo + Branding, Title: *Ear and Hearing Care Summary*, Metadata bar (Care Home, Completed Date, Audiologist).
- **Patient Info Grid:** Resident Name, Date of Birth, Care Home, Report Ref, Visit Date, Next Step.
- **Ear Check Findings:** Left Ear vs. Right Ear finding blocks.
- **Hearing Test Box:** Result description + indicator if Audiogram/Screening was conducted.
- **Summary & Recommendations:** Clinical summary notes + Next step pathway.
- **Earwax Removal Preparation (Conditional):** If earwax removal is required, display the 2-week olive oil administration guidance block.
- **Page 2 (Optional):** Audiogram image chart container if image is provided.
- **Footer:** Fixed EliteSight contact and registered address.

### Document 3: Audiology Invoice
- **Header:** EliteSight HomeCare Logo + Branding, Company Reg No, Invoice No, Date, Due Date (7 days).
- **Bill To / Care Home:** Resident Name and Care Home.
- **Itemized Table:** Description (e.g., *Ear Wax Removal*, *Audiogram*), Quantity, Unit, Price, VAT (0%), Amount.
- **Total Box:** Highlighted `TOTAL GBP: £XX.00`.
- **Payment Instructions:** Bank transfer reference (`{Resident Name}`), 7-day payment terms.
- **Footer:** Full SumUp bank details (Account, Sort Code, SWIFT, IBAN).

---

## Implementation Tasks

### Phase 1: Project Setup & PWA Configuration
- [x] **Task 1.1:** Initialize Vite project with React and TypeScript (`vite.config.ts`, `tsconfig.json`).
- [x] **Task 1.2:** Configure Tailwind CSS with custom EliteSight palette (`#0a2569`, `#0052cc`, `#e8f0fe`) and print utility classes.
- [x] **Task 1.3:** Setup `vite-plugin-pwa` with offline caching manifest, app icons, and standalone PWA display mode.
- [x] **Task 1.4:** Create `.github/workflows/deploy.yml` for automated GitHub Pages CI/CD deployment.

### Phase 2: Core Data Utilities & Business Logic
- [x] **Task 2.1:** Create `src/types/audiology.ts` defining strict data models for `PatientRow`, `CareHomeSummary`, `ReportData`, and `InvoiceData`.
- [x] **Task 2.2:** Implement `src/utils/cleaners.ts` with `toTitleCase()`, date normalizers (`DD/MM/YYYY`), and boolean parsing utilities.
- [x] **Task 2.3:** Implement `src/utils/hash.ts` to generate deterministic, human-readable Report Refs and Invoice Numbers based on Care Home initials, patient initials, DOB, and dates.
- [x] **Task 2.4:** Implement `src/utils/pricing.ts` to calculate line items based on Screening (Free), Audiogram (£50), and Wax Removal (£80).
- [x] **Task 2.5:** Implement `src/utils/csvParser.ts` using `PapaParse` with comprehensive validation:
  - Verify required columns exist.
  - Collect row-by-row errors and warnings.
  - Return partitioned dataset: Seen Patients (with Reports & Invoices) vs. Unseen Patients.

### Phase 3: Printable Document Components
- [x] **Task 3.1:** Create `src/components/print/CareHomeReport.tsx` matching EliteSight A4 design tokens.
- [x] **Task 3.2:** Create `src/components/print/AudiologyReport.tsx` matching the reference layout (including conditional 2-week earwax preparation box and optional Page 2 audiogram upload).
- [x] **Task 3.3:** Create `src/components/print/AudiologyInvoice.tsx` matching the reference layout with accurate itemization, SumUp bank details, and payment instructions.
- [x] **Task 3.4:** Configure print styles in `src/index.css` to enforce exact A4 margins, page breaks (`.page-break`), and print color fidelity.

### Phase 4: User Interface & Workflow Orchestration
- [x] **Task 4.1:** Create top navigation bar with offline indicator, CSV importer, downloadable CSV template generator, and print action triggers.
- [x] **Task 4.2:** Create `BatchManager.tsx` UI showing parsed summary count, validation error toasts, and a patient carousel/selector.
- [x] **Task 4.3:** Build interactive editor allowing real-time adjustments to patient notes, findings, or line items before printing.
- [x] **Task 4.4:** Build view switcher to preview:
  - Care Home Overview Report
  - Individual Patient Report (with Page 2 Audiogram upload slot)
  - Patient Invoice
  - Batch Multi-Print View (concatenating all documents with print page breaks)
- [x] **Task 4.5:** Implement zero-retention session reset button to instantly flush all patient data from React memory.

### Phase 5: Verification & Polish
- [x] **Task 5.1:** Test batch import with a 10-patient CSV containing mixed cases (unseen patients, wax only, audiogram only, combined services).
- [x] **Task 5.2:** Verify that print dialogue renders crisp, pixel-perfect A4 sheets with exact color matches and no clipped footers.
- [x] **Task 5.3:** Verify PWA offline functionality (disconnect network, reload page, test CSV parsing and PDF generation).
- [x] **Task 5.4:** Verify GitHub Pages deployment builds cleanly with zero TypeScript or linter errors.
