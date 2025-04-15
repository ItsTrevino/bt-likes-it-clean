// /api/generate.js
import { createCanvas, loadImage } from 'canvas';
import path from 'path';
import fs from 'fs';

export default async function handler(req, res) {
  const { namn1, namn2 } = req.query;

  if (!namn1 || !namn2) {
    return res.status(400).json({ error: "Både namn1 och namn2 krävs" });
  }

  const canvas = createCanvas(1200, 1600); // Anpassa om din affisch har annan storlek
  const ctx = canvas.getContext('2d');

  const letterHeightMax = 170;
  const margin = 30;
  const spacing = 5;

  const charToFilename = {
    'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E',
    'F': 'F', 'G': 'G', 'H': 'H', 'I': 'I', 'J': 'J',
    'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N', 'O': 'O',
    'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T',
    'U': 'U', 'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y',
    'Z': 'Z', 'Å': 'AA', 'Ä': 'AE', 'Ö': 'OE', '&': '&'
  };

  const getImage = (char) => {
    const upper = char.toUpperCase();
    const filename = charToFilename[upper];
    if (!filename) return null;
    const imgPath = path.join(process.cwd(), 'public/images', `${filename}.png`);
    if (!fs.existsSync(imgPath)) return null;
    return loadImage(imgPath);
  };

  const loadLine = async (text) => {
    const promises = [...text].map(async (char) => {
      if (char === ' ') return null;
      const img = await getImage(char);
      return img;
    });
    return Promise.all(promises);
  };

  try {
    const background = await loadImage(path.join(process.cwd(), 'public/images/background.png'));
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    const line1Images = await loadLine(namn1);
    const line2Images = await loadLine(namn2);
    const likesIt = await loadImage(path.join(process.cwd(), 'public/images/likes-it.png'));

    // Räkna ut vilken rad som är bredast
    const getLineWidth = (imgs, scale) =>
      imgs.reduce((sum, img) => sum + (img ? img.width * scale : spacing), 0) + spacing * (imgs.length - 1);

    const scaleLine = (imgs) => {
      const baseScale = (img) => letterHeightMax / img.height;
      const widths = imgs.map(img => img ? img.width * baseScale(img) : spacing);
      return widths.reduce((a, b) => a + b, 0);
    };

    const allLines = [line1Images, line2Images];
    const widest = Math.max(...allLines.map(scaleLine));
    const maxAllowedWidth = canvas.width - margin * 2;
    const scaleFactor = widest > maxAllowedWidth ? maxAllowedWidth / widest : 1;

    const drawLine = (imgs, y) => {
      let x = (canvas.width - scaleLine(imgs) * scaleFactor) / 2;
      for (let img of imgs) {
        if (!img) {
          x += spacing * scaleFactor;
          continue;
        }
        const scale = letterHeightMax / img.height * scaleFactor;
        const w = img.width * scale;
        const h = letterHeightMax * scaleFactor;
        ctx.drawImage(img, x, y, w, h);
        x += w + spacing * scaleFactor;
      }
    };

    const startY = 115;
    const lineSpacing = letterHeightMax * 1.3 * scaleFactor;

    drawLine(line1Images, startY);
    drawLine(line2Images, startY + lineSpacing);

    const likeScale = letterHeightMax / likesIt.height * scaleFactor;
    const likeW = likesIt.width * likeScale;
    const likeX = (canvas.width - likeW) / 2;
    ctx.drawImage(likesIt, likeX, startY + lineSpacing * 2, likeW, letterHeightMax * scaleFactor);

    // Svara med bilden som buffer
    res.setHeader('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);

  } catch (err) {
    console.error("API-fel:", err);
    res.status(500).json({ error: "Något gick fel vid bildgenerering" });
  }
}
