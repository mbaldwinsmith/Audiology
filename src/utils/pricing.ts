import { InvoiceLineItem, EarWaxLevel } from '../types/audiology';
import { PRICING } from './constants';

/**
 * Generates invoice line items based on services performed:
 * - Screening: £0.00
 * - Full Hearing Test: £50.00
 * - Ear Wax Removal: £80.00 flat fee (left, right, or bilateral)
 * - Half-Price Discount: 50% discount on billable services
 */
export function calculateLineItems(
  screening: boolean,
  audiogram: boolean,
  leftEarWax: EarWaxLevel | boolean | number,
  rightEarWax: EarWaxLevel | boolean | number,
  isHalfPrice?: boolean
): InvoiceLineItem[] {
  const items: InvoiceLineItem[] = [];

  const hasLeft = typeof leftEarWax === 'number' ? leftEarWax >= 2 : Boolean(leftEarWax);
  const hasRight = typeof rightEarWax === 'number' ? rightEarWax >= 2 : Boolean(rightEarWax);
  const hasWaxRemoval = hasLeft || hasRight;

  if (hasWaxRemoval) {
    let waxDesc = 'Ear Wax Removal (Gentle Cleaning)';
    if (hasLeft && hasRight) {
      waxDesc = 'Ear Wax Removal - Both Ears';
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
      description: 'Full Hearing Test',
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
      description: 'Hearing Screening & Ear Check',
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
      description: 'Hearing Screening & Ear Check',
      quantity: 1,
      unit: 'Screening',
      unitPrice: PRICING.SCREENING,
      vatRate: PRICING.VAT_RATE,
      amount: PRICING.SCREENING,
    });
  }

  // If half-price discount is applied, calculate 50% discount on billable items
  if (isHalfPrice) {
    const grossSubtotal = items
      .filter((i) => i.amount > 0)
      .reduce((sum, item) => sum + item.amount, 0);

    if (grossSubtotal > 0) {
      const discountAmount = Number((grossSubtotal * 0.5).toFixed(2));
      items.push({
        id: 'item-discount-half',
        description: 'Half Price Discount (50% Off)',
        quantity: 1,
        unit: 'Discount',
        unitPrice: -discountAmount,
        vatRate: PRICING.VAT_RATE,
        amount: -discountAmount,
      });
    }
  }

  return items;
}

/**
 * Calculates total amount for given line items (net total).
 */
export function calculateTotalAmount(items: InvoiceLineItem[]): number {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  return Math.max(0, Number(total.toFixed(2)));
}

/**
 * Calculates gross subtotal (sum of positive billable service charges before discount).
 */
export function calculateGrossSubtotal(items: InvoiceLineItem[]): number {
  const gross = items
    .filter((item) => item.amount > 0)
    .reduce((sum, item) => sum + item.amount, 0);
  return Number(gross.toFixed(2));
}

/**
 * Calculates total discount amount (sum of discount line items as positive number).
 */
export function calculateDiscountAmount(items: InvoiceLineItem[]): number {
  const discount = items
    .filter((item) => item.amount < 0)
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
  return Number(discount.toFixed(2));
}

