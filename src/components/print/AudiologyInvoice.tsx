import React from 'react';
import { PatientRow } from '../../types/audiology';
import { COMPANY_DETAILS } from '../../utils/constants';
import { formatDobDisplay } from '../../utils/cleaners';

interface AudiologyInvoiceProps {
  patient: PatientRow;
}

export const AudiologyInvoice: React.FC<AudiologyInvoiceProps> = ({ patient }) => {
  const isPaid = Boolean(patient.isPaid);

  return (
    <div className="a4-page p-8 md:p-10 font-sans text-slate-800 flex flex-col justify-between text-xs leading-relaxed">
      <div>
        {/* Invoice Header */}
        <div className="flex items-start justify-between border-b-2 border-brand-navy pb-5 mb-6">
          <div className="flex items-center gap-3">
            <img src="./logo.png" alt="EliteSight HomeCare" className="h-12 w-12 object-contain" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-brand-navy uppercase tracking-tight">
                  {isPaid ? 'INVOICE & RECEIPT' : 'INVOICE'}
                </h1>
                {isPaid && (
                  <span className="bg-emerald-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded tracking-wider uppercase">
                    PAID
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-semibold">{COMPANY_DETAILS.name}</p>
              <p className="text-[10px] text-slate-400">Co. Reg. No: {COMPANY_DETAILS.regNo}</p>
            </div>
          </div>

          <div className="text-right">
            <div className={`border rounded-md p-3 text-right ${isPaid ? 'bg-emerald-50/70 border-emerald-200' : 'bg-brand-soft border-brand-soft-dark'}`}>
              <div className="text-[10px] uppercase font-bold text-slate-500">Invoice Number</div>
              <div className="font-mono font-extrabold text-brand-navy text-sm">{patient.invoiceNo}</div>
              <div className="mt-2 text-[11px]">
                <span className="text-slate-500">Invoice Date: </span>
                <span className="font-semibold text-slate-800">{patient.appointmentDate}</span>
              </div>
              {isPaid ? (
                <div className="text-[11px]">
                  <span className="text-emerald-800 font-bold">Paid on: </span>
                  <span className="font-bold text-emerald-900">{patient.paymentDate || patient.appointmentDate}</span>
                </div>
              ) : (
                <div className="text-[11px]">
                  <span className="text-amber-800 font-bold">Due Date: </span>
                  <span className="font-bold text-amber-900">{patient.dueDate}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Billed To & Service Location Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Bill To */}
          <div className="border border-slate-200 rounded-md p-3.5 bg-white">
            <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
              BILLED TO / RESIDENT
            </h3>
            <div className="font-bold text-slate-900 text-sm">{patient.residentFullName}</div>
            <div className="text-slate-600 mt-1">Care Home: <span className="font-medium text-slate-800">{patient.careHome}</span></div>
            <div className="text-slate-600">Location: <span className="font-medium text-slate-800">{patient.postCode || 'Local Care Residence'}</span></div>
            {formatDobDisplay(patient.dob) && (
              <div className="text-slate-500 text-[10px] mt-1">DOB: {formatDobDisplay(patient.dob)}</div>
            )}
          </div>

          {/* Service Provider Info */}
          <div className="border border-slate-200 rounded-md p-3.5 bg-slate-50/60">
            <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
              SERVICE PROVIDER
            </h3>
            <div className="font-bold text-brand-navy">{COMPANY_DETAILS.name}</div>
            <div className="text-slate-600 text-[11px] leading-snug mt-0.5">{COMPANY_DETAILS.address}</div>
            <div className="text-slate-600 text-[11px] mt-1">
              Tel: {COMPANY_DETAILS.phone} | Email: {COMPANY_DETAILS.email}
            </div>
            <div className="text-slate-500 text-[10px] mt-1">
              Attending Audiologist: <strong className="text-slate-700">{patient.audiologist}</strong>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="mb-6 border border-slate-200 rounded-md overflow-hidden bg-white">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-brand-navy text-white font-semibold">
                <th className="py-2.5 px-3.5">Description</th>
                <th className="py-2.5 px-3 text-center w-12">Qty</th>
                <th className="py-2.5 px-3 text-center w-20">Unit</th>
                <th className="py-2.5 px-3 text-right w-24">Unit Price</th>
                <th className="py-2.5 px-3 text-center w-16">VAT (%)</th>
                <th className="py-2.5 px-3.5 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patient.lineItems.length > 0 ? (
                patient.lineItems.map((item, idx) => (
                  <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="py-2.5 px-3.5">
                      <div className="font-semibold text-slate-800">{item.description}</div>
                      <div className="text-[10px] text-slate-400">Clinical reference: {patient.reportRef}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-700">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-center text-slate-500">{item.unit}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-700">£{item.unitPrice.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-center text-slate-500">{item.vatRate}%</td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-slate-900">£{item.amount.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400 italic">
                    No billable items recorded for this consultation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total Callout Box & Payment Instructions / Receipt */}
        <div className="grid grid-cols-2 gap-4 items-start mb-6">
          {/* Payment Terms or Receipt Confirmation */}
          {isPaid ? (
            <div className="border-2 border-emerald-500 bg-emerald-50/90 rounded-md p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-emerald-900 font-black text-xs uppercase tracking-wide mb-1">
                  <span>✓</span> OFFICIAL PAYMENT RECEIPT
                </div>
                <p className="text-[11px] text-emerald-800 leading-snug">
                  Thank you. Payment has been received and settled in full for this clinical visit.
                </p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-emerald-200 grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-emerald-700 block font-semibold">Payment Method</span>
                  <strong className="text-emerald-950 font-bold text-[11px]">{patient.paymentMethod || 'SumUp Card Reader'}</strong>
                </div>
                <div>
                  <span className="text-emerald-700 block font-semibold">Payment Date</span>
                  <strong className="text-emerald-950 font-bold text-[11px]">{patient.paymentDate || patient.appointmentDate}</strong>
                </div>
                {patient.paymentRef && (
                  <div className="col-span-2">
                    <span className="text-emerald-700 block font-semibold">Transaction / Auth Ref</span>
                    <strong className="text-emerald-950 font-mono font-bold">{patient.paymentRef}</strong>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="border border-brand-soft-dark bg-brand-soft/50 rounded-md p-3.5">
              <h4 className="font-bold text-brand-navy text-[11px] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <span>💳</span> Payment Instructions
              </h4>
              <ul className="space-y-1 text-[11px] text-slate-700">
                <li>
                  <strong>Payment Terms:</strong> Strictly 7 days from date of visit.
                </li>
                <li>
                  <strong>Payment Reference:</strong> Please quote resident name <strong className="text-brand-navy">"{patient.residentFullName}"</strong> or invoice no <strong className="text-brand-navy">"{patient.invoiceNo}"</strong> with your BACS transfer.
                </li>
              </ul>
            </div>
          )}

          {/* Total Breakdown */}
          <div className="border border-brand-navy/20 rounded-md overflow-hidden bg-white">
            <div className="p-3 space-y-1.5 text-[11px] border-b border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800">£{patient.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>VAT (0% - Medical Exemption):</span>
                <span className="font-semibold text-slate-800">£0.00</span>
              </div>
              {isPaid && (
                <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t border-slate-100">
                  <span>Amount Paid:</span>
                  <span>-£{patient.totalAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className={`px-3.5 py-3 flex justify-between items-center text-white ${isPaid ? 'bg-emerald-800' : 'bg-brand-navy'}`}>
              <span className="font-extrabold text-xs uppercase tracking-wider text-brand-soft">
                {isPaid ? 'BALANCE DUE (GBP):' : 'TOTAL GBP DUE:'}
              </span>
              <span className="text-lg font-black tracking-tight text-white">
                {isPaid ? '£0.00' : `£${patient.totalAmount.toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>

        {/* SumUp Bank Transfer Details Box */}
        <div className="border-2 border-brand-navy/30 bg-slate-50 rounded-md p-3.5 mb-2">
          <div className="text-[11px] font-bold text-brand-navy uppercase tracking-wider mb-2 flex items-center gap-2">
            <span>🏦</span> SumUp Bank Account Details for Electronic Transfer (BACS)
          </div>
          <div className="grid grid-cols-4 gap-2 text-[11px]">
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Bank Name</span>
              <strong className="text-slate-800 font-bold">{COMPANY_DETAILS.bankName}</strong>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Sort Code</span>
              <strong className="text-brand-navy font-mono font-bold text-xs">{COMPANY_DETAILS.sortCode}</strong>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Account Number</span>
              <strong className="text-brand-navy font-mono font-bold text-xs">{COMPANY_DETAILS.accountNo}</strong>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">SWIFT / BIC</span>
              <strong className="text-slate-700 font-mono text-xs">{COMPANY_DETAILS.swift}</strong>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 font-mono">
            <strong>IBAN:</strong> {COMPANY_DETAILS.iban}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 pt-3 mt-auto text-[10px] text-slate-500 flex justify-between items-end">
        <div className="space-y-0.5">
          <div>
            <span className="font-semibold text-slate-700">{COMPANY_DETAILS.name}</span>
            <span className="text-slate-400 mx-1.5">•</span>
            <span>Co. Reg: {COMPANY_DETAILS.regNo}</span>
          </div>
          <div className="text-slate-500">{COMPANY_DETAILS.address}</div>
        </div>
        <div className="text-right space-y-0.5 font-medium text-slate-600">
          <div>Tel: <span className="text-slate-700 font-semibold">{COMPANY_DETAILS.phone}</span></div>
          <div className="text-slate-500">{COMPANY_DETAILS.email}</div>
        </div>
      </div>
    </div>
  );
};
