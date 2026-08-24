import React from 'react';
import { CareHomeSummary, PatientRow } from '../../types/audiology';
import { CareHomeReport } from './CareHomeReport';
import { AudiologyReport } from './AudiologyReport';
import { AudiologyInvoice } from './AudiologyInvoice';

interface BatchPrintContainerProps {
  summary: CareHomeSummary;
  patients: PatientRow[];
}

export const BatchPrintContainer: React.FC<BatchPrintContainerProps> = ({
  summary,
  patients,
}) => {
  const seenPatients = patients.filter((p) => p.seen);

  return (
    <div className="batch-print-wrapper">
      {/* 1. Care Home Overview Summary Report */}
      <div className="print-page-block page-break">
        <CareHomeReport summary={summary} />
      </div>

      {/* 2. Patient Reports and Invoices */}
      {seenPatients.map((patient, index) => (
        <React.Fragment key={patient.id || index}>
          {/* Individual Clinical Ear & Hearing Care Summary */}
          <div className="print-page-block page-break">
            <AudiologyReport patient={patient} />
          </div>

          {/* Individual Invoice */}
          <div className="print-page-block page-break">
            <AudiologyInvoice patient={patient} />
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};
