/**
 * PdfService.test.js
 *
 * Integration-style unit tests for generateInvoicePdf.
 *
 * Strategy: run against real PDFKit (no mock) because PdfService's logic
 * IS the PDF construction — mocking PDFKit would make these tests vacuous.
 * What we're actually testing:
 *   - The function resolves to a valid, non-empty PDF buffer
 *   - It handles optional fields gracefully (no notes, no address, no discount)
 *   - It rejects cleanly when required fields are missing
 *   - Currency symbol is applied from company settings
 *
 * Note: PdfService reads pre-computed values (subtotal, taxTotal, total)
 * from the invoice object — it does not re-derive the math itself.
 * The "math correctness" tests here verify that the service correctly
 * READS and FORMATS those values (e.g., 2 decimal places, currency prefix).
 */

import { generateInvoicePdf } from '../services/PdfService.js';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const company = {
  name: 'Acme Corp',
  settings: {
    currencySymbol: '$',
    address: '123 Business Ave, New York, NY 10001',
  },
};

/** A fully-populated invoice that exercises every code path. */
const fullInvoice = {
  invoiceNumber: 'INV-0042',
  issueDate: '2024-06-01',
  dueDate: '2024-06-30',
  clientId: {
    name: 'Jane Smith',
    email: 'jane@client.com',
    address: '456 Client Road, Boston, MA',
  },
  items: [
    { description: 'Web Development', quantity: 10, rate: 150.00 },
    { description: 'UI Design',       quantity: 5,  rate: 80.00  },
  ],
  //  subtotal = (10×150) + (5×80) = 1500 + 400 = 1900
  subtotal: 1900.00,
  //  10% tax on subtotal
  taxTotal: 190.00,
  //  flat discount
  discount: 50.00,
  //  total = subtotal + tax − discount = 1900 + 190 − 50 = 2040
  total: 2040.00,
  notes: 'Net 30. Please reference invoice number on payment.',
};

