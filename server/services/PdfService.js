import PDFDocument from 'pdfkit';

export const generateInvoicePdf = (invoice, company) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // --- Header ---
      doc.fontSize(20).text(`INVOICE`, { align: 'right' });
      doc.fontSize(10).text(`Invoice Number: ${invoice.invoiceNumber}`, { align: 'right' });
      doc.text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, { align: 'right' });
      doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, { align: 'right' });
      
      doc.moveDown();

      // --- Company Info ---
      doc.fontSize(14).text(company.name);
      if (company.settings?.address) {
        doc.fontSize(10).text(company.settings.address);
      }
      doc.moveDown(2);

      // --- Billed To ---
      doc.fontSize(10).text('Billed To:', { underline: true });
      doc.text(invoice.clientId.name);
      if (invoice.clientId.email) doc.text(invoice.clientId.email);
      if (invoice.clientId.address) doc.text(invoice.clientId.address);
      
      doc.moveDown(2);

      // --- Line Items Table Header ---
      const tableTop = doc.y;
      doc.font('Helvetica-Bold');
      doc.text('Description', 50, tableTop);
      doc.text('Qty', 300, tableTop, { width: 50, align: 'right' });
      doc.text('Rate', 370, tableTop, { width: 70, align: 'right' });
      doc.text('Amount', 460, tableTop, { width: 70, align: 'right' });
      
      doc.moveTo(50, tableTop + 15).lineTo(530, tableTop + 15).stroke();
      doc.font('Helvetica');

      // --- Line Items ---
      let y = tableTop + 25;
      const currencySymbol = company.settings?.currencySymbol || '$';

      invoice.items.forEach(item => {
        const amount = item.quantity * item.rate;
        doc.text(item.description, 50, y, { width: 230 });
        doc.text(item.quantity.toString(), 300, y, { width: 50, align: 'right' });
        doc.text(`${currencySymbol}${item.rate.toFixed(2)}`, 370, y, { width: 70, align: 'right' });
        doc.text(`${currencySymbol}${amount.toFixed(2)}`, 460, y, { width: 70, align: 'right' });
        y += 20;
      });

      doc.moveTo(350, y).lineTo(530, y).stroke();
      y += 10;

      // --- Totals ---
      doc.text('Subtotal:', 350, y, { width: 100, align: 'right' });
      doc.text(`${currencySymbol}${invoice.subtotal.toFixed(2)}`, 460, y, { width: 70, align: 'right' });
      y += 15;

      doc.text('Tax:', 350, y, { width: 100, align: 'right' });
      doc.text(`${currencySymbol}${invoice.taxTotal.toFixed(2)}`, 460, y, { width: 70, align: 'right' });
      y += 15;

      if (invoice.discount > 0) {
        doc.text('Discount:', 350, y, { width: 100, align: 'right' });
        doc.text(`-${currencySymbol}${invoice.discount.toFixed(2)}`, 460, y, { width: 70, align: 'right' });
        y += 15;
      }

      doc.font('Helvetica-Bold');
      doc.text('Total:', 350, y, { width: 100, align: 'right' });
      doc.text(`${currencySymbol}${invoice.total.toFixed(2)}`, 460, y, { width: 70, align: 'right' });
      doc.font('Helvetica');

      doc.moveDown(2);

      if (invoice.notes) {
        doc.y = y + 40;
        doc.text('Notes:', 50, doc.y, { underline: true });
        doc.text(invoice.notes);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
