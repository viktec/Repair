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

const BASE_HEADER = (title: string) => `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
        <tr><td style="background:#0D8F7A;padding:24px 28px">
          <p style="margin:0;color:#fff;font-size:18px;font-weight:700">My-Repair</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,.75);font-size:13px">${title}</p>
        </td></tr>
        <tr><td style="padding:28px">`;

const BASE_FOOTER = `
        </td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid #f1f5f9;text-align:center">
          <p style="margin:0;font-size:11px;color:#cbd5e1">my-repair.it — Gestionale per centri riparazione</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

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
        <tr><td style="background:#0D8F7A;padding:24px 28px">
          <p style="margin:0;color:#fff;font-size:18px;font-weight:700">${orgName}</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,.75);font-size:13px">Aggiornamento riparazione</p>
        </td></tr>
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

export async function sendNewRegistrationEmail({
  shopName,
  ownerName,
  ownerEmail,
  orgId,
}: {
  shopName: string;
  ownerName: string;
  ownerEmail: string;
  orgId: string;
}) {
  const transport = getTransport();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!transport || !adminEmail) return { ok: false, error: "SMTP o ADMIN_EMAIL non configurati" };

  const appUrl = process.env.APP_URL ?? "https://app.my-repair.it";
  const orgUrl = `${appUrl}/admin/orgs/${orgId}`;

  const html = `${BASE_HEADER("Nuova richiesta di iscrizione")}
    <p style="margin:0 0 16px;font-size:15px;color:#1e293b">Nuova registrazione in attesa di approvazione:</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px;font-size:14px">
      <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:600;color:#475569;border-radius:6px 0 0 0;width:140px">Negozio</td>
          <td style="padding:8px 12px;color:#1e293b">${shopName}</td></tr>
      <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:600;color:#475569">Nome</td>
          <td style="padding:8px 12px;color:#1e293b">${ownerName}</td></tr>
      <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:600;color:#475569;border-radius:0 0 0 6px">Email</td>
          <td style="padding:8px 12px;color:#1e293b">${ownerEmail}</td></tr>
    </table>
    <a href="${orgUrl}" style="display:inline-block;background:#0D8F7A;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px">
      Gestisci iscrizione →
    </a>
  ${BASE_FOOTER}`;

  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM ?? "My-Repair <noreply@my-repair.it>",
      to: adminEmail,
      subject: `Nuova iscrizione: ${shopName} (${ownerEmail})`,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email]", err);
    return { ok: false, error: String(err) };
  }
}

export async function sendApprovalEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  const transport = getTransport();
  if (!transport) return { ok: false, error: "SMTP non configurato" };

  const appUrl = process.env.APP_URL ?? "https://app.my-repair.it";
  const firstName = name.split(" ")[0];

  const html = `${BASE_HEADER("Account approvato")}
    <p style="margin:0 0 16px;font-size:15px;color:#1e293b">Ciao <strong>${firstName}</strong>,</p>
    <p style="margin:0 0 20px;font-size:14px;color:#475569">
      Il tuo account su My-Repair è stato <strong>approvato</strong>. Puoi accedere e iniziare a configurare il tuo spazio di lavoro.
    </p>
    <div style="background:#f0fdf9;border:1px solid #6ee7b7;border-radius:8px;padding:14px 18px;margin:0 0 24px">
      <p style="margin:0;font-size:14px;color:#0D8F7A;font-weight:600">✓ Account attivo</p>
    </div>
    <a href="${appUrl}/login" style="display:inline-block;background:#0D8F7A;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px">
      Accedi ora →
    </a>
  ${BASE_FOOTER}`;

  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM ?? "My-Repair <noreply@my-repair.it>",
      to,
      subject: "Account My-Repair approvato — puoi accedere",
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email]", err);
    return { ok: false, error: String(err) };
  }
}

export async function sendNewSubscriptionEmail({
  shopName,
  ownerEmail,
  plan,
  orgId,
}: {
  shopName: string;
  ownerEmail: string;
  plan: string;
  orgId: string;
}) {
  const transport = getTransport();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!transport || !adminEmail) return { ok: false, error: "SMTP o ADMIN_EMAIL non configurati" };

  const appUrl = process.env.APP_URL ?? "https://app.my-repair.it";
  const orgUrl = `${appUrl}/admin/orgs/${orgId}`;
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

  const html = `${BASE_HEADER("Nuovo abbonamento attivato")}
    <p style="margin:0 0 16px;font-size:15px;color:#1e293b">Un nuovo abbonamento è stato attivato:</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px;font-size:14px">
      <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:600;color:#475569;border-radius:6px 0 0 0;width:140px">Negozio</td>
          <td style="padding:8px 12px;color:#1e293b">${shopName}</td></tr>
      <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:600;color:#475569">Email</td>
          <td style="padding:8px 12px;color:#1e293b">${ownerEmail}</td></tr>
      <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:600;color:#475569;border-radius:0 0 0 6px">Piano</td>
          <td style="padding:8px 12px;color:#0D8F7A;font-weight:700">${planLabel}</td></tr>
    </table>
    <a href="${orgUrl}" style="display:inline-block;background:#0D8F7A;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px">
      Visualizza organizzazione →
    </a>
  ${BASE_FOOTER}`;

  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM ?? "My-Repair <noreply@my-repair.it>",
      to: adminEmail,
      subject: `Nuovo abbonamento ${planLabel}: ${shopName}`,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email]", err);
    return { ok: false, error: String(err) };
  }
}

export async function sendPasswordResetEmail({ to, token }: { to: string; token: string }) {
  const transport = getTransport();
  if (!transport) return { ok: false, error: "SMTP non configurato" };
  const appUrl = process.env.APP_URL ?? "https://app.my-repair.it";
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  const html = `${BASE_HEADER("Reset password")}
    <p style="margin:0 0 16px;font-size:15px;color:#1e293b">Hai richiesto il reset della password.</p>
    <p style="margin:0 0 24px;font-size:14px;color:#475569">Clicca il bottone qui sotto per impostare una nuova password. Il link è valido per 1 ora.</p>
    <a href="${resetUrl}" style="display:inline-block;background:#0D8F7A;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px">
      Reimposta password →
    </a>
    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8">Se non hai richiesto il reset, ignora questa email.</p>
  ${BASE_FOOTER}`;

  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM ?? "My-Repair <noreply@my-repair.it>",
      to,
      subject: "Reset password My-Repair",
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email]", err);
    return { ok: false, error: String(err) };
  }
}

export async function sendTrialExpiryEmail({
  to,
  shopName,
  daysLeft,
}: {
  to: string;
  shopName: string;
  daysLeft: number;
}) {
  const transport = getTransport();
  if (!transport) return { ok: false, error: "SMTP non configurato" };
  const appUrl = process.env.APP_URL ?? "https://app.my-repair.it";

  const html = `${BASE_HEADER("Il tuo trial sta per scadere")}
    <p style="margin:0 0 16px;font-size:15px;color:#1e293b">Ciao!</p>
    <p style="margin:0 0 20px;font-size:14px;color:#475569">
      Il trial di <strong>${shopName}</strong> su My-Repair scadrà tra <strong>${daysLeft === 1 ? "1 giorno" : `${daysLeft} giorni`}</strong>.
    </p>
    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px 18px;margin:0 0 24px">
      <p style="margin:0;font-size:14px;color:#92400e">Attiva un piano per continuare ad usare My-Repair senza interruzioni.</p>
    </div>
    <a href="${appUrl}/upgrade" style="display:inline-block;background:#0D8F7A;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px">
      Scegli il tuo piano →
    </a>
  ${BASE_FOOTER}`;

  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM ?? "My-Repair <noreply@my-repair.it>",
      to,
      subject: `Il tuo trial My-Repair scade tra ${daysLeft === 1 ? "1 giorno" : `${daysLeft} giorni`}`,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email]", err);
    return { ok: false, error: String(err) };
  }
}

export async function sendInviteEmail({
  to,
  orgName,
  inviterName,
  role,
  inviteUrl,
}: {
  to: string;
  orgName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
}) {
  const transport = getTransport();
  if (!transport) return { ok: false, error: "SMTP non configurato" };

  const roleLabel: Record<string, string> = {
    owner: "Proprietario",
    admin: "Amministratore",
    technician: "Tecnico",
    front_desk: "Reception",
  };

  const html = `${BASE_HEADER("Invito al team")}
    <p style="margin:0 0 8px;font-size:15px;color:#1e293b"><strong>${inviterName}</strong> ti ha invitato a unirti al team <strong>${orgName}</strong> su My-Repair.</p>
    <p style="margin:0 0 24px;font-size:14px;color:#475569">Ruolo assegnato: <strong>${roleLabel[role] ?? role}</strong></p>
    <a href="${inviteUrl}" style="display:inline-block;background:#0D8F7A;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px">
      Accetta invito →
    </a>
    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8">Il link scade tra 7 giorni. Se non conosci ${orgName}, ignora questa email.</p>
  ${BASE_FOOTER}`;

  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM ?? "My-Repair <noreply@my-repair.it>",
      to,
      subject: `Sei stato invitato a unirti a ${orgName} su My-Repair`,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email]", err);
    return { ok: false, error: String(err) };
  }
}

export async function sendMagicLinkEmail({ to, token }: { to: string; token: string }) {
  const transport = getTransport();
  if (!transport) return { ok: false, error: "SMTP non configurato" };
  const appUrl = process.env.APP_URL ?? "https://app.my-repair.it";
  const magicUrl = `${appUrl}/api/auth/magic?token=${token}`;

  const html = `${BASE_HEADER("Link di accesso")}
    <p style="margin:0 0 16px;font-size:15px;color:#1e293b">Hai richiesto un link di accesso a My-Repair.</p>
    <p style="margin:0 0 24px;font-size:14px;color:#475569">Clicca il pulsante qui sotto per accedere. Il link è valido per 10 minuti.</p>
    <a href="${magicUrl}" style="display:inline-block;background:#0D8F7A;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px">
      Accedi ora →
    </a>
    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8">Se non hai richiesto questo link, ignora questa email. Il link scadrà automaticamente.</p>
    <p style="margin:8px 0 0;font-size:12px;color:#94a3b8">Per sicurezza, non condividere questo link con nessuno.</p>
  ${BASE_FOOTER}`;

  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM ?? "My-Repair <noreply@my-repair.it>",
      to,
      subject: "Il tuo link di accesso a My-Repair",
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email]", err);
    return { ok: false, error: String(err) };
  }
}

export async function sendNewClientRequestEmail({
  to,
  customerName,
  contractNumber,
  title,
  portalUrl,
}: {
  to: string;
  customerName: string;
  contractNumber: string;
  title: string;
  portalUrl: string;
}) {
  const transport = getTransport();
  if (!transport) return { ok: false, error: "SMTP non configurato" };

  const html = `${BASE_HEADER("Nuova richiesta cliente")}
    <p style="margin:0 0 16px;font-size:15px;color:#1e293b">Nuova richiesta di assistenza ricevuta:</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px;font-size:14px">
      <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:600;color:#475569;border-radius:6px 0 0 0;width:140px">Cliente</td>
          <td style="padding:8px 12px;color:#1e293b">${customerName}</td></tr>
      <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:600;color:#475569">Contratto</td>
          <td style="padding:8px 12px;color:#1e293b">${contractNumber}</td></tr>
      <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:600;color:#475569;border-radius:0 0 0 6px">Richiesta</td>
          <td style="padding:8px 12px;color:#1e293b">${title}</td></tr>
    </table>
    <a href="${portalUrl}" style="display:inline-block;background:#0D8F7A;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px">
      Vai al contratto →
    </a>
  ${BASE_FOOTER}`;

  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM ?? "My-Repair <noreply@my-repair.it>",
      to,
      subject: `Nuova richiesta da ${customerName}: ${title}`,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email]", err);
    return { ok: false, error: String(err) };
  }
}

export async function sendRejectionEmail({
  to,
  name,
  reason,
}: {
  to: string;
  name: string;
  reason?: string | null;
}) {
  const transport = getTransport();
  if (!transport) return { ok: false, error: "SMTP non configurato" };

  const firstName = name.split(" ")[0];

  const html = `${BASE_HEADER("Esito richiesta di iscrizione")}
    <p style="margin:0 0 16px;font-size:15px;color:#1e293b">Ciao <strong>${firstName}</strong>,</p>
    <p style="margin:0 0 20px;font-size:14px;color:#475569">
      Siamo spiacenti di comunicarti che la tua richiesta di iscrizione a My-Repair non è stata approvata.
    </p>
    ${reason ? `
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 18px;margin:0 0 24px">
      <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#ef4444;text-transform:uppercase;letter-spacing:.05em">Motivazione</p>
      <p style="margin:0;font-size:14px;color:#7f1d1d">${reason}</p>
    </div>` : ""}
    <p style="margin:0;font-size:13px;color:#94a3b8">
      Per ulteriori informazioni puoi rispondere a questa email.
    </p>
  ${BASE_FOOTER}`;

  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM ?? "My-Repair <noreply@my-repair.it>",
      to,
      subject: "Esito richiesta di iscrizione My-Repair",
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email]", err);
    return { ok: false, error: String(err) };
  }
}
