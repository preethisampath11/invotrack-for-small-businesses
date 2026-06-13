/**
 * recurringInvoiceJob.js
 *
 * Nightly cron job that finds all active recurring invoice templates whose
 * nextBillingDate has arrived, then:
 *
 *  1. Clones the template as a brand-new invoice with today's dates
 *  2. Advances the template's nextBillingDate by one interval
 *  3. Generates a PDF of the new invoice
 *  4. Emails it to the client
 *  5. Logs an Activity entry for the admin dashboard
 *
 * Failures are caught per-invoice so one bad record never blocks the rest.
 *
 * Usage: call startRecurringInvoiceJob() once, after MongoDB is connected.
 * For testing/debugging: import and call runRecurringInvoices() directly.
 */

import cron from 'node-cron';
import Invoice from '../models/Invoice.js';
import Company from '../models/Company.js';
import Sequence from '../models/Sequence.js';
import Activity from '../models/Activity.js';
import { addIntervalToDate } from '../services/InvoiceService.js';
import { generateInvoicePdf } from '../services/PdfService.js';
import { sendInvoiceEmail } from '../services/EmailService.js';

// ─── Core logic (exported so it can be called from tests or a manual trigger) ─

export const runRecurringInvoices = async () => {
  // Include everything up to the end of today so the job is safe to run
  // at any time during the day, not just exactly at midnight.
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const templates = await Invoice.find({
    isRecurring: true,
    recurringStatus: 'active',
    nextBillingDate: { $lte: endOfToday },
  }).populate('clientId');

  console.log(`[Recurring] ${templates.length} invoice template(s) due for renewal`);

  const results = { success: 0, failed: 0, skipped: 0 };

  for (const template of templates) {
    try {
      // ── Sanity checks ──────────────────────────────────────────────────
      if (!template.clientId?.email) {
        console.warn(`[Recurring] Skipping ${template.invoiceNumber} — client has no email`);
        results.skipped++;
        continue;
      }

      const company = await Company.findById(template.companyId);
      if (!company) {
        console.warn(`[Recurring] Skipping ${template.invoiceNumber} — company not found`);
        results.skipped++;
        continue;
      }

      // ── Generate a sequential invoice number ───────────────────────────
      const sequenceDoc = await Sequence.findOneAndUpdate(
        { companyId: template.companyId, sequenceName: 'invoice' },
        { $inc: { sequenceValue: 1 } },
        { new: true, upsert: true }
      );
      const prefix = company.settings?.invoicePrefix ?? 'INV-';
      const invoiceNumber = `${prefix}${String(sequenceDoc.sequenceValue).padStart(5, '0')}`;

      // ── Calculate new dates ────────────────────────────────────────────
      // issueDate = today (midnight)
      const issueDate = new Date();
      issueDate.setHours(0, 0, 0, 0);

      // Preserve the original payment window (e.g. Net 30, Net 7)
      const originalWindowMs = new Date(template.dueDate) - new Date(template.issueDate);
      const dueDate = new Date(issueDate.getTime() + originalWindowMs);

      // ── Create the new invoice ─────────────────────────────────────────
      // The copy is a plain invoice (isRecurring: false) linked to the
      // template via parentInvoiceId for full audit trail.
      const newInvoice = await Invoice.create({
        invoiceNumber,
        companyId:      template.companyId,
        clientId:       template.clientId._id,
        issueDate,
        dueDate,
        items:          template.items,          // shared item array (not mutated)
        discount:       template.discount,
        subtotal:       template.subtotal,
        taxTotal:       template.taxTotal,
        total:          template.total,
        notes:          template.notes,
        status:         'sent',                  // immediately mark as sent
        paidAmount:     0,
        paymentStatus:  'unpaid',
        isRecurring:    false,                   // copies are plain invoices
        parentInvoiceId: template._id,
        createdBy:      template.createdBy,
      });

      // ── Advance the template to its next billing cycle ─────────────────
      template.nextBillingDate = addIntervalToDate(
        template.nextBillingDate,
        template.recurringInterval
      );
      await template.save();

      // ── PDF → Email ────────────────────────────────────────────────────
      // Populate clientId on the new invoice so PdfService & EmailService
      // can access client.name, client.email, etc.
      const populatedInvoice = await Invoice.findById(newInvoice._id).populate('clientId');

      const pdfBuffer = await generateInvoicePdf(populatedInvoice, company);
      await sendInvoiceEmail(populatedInvoice, company, pdfBuffer);

      // ── Activity log ───────────────────────────────────────────────────
      await Activity.create({
        companyId:  template.companyId,
        userId:     template.createdBy,
        userName:   'System',
        action:     'Auto-generated recurring invoice',
        entityType: 'invoice',
        entityId:   newInvoice._id,
        details:    `Auto-created ${invoiceNumber} (${template.recurringInterval}) from template ${template.invoiceNumber}`,
      });

      console.log(
        `[Recurring] ✓ ${invoiceNumber} created & emailed to ${template.clientId.email}` +
        ` | next billing: ${template.nextBillingDate.toISOString().split('T')[0]}`
      );
      results.success++;

    } catch (err) {
      // Per-invoice errors are caught here — other templates still run
      console.error(`[Recurring] ✗ Failed for template ${template.invoiceNumber}:`, err.message);
      results.failed++;
    }
  }

  console.log(
    `[Recurring] Done — ✓ ${results.success} sent, ✗ ${results.failed} failed, ⊘ ${results.skipped} skipped`
  );
  return results;
};

// ─── Scheduler ────────────────────────────────────────────────────────────────

/**
 * Registers the midnight cron job.
 * Must be called after mongoose.connect() resolves.
 *
 * Cron expression breakdown:
 *   ┌──── minute (0)
 *   │  ┌─ hour (0 = midnight)
 *   │  │  ┌ day-of-month (*)
 *   │  │  │  ┌ month (*)
 *   │  │  │  │  ┌ day-of-week (*)
 *   0  0  *  *  *
 */
export const startRecurringInvoiceJob = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log(`[Recurring] Nightly job triggered at ${new Date().toISOString()}`);
    try {
      await runRecurringInvoices();
    } catch (err) {
      console.error('[Recurring] Unexpected top-level failure:', err);
    }
  }, {
    scheduled: true,
    timezone: 'UTC',  // Change to your business timezone if needed, e.g. 'Asia/Kolkata'
  });

  console.log('[Recurring] Nightly recurring invoice job scheduled (00:00 UTC daily)');
};
