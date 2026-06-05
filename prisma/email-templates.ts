import { NotificationChannel, Prisma } from '@prisma/client';

/** Brand tokens aligned with https://kritly.com */
export const KRITLY_BRAND = {
  name: 'Kritly',
  tagline: 'Review. Connect. Share Stories.',
  websiteUrl: 'https://kritly.com',
  primary: '#40008C',
  primaryLight: '#5A00C7',
  accent: '#FFC30D',
  text: '#1A1033',
  muted: '#5C5470',
  surface: '#F7F3FF',
  border: '#E8DFFF',
} as const;

type TemplateSeed = {
  key: string;
  channel: NotificationChannel;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  fieldSchema: Prisma.InputJsonValue;
};

function wrapEmailHtml(title: string, preheader: string, body: string): string {
  const { name, tagline, websiteUrl, primary, primaryLight, accent, text, muted, surface, border } =
    KRITLY_BRAND;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${surface};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${surface};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid ${border};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px;background:linear-gradient(135deg,${primary} 0%,${primaryLight} 100%);color:#ffffff;">
              <div style="font-size:24px;font-weight:700;letter-spacing:0.2px;">${name}</div>
              <div style="margin-top:6px;font-size:14px;opacity:0.92;">${tagline}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">${body}</td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid ${border};background:${surface};">
              <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:${muted};">
                You are receiving this email because you have a ${name} account linked to this address.
              </p>
              <p style="margin:0;font-size:12px;line-height:1.6;color:${muted};">
                <a href="${websiteUrl}" style="color:${primaryLight};text-decoration:none;">${websiteUrl.replace('https://', '')}</a>
                · <a href="mailto:{{supportEmail}}" style="color:${primaryLight};text-decoration:none;">{{supportEmail}}</a>
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:${muted};">© ${new Date().getFullYear()} ${name}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(label: string, href: string): string {
  const { primary, accent } = KRITLY_BRAND;
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 8px;">
  <tr>
    <td style="border-radius:999px;background:${primary};">
      <a href="${href}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;border:2px solid ${accent};">${label}</a>
    </td>
  </tr>
</table>`;
}

function featureList(items: string[]): string {
  const { primaryLight, muted } = KRITLY_BRAND;
  return `<ul style="margin:16px 0 0;padding-left:20px;color:${muted};line-height:1.7;">
${items.map((item) => `  <li style="margin-bottom:8px;"><span style="color:${primaryLight};font-weight:600;">•</span> ${item}</li>`).join('\n')}
</ul>`;
}

export const notificationTemplates: TemplateSeed[] = [
  {
    key: 'auth.welcome',
    channel: NotificationChannel.email,
    subject: `Welcome to ${KRITLY_BRAND.name}, {{displayName}} — your account is ready`,
    bodyText: `Hi {{displayName}},

Welcome to ${KRITLY_BRAND.name} — ${KRITLY_BRAND.tagline}

Your account ({{email}}) is ready. Kritly is the social review platform where you can review places, social media accounts, and Kritly profiles, join polls, and share Story Times.

Here is what you can do next:
- Review places and accounts you trust
- Connect your social world and discover creators
- Create polls and share short video Story Times

Open Kritly: {{appUrl}}

Need help? Reply to {{supportEmail}} or visit ${KRITLY_BRAND.websiteUrl}

— The ${KRITLY_BRAND.name} team`,
    bodyHtml: wrapEmailHtml(
      `Welcome to ${KRITLY_BRAND.name}`,
      `Your ${KRITLY_BRAND.name} account is ready. Start reviewing, connecting, and sharing Story Times.`,
      `<p style="margin:0 0 12px;font-size:18px;line-height:1.5;">Hi <strong>{{displayName}}</strong>,</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${KRITLY_BRAND.muted};">
  Welcome to <strong style="color:${KRITLY_BRAND.primaryLight};">${KRITLY_BRAND.name}</strong> — the social review platform where you review places, social accounts, and Kritly profiles, take polls, and share short video <strong>Story Times</strong>.
</p>
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:${KRITLY_BRAND.text};">Your account</p>
<p style="margin:0 0 16px;font-size:14px;color:${KRITLY_BRAND.muted};">{{email}}</p>
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:${KRITLY_BRAND.text};">Get started</p>
${featureList([
        'Review places and accounts with honest feedback',
        'Connect your social world and discover creators',
        'Join interactive polls with the community',
        'Share moments through Story Times',
      ])}
${ctaButton('Open Kritly', '{{appUrl}}')}
<p style="margin:0;font-size:13px;line-height:1.6;color:${KRITLY_BRAND.muted};">
  Questions? We are here at <a href="mailto:{{supportEmail}}" style="color:${KRITLY_BRAND.primaryLight};">{{supportEmail}}</a>.
</p>`,
    ),
    fieldSchema: {
      required: ['displayName', 'email'],
      optional: ['appUrl', 'supportEmail'],
    },
  },
  {
    key: 'auth.password_reset',
    channel: NotificationChannel.email,
    subject: `Reset your ${KRITLY_BRAND.name} password`,
    bodyText: `Hi {{displayName}},

We received a request to reset the password for your ${KRITLY_BRAND.name} account ({{email}}).

Reset your password: {{resetUrl}}

This link expires in {{expiresIn}}. If you did not request a password reset, you can safely ignore this email — your password will stay the same.

For account security, never share this link with anyone.

Need help? Contact {{supportEmail}}

— The ${KRITLY_BRAND.name} team`,
    bodyHtml: wrapEmailHtml(
      `Reset your ${KRITLY_BRAND.name} password`,
      `Password reset requested for your ${KRITLY_BRAND.name} account. Link expires in {{expiresIn}}.`,
      `<p style="margin:0 0 12px;font-size:18px;line-height:1.5;">Hi <strong>{{displayName}}</strong>,</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${KRITLY_BRAND.muted};">
  We received a request to reset the password for your <strong style="color:${KRITLY_BRAND.primaryLight};">${KRITLY_BRAND.name}</strong> account (<strong>{{email}}</strong>).
</p>
${ctaButton('Reset password', '{{resetUrl}}')}
<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${KRITLY_BRAND.muted};">
  This link expires in <strong>{{expiresIn}}</strong>.
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;background:${KRITLY_BRAND.surface};border:1px solid ${KRITLY_BRAND.border};border-radius:12px;">
  <tr>
    <td style="padding:14px 16px;font-size:13px;line-height:1.6;color:${KRITLY_BRAND.muted};">
      <strong style="color:${KRITLY_BRAND.text};">Did not request this?</strong> Ignore this email and your password will remain unchanged. Never share your reset link with anyone.
    </td>
  </tr>
</table>
<p style="margin:0;font-size:13px;line-height:1.6;color:${KRITLY_BRAND.muted};">
  Need help? Contact <a href="mailto:{{supportEmail}}" style="color:${KRITLY_BRAND.primaryLight};">{{supportEmail}}</a>.
</p>`,
    ),
    fieldSchema: {
      required: ['displayName', 'email', 'resetUrl', 'expiresIn'],
      optional: ['supportEmail'],
    },
  },
  {
    key: 'verification.otp',
    channel: NotificationChannel.email,
    subject: `Your ${KRITLY_BRAND.name} verification code`,
    bodyText: `Your ${KRITLY_BRAND.name} verification code is {{code}}.

This code expires in {{expiresIn}}. If you did not request this code, you can safely ignore this email.

— The ${KRITLY_BRAND.name} team`,
    bodyHtml: wrapEmailHtml(
      `Your ${KRITLY_BRAND.name} verification code`,
      `Your verification code is {{code}}. It expires in {{expiresIn}}.`,
      `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${KRITLY_BRAND.muted};">
  Use this code to complete your verification on <strong style="color:${KRITLY_BRAND.primaryLight};">${KRITLY_BRAND.name}</strong>:
</p>
<p style="margin:0 0 20px;font-size:32px;font-weight:700;letter-spacing:8px;color:${KRITLY_BRAND.text};">{{code}}</p>
<p style="margin:0;font-size:14px;line-height:1.6;color:${KRITLY_BRAND.muted};">
  This code expires in <strong>{{expiresIn}}</strong>. If you did not request this, ignore this email.
</p>`,
    ),
    fieldSchema: {
      required: ['code', 'expiresIn'],
      optional: [],
    },
  },
];
