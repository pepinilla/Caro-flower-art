type ClientEmailArgs = {
  name?: string;
  email?: string;
  message?: string;
  currency?: string;
  websiteUrl?: string; // optional override.
  logoUrl?: string;    // optional override
};

type AdminEmailArgs = ClientEmailArgs & {
  createdAt?: string;
};

const BRAND = {
  name: "Caro Flower Art",
  website: "https://caroflower.com",
  logo: "https://caroflower.com/logo.svg",
  primary: "#e89aa6",
  dark: "#2f2323",
  text: "#4f3f3f",
  bg1: "#fffaf5",
  bg2: "#fdf0ea",
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
      /* Reset-ish for email */
      body{margin:0;padding:0;background:${BRAND.bg1};font-family:Arial,Helvetica,sans-serif;color:${BRAND.text}}
      a{color:inherit}
      .wrap{width:100%;background:linear-gradient(180deg, ${BRAND.bg2} 0%, ${BRAND.bg1} 60%)}
      .container{max-width:640px;margin:0 auto;padding:28px 16px}
      .card{
        background:#ffffff;
        border:1px solid rgba(232,154,166,.22);
        border-radius:18px;
        box-shadow:0 12px 30px rgba(0,0,0,.06);
        overflow:hidden;
      }
      .topbar{
        background:rgba(232,154,166,.10);
        padding:18px 20px;
        border-bottom:1px solid rgba(232,154,166,.18);
      }
      .brand{display:flex;align-items:center;gap:12px}
      .logo{
        width:44px;height:44px;border-radius:12px;
        background:#fff; border:1px solid rgba(0,0,0,.06);
        display:flex;align-items:center;justify-content:center;
      }
      .logo img{max-width:30px;max-height:30px;display:block}
      .brand h1{margin:0;font-size:16px;letter-spacing:.3px;color:${BRAND.dark}}
      .badge{
        display:inline-block;margin-top:10px;
        padding:8px 12px;border-radius:999px;
        background:rgba(232,154,166,.16);
        border:1px solid rgba(232,154,166,.24);
        font-weight:700;font-size:12px;color:${BRAND.dark};
      }
      .content{padding:22px 20px}
      .title{margin:0 0 10px 0;font-size:22px;line-height:1.2;color:${BRAND.dark}}
      .p{margin:0 0 12px 0;line-height:1.55;font-size:14px}
      .muted{opacity:.78}
      .divider{height:1px;background:rgba(0,0,0,.06);margin:16px 0}
      .kv{margin:0;padding:0;list-style:none}
      .kv li{padding:10px 0;border-bottom:1px dashed rgba(0,0,0,.06);font-size:14px}
      .kv b{color:${BRAND.dark}}
      .kv li:last-child{border-bottom:none}
      .ctaRow{padding:0 20px 22px 20px}
      .btn{
        display:inline-block;text-decoration:none;
        padding:12px 16px;border-radius:999px;
        background:${BRAND.primary};color:#fff;font-weight:800;
        border:1px solid rgba(0,0,0,.06);
      }
      .btn:hover{opacity:.95}
      .foot{padding:16px 20px 22px 20px;font-size:12px;opacity:.75}
      .small{font-size:12px}
      /* Mobile */
      @media (max-width:480px){
        .content{padding:18px 16px}
        .topbar{padding:16px}
        .ctaRow{padding:0 16px 18px 16px}
      }
    </style>
  `;
}

function shell(opts: { badge: string; title: string; bodyHtml: string; ctaLabel?: string; ctaUrl?: string }) {
  return `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      ${baseStyles()}
    </head>
    <body>
      <div class="wrap">
        <div class="container">
          <div class="card">
            <div class="topbar">
              <div class="brand">
                <div class="logo">
                  <img src="${esc(BRAND.logo)}" alt="${esc(BRAND.name)}" />
                </div>
                <div>
                  <h1>${esc(BRAND.name)}</h1>
                  <div class="badge">${esc(opts.badge)}</div>
                </div>
              </div>
            </div>

            <div class="content">
              <h2 class="title">${esc(opts.title)}</h2>
              ${opts.bodyHtml}
            </div>

            ${
              opts.ctaUrl
                ? `<div class="ctaRow">
                    <a class="btn" href="${esc(opts.ctaUrl)}" target="_blank" rel="noopener">${esc(opts.ctaLabel || "Visit website")}</a>
                  </div>`
                : ""
            }

            <div class="foot">
              <div class="muted">Caro Flower Art • Handmade paper flowers • ${esc(BRAND.website)}</div>
              <div class="muted small">If you didn’t request this, you can ignore this email.</div>
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>
  `;
}

/** Email que recibe el cliente */
export function emailTemplateClient(args: ClientEmailArgs) {
  const name = args.name?.trim() || "there";
  const currency = args.currency || "CAD";
  const websiteUrl = args.websiteUrl || BRAND.website;

  const body = `
    <p class="p">Hi ${esc(name)} ✨</p>
    <p class="p">
      Thanks for your request! I received your details and I’ll reply soon with options and pricing.
      <br/><span class="muted">¡Gracias por tu mensaje! Te responderé pronto con opciones y precio.</span>
    </p>

    <div class="divider"></div>

    <p class="p"><b>Your request / Tu solicitud</b></p>
    <ul class="kv">
      <li><b>Name:</b> ${esc(args.name)}</li>
      <li><b>Email:</b> ${esc(args.email)}</li>
      <li><b>Currency:</b> ${esc(currency)}</li>
      <li><b>Details:</b><br/>${esc(args.message).replaceAll("\n", "<br/>")}</li>
    </ul>
  `;

  return shell({
    badge: "Request received / Solicitud recibida",
    title: "I got your message ✿ / Recibí tu mensaje ✿",
    bodyHtml: body,
    ctaLabel: "Visit website",
    ctaUrl: websiteUrl,
  });
}

/** Email que te llega a ti (admin) */
export function emailTemplateAdmin(args: AdminEmailArgs) {
  const websiteUrl = args.websiteUrl || BRAND.website;
  const body = `
    <p class="p"><b>New quote request ✨</b></p>
    <p class="p muted">A customer submitted the contact form.</p>

    <div class="divider"></div>

    <ul class="kv">
      <li><b>Name:</b> ${esc(args.name)}</li>
      <li><b>Email:</b> ${esc(args.email)}</li>
      <li><b>Currency:</b> ${esc(args.currency || "CAD")}</li>
      ${args.createdAt ? `<li><b>Created:</b> ${esc(args.createdAt)}</li>` : ""}
      <li><b>Message:</b><br/>${esc(args.message).replaceAll("\n", "<br/>")}</li>
    </ul>
  `;

  return shell({
    badge: "New lead / Nuevo cliente",
    title: "New quote request",
    bodyHtml: body,
    ctaLabel: "Visit website",
    ctaUrl: websiteUrl,
  });
}
