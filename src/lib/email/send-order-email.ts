import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER || "";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "";
const BUSINESS_EMAIL = "jess@trauerpost.com";

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
  pdfUrl: string | null;
}): Promise<void> {
  const { customerEmail, customerName, orderId, cardType, quantity, pdfUrl } = params;

  const transporter = createTransporter();
  const orderRef = orderId.slice(0, 8);
  const filename = `trauerpost-${cardType}-${orderRef}.pdf`;

  // Fetch PDF as attachment if URL available
  let attachments: { filename: string; content: Buffer }[] = [];
  if (pdfUrl) {
    try {
      const pdfResponse = await fetch(pdfUrl);
      if (pdfResponse.ok) {
        const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
        attachments = [{ filename, content: pdfBuffer }];
      }
    } catch (err) {
      console.warn("[send-order-email] Failed to fetch PDF for attachment:", err);
    }
  }

  // Email to customer
  await transporter.sendMail({
    from: `Trauerpost <${GMAIL_USER}>`,
    to: customerEmail,
    subject: `Ihre Bestellung #${orderRef} — Trauerpost`,
    html: `
      <h2>Vielen Dank für Ihre Bestellung!</h2>
      <p>Liebe/r ${customerName || "Kunde"},</p>
      <p>Ihre Bestellung wurde erfolgreich aufgegeben:</p>
      <ul>
        <li><strong>Kartentyp:</strong> ${cardType}</li>
        <li><strong>Menge:</strong> ${quantity}</li>
        <li><strong>Bestellnummer:</strong> ${orderRef}</li>
      </ul>
      ${attachments.length > 0 ? "<p>Im Anhang finden Sie Ihre Karte als PDF.</p>" : ""}
      <p>Mit freundlichen Grüßen,<br/>Ihr Trauerpost-Team</p>
    `,
    attachments,
  });

  // Email to business owner
  await transporter.sendMail({
    from: `Trauerpost System <${GMAIL_USER}>`,
    to: BUSINESS_EMAIL,
    subject: `Neue Bestellung #${orderRef} — ${customerName || customerEmail}`,
    html: `
      <h2>Neue Bestellung eingegangen</h2>
      <ul>
        <li><strong>Kunde:</strong> ${customerName || "—"} (${customerEmail})</li>
        <li><strong>Kartentyp:</strong> ${cardType}</li>
        <li><strong>Menge:</strong> ${quantity}</li>
        <li><strong>Bestellnummer:</strong> ${orderRef}</li>
      </ul>
      <p>${attachments.length > 0 ? "PDF im Anhang." : ""} Bestellung im <a href="https://trauerpost.vercel.app/de/admin/orders">Admin-Panel</a> ansehen.</p>
    `,
    attachments,
  });
}
