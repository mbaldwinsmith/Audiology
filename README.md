# EliteSight HomeCare — Audiology Batch Portal & Clinical Document Generator

[![PWA Ready](https://img.shields.io/badge/PWA-Offline%20Ready-0052cc.svg)](https://mbaldwinsmith.github.io/Audiology/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![License: Commercial](https://img.shields.io/badge/License-Commercial-0a2569.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-success.svg)](https://mbaldwinsmith.github.io/Audiology/)

A clinical-grade, offline-first Progressive Web Application (PWA) designed for **EliteSight HomeCare**. The portal automates the processing of Care Home audiology consultation spreadsheets, performing real-time data cleansing, automated medical invoicing, deterministic reference generation, and instant export of pixel-perfect A4 clinical reports and invoices.

---

## 🌟 Key Features

### 1. In-Browser Batch Ingestion & Real-Time Validation
* **Drag-and-Drop CSV Ingestion:** Ingest multi-resident care home rosters in seconds via PapaParse.
* **Auto-Cleaning & Normalization:** Formats names to TitleCase, standardizes dates (`DD/MM/YYYY`), and parses clinical boolean flags.
* **Validation Engine:** Highlights missing fields, invalid formats, or non-seen residents with actionable warning callouts.

### 2. GDPR Zero-Retention Architecture
* **Strict In-Memory Processing:** 100% of patient records and clinical notes are processed inside browser memory.
* **No Server Storage:** No patient identifiable data (PID) or clinical records are ever uploaded to cloud servers or databases.
* **1-Click Session Flush:** Instantly wipe in-memory state after printing or exporting.

### 3. Three Standardized A4 Document Outputs
* 🏢 **Care Home Summary Report:** Executive visit overview with financial grand totals, clinical diagnostic statistics (screenings, audiograms, wax cases), and exceptions/unseen reschedule lists.
* 👂 **Patient Ear & Hearing Summary:** Direct otoscopy visualization findings per ear, clinical recommendations, automatic **2-week olive oil softening regimen** callout for wax cases, and optional **Page 2 Pure-Tone Audiogram Chart** attachment.
* 🧾 **Itemized Audiology Invoice:** Automated medical billing (0% VAT exemption) featuring 7-day payment terms, reference quoting, and official SumUp BACS bank transfer details.

### 4. Deterministic Reference & Invoice Hashing
* **Report References:** Format `{CareHomeInitials}-{PatientInitials}{DOB_compact}-{RefSuffix}` (e.g. `FCH-MD1403-A1`).
* **Invoice Numbers:** Format `{CareHomeInitials}-{PatientInitials}{DOB_compact}-INV{Suffix}` (e.g. `FCH-MD1403-INV1`).
* Guarantees reproducible, unique audit trails for care home coordinators and billing departments.

### 5. Automated Pricing Engine
* **Hearing Screening:** `£0.00` (Complimentary NHS/Care Home visit screening).
* **Pure-Tone Audiogram Assessment:** `£50.00`.
* **Ear Wax Removal (Microsuction/Irrigation):** `£80.00` flat fee (covers unilateral or bilateral removal).

### 6. Client-Side Batch PDF & ZIP Export
* **Individual PDF Generation:** Generates high-resolution A4 PDFs directly in the browser via `jspdf` and `html2canvas`.
* **1-Click ZIP Archive:** Bundles all individually named PDFs into an organized archive structure:
  ```text
  📁 Fairhaven_Care_Home_Audiology_2026-08-24.zip
  ├── 00_Fairhaven_Care_Home_Summary_Report_2026-08-24.pdf
  ├── 📁 Reports/
  │   ├── FCH-MD1403-A1_Dudman_Melanie_Report.pdf
  │   ├── FCH-AP2211-A2_Pendleton_Arthur_Report.pdf
  │   └── ...
  └── 📁 Invoices/
      ├── FCH-MD1403-INV1_Dudman_Melanie_Invoice.pdf
      ├── FCH-AP2211-INV2_Pendleton_Arthur_Invoice.pdf
      └── ...
  ```

### 7. Progressive Web App (PWA) & Offline Capability
* **Offline-Ready:** Service Worker caching ensures full app functionality inside care homes with poor or no Wi-Fi connectivity.
* **Installable:** Install as a standalone native-like desktop or tablet application on Windows, macOS, iPadOS, and Android.

---

## 📊 CSV Schema Specification

Upload spreadsheets in `.csv` format matching the following 14 required columns:

| Column Header | Format / Values | Description | Example |
| :--- | :--- | :--- | :--- |
| `Care Home` | Text | Name of the care home | `Fairhaven Care Home` |
| `Post Code` | Text | UK Postcode of facility | `CB25 9EJ` |
| `Appointment Date` | `DD/MM/YYYY` | Date of audiology visit | `24/08/2026` |
| `DOB` | `DD/MM/YYYY` | Resident date of birth | `14/03/1938` |
| `Audiologist` | Text | Attending audiologist | `Sarah Jenkins` |
| `Resident First Name`| Text | Resident first name | `Melanie` |
| `Resident Surname` | Text | Resident surname | `Dudman` |
| `Seen?` | `Yes / No` | Was resident assessed? | `Yes` |
| `Reason not seen` | Text | Reason if `Seen? = No` | `Unwell in bed` |
| `Screening?` | `Yes / No` | Routine screening done | `Yes` |
| `Audiogram?` | `Yes / No` | Audiogram performed (£50) | `Yes` |
| `Left Ear Wax?` | `Yes / No` | Wax present in left ear | `Yes` |
| `Right Ear Wax` | `Yes / No` | Wax present in right ear | `Yes` |
| `Notes` | Text | Clinical consultation notes | `Bilateral wax cleared` |

> 💡 *A schema template can be downloaded directly from within the application by clicking the **CSV Template** button.*

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mbaldwinsmith/Audiology.git
   cd Audiology
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Preview production build locally:**
   ```bash
   npm run preview
   ```

---

## 🌐 Deployment to GitHub Pages

The application includes an automated CI/CD GitHub Actions workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

To deploy:
1. Navigate to your repository on GitHub: **Settings** &rarr; **Pages**.
2. Under **Build and deployment** &rarr; **Source**, select **GitHub Actions**.
3. Push changes to `main`:
   ```bash
   git push origin main
   ```
4. Your application will be live at:
   **`https://mbaldwinsmith.github.io/Audiology/`**

---

## 🛠️ Technology Stack

* **Core:** [React 18](https://react.dev/), [TypeScript 5.7](https://www.typescriptlang.org/)
* **Build Tooling:** [Vite 6](https://vitejs.dev/)
* **Styling & UI:** [Tailwind CSS 3.4](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/)
* **CSV Parsing:** [PapaParse](https://www.papaparse.com/)
* **Client-Side PDF & ZIP:** [jsPDF](https://github.com/parallax/jsPDF), [html2canvas](https://html2canvas.hertzen.com/), [JSZip](https://stuk.github.io/jszip/)
* **PWA Engine:** [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (Workbox Service Worker)

---

## 🏢 Company & Commercial Details

* **Company:** EliteSight HomeCare Ltd
* **Company Registration No:** `16396660` (England & Wales)
* **Registered Address:** 60B Green End Road, Cambridge, England, CB4 1RY
* **Contact:** `0800 865 4488` | `info@elitesighthomecare.com`
* **Website:** [elitesighthomecare.com](https://elitesighthomecare.com)

---

## 📄 License

This software and its branding assets are proprietary and confidential to **EliteSight HomeCare Ltd**. Unauthorized copying, distribution, modification, or commercial exploitation is strictly prohibited under the terms of the [Commercial Software License](LICENSE).

Copyright &copy; 2026 EliteSight HomeCare Ltd. All Rights Reserved.
