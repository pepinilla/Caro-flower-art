import fs from "fs";
import path from "path";

const PINTEREST_ACCESS_TOKEN = process.env.PINTEREST_ACCESS_TOKEN || "";
const PINTEREST_BOARD_ID = process.env.PINTEREST_BOARD_ID || "";

const LAST_POST_JSON = path.join(process.cwd(), "blog", "last_post.json");

async function createPinterestPin({ title, description, link, imageUrl }) {
  if (!PINTEREST_ACCESS_TOKEN || !PINTEREST_BOARD_ID) {
    throw new Error("Missing PINTEREST_ACCESS_TOKEN or PINTEREST_BOARD_ID");
  }

  const resp = await fetch("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINTEREST_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      board_id: PINTEREST_BOARD_ID,
      title: (title || "Caro Flower Art").slice(0, 100),
      description: (description || "").slice(0, 490),
      link,
      media_source: { source_type: "image_url", url: imageUrl },
    }),
  });

  const text = await resp.text();
  if (!resp.ok) throw new Error(`Pinterest error ${resp.status}: ${text}`);
  return text;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  if (!fs.existsSync(LAST_POST_JSON)) {
    throw new Error("blog/last_post.json not found (run generate script first).");
  }

  const last = JSON.parse(fs.readFileSync(LAST_POST_JSON, "utf-8"));

  // Espera para que GitHub Pages alcance a desplegar
  await sleep(90000); // 90s

  const res = await createPinterestPin({
    title: last.title,
    description: last.description,
    link: last.postUrl,
    imageUrl: last.imageUrl,
  });

  console.log("Pinterest pin created:", res);
}

run();
