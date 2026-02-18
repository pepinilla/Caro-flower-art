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
  logo: "https://caroflower.com/logo.png",
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

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const options: Intl.DateTimeFormatOptions = {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    };
    return date.toLocaleString('en-US', options);
  } catch (e) { return dateStr; }
}

function baseStyles() {
  return `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600&display=swap');

    body {
      margin: 0; padding: 0; width: 100% !important;
      background-color: ${BRAND.bg1};
      font-family: 'Inter', Arial, sans-serif;
      color: ${BRAND.text};
      -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;
    }

    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; display: block; }
    
    .wrapper { width: 100%; background-color: ${BRAND.bg1}; padding: 30px 0; }
    .container {
      max-width: 600px; margin: 0 auto;
      background-color: #ffffff;
      border-radius: 32px;
      overflow: hidden;
      border: 1px solid rgba(232, 154, 166, 0.15);
    }

    /* Header con Tabla para asegurar que las flores NO se amontonen */
    .header-table {
      width: 100%;
      background-color: ${BRAND.bg2};
      padding: 40px 20px;
    }

    .flower-cell {
      width: 60px;
      font-size: 40px;
      vertical-align: middle;
      opacity: 0.3;
    }

    .logo-cell {
      text-align: center;
      vertical-align: middle;
    }

    .logo-img {
      width: 100px;
      margin: 0 auto;
      /* Forzamos que el fondo blanco del logo se vea como parte del diseño si no es transparente */
      border-radius: 12px;
    }

    .brand-name {
      font-family: 'Playfair Display', serif;
      font-size: 26px;
      color: ${BRAND.dark};
      margin: 15px 0 0 0;
      text-align: center;
    }

    .badge-wrap { text-align: center; padding-top: 15px; }
    .badge {
      display: inline-block;
      padding: 8px 24px;
      background-color: ${BRAND.primary};
      color: #ffffff;
      border-radius: 50px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .content { padding: 40px 30px; text-align: center; }
    .title {
      font-family: 'Playfair Display', serif;
      font-size: 30px;
      color: ${BRAND.dark};
      margin: 0 0 20px 0;
    }

    .message { font-size: 16px; line-height: 1.6; color: ${BRAND.text}; margin-bottom: 30px; }
    .translation { font-style: italic; color: ${BRAND.textLight}; font-size: 14px; margin-top: 10px; }

    .divider {
      border-top: 1px solid rgba(232, 154, 166, 0.3);
      margin: 30px 0;
      text-align: center;
      height: 1px;
    }

    .info-card {
      background-color: ${BRAND.bg3};
      border-radius: 24px;
      padding: 30px 20px;
      margin-bottom: 30px;
    }

    .info-title {
      font-size: 13px;
      font-weight: 700;
      color: ${BRAND.accent};
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 20px;
    }

    .kv-item { margin-bottom: 15px; }
    .kv-label { font-size: 11px; font-weight: 600; color: ${BRAND.textLight}; text-transform: uppercase; display: block; }
    .kv-value { font-size: 15px; color: ${BRAND.dark}; font-weight: 500; }

    .btn-wrap { text-align: center; margin-top: 30px; }
    .btn {
      display: inline-block;
      padding: 16px 36px;
      background-color: ${BRAND.primary};
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 700;
      font-size: 15px;
    }

    .footer {
      padding: 30px;
      background-color: ${BRAND.bg2};
      text-align: center;
      font-size: 13px;
      color: ${BRAND.textLight};
    }

    @media only screen and (max-width: 480px) {
      .container { border-radius: 0; }
      .title { font-size: 26px; }
      .flower-cell { width: 40px; font-size: 30px; }
    }
  </style>
  `;
}

