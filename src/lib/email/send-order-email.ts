import { Resend } from "resend";

const resend = new Resend(process.env.resend_Key);
const BUSINESS_EMAIL = "jess@trauerpost.com";

export async function sendOrderEmails(params: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  cardType: string;
  quantity: number;
  pdfUrl: string | null;
}): Promise<void> {
  const { customerEmail, customerName, orderId, cardType, quantity, pdfUrl } = params;

  // Fetch PDF as attachment if URL available
  let attachments: { filename: string; content: Buffer }[] = [];
  const filename = `trauerpost-${cardType}-${orderId.slice(0, 8)}.pdf`;

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
  await resend.emails.send({
    from: "Trauerpost <onboarding@resend.dev>",
    to: customerEmail,
    subject: `Ihre Bestellung #${orderId.slice(0, 8)} — Trauerpost`,
    html: `
      <h2>Vielen Dank für Ihre Bestellung!</h2>
      <p>Liebe/r ${customerName || "Kunde"},</p>
      <p>Ihre Bestellung wurde erfolgreich aufgegeben:</p>
      <ul>
        <li><strong>Kartentyp:</strong> ${cardType}</li>
        <li><strong>Menge:</strong> ${quantity}</li>
        <li><strong>Bestellnummer:</strong> ${orderId.slice(0, 8)}</li>
      </ul>
      ${attachments.length > 0 ? "<p>Im Anhang finden Sie Ihre Karte als PDF.</p>" : ""}
      <p>Mit freundlichen Grüßen,<br/>Ihr Trauerpost-Team</p>
    `,
    attachments,
  });

  // Email to business owner
  await resend.emails.send({
    from: "Trauerpost System <onboarding@resend.dev>",
    to: BUSINESS_EMAIL,
    subject: `Neue Bestellung #${orderId.slice(0, 8)} — ${customerName || customerEmail}`,
    html: `
      <h2>Neue Bestellung eingegangen</h2>
      <ul>
        <li><strong>Kunde:</strong> ${customerName || "—"} (${customerEmail})</li>
        <li><strong>Kartentyp:</strong> ${cardType}</li>
        <li><strong>Menge:</strong> ${quantity}</li>
        <li><strong>Bestellnummer:</strong> ${orderId.slice(0, 8)}</li>
      </ul>
      <p>${attachments.length > 0 ? "PDF im Anhang." : ""} Bestellung im <a href="https://trauerpost.vercel.app/de/admin/orders">Admin-Panel</a> ansehen.</p>
    `,
    attachments,
  });
}