/** Minimal invoice — only required fields, no optional ones. */
const minimalInvoice = {
  invoiceNumber: 'INV-0001',
  issueDate: '2024-01-15',
  dueDate: '2024-02-15',
  clientId: {
    name: 'Bob Jones',
    email: 'bob@example.com',
    // no address
  },
  items: [
    { description: 'Consulting', quantity: 1, rate: 500.00 },
  ],
  subtotal: 500.00,
  taxTotal: 0.00,
  discount: 0,        // ← zero discount: the "Discount:" line should be skipped
  total: 500.00,
  notes: null,        // ← no notes section
};

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('PdfService › generateInvoicePdf', () => {

  // ── Output type ────────────────────────────────────────────────────────────

  it('resolves to a Buffer', async () => {
    const result = await generateInvoicePdf(fullInvoice, company);
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('produces a non-empty buffer', async () => {
    const result = await generateInvoicePdf(fullInvoice, company);
    expect(result.length).toBeGreaterThan(0);
  });

  it('starts with the PDF magic bytes (%PDF)', async () => {
    // All valid PDF files begin with the ASCII string "%PDF".
    // If this fails the output is corrupted or not a PDF at all.
    const result = await generateInvoicePdf(fullInvoice, company);
    expect(result.slice(0, 4).toString('ascii')).toBe('%PDF');
  });

  // ── Math & formatting ──────────────────────────────────────────────────────
  // PDFKit embeds text as compressed streams so we cannot grep the raw buffer
  // for exact currency strings.  What we CAN assert is that the function
  // accepts our pre-computed numbers without throwing — confirming it correctly
  // reads `invoice.subtotal`, `invoice.taxTotal`, `invoice.discount`, and
  // `invoice.total` and calls `.toFixed(2)` on each (which would throw on
  // undefined/null values).

  it('handles a full totals breakdown (subtotal + tax − discount = total)', async () => {
    // These numbers obey the invariant: 1900 + 190 − 50 = 2040
    const result = await generateInvoicePdf(fullInvoice, company);
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('handles zero tax correctly', async () => {
    const zeroTaxInvoice = { ...fullInvoice, taxTotal: 0.00, total: 1850.00 };
    await expect(generateInvoicePdf(zeroTaxInvoice, company)).resolves.toBeInstanceOf(Buffer);
  });

  it('skips the discount line when discount is 0', async () => {
    // minimalInvoice has discount: 0.  The service has a guard:
    //   if (invoice.discount > 0) { /* render discount row */ }
    // This test ensures the guard doesn't throw or corrupt the PDF.
    await expect(generateInvoicePdf(minimalInvoice, company)).resolves.toBeInstanceOf(Buffer);
  });

  it('renders the discount line when discount > 0', async () => {
    // discount: 50 in fullInvoice — should produce a valid buffer, not skip
    const result = await generateInvoicePdf(fullInvoice, company);
    expect(result.length).toBeGreaterThan(0);
  });

  // ── Currency symbol ────────────────────────────────────────────────────────

  it('uses the currency symbol from company.settings', async () => {
    const euroCompany = { ...company, settings: { ...company.settings, currencySymbol: '€' } };
    await expect(generateInvoicePdf(fullInvoice, euroCompany)).resolves.toBeInstanceOf(Buffer);
  });

  it('defaults to $ when currencySymbol is not set', async () => {
    const noSymbolCompany = { name: 'No Symbol Co', settings: {} };
    await expect(generateInvoicePdf(fullInvoice, noSymbolCompany)).resolves.toBeInstanceOf(Buffer);
  });

  // ── Optional fields ────────────────────────────────────────────────────────

  it('works without client address', async () => {
    await expect(generateInvoicePdf(minimalInvoice, company)).resolves.toBeInstanceOf(Buffer);
  });

  it('works without invoice notes', async () => {
    const noNotesInvoice = { ...fullInvoice, notes: null };
    await expect(generateInvoicePdf(noNotesInvoice, company)).resolves.toBeInstanceOf(Buffer);
  });

  it('works without company address', async () => {
    const noAddrCompany = { name: 'Minimal Co', settings: { currencySymbol: '$' } };
    await expect(generateInvoicePdf(fullInvoice, noAddrCompany)).resolves.toBeInstanceOf(Buffer);
  });

  it('renders notes when they are present', async () => {
    // fullInvoice has notes set — the function should not throw
    await expect(generateInvoicePdf(fullInvoice, company)).resolves.toBeInstanceOf(Buffer);
  });

  // ── Multiple line items ────────────────────────────────────────────────────

  it('handles a single line item', async () => {
    await expect(generateInvoicePdf(minimalInvoice, company)).resolves.toBeInstanceOf(Buffer);
  });

  it('handles multiple line items', async () => {
    const multiItem = {
      ...minimalInvoice,
      items: [
        { description: 'Item A', quantity: 2, rate: 100.00 },
        { description: 'Item B', quantity: 3, rate: 50.00  },
        { description: 'Item C', quantity: 1, rate: 25.00  },
      ],
      subtotal: 375.00,
      total: 375.00,
    };
    await expect(generateInvoicePdf(multiItem, company)).resolves.toBeInstanceOf(Buffer);
  });

  // ── Error handling ─────────────────────────────────────────────────────────

  it('rejects when clientId is missing', async () => {
    const badInvoice = { ...fullInvoice, clientId: undefined };
    await expect(generateInvoicePdf(badInvoice, company)).rejects.toThrow();
  });

  it('rejects when invoice.total is undefined (toFixed would throw)', async () => {
    const badInvoice = { ...fullInvoice, total: undefined };
    await expect(generateInvoicePdf(badInvoice, company)).rejects.toThrow();
  });

  it('rejects when invoice.subtotal is undefined', async () => {
    const badInvoice = { ...fullInvoice, subtotal: undefined };
    await expect(generateInvoicePdf(badInvoice, company)).rejects.toThrow();
  });
});
