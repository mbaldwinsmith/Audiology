import { InvoiceLineItem, EarWaxLevel } from '../types/audiology';
import { PRICING } from './constants';

/**
 * Generates invoice line items based on services performed:
 * - Screening: £0.00
 * - Full Hearing Test: £50.00
 * - Ear Wax Removal: £80.00 flat fee (left, right, or bilateral)
 */
export function calculateLineItems(
  screening: boolean,
  audiogram: boolean,
  leftEarWax: EarWaxLevel | boolean | number,
  rightEarWax: EarWaxLevel | boolean | number
): InvoiceLineItem[] {
  const items: InvoiceLineItem[] = [];

  const hasLeft = typeof leftEarWax === 'number' ? leftEarWax >= 2 : Boolean(leftEarWax);
  const hasRight = typeof rightEarWax === 'number' ? rightEarWax >= 2 : Boolean(rightEarWax);
  const hasWaxRemoval = hasLeft || hasRight;

  if (hasWaxRemoval) {
    let waxDesc = 'Ear Wax Removal (Micro-suction / Irrigation)';
    if (hasLeft && hasRight) {
      waxDesc = 'Ear Wax Removal - Bilateral (Both Ears)';
    } else if (hasLeft) {
      waxDesc = 'Ear Wax Removal - Left Ear';
    } else if (hasRight) {
      waxDesc = 'Ear Wax Removal - Right Ear';
    }

    items.push({
      id: 'item-wax',
      description: waxDesc,
      quantity: 1,
      unit: 'Service',
      unitPrice: PRICING.EAR_WAX_REMOVAL,
      vatRate: PRICING.VAT_RATE,
      amount: PRICING.EAR_WAX_REMOVAL,
    });
  }

  if (audiogram) {
    items.push({
      id: 'item-audiogram',
      description: 'Comprehensive Diagnostic Full Hearing Test',
      quantity: 1,
      unit: 'Assessment',
      unitPrice: PRICING.AUDIOGRAM,
      vatRate: PRICING.VAT_RATE,
      amount: PRICING.AUDIOGRAM,
    });
  }

  if (screening && !audiogram && !hasWaxRemoval) {
    // If only screening conducted or explicitly recorded
    items.push({
      id: 'item-screening',
      description: 'Initial Audiological Hearing Screening & Otoscopy Check',
      quantity: 1,
      unit: 'Screening',
      unitPrice: PRICING.SCREENING,
      vatRate: PRICING.VAT_RATE,
      amount: PRICING.SCREENING,
    });
  } else if (screening && (audiogram || hasWaxRemoval)) {
    // Included screening alongside other services
    items.push({
      id: 'item-screening',
      description: 'Initial Audiological Hearing Screening & Otoscopy Check',
      quantity: 1,
      unit: 'Screening',
      unitPrice: PRICING.SCREENING,
      vatRate: PRICING.VAT_RATE,
      amount: PRICING.SCREENING,
    });
  }

  return items;
}

/**
 * Calculates total amount for given line items.
 */
export function calculateTotalAmount(items: InvoiceLineItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}
