import nodemailer from "nodemailer";

function getTransport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

export async function sendStatusEmail({
  to,
  customerName,
  ticketNumber,
  device,
  statusName,
  trackingUrl,
  orgName,
  orgPhone,
}: {
  to: string;
  customerName: string | null;
  ticketNumber: number;
  device: string;
  statusName: string;
  trackingUrl: string;
  orgName: string;
  orgPhone?: string | null;
}) {
  const transport = getTransport();
  if (!transport) return { ok: false, error: "SMTP non configurato" };

  const firstName = customerName?.split(" ")[0] ?? "Cliente";
  const num = String(ticketNumber).padStart(4, "0");

  const html = `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
        <!-- header -->
        <tr><td style="background:#0D8F7A;padding:24px 28px">
          <p style="margin:0;color:#fff;font-size:18px;font-weight:700">${orgName}</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,.75);font-size:13px">Aggiornamento riparazione</p>
        </td></tr>
        <!-- body -->
        <tr><td style="padding:28px">
          <p style="margin:0 0 16px;font-size:15px;color:#1e293b">Salve <strong>${firstName}</strong>,</p>
          <p style="margin:0 0 20px;font-size:14px;color:#475569">
            Il suo dispositivo <strong>${device}</strong> (Ticket #${num}) è ora in stato:
          </p>
          <div style="background:#f0fdf9;border:1px solid #6ee7b7;border-radius:8px;padding:14px 18px;margin:0 0 24px">
            <p style="margin:0;font-size:20px;font-weight:700;color:#0D8F7A">${statusName}</p>
          </div>
          <a href="${trackingUrl}" style="display:inline-block;background:#0D8F7A;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px">
            Segui la riparazione →
          </a>
          ${orgPhone ? `<p style="margin:24px 0 0;font-size:13px;color:#94a3b8">Per informazioni: ${orgPhone}</p>` : ""}
        </td></tr>
        <!-- footer -->
        <tr><td style="padding:16px 28px;border-top:1px solid #f1f5f9;text-align:center">
          <p style="margin:0;font-size:11px;color:#cbd5e1">Gestito con my-repair.it</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM ?? `"${orgName}" <noreply@my-repair.it>`,
      to,
      subject: `Aggiornamento riparazione #${num} — ${statusName}`,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email]", err);
    return { ok: false, error: String(err) };
  }
}
