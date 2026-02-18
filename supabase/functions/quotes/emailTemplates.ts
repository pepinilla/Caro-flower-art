type ClientEmailArgs = {
  name?: string;
  email?: string;
  message?: string;
  currency?: string;
  websiteUrl?: string; // optional override
  logoUrl?: string;    // optional override
};

type AdminEmailArgs = ClientEmailArgs & {
  createdAt?: string;
};

const BRAND = {
  name: "Caro Flower Art",
  website: "https://caroflower.com",
  // ✅ PNG (mejor soporte en emails que SVG)
  logo: "https://caroflower.com/logo.png",
  primary: "#e89aa6",
  secondary: "#f4b5be",
  accent: "#d67d8a",
  dark: "#2f2323",
  text: "#4f3f3f",
  textLight: "#7a6a6a",
  bg1: "#fffaf5",
  bg2: "#fdf0ea",
  bg3: "#fff5f0",
};

function esc(s: unknown) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function baseStyles() {
  return `
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: ${BRAND.bg1};
        font-family: Arial, Helvetica, sans-serif;
        color: ${BRAND.text};
      }

      table { border-collapse: collapse; border-spacing: 0; width: 100%; }
      img { border: 0; display: block; }

      .wrapper {
        width: 100%;
        background-color: ${BRAND.bg1};
        background-image: radial-gradient(${BRAND.bg2} 2px, transparent 2px);
        background-size: 32px 32px;
        padding: 36px 0;
      }

      .container {
        max-width: 620px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 26px;
        overflow: hidden;
        box-shadow: 0 18px 40px rgba(232, 154, 166, 0.15);
        border: 1px solid rgba(232, 154, 166, 0.12);
      }

      .header {
        background: linear-gradient(180deg, ${BRAND.bg2} 0%, #fff 100%);
        padding: 34px 26px 22px 26px;
        text-align: center;
        position: relative;
      }

      .badge {
        display: inline-block;
        margin-top: 12px;
        padding: 8px 18px;
        background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%);
        color: #ffffff;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.9px;
        text-transform: uppercase;
        box-shadow: 0 6px 14px rgba(232, 154, 166, 0.28);
      }

      /* ✅ LOGO: más grande y sin “encajonarse” */
      .logo-wrap {
        width: 96px;
        height: 96px;
        margin: 0 auto 14px auto;
        border-radius: 28px;
        background: rgba(255,255,255,0.85);
        box-shadow: 0 10px 26px rgba(232, 154, 166, 0.18);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .logo-wrap img {
        width: 92px;
        height: 92px;
        object-fit: contain;
        display: block;
      }

      .brand-name {
        margin: 0;
        font-size: 24px;
        color: ${BRAND.dark};
        letter-spacing: 0.4px;
        font-weight: 800;
      }

      .content {
        padding: 30px 26px;
        text-align: left;
      }

      .title {
        margin: 0 0 16px 0;
        font-size: 26px;
        line-height: 1.2;
        color: ${BRAND.dark};
        font-weight: 800;
        text-align: left;
      }

      .p {
        margin: 0 0 12px 0;
        line-height: 1.6;
        font-size: 15px;
        color: ${BRAND.text};
      }

      .muted {
        color: ${BRAND.textLight};
        font-size: 13px;
      }

      .divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(232,154,166,0.35), transparent);
        margin: 18px 0;
      }

      .info-card {
        background-color: ${BRAND.bg3};
        border-radius: 18px;
        padding: 18px;
        border: 1px solid rgba(232, 154, 166, 0.12);
      }

      .info-title {
        margin: 0 0 14px 0;
        text-align: center;
        font-size: 12px;
        font-weight: 800;
        color: ${BRAND.accent};
        text-transform: uppercase;
        letter-spacing: 1.2px;
      }

      .kv-item {
        margin: 0 0 12px 0;
        padding: 0 0 10px 0;
        border-bottom: 1px solid rgba(232,154,166,0.12);
      }

      .kv-item:last-child {
        border-bottom: none;
        padding-bottom: 0;
        margin-bottom: 0;
      }

      .kv-label {
        display: block;
        font-size: 11px;
        font-weight: 800;
        color: ${BRAND.textLight};
        text-transform: uppercase;
        letter-spacing: 0.6px;
        margin-bottom: 4px;
      }

      .kv-value {
        font-size: 15px;
        color: ${BRAND.dark};
        font-weight: 700;
        word-break: break-word;
      }

      .cta {
        text-align: center;
        padding: 0 26px 26px 26px;
      }

      .btn {
        display: inline-block;
        padding: 14px 26px;
        background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%);
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 999px;
        font-weight: 900;
        font-size: 15px;
        letter-spacing: 0.4px;
        box-shadow: 0 10px 22px rgba(232, 154, 166, 0.35);
      }

      .footer {
        padding: 22px 26px 28px 26px;
        text-align: center;
        background-color: ${BRAND.bg2};
        border-top: 1px solid rgba(232, 154, 166, 0.10);
      }

      .footer-text {
        font-size: 12px;
        color: ${BRAND.textLight};
        line-height: 1.55;
        margin: 0;
      }

      .footer-link {
        color: ${BRAND.accent};
        text-decoration: none;
        font-weight: 800;
      }

      @media only screen and (max-width: 600px) {
        .container { border-radius: 0; }
        .content, .header, .footer { padding-left: 18px; padding-right: 18px; }
        .title { font-size: 24px; }
      }
    </style>
  `;
}

