type ClientEmailArgs = {
  name?: string;
  email?: string;
  message?: string;
  currency?: string;
  websiteUrl?: string;
  logoUrl?: string;
};

type AdminEmailArgs = ClientEmailArgs & {
  createdAt?: string;
};

const BRAND = {
  name: "Caro Flower Art",
  website: "https://caroflower.com",
  logo: "https://caroflower.com/logo.png", // PNG mejor para email
  primary: "#e89aa6",
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
    /* Importación de fuentes elegantes */
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
      text-align: center;
    }

    /* Header con elementos florales */
    .header {
      background-color: ${BRAND.bg2};
      padding: 56px 40px 40px;
      position: relative;
      overflow: hidden;
    }

    .flower-decor {
      position: absolute;
      font-size: 40px;
      opacity: 0.2;
    }
    .f1 { top: 10px; left: 10px; transform: rotate(-15deg); }
    .f2 { bottom: 10px; right: 10px; transform: rotate(15deg); }

    .logo-wrap {
      margin-bottom: 20px;
    }

    .logo-wrap img {
      width: 100px;
      height: auto;
      margin: 0 auto;
      filter: drop-shadow(0 4px 8px rgba(232, 154, 166, 0.2));
    }

    .brand-name {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      color: ${BRAND.dark};
      margin: 0;
      letter-spacing: 0.5px;
    }

    .badge {
      display: inline-block;
      margin-top: 18px;
      padding: 10px 28px;
      background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%);
      color: #ffffff;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      box-shadow: 0 4px 12px rgba(232, 154, 166, 0.3);
    }

    .content {
      padding: 56px 40px;
    }

    .title {
      font-family: 'Playfair Display', serif;
      font-size: 34px;
      line-height: 1.2;
      color: ${BRAND.dark};
      margin: 0 0 28px 0;
    }

    .message {
      font-size: 17px;
      line-height: 1.8;
      color: ${BRAND.text};
      margin-bottom: 36px;
    }

    .translation {
      margin-top: 18px;
      font-style: italic;
      color: ${BRAND.textLight};
      font-size: 14px;
      line-height: 1.6;
    }

    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(232, 154, 166, 0.4), transparent);
      margin: 44px 0;
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
      font-size: 20px;
    }

    .info-card {
      background-color: ${BRAND.bg3};
      border-radius: 26px;
      padding: 36px;
      margin-bottom: 44px;
      border: 1px solid rgba(232, 154, 166, 0.1);
    }

    .info-title {
      font-size: 14px;
      font-weight: 700;
      color: ${BRAND.accent};
      text-transform: uppercase;
      letter-spacing: 1.8px;
      margin-bottom: 24px;
    }

    .kv-item {
      margin-bottom: 18px;
    }

    .kv-item:last-child { margin-bottom: 0; }

    .kv-label {
      font-size: 11px;
      font-weight: 600;
      color: ${BRAND.textLight};
      text-transform: uppercase;
      letter-spacing: 0.8px;
      display: block;
      margin-bottom: 4px;
    }

    .kv-value {
      font-size: 16px;
      color: ${BRAND.dark};
      font-weight: 500;
      word-break: break-word;
    }

    .btn {
      display: inline-block;
      padding: 20px 44px;
      background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 999px;
      font-weight: 700;
      font-size: 16px;
      letter-spacing: 0.5px;
      box-shadow: 0 12px 28px rgba(232, 154, 166, 0.4);
    }

    .footer {
      padding: 48px 40px;
      background-color: ${BRAND.bg2};
      border-top: 1px solid rgba(232, 154, 166, 0.1);
    }

    .footer-text {
      font-size: 14px;
      color: ${BRAND.textLight};
      line-height: 1.7;
      margin: 0;
    }

    .footer-link {
      color: ${BRAND.primary};
      text-decoration: none;
      font-weight: 600;
    }

    @media only screen and (max-width: 600px) {
      .container { border-radius: 0; }
      .content, .header, .footer { padding: 40px 24px; }
      .title { font-size: 28px; }
      .message { font-size: 16px; }
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
}) {
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
          <div class="flower-decor f1">🌸</div>
          <div class="flower-decor f2">🌺</div>
          <div class="logo-wrap">
            <img src="${esc(BRAND.logo)}" alt="${esc(BRAND.name)}">
          </div>
          <h1 class="brand-name">${esc(BRAND.name)}</h1>
          <div class="badge">${esc(opts.badge)}</div>
        </div>

        <div class="content">
          <h2 class="title">${esc(opts.title)}</h2>
          ${opts.bodyHtml}

          ${opts.ctaUrl ? `
          <div style="margin-top: 40px;">
            <a href="${esc(opts.ctaUrl)}" class="btn" target="_blank">
              ${esc(opts.ctaLabel || "Visitar Web")}
            </a>
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <p class="footer-text">
            <strong>${esc(BRAND.name)}</strong><br>
            Handmade Paper Flower Art<br>
            <a href="${esc(BRAND.website)}" class="footer-link">${esc(BRAND.website)}</a>
          </p>
        </div>

      </div>
    </div>
  </body>
  </html>
  `;
}

/* CLIENT EMAIL */
export function emailTemplateClient(args: ClientEmailArgs) {
  const name = args.name?.trim() || "amiga/o";
  const currency = args.currency || "CAD";

  const body = `
    <div class="message">
      ¡Hola <strong>${esc(name)}</strong>! ✨<br><br>
      ¡Muchas gracias por contactarme! He recibido tu solicitud y me hace mucha ilusión ayudarte a crear algo mágico con mis flores de papel hechas a mano.
      
      <div class="translation">
        Thank you for reaching out! I’ve received your request and I’ll reply soon with options and pricing.
      </div>
    </div>

    <div class="divider"></div>

    <div class="info-card">
      <div class="info-title">Resumen de tu Solicitud</div>

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

    <div class="message">
      ¡Espero que podamos crear algo hermoso juntas! 🌸
    </div>
  `;

  return shell({
    badge: "SOLICITUD RECIBIDA",
    title: "¡Recibí tu mensaje! ✿",
    bodyHtml: body,
    ctaLabel: "Ver mi Galería",
    ctaUrl: BRAND.website
  });
}

/* ADMIN EMAIL */
export function emailTemplateAdmin(args: AdminEmailArgs) {
  const body = `
    <div class="message">
      <strong>¡Tienes un nuevo cliente!</strong> ✨<br><br>
      Alguien ha completado el formulario de contacto en tu web. Aquí tienes los detalles para que puedas responderle pronto.

      <div class="translation">
        A customer submitted the contact form. Here are the details:
      </div>
    </div>

    <div class="divider"></div>

    <div class="info-card">
      <div class="info-title">Datos del Cliente</div>

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

      ${args.createdAt ? `
      <div class="kv-item">
        <span class="kv-label">Fecha</span>
        <span class="kv-value">${esc(args.createdAt)}</span>
      </div>
      ` : ""}

      <div class="kv-item">
        <span class="kv-label">Mensaje</span>
        <span class="kv-value">${esc(args.message).replaceAll("\n", "<br/>")}</span>
      </div>
    </div>

    <div class="message">
      <strong>Siguiente paso:</strong> Responde a este cliente con presupuesto y disponibilidad.
    </div>
  `;

  return shell({
    badge: "NUEVO CLIENTE",
    title: "Nueva Solicitud de Cotización 📬",
    bodyHtml: body,
    ctaLabel: "Ir a la Web",
    ctaUrl: BRAND.website
  });
}
