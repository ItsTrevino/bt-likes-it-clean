import { createCanvas, loadImage } from 'canvas';

export default async function handler(req, res) {
  const { namn1, namn2 } = req.query;

  if (!namn1 || !namn2) {
    return res.status(400).send("Båda namn1 och namn2 krävs");
  }

  const charToFilename = {
    'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E',
    'F': 'F', 'G': 'G', 'H': 'H', 'I': 'I', 'J': 'J',
    'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N', 'O': 'O',
    'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T',
    'U': 'U', 'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y',
    'Z': 'Z', 'Å': 'AA', 'Ä': 'AE', 'Ö': 'OE', '&': '&'
  };

  const spacing = 5;
  const margin = 30;
  const maxHeight = 170;

  try {
    const imageBaseUrl = `https://${req.headers.host}/images`;

    // Ladda bakgrund
    const background = await loadImage(`${imageBaseUrl}/background.png`);
    const canvas = createCanvas(background.width, background.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(background, 0, 0);

    // Ladda bokstavsbilder för båda rader
    const loadLine = async (line) => {
      const chars = [];
      for (let char of line) {
        const upperChar = char.toUpperCase();
        if (char === ' ') {
          chars.push(null); // hantera mellanslag separat
          continue;
        }
        const fileKey = charToFilename[upperChar];
        if (!fileKey) throw new Error(`Okänt tecken: ${char}`);
        const img = await loadImage(`${imageBaseUrl}/${fileKey}.png`);
        chars.push(img);
      }
      return chars;
    };

    const line1Images = await loadLine(namn1);
    const line2Images = await loadLine(namn2);
    const likesItImg = await loadImage(`${imageBaseUrl}/likes-it.png`);

    const scaleLine = (lineImages, targetHeight) => {
      return lineImages.map(img => {
        if (!img) return null;
        const scale = targetHeight / img.height;
        return {
          img,
          width: img.width * scale,
          height: targetHeight
        };
      });
    };

    const getLineWidth = (scaledLine) =>
      scaledLine.reduce((sum, item) => sum + (item ? item.width : maxHeight / 4) + spacing, -spacing);

    // Dynamisk skalning baserat på längsta raden
    const testScales = [170, 160, 150, 140, 130, 120, 110, 100];
    let finalHeight = maxHeight;
    let scaled1, scaled2, line1Width, line2Width;

    for (let h of testScales) {
      const temp1 = scaleLine(line1Images, h);
      const temp2 = scaleLine(line2Images, h);
      const w1 = getLineWidth(temp1);
      const w2 = getLineWidth(temp2);
      if (Math.max(w1, w2) + margin * 2 <= canvas.width) {
        finalHeight = h;
        scaled1 = temp1;
        scaled2 = temp2;
        line1Width = w1;
        line2Width = w2;
        break;
      }
    }

    if (!scaled1 || !scaled2) {
      throw new Error("Namnet är för långt för att rymmas");
    }

    const yStart = 115;
    const lineSpacing = finalHeight * 1.2;

    const drawLine = (scaledLine, y) => {
      let x = (canvas.width - getLineWidth(scaledLine)) / 2;
      for (let item of scaledLine) {
        if (!item) {
          x += finalHeight / 4 + spacing; // space width
          continue;
        }
        ctx.drawImage(item.img, x, y, item.width, item.height);
        x += item.width + spacing;
      }
    };

    drawLine(scaled1, yStart);
    drawLine(scaled2, yStart + lineSpacing);

    // Rita likes-it.png
    const scale = finalHeight / likesItImg.height;
    const likesItWidth = likesItImg.width * scale;
    const likesItX = (canvas.width - likesItWidth) / 2;
    ctx.drawImage(
      likesItImg,
      likesItX,
      yStart + lineSpacing * 2,
      likesItWidth,
      finalHeight
    );

    // Skicka PNG
    res.setHeader('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);
  } catch (err) {
    console.error("💥 API-fel:", err);
    res.status(500).send("Fel vid bildgenerering");
  }
}
