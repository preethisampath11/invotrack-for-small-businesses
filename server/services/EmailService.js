import nodemailer from 'nodemailer';

export const sendInvoiceEmail = async (invoice, company, pdfBuffer) => {
  const recipientEmail = invoice.clientId.email;

  if (!recipientEmail) {
    throw new Error('Client does not have an email address');
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    console.log(`[MOCK EMAIL] GMAIL_USER or GMAIL_APP_PASSWORD not set.`);
    console.log(`[MOCK EMAIL] Would send invoice ${invoice.invoiceNumber} to ${recipientEmail}`);
    return { id: 'mock-email-id' };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  const currencySymbol = company.settings?.currencySymbol || '$';

  const mailOptions = {
    from: `"${company.name}" <${gmailUser}>`,
    to: recipientEmail,
    subject: `Invoice ${invoice.invoiceNumber} from ${company.name}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #2c3940, #3a4a53); padding: 32px 40px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.3px;">${company.name}</h1>
          <p style="color: rgba(255,255,255,0.6); margin: 6px 0 0; font-size: 14px;">Invoice Notification</p>
        </div>
        <div style="padding: 40px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="color: #334155; font-size: 16px; margin: 0 0 8px;">Hello <strong>${invoice.clientId.name}</strong>,</p>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 32px; line-height: 1.6;">
            Please find your invoice <strong style="color: #2c3940;">${invoice.invoiceNumber}</strong> attached to this email.
          </p>

          <div style="background: #f8fafc; border-radius: 10px; padding: 24px; margin-bottom: 32px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Invoice Number</td>
                <td style="padding: 8px 0; color: #0f172a; font-size: 13px; font-weight: 600; text-align: right;">${invoice.invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0;">Due Date</td>
                <td style="padding: 8px 0; color: #0f172a; font-size: 13px; font-weight: 600; text-align: right; border-top: 1px solid #e2e8f0;">
                  ${new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0 0; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0;">Total Amount Due</td>
                <td style="padding: 12px 0 0; font-size: 20px; font-weight: 800; color: #2c3940; text-align: right; border-top: 1px solid #e2e8f0;">
                  ${currencySymbol}${invoice.total.toFixed(2)}
                </td>
              </tr>
            </table>
          </div>

          ${invoice.notes ? `<p style="color: #64748b; font-size: 13px; line-height: 1.6; margin-bottom: 32px;"><strong style="color: #334155;">Note:</strong> ${invoice.notes}</p>` : ''}

          <p style="color: #94a3b8; font-size: 13px; margin: 0; line-height: 1.6;">
            Thank you for your business! If you have any questions about this invoice, please don't hesitate to reach out.
          </p>
        </div>
        <p style="text-align: center; color: #cbd5e1; font-size: 12px; margin-top: 24px;">
          Sent via InvoTrack · ${company.name}
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `Invoice_${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Sent invoice ${invoice.invoiceNumber} to ${recipientEmail} — MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
};