function shell(opts: { badge: string; title: string; bodyHtml: string; ctaLabel?: string; ctaUrl?: string }) {
  return `
  <!DOCTYPE html>
  <html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    ${baseStyles()}
  </head>
  <body>
    <div class="wrapper">
      <table class="container" align="center" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <!-- Header con Tabla para flores a los lados -->
            <table class="header-table" cellpadding="0" cellspacing="0">
              <tr>
                <td class="flower-cell" align="left">🌸</td>
                <td class="logo-cell">
                  <img src="${esc(BRAND.logo)}" alt="${esc(BRAND.name)}" class="logo-img" />
                </td>
                <td class="flower-cell" align="right">🌺</td>
              </tr>
              <tr>
                <td colspan="3">
                  <h1 class="brand-name">${esc(BRAND.name)}</h1>
                  <div class="badge-wrap">
                    <span class="badge">${esc(opts.badge)}</span>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Contenido -->
            <div class="content">
              <h2 class="title">${esc(opts.title)}</h2>
              ${opts.bodyHtml}

              ${opts.ctaUrl ? `
              <div class="btn-wrap">
                <a href="${esc(opts.ctaUrl)}" class="btn" target="_blank">${esc(opts.ctaLabel || "Visit Website")}</a>
              </div>
              ` : ''}
            </div>

            <!-- Footer -->
            <div class="footer">
              <strong>${esc(BRAND.name)}</strong><br/>
              Handmade Paper Flower Art<br/>
              <a href="${esc(BRAND.website)}" style="color:${BRAND.primary}; text-decoration:none;">${esc(BRAND.website)}</a>
            </div>
          </td>
        </tr>
      </table>
    </div>
  </body>
  </html>
  `;
}

export function emailTemplateClient(args: ClientEmailArgs) {
  const name = args.name?.trim() || "there";
  const body = `
    <div class="message">
      Hi <strong>${esc(name)}</strong>! ✨<br/><br/>
      Thank you so much for reaching out! I’ve received your request and I’m excited to help bring your vision to life with beautiful handmade paper flowers.
      <div class="translation">¡Muchas gracias por contactarme! He recibido tu solicitud y me hace mucha ilusión ayudarte a crear algo mágico.</div>
    </div>
    <div class="divider">✿</div>
    <div class="info-card">
      <div class="info-title">Request Summary</div>
      <div class="kv-item"><span class="kv-label">Name</span><span class="kv-value">${esc(args.name)}</span></div>
      <div class="kv-item"><span class="kv-label">Email</span><span class="kv-value">${esc(args.email)}</span></div>
      <div class="kv-item"><span class="kv-label">Details</span><span class="kv-value">${esc(args.message).replaceAll("\n", "<br/>")}</span></div>
    </div>
    <div class="message">
      I look forward to creating something beautiful for you! 🌸
      <div class="translation">¡Espero que podamos crear algo hermoso juntas!</div>
    </div>
  `;
  return shell({ badge: "REQUEST RECEIVED", title: "I got your message! ✿", bodyHtml: body, ctaLabel: "View My Gallery", ctaUrl: BRAND.website });
}

export function emailTemplateAdmin(args: AdminEmailArgs) {
  const body = `
    <div class="message">
      <strong>You have a new client!</strong> ✨<br/><br/>
      A customer has submitted the contact form on your website.
      <div class="translation">Alguien ha completado el formulario de contacto en tu web.</div>
    </div>
    <div class="divider">✿</div>
    <div class="info-card">
      <div class="info-title">Lead Details</div>
      <div class="kv-item"><span class="kv-label">Name</span><span class="kv-value">${esc(args.name)}</span></div>
      <div class="kv-item"><span class="kv-label">Email</span><span class="kv-value">${esc(args.email)}</span></div>
      ${args.createdAt ? `<div class="kv-item"><span class="kv-label">Submitted At</span><span class="kv-value">${esc(formatDate(args.createdAt))}</span></div>` : ""}
      <div class="kv-item"><span class="kv-label">Message</span><span class="kv-value">${esc(args.message).replaceAll("\n", "<br/>")}</span></div>
    </div>
    <div class="message">
      <strong>Next step:</strong> Reply to this customer with pricing and availability.
      <div class="translation"><strong>Siguiente paso:</strong> Responde a este cliente con presupuesto y disponibilidad.</div>
    </div>
  `;
  return shell({ badge: "NEW LEAD", title: "New Quote Request 📬", bodyHtml: body, ctaLabel: "Go to Website", ctaUrl: BRAND.website });
}
