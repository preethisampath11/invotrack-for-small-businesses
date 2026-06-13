/**
 * EmailService.test.js
 *
 * Unit tests for sendInvoiceEmail.
 *
 * Strategy: mock `nodemailer` so no real SMTP connection is made.
 * We capture the `mailOptions` object passed to `sendMail` and assert
 * on its shape — this is how we verify email body formatting, subject
 * line construction, attachment names, etc.
 *
 * ESM note: Jest's `jest.mock()` is NOT available in native-ESM mode.
 * We use `jest.unstable_mockModule()` instead, which must be called BEFORE
 * the module under test is imported (hence the dynamic `await import()`
 * inside beforeEach / at describe-scope, after the mock is registered).
 */

// ─── Mock nodemailer BEFORE importing EmailService ───────────────────────────
// jest.unstable_mockModule must run before the first `import` of the module
// that uses it (EmailService.js imports nodemailer at the top).

const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({ sendMail: mockSendMail }));

jest.unstable_mockModule('nodemailer', () => ({
  default: {
    createTransport: mockCreateTransport,
  },
}));

// Import AFTER registering the mock so the module picks up the fake.
const { sendInvoiceEmail } = await import('../services/EmailService.js');

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const company = {
  name: 'Acme Corp',
  settings: { currencySymbol: '$' },
};

const invoice = {
  invoiceNumber: 'INV-0007',
  dueDate: '2024-07-31',
  total: 1325.00,
  notes: null,
  clientId: {
    name: 'Alice Wonderland',
    email: 'alice@client.com',
  },
};

