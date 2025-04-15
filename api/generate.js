import path from "path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function handler(req, res) {
  const { namn1, namn2 } = req.query;

  console.log("📥 API anropat med:", { namn1, namn2 });

  try {
    const canvas = createCanvas(1080, 1350);
    const ctx = canvas.getContext("2d");

    // Hämta rätt absolut sökväg till bakgrunden
    const bgPath = path.join(process.cwd(), "public", "images", "background.png");
    console.log("🖼️ Laddar bakgrund från:", bgPath);

    const bg = await loadImage(bgPath);
    ctx.drawImage(bg, 0, 0);

    // (Du kan lägga in fler steg här senare)

    const buffer = canvas.toBuffer("image/png");
    console.log("✅ Skapade PNG-buffer");

    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    console.error("❌ API-fel:", err);
    res.status(500).send("Fel i servern");
  }
}