function shell(opts: {
  badge: string;
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  websiteUrl?: string;
  logoUrl?: string;
}) {
  const websiteUrl = opts.websiteUrl || BRAND.website;
  const logoUrl = opts.logoUrl || BRAND.logo;

  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>${esc(opts.title)}</title>
      ${baseStyles()}
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <div class="logo-wrap">
              <img src="${esc(logoUrl)}" alt="${esc(BRAND.name)}" width="92" height="92" />
            </div>
            <h1 class="brand-name">${esc(BRAND.name)}</h1>
            <div class="badge">${esc(opts.badge)}</div>
          </div>

          <div class="content">
            <h2 class="title">${esc(opts.title)}</h2>
            ${opts.bodyHtml}
          </div>

          ${
            opts.ctaUrl
              ? `<div class="cta">
                   <a href="${esc(opts.ctaUrl)}" class="btn" target="_blank" rel="noopener">
                     ${esc(opts.ctaLabel || "Visit website")}
                   </a>
                 </div>`
              : ""
          }

          <div class="footer">
            <p class="footer-text">
              <strong>${esc(BRAND.name)}</strong><br/>
              Handmade paper flowers<br/>
              <a class="footer-link" href="${esc(websiteUrl)}">${esc(websiteUrl)}</a>
            </p>
            <p class="footer-text" style="margin-top: 12px; font-size: 11px; opacity: 0.75;">
              If you didn’t request this email, you can safely ignore it.
              <br/>
              <span>Español: Si no solicitaste este correo, puedes ignorarlo con seguridad.</span>
            </p>
          </div>
        </div>
      </div>
    </body>
  </html>
  `;
}

/** ✅ Customer email (English first, Spanish translation below) */
export function emailTemplateClient(args: ClientEmailArgs) {
  const name = args.name?.trim() || "there";
  const currency = args.currency || "CAD";
  const websiteUrl = args.websiteUrl || BRAND.website;
  const logoUrl = args.logoUrl || BRAND.logo;

  const body = `
    <p class="p"><strong>Hi ${esc(name)} ✨</strong></p>
    <p class="p">
      Thanks for reaching out! I’ve received your request and I’ll reply soon with options and pricing.
    </p>
    <p class="p muted">
      <em>Español:</em> ¡Gracias por tu mensaje! Ya recibí tu solicitud y te responderé pronto con opciones y precio.
    </p>

    <div class="divider"></div>

    <div class="info-card">
      <p class="info-title">Request summary</p>

      <div class="kv-item">
        <span class="kv-label">Name</span>
        <span class="kv-value">${esc(args.name)}</span>
      </div>

      <div class="kv-item">
        <span class="kv-label">Email</span>
        <span class="kv-value">${esc(args.email)}</span>
      </div>

      <div class="kv-item">
        <span class="kv-label">Currency</span>
        <span class="kv-value">${esc(currency)}</span>
      </div>

      <div class="kv-item">
        <span class="kv-label">Details</span>
        <span class="kv-value">${esc(args.message).replaceAll("\n", "<br/>")}</span>
      </div>
    </div>

    <p class="p" style="margin-top:14px;"><strong>Talk soon!</strong> 🌸</p>
    <p class="p muted"><em>Español:</em> ¡Hablamos pronto! 🌸</p>
  `;

  return shell({
    badge: "Request received",
    title: "I got your message ✿",
    bodyHtml: body,
    ctaLabel: "Visit website",
    ctaUrl: websiteUrl,
    websiteUrl,
    logoUrl,
  });
}

/** ✅ Admin email (English first, Spanish note) */
export function emailTemplateAdmin(args: AdminEmailArgs) {
  const websiteUrl = args.websiteUrl || BRAND.website;
  const logoUrl = args.logoUrl || BRAND.logo;

  const body = `
    <p class="p"><strong>New quote request ✨</strong></p>
    <p class="p">
      A customer submitted the contact form. Here are the details:
    </p>
    <p class="p muted">
      <em>Español:</em> Un cliente llenó el formulario de contacto. Aquí están los detalles:
    </p>

    <div class="divider"></div>

    <div class="info-card">
      <p class="info-title">Lead details</p>

      <div class="kv-item">
        <span class="kv-label">Name</span>
        <span class="kv-value">${esc(args.name)}</span>
      </div>

      <div class="kv-item">
        <span class="kv-label">Email</span>
        <span class="kv-value">${esc(args.email)}</span>
      </div>

      <div class="kv-item">
        <span class="kv-label">Currency</span>
        <span class="kv-value">${esc(args.currency || "CAD")}</span>
      </div>

      ${
        args.createdAt
          ? `<div class="kv-item">
              <span class="kv-label">Created</span>
              <span class="kv-value">${esc(args.createdAt)}</span>
            </div>`
          : ""
      }

      <div class="kv-item">
        <span class="kv-label">Message</span>
        <span class="kv-value">${esc(args.message).replaceAll("\n", "<br/>")}</span>
      </div>
    </div>

    <p class="p" style="margin-top:14px;">
      <strong>Next step:</strong> Reply to the customer with pricing and availability.
    </p>
    <p class="p muted">
      <em>Español:</em> Siguiente paso: responde al cliente con precio y disponibilidad.
    </p>
  `;

  return shell({
    badge: "New lead",
    title: "New quote request",
    bodyHtml: body,
    ctaLabel: "Visit website",
    ctaUrl: websiteUrl,
    websiteUrl,
    logoUrl,
  });
}