/** A small Buffer standing in for a real PDF attachment. */
const fakePdfBuffer = Buffer.from('%PDF-1.4 fake pdf content');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the mailOptions object that was passed to sendMail in the last call. */
const getCapturedMailOptions = () => mockSendMail.mock.calls[0][0];

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('EmailService › sendInvoiceEmail', () => {

  beforeEach(() => {
    // Reset call history between tests
    jest.clearAllMocks();
    // Default: return a successful send result
    mockSendMail.mockResolvedValue({ messageId: '<test-message-id@gmail.com>' });
  });

  // ── Mock mode (no env vars set) ────────────────────────────────────────────

  describe('when GMAIL credentials are not configured', () => {
    beforeEach(() => {
      delete process.env.GMAIL_USER;
      delete process.env.GMAIL_APP_PASSWORD;
    });

    it('returns a mock response without calling nodemailer', async () => {
      const result = await sendInvoiceEmail(invoice, company, fakePdfBuffer);
      expect(result).toEqual({ id: 'mock-email-id' });
      expect(mockCreateTransport).not.toHaveBeenCalled();
    });

    it('does not throw', async () => {
      await expect(sendInvoiceEmail(invoice, company, fakePdfBuffer)).resolves.toBeDefined();
    });
  });

  // ── Real send mode (env vars present) ─────────────────────────────────────

  describe('when GMAIL credentials are configured', () => {
    beforeEach(() => {
      process.env.GMAIL_USER = 'test@gmail.com';
      process.env.GMAIL_APP_PASSWORD = 'test-app-password';
    });

    afterEach(() => {
      delete process.env.GMAIL_USER;
      delete process.env.GMAIL_APP_PASSWORD;
    });

    // ── Subject line ──────────────────────────────────────────────────────

    it('sets the correct subject line', async () => {
      await sendInvoiceEmail(invoice, company, fakePdfBuffer);
      const { subject } = getCapturedMailOptions();
      expect(subject).toBe('Invoice INV-0007 from Acme Corp');
    });

    it('subject contains the invoice number', async () => {
      await sendInvoiceEmail(invoice, company, fakePdfBuffer);
      expect(getCapturedMailOptions().subject).toContain('INV-0007');
    });

    it('subject contains the company name', async () => {
      await sendInvoiceEmail(invoice, company, fakePdfBuffer);
      expect(getCapturedMailOptions().subject).toContain('Acme Corp');
    });

    // ── From / To ─────────────────────────────────────────────────────────

    it('sends from the Gmail user address with company name display name', async () => {
      await sendInvoiceEmail(invoice, company, fakePdfBuffer);
      expect(getCapturedMailOptions().from).toBe('"Acme Corp" <test@gmail.com>');
    });

    it('sends to the client email address', async () => {
      await sendInvoiceEmail(invoice, company, fakePdfBuffer);
      expect(getCapturedMailOptions().to).toBe('alice@client.com');
    });

    // ── HTML body — required content ──────────────────────────────────────

    it('greets the client by name', async () => {
      await sendInvoiceEmail(invoice, company, fakePdfBuffer);
      expect(getCapturedMailOptions().html).toContain('Alice Wonderland');
    });

    it('includes the invoice number in the body', async () => {
      await sendInvoiceEmail(invoice, company, fakePdfBuffer);
      expect(getCapturedMailOptions().html).toContain('INV-0007');
    });

    it('displays the company name in the header', async () => {
      await sendInvoiceEmail(invoice, company, fakePdfBuffer);
      expect(getCapturedMailOptions().html).toContain('Acme Corp');
    });

    it('shows the total amount formatted to 2 decimal places', async () => {
      await sendInvoiceEmail(invoice, company, fakePdfBuffer);
      // $1325.00
      expect(getCapturedMailOptions().html).toContain('1325.00');
    });

    it('shows the correct currency symbol in the total', async () => {
      await sendInvoiceEmail(invoice, company, fakePdfBuffer);
      // $ before the amount
      expect(getCapturedMailOptions().html).toMatch(/\$1325\.00/);
    });

    it('uses a different currency symbol when configured', async () => {
      const euroCompany = { ...company, settings: { currencySymbol: '€' } };
      await sendInvoiceEmail(invoice, euroCompany, fakePdfBuffer);
      expect(getCapturedMailOptions().html).toMatch(/€1325\.00/);
    });

    it('defaults to $ when currencySymbol is missing from settings', async () => {
      const noSymbolCompany = { name: 'Co', settings: {} };
      await sendInvoiceEmail(invoice, noSymbolCompany, fakePdfBuffer);
      expect(getCapturedMailOptions().html).toContain('$');
    });

    it('includes the due date in the body', async () => {
      await sendInvoiceEmail(invoice, company, fakePdfBuffer);
      // The date is formatted via toLocaleDateString — just check the year
      expect(getCapturedMailOptions().html).toContain('2024');
    });

    // ── HTML body — conditional notes section ─────────────────────────────

    it('omits the notes paragraph when invoice.notes is null', async () => {
      const noNotesInvoice = { ...invoice, notes: null };
      await sendInvoiceEmail(noNotesInvoice, company, fakePdfBuffer);
      expect(getCapturedMailOptions().html).not.toContain('<strong style="color: #334155;">Note:</strong>');
    });

    it('includes the notes paragraph when invoice.notes is set', async () => {
      const notedInvoice = { ...invoice, notes: 'Net 30 payment terms.' };
      await sendInvoiceEmail(notedInvoice, company, fakePdfBuffer);
      const html = getCapturedMailOptions().html;
      expect(html).toContain('Net 30 payment terms.');
      expect(html).toContain('Note:');
    });

    // ── PDF attachment ────────────────────────────────────────────────────

    it('attaches a file with the correct filename', async () => {
      await sendInvoiceEmail(invoice, company, fakePdfBuffer);
      const { attachments } = getCapturedMailOptions();
      expect(attachments).toHaveLength(1);
      expect(attachments[0].filename).toBe('Invoice_INV-0007.pdf');
    });

    it('attaches the provided PDF buffer', async () => {
      await sendInvoiceEmail(invoice, company, fakePdfBuffer);
      const { attachments } = getCapturedMailOptions();
      expect(attachments[0].content).toBe(fakePdfBuffer);
    });

    it('sets the PDF MIME type on the attachment', async () => {
      await sendInvoiceEmail(invoice, company, fakePdfBuffer);
      const { attachments } = getCapturedMailOptions();
      expect(attachments[0].contentType).toBe('application/pdf');
    });

    // ── Return value ──────────────────────────────────────────────────────

    it('returns the info object from nodemailer on success', async () => {
      const result = await sendInvoiceEmail(invoice, company, fakePdfBuffer);
      expect(result).toEqual({ messageId: '<test-message-id@gmail.com>' });
    });

    // ── Error handling ────────────────────────────────────────────────────

    it('throws a descriptive error when the client has no email', async () => {
      const noEmailInvoice = {
        ...invoice,
        clientId: { name: 'Ghost Client', email: '' },
      };
      await expect(
        sendInvoiceEmail(noEmailInvoice, company, fakePdfBuffer)
      ).rejects.toThrow('Client does not have an email address');
    });

    it('throws a descriptive error when nodemailer sendMail fails', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP connection refused'));
      await expect(
        sendInvoiceEmail(invoice, company, fakePdfBuffer)
      ).rejects.toThrow('Failed to send email: SMTP connection refused');
    });

    it('creates the nodemailer transport with Gmail service config', async () => {
      await sendInvoiceEmail(invoice, company, fakePdfBuffer);
      expect(mockCreateTransport).toHaveBeenCalledWith({
        service: 'gmail',
        auth: {
          user: 'test@gmail.com',
          pass: 'test-app-password',
        },
      });
    });
  });
});
