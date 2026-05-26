/**
 * Brevo (ex-Sendinblue) email helper
 * API docs: https://developers.brevo.com/reference/sendtransacemail
 * Free tier: 300 emails/jour, hébergé en EU, RGPD natif
 */

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface EmailAddress {
  email: string;
  name?: string;
}

interface SendEmailOptions {
  to: EmailAddress | EmailAddress[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: EmailAddress;
}

const SENDER: EmailAddress = {
  email: process.env.BREVO_SENDER_EMAIL ?? "hello@atourderole.tk",
  name: "À Tour de Rôle",
};

export async function sendEmail(opts: SendEmailOptions) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("[email] BREVO_API_KEY non configurée — email non envoyé");
    return;
  }

  const recipients = Array.isArray(opts.to) ? opts.to : [opts.to];

  const payload = {
    sender: SENDER,
    to: recipients,
    subject: opts.subject,
    htmlContent: opts.htmlContent,
    ...(opts.textContent && { textContent: opts.textContent }),
    ...(opts.replyTo && { replyTo: opts.replyTo }),
  };

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[email] Brevo error ${res.status}:`, body);
    throw new Error(`Brevo API error: ${res.status}`);
  }

  return res.json();
}

// ─── Email templates ──────────────────────────────────────────────────────────

function baseLayout(content: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>À Tour de Rôle</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background:#ea580c;padding:24px 32px;">
      <h1 style="margin:0;color:white;font-size:20px;font-weight:700;">👨‍👩‍👧 À Tour de Rôle</h1>
    </div>
    <!-- Content -->
    <div style="padding:32px;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="padding:16px 32px;background:#f3f4f6;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
        © 2026 À Tour de Rôle · <a href="mailto:hello@atourderole.tk" style="color:#9ca3af;">hello@atourderole.tk</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function emailExchangeRequest({
  recipientName,
  requesterName,
  familyName,
  targetDate,
  proposedDate,
  reason,
  appUrl,
}: {
  recipientName: string;
  requesterName: string;
  familyName: string;
  targetDate: string;
  proposedDate?: string;
  reason?: string;
  appUrl: string;
}) {
  const content = `
    <h2 style="margin:0 0 8px;font-size:18px;color:#111827;">Nouvelle demande d'échange 🔄</h2>
    <p style="color:#6b7280;margin:0 0 24px;">Bonjour ${recipientName},</p>
    <p style="color:#374151;margin:0 0 16px;">
      <strong>${requesterName}</strong> vous propose un échange de week-end pour la famille <strong>${familyName}</strong>.
    </p>
    <div style="background:#f9fafb;border-radius:12px;padding:16px;margin:0 0 24px;">
      <p style="margin:0 0 8px;"><span style="color:#6b7280;">Week-end demandé :</span> <strong>${targetDate}</strong></p>
      ${proposedDate ? `<p style="margin:0 0 8px;"><span style="color:#6b7280;">Proposé en échange :</span> <strong>${proposedDate}</strong></p>` : ""}
      ${reason ? `<p style="margin:0;"><span style="color:#6b7280;">Motif :</span> <em>"${reason}"</em></p>` : ""}
    </div>
    <a href="${appUrl}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;">
      Répondre à la demande →
    </a>
  `;
  return baseLayout(content);
}

export function emailExchangeDecision({
  recipientName,
  familyName,
  targetDate,
  accepted,
  appUrl,
}: {
  recipientName: string;
  familyName: string;
  targetDate: string;
  accepted: boolean;
  appUrl: string;
}) {
  const content = `
    <h2 style="margin:0 0 8px;font-size:18px;color:#111827;">
      ${accepted ? "Échange accepté ✅" : "Échange refusé ❌"}
    </h2>
    <p style="color:#6b7280;margin:0 0 24px;">Bonjour ${recipientName},</p>
    <p style="color:#374151;margin:0 0 24px;">
      Votre demande d'échange pour le <strong>${targetDate}</strong>
      (famille <strong>${familyName}</strong>) a été
      <strong style="color:${accepted ? "#16a34a" : "#dc2626"}">
        ${accepted ? "acceptée" : "refusée"}
      </strong>.
    </p>
    <a href="${appUrl}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;">
      Voir le calendrier →
    </a>
  `;
  return baseLayout(content);
}

export function emailWelcome({
  userName,
  appUrl,
}: {
  userName: string;
  appUrl: string;
}) {
  const content = `
    <h2 style="margin:0 0 8px;font-size:18px;color:#111827;">Bienvenue sur À Tour de Rôle 🎉</h2>
    <p style="color:#6b7280;margin:0 0 24px;">Bonjour ${userName},</p>
    <p style="color:#374151;margin:0 0 16px;">
      Votre compte est prêt. Créez votre première famille et générez votre planning de garde en 5 minutes.
    </p>
    <ul style="color:#374151;padding-left:20px;margin:0 0 24px;">
      <li>Jours fériés gérés automatiquement</li>
      <li>Vacances scolaires Zone A/B/C</li>
      <li>Planning 3 ans en un clic</li>
    </ul>
    <a href="${appUrl}" style="display:inline-block;background:#ea580c;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;">
      Commencer →
    </a>
  `;
  return baseLayout(content);
}
