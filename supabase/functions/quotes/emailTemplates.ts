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
  // ✅ PNG es lo más compatible para emails (Gmail a veces rompe SVG)
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
      /* NOTE: many email clients ignore @import fonts; fallbacks are included */
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600&display=swap');

      body {
        margin: 0;
        padding: 0;
        background-color: ${BRAND.bg1};
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        color: ${BRAND.text};
        -webkit-font-smoothing: antialiased;
      }

      table { border-collapse: collapse; border-spacing: 0; width: 100%; }
      img { border: 0; display: block; }

      .wrapper {
        width: 100%;
        table-layout: fixed;
        background-color: ${BRAND.bg1};
        background-image: radial-gradient(${BRAND.bg2} 2px, transparent 2px);
        background-size: 32px 32px;
        padding: 40px 0;
      }

      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 32px;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(232, 154, 166, 0.15);
        border: 1px solid rgba(232, 154, 166, 0.1);
      }

      .header {
        background-color: ${BRAND.bg2};
        background-image: url('https://www.transparenttextures.com/patterns/pollen.png');
        padding: 48px 40px;
        text-align: center;
        position: relative;
      }

      .header-flower-left {
        position: absolute;
        top: -20px;
        left: -20px;
        font-size: 60px;
        opacity: 0.15;
        transform: rotate(-15deg);
      }

      .header-flower-right {
        position: absolute;
        bottom: -20px;
        right: -20px;
        font-size: 60px;
        opacity: 0.15;
        transform: rotate(15deg);
      }

      .logo-container {
        width: 80px;
        height: 80px;
        background: #ffffff;
        border-radius: 24px;
        margin: 0 auto 20px auto;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 20px rgba(232, 154, 166, 0.2);
        border: 2px solid rgba(232, 154, 166, 0.1);
        overflow: hidden;
      }

      /* ✅ Force stable size in Gmail */
      .logo-container img {
        width: 50px;
        height: 50px;
        display: block;
        object-fit: contain;
      }

      .brand-name {
        font-family: 'Playfair Display', serif;
        font-size: 24px;
        color: ${BRAND.dark};
        margin: 0;
        letter-spacing: 0.5px;
      }

      .badge {
        display: inline-block;
        margin-top: 16px;
        padding: 8px 20px;
        background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%);
        color: #ffffff;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        box-shadow: 0 4px 12px rgba(232, 154, 166, 0.3);
      }

      .content {
        padding: 48px 40px;
        text-align: center;
      }

      .title {
        font-family: 'Playfair Display', serif;
        font-size: 32px;
        line-height: 1.2;
        color: ${BRAND.dark};
        margin: 0 0 24px 0;
      }

      .message {
        font-size: 16px;
        line-height: 1.7;
        color: ${BRAND.text};
        margin-bottom: 32px;
        text-align: left;
      }

      .divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(232, 154, 166, 0.3), transparent);
        margin: 40px 0;
        position: relative;
      }

      .divider::after {
        content: '✿';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #ffffff;
        padding: 0 15px;
        color: ${BRAND.primary};
        font-size: 18px;
      }

      .info-card {
        background-color: ${BRAND.bg3};
        border-radius: 24px;
        padding: 32px;
        margin-bottom: 40px;
        text-align: left;
        border: 1px solid rgba(232, 154, 166, 0.1);
      }

      .info-title {
        font-size: 14px;
        font-weight: 700;
        color: ${BRAND.accent};
        text-transform: uppercase;
        letter-spacing: 1.5px;
        margin-bottom: 20px;
        text-align: center;
      }

      .kv-item {
        margin-bottom: 16px;
        border-bottom: 1px solid rgba(232, 154, 166, 0.1);
        padding-bottom: 12px;
      }

      .kv-item:last-child {
        margin-bottom: 0;
        border-bottom: none;
        padding-bottom: 0;
      }

      .kv-label {
        font-size: 12px;
        font-weight: 600;
        color: ${BRAND.textLight};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: block;
        margin-bottom: 4px;
      }

      .kv-value {
        font-size: 15px;
        color: ${BRAND.dark};
        font-weight: 500;
        word-break: break-word;
      }

      .cta-container {
        text-align: center;
        margin-top: 40px;
      }

      .btn {
        display: inline-block;
        padding: 18px 40px;
        background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%);
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 999px;
        font-weight: 700;
        font-size: 16px;
        letter-spacing: 0.5px;
        box-shadow: 0 10px 25px rgba(232, 154, 166, 0.4);
      }

      .footer {
        padding: 40px;
        text-align: center;
        background-color: ${BRAND.bg2};
        border-top: 1px solid rgba(232, 154, 166, 0.1);
      }

      .footer-text {
        font-size: 13px;
        color: ${BRAND.textLight};
        line-height: 1.6;
        margin: 0;
      }

      .footer-link {
        color: ${BRAND.primary};
        text-decoration: none;
        font-weight: 600;
      }

      @media only screen and (max-width: 600px) {
        .container { border-radius: 0; }
        .content, .header, .footer { padding: 32px 24px; }
        .title { font-size: 28px; }
        .message { text-align: left; }
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
  <html lang="es">
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
          <div class="header-flower-left">🌸</div>
          <div class="header-flower-right">🌺</div>

          <div class="logo-container">
            <img src="${esc(logoUrl)}" alt="${esc(BRAND.name)}" width="50" height="50">
          </div>

          <h1 class="brand-name">${esc(BRAND.name)}</h1>
          <div class="badge">${esc(opts.badge)}</div>
        </div>

        <div class="content">
          <h2 class="title">${esc(opts.title)}</h2>

          <div class="message">
            ${opts.bodyHtml}
          </div>

          ${
            opts.ctaUrl
              ? `
                <div class="cta-container">
                  <a href="${esc(opts.ctaUrl)}" class="btn" target="_blank" rel="noopener">
                    ${esc(opts.ctaLabel || "Visit website")}
                  </a>
                </div>
              `
              : ""
          }
        </div>

        <div class="footer">
          <p class="footer-text">
            <strong>${esc(BRAND.name)}</strong><br>
            Handmade Paper Flower Art<br>
            <a href="${esc(websiteUrl)}" class="footer-link">${esc(websiteUrl)}</a>
          </p>
          <p class="footer-text" style="margin-top: 20px; font-size: 11px; opacity: 0.7;">
            If you didn’t request this, you can ignore this email.<br/>
            Si no solicitaste este correo, puedes ignorarlo con seguridad.
          </p>
        </div>

      </div>
    </div>
  </body>
  </html>
  `;
}

/** Email que recibe el cliente */
export function emailTemplateClient(args: ClientEmailArgs) {
  const name = args.name?.trim() || "amiga/o";
  const currency = args.currency || "CAD";
  const websiteUrl = args.websiteUrl || BRAND.website;
  const logoUrl = args.logoUrl || BRAND.logo;

  const body = `
    <p>¡Hola <strong>${esc(name)}</strong>! ✨</p>
    <p>
      ¡Muchas gracias por contactarme! He recibido tu solicitud y me hace mucha ilusión ayudarte a crear algo mágico con mis flores de papel hechas a mano.
    </p>
    <p style="font-style: italic; color: ${BRAND.textLight}; font-size: 14px; margin-top: 14px;">
      I've received your request and I'm excited to help bring your vision to life with beautiful handmade paper flowers.
    </p>
    <p style="margin-top: 14px;">
      Revisaré todos los detalles y te responderé muy pronto con opciones personalizadas y precios.
    </p>

    <div class="divider"></div>

    <div class="info-card">
      <p class="info-title">Resumen de tu Solicitud</p>

      <div class="kv-item">
        <span class="kv-label">Nombre</span>
        <span class="kv-value">${esc(args.name)}</span>
      </div>

      <div class="kv-item">
        <span class="kv-label">Email</span>
        <span class="kv-value">${esc(args.email)}</span>
      </div>

      <div class="kv-item">
        <span class="kv-label">Moneda</span>
        <span class="kv-value">${esc(currency)}</span>
      </div>

      <div class="kv-item">
        <span class="kv-label">Detalles</span>
        <span class="kv-value">${esc(args.message).replaceAll("\n", "<br/>")}</span>
      </div>
    </div>

    <p>¡Espero que podamos crear algo hermoso juntas! 🌸</p>
  `;

  return shell({
    badge: "Solicitud Recibida",
    title: "¡Recibí tu mensaje! ✿",
    bodyHtml: body,
    ctaLabel: "Visit website",
    ctaUrl: websiteUrl,
    websiteUrl,
    logoUrl,
  });
}

/** Email que te llega a ti (admin) */
export function emailTemplateAdmin(args: AdminEmailArgs) {
  const websiteUrl = args.websiteUrl || BRAND.website;
  const logoUrl = args.logoUrl || BRAND.logo;

  const body = `
    <p><strong>¡Tienes un nuevo cliente!</strong> ✨</p>
    <p style="margin-top: 8px;">
      Alguien ha completado el formulario de contacto en tu web. Aquí tienes los detalles para que puedas responderle pronto.
    </p>

    <div class="divider"></div>

    <div class="info-card">
      <p class="info-title">Datos del Cliente</p>

      <div class="kv-item">
        <span class="kv-label">Nombre</span>
        <span class="kv-value">${esc(args.name)}</span>
      </div>

      <div class="kv-item">
        <span class="kv-label">Email</span>
        <span class="kv-value">${esc(args.email)}</span>
      </div>

      <div class="kv-item">
        <span class="kv-label">Moneda</span>
        <span class="kv-value">${esc(args.currency || "CAD")}</span>
      </div>

      ${
        args.createdAt
          ? `
            <div class="kv-item">
              <span class="kv-label">Fecha</span>
              <span class="kv-value">${esc(args.createdAt)}</span>
            </div>
          `
          : ""
      }

      <div class="kv-item">
        <span class="kv-label">Mensaje</span>
        <span class="kv-value">${esc(args.message).replaceAll("\n", "<br/>")}</span>
      </div>
    </div>

    <p><strong>Siguiente paso:</strong> Responde a este cliente con presupuesto y disponibilidad.</p>
  `;

  return shell({
    badge: "Nuevo Cliente",
    title: "Nueva Solicitud de Cotización 📬",
    bodyHtml: body,
    ctaLabel: "Visit website",
    ctaUrl: websiteUrl,
    websiteUrl,
    logoUrl,
  });
}
