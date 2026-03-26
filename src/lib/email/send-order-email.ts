import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER || "";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "";
const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL || "ofir393@gmail.com";

function createTransporter(): nodemailer.Transporter {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
    tls: { rejectUnauthorized: false },
  });
}

export async function sendOrderEmails(params: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  cardType: string;
  quantity: number;
  pdfBuffer: Buffer | null;
}): Promise<void> {
  const { customerEmail, customerName, orderId, cardType, quantity, pdfBuffer } = params;

  const transporter = createTransporter();
  const orderRef = orderId.slice(0, 8);
  const filename = `trauerpost-${cardType}-${orderRef}.pdf`;

  const attachments = pdfBuffer ? [{ filename, content: pdfBuffer }] : [];

  // Single email to business — always goes to BUSINESS_EMAIL
  await transporter.sendMail({
    from: `Trauerpost <${GMAIL_USER}>`,
    to: BUSINESS_EMAIL,
    subject: `Neue Bestellung #${orderRef} — ${cardType}`,
    html: `
      <h2>Neue Bestellung eingegangen</h2>
      <ul>
        <li><strong>Kunde:</strong> ${customerName || "—"} (${customerEmail})</li>
        <li><strong>Kartentyp:</strong> ${cardType}</li>
        <li><strong>Menge:</strong> ${quantity}</li>
        <li><strong>Bestellnummer:</strong> ${orderRef}</li>
      </ul>
      ${attachments.length > 0 ? "<p>PDF im Anhang.</p>" : "<p>PDF konnte nicht erstellt werden.</p>"}
      <p>Bestellung im <a href="https://trauerpost.vercel.app/de/admin/orders">Admin-Panel</a> ansehen.</p>
    `,
    attachments,
  });
}
