export interface InvoicePdfData {
  id: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  subscription_id?: string;
  plan_name: string;
  billing_interval?: 'month' | 'year' | string;
  amount: number;
  currency?: string;
  status: 'paid' | 'open' | 'failed' | 'void' | string;
  provider_invoice_id?: string;
  gateway_name?: string;
  created_at: string;
}

function escapePdfText(input: string): string {
  return String(input || '')
    .replace(/₹/g, 'INR ')
    .replace(/•/g, '-')
    .replace(/—|–/g, '-')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function formatAmountInr(amount: number, currency = 'INR'): string {
  const cleanCurr = (currency || 'INR').toUpperCase();
  const prefix = cleanCurr === 'INR' ? 'INR ' : `${cleanCurr} `;
  return `${prefix}${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Generates a standards-compliant PDF 1.4 binary (Uint8Array) for a CareerWave subscription invoice.
 * Works identically in both browser and Node.js environments with zero external dependencies.
 */
export function generateSubscriptionInvoicePdfBytes(invoice: InvoicePdfData): Uint8Array {
  const invoiceId = invoice.id || `inv_${Date.now()}`;
  const customerName = invoice.user_name || 'CareerWave Subscriber';
  const customerEmail = invoice.user_email || 'member@careerwave.in';
  const planName = invoice.plan_name || 'Pro';
  const totalAmount = Number(invoice.amount || 0);
  const currency = invoice.currency || 'INR';
  const status = String(invoice.status || 'paid').toUpperCase();
  const providerId = invoice.provider_invoice_id || `txn_${invoiceId}`;
  const subscriptionId = invoice.subscription_id || 'sub_active';
  const intervalLabel =
    invoice.billing_interval === 'year' || totalAmount >= 10000 ? 'Annual (12 Months)' : 'Monthly (1 Month)';

  const gatewayRaw = (invoice.gateway_name || providerId || '').toLowerCase();
  const gatewayLabel = gatewayRaw.includes('rzp') || gatewayRaw.includes('razorpay')
    ? 'Razorpay Checkout'
    : gatewayRaw.includes('cf') || gatewayRaw.includes('cashfree')
    ? 'Cashfree Payments'
    : gatewayRaw.includes('upi')
    ? 'Direct NPCI UPI'
    : 'Verified Online Payment';

  const dateObj = invoice.created_at ? new Date(invoice.created_at) : new Date();
  const formattedDate = Number.isNaN(dateObj.getTime())
    ? new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Tax calculation (18% GST inclusive breakdown for Indian SaaS billing)
  const baseAmount = +(totalAmount / 1.18).toFixed(2);
  const gstAmount = +(totalAmount - baseAmount).toFixed(2);

  const ops: string[] = [];

  // Helper to draw filled rectangle: x, y, w, h, r, g, b (0..1)
  const fillRect = (x: number, y: number, w: number, h: number, r: number, g: number, b: number) => {
    ops.push('q');
    ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    ops.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
    ops.push('Q');
  };

  // Helper to draw stroked rectangle
  const strokeRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    g: number,
    b: number,
    lineWidth = 1
  ) => {
    ops.push('q');
    ops.push(`${lineWidth.toFixed(2)} w`);
    ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
    ops.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
    ops.push('Q');
  };

  // Helper to draw horizontal line
  const drawLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    r: number,
    g: number,
    b: number,
    lineWidth = 0.75
  ) => {
    ops.push('q');
    ops.push(`${lineWidth.toFixed(2)} w`);
    ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
    ops.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
    ops.push('Q');
  };

  // Helper to draw text: font ('F1' regular, 'F2' bold), size, x, y, text, color
  const drawText = (
    font: 'F1' | 'F2',
    size: number,
    x: number,
    y: number,
    text: string,
    r = 0.06,
    g = 0.09,
    b = 0.16
  ) => {
    ops.push('BT');
    ops.push(`/${font} ${size} Tf`);
    ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    ops.push(`${x.toFixed(2)} ${y.toFixed(2)} Td`);
    ops.push(`(${escapePdfText(text)}) Tj`);
    ops.push('ET');
  };

  // Page size: A4 (595.28 x 841.89 pt)
  // 1. Top Brand Header Banner
  fillRect(0, 742, 595.28, 100, 0.424, 0.235, 0.882); // #6C3CE1
  drawText('F2', 22, 48, 795, 'CAREERWAVE', 1, 1, 1);
  drawText('F1', 10, 48, 777, 'AI Career & ATS SaaS Platform  |  Tax & Subscription Invoice', 0.91, 0.88, 1);
  drawText('F1', 9, 48, 761, 'https://careerwave.in  |  billing@careerwave.in', 0.85, 0.8, 0.98);

  // Invoice Title & Status Pill on Top Right
  drawText('F2', 18, 415, 795, 'TAX INVOICE', 1, 1, 1);
  drawText('F2', 10, 415, 777, `Invoice #: ${invoiceId}`, 0.95, 0.93, 1);
  drawText('F1', 9, 415, 761, `Issued: ${formattedDate}`, 0.9, 0.86, 1);

  // 2. Status Banner & Summary Meta Strip (y: 675..722)
  fillRect(48, 672, 499, 52, 0.976, 0.969, 1.0); // #F9F7FF
  strokeRect(48, 672, 499, 52, 0.88, 0.84, 0.98, 0.8);

  drawText('F2', 8, 62, 708, 'INVOICE NUMBER', 0.4, 0.45, 0.55);
  drawText('F2', 10, 62, 692, invoiceId, 0.06, 0.09, 0.16);

  drawText('F2', 8, 185, 708, 'PAYMENT STATUS', 0.4, 0.45, 0.55);
  const isPaid = status === 'PAID';
  drawText(
    'F2',
    10,
    185,
    692,
    status,
    isPaid ? 0.02 : 0.8,
    isPaid ? 0.58 : 0.15,
    isPaid ? 0.4 : 0.25
  );

  drawText('F2', 8, 295, 708, 'PAYMENT METHOD', 0.4, 0.45, 0.55);
  drawText('F2', 10, 295, 692, gatewayLabel, 0.06, 0.09, 0.16);

  drawText('F2', 8, 425, 708, 'TRANSACTION REF', 0.4, 0.45, 0.55);
  drawText('F1', 9, 425, 692, providerId.slice(0, 22), 0.2, 0.25, 0.33);

  // 3. Issued By & Billed To Columns (y: 560..650)
  drawText('F2', 9, 48, 644, 'ISSUED BY (MERCHANT)', 0.424, 0.235, 0.882);
  drawText('F2', 11, 48, 627, 'CareerWave Technologies Pvt. Ltd.', 0.06, 0.09, 0.16);
  drawText('F1', 9, 48, 612, 'Level 4, TechOne Park, Financial District', 0.3, 0.35, 0.45);
  drawText('F1', 9, 48, 598, 'Gachibowli, Hyderabad, Telangana 500032, India', 0.3, 0.35, 0.45);
  drawText('F1', 9, 48, 584, 'GSTIN: 36AABCC2026K1Z5  |  SAC: 998314', 0.3, 0.35, 0.45);

  drawText('F2', 9, 320, 644, 'BILLED TO (SUBSCRIBER)', 0.424, 0.235, 0.882);
  drawText('F2', 11, 320, 627, customerName, 0.06, 0.09, 0.16);
  drawText('F1', 9, 320, 612, `Email: ${customerEmail}`, 0.3, 0.35, 0.45);
  drawText('F1', 9, 320, 598, `Subscription ID: ${subscriptionId}`, 0.3, 0.35, 0.45);
  drawText('F1', 9, 320, 584, `Active Tier: CareerWave ${planName} Plan`, 0.3, 0.35, 0.45);

  drawLine(48, 566, 547, 566, 0.88, 0.9, 0.94, 1);

  // 4. Subscription Line Items Table (y: 440..545)
  fillRect(48, 524, 499, 26, 0.06, 0.09, 0.16); // Dark slate table header
  drawText('F2', 9, 60, 534, 'DESCRIPTION & SUBSCRIPTION PLAN', 1, 1, 1);
  drawText('F2', 9, 315, 534, 'BILLING CYCLE', 1, 1, 1);
  drawText('F2', 9, 415, 534, 'SAC CODE', 1, 1, 1);
  drawText('F2', 9, 478, 534, 'AMOUNT', 1, 1, 1);

  // Row 1: Main Plan Charge
  fillRect(48, 458, 499, 66, 1, 1, 1);
  strokeRect(48, 458, 499, 66, 0.88, 0.9, 0.94, 0.8);

  drawText('F2', 10, 60, 504, `CareerWave ${planName} Plan Subscription`, 0.06, 0.09, 0.16);
  drawText(
    'F1',
    8.5,
    60,
    489,
    'Includes ATS Resume Studio, Multi-Platform Job Match Scoring,',
    0.35,
    0.4,
    0.5
  );
  drawText(
    'F1',
    8.5,
    60,
    476,
    'AI Application Kits, Voice Mock Interviews & Portfolio Hosting.',
    0.35,
    0.4,
    0.5
  );

  drawText('F1', 9.5, 315, 496, intervalLabel, 0.15, 0.2, 0.3);
  drawText('F1', 9.5, 415, 496, '998314', 0.15, 0.2, 0.3);
  drawText('F2', 10, 470, 496, formatAmountInr(baseAmount, currency), 0.06, 0.09, 0.16);

  // 5. Subtotal, Tax & Total Summary Box (y: 330..442)
  fillRect(310, 336, 237, 106, 0.98, 0.98, 0.99);
  strokeRect(310, 336, 237, 106, 0.86, 0.88, 0.92, 0.8);

  drawText('F1', 9, 324, 420, 'Subtotal (Excl. Tax):', 0.3, 0.35, 0.45);
  drawText('F2', 9, 462, 420, formatAmountInr(baseAmount, currency), 0.1, 0.15, 0.25);

  drawText('F1', 9, 324, 400, 'IGST / GST (18%):', 0.3, 0.35, 0.45);
  drawText('F2', 9, 462, 400, formatAmountInr(gstAmount, currency), 0.1, 0.15, 0.25);

  drawLine(324, 384, 535, 384, 0.82, 0.85, 0.9, 0.8);

  drawText('F2', 11, 324, 364, 'Total Amount:', 0.06, 0.09, 0.16);
  drawText('F2', 11, 452, 364, formatAmountInr(totalAmount, currency), 0.424, 0.235, 0.882);

  drawText(
    'F2',
    8.5,
    324,
    346,
    isPaid ? 'Status: PAID IN FULL' : `Status: ${status}`,
    isPaid ? 0.02 : 0.8,
    isPaid ? 0.58 : 0.15,
    isPaid ? 0.4 : 0.25
  );

  // 6. Payment Receipt & Compliance Note (Left of Totals & Bottom)
  drawText('F2', 9, 48, 420, 'PAYMENT VERIFICATION DETAILS', 0.06, 0.09, 0.16);
  drawText('F1', 8.5, 48, 404, `Gateway: ${gatewayLabel}`, 0.3, 0.35, 0.45);
  drawText('F1', 8.5, 48, 390, `Reference ID: ${providerId}`, 0.3, 0.35, 0.45);
  drawText('F1', 8.5, 48, 376, `Invoice Date: ${formattedDate}`, 0.3, 0.35, 0.45);
  drawText('F1', 8.5, 48, 362, `Currency: Indian Rupee (${currency})`, 0.3, 0.35, 0.45);

  // Footer Box
  drawLine(48, 130, 547, 130, 0.88, 0.9, 0.94, 0.8);
  drawText(
    'F2',
    9,
    48,
    110,
    'Thank you for subscribing to CareerWave!',
    0.424,
    0.235,
    0.882
  );
  drawText(
    'F1',
    8,
    48,
    95,
    'This is a computer-generated tax invoice and does not require a physical signature.',
    0.4,
    0.45,
    0.55
  );
  drawText(
    'F1',
    8,
    48,
    82,
    'For billing support or GST inquiries, contact support@careerwave.in or open a ticket in your Account Settings.',
    0.4,
    0.45,
    0.55
  );

  const contentStream = ops.join('\n');

  // Assemble PDF 1.4 objects with exact byte offsets
  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n',
    `6 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const encoder = new TextEncoder();
  return encoder.encode(pdf);
}

/**
 * Triggers a browser download of the PDF invoice for the given transaction/invoice item.
 */
export function downloadSubscriptionInvoicePdf(invoice: InvoicePdfData): void {
  const bytes = generateSubscriptionInvoicePdfBytes(invoice);
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const safeId = String(invoice.id || 'invoice').replace(/[^a-zA-Z0-9_-]/g, '_');
  const a = document.createElement('a');
  a.href = url;
  a.download = `CareerWave-Invoice-${safeId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}
