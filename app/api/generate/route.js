import { NextResponse } from 'next/server';
import { createCanvas, loadImage } from 'canvas';
import path from 'path';
import fs from 'fs';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const namn1 = searchParams.get('namn1') || '';
    const namn2 = searchParams.get('namn2') || '';

    if (!namn1 || !namn2) {
      return NextResponse.json({ error: 'Båda namn måste anges' }, { status: 400 });
    }

    const charToFilename = {
      'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E',
      'F': 'F', 'G': 'G', 'H': 'H', 'I': 'I', 'J': 'J',
      'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N', 'O': 'O',
      'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T',
      'U': 'U', 'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y',
      'Z': 'Z',
      'Å': 'AA', 'Ä': 'AE', 'Ö': 'OE',
      '&': '&', ' ': null // Vi hanterar mellanslag manuellt
    };

    const canvasWidth = 1200;
    const canvasHeight = 1600;
    const margin = 30;
    const spacing = 5;
    const maxCharHeight = 170;

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    const backgroundPath = path.resolve(process.cwd(), 'public/images/background.png');
    const background = await loadImage(backgroundPath);
    ctx.drawImage(background, 0, 0);

    const loadCharImages = async (text) => {
      const images = [];
      for (const char of text.toUpperCase()) {
        const filename = charToFilename[char];
        if (!filename) {
          // Space
          images.push(null);
          continue;
        }
        const charPath = path.resolve(process.cwd(), `public/images/${filename}.png`);
        const img = await loadImage(charPath);
        images.push(img);
      }
      return images;
    };

    const line1Imgs = await loadCharImages(namn1);
    const line2Imgs = await loadCharImages(namn2);
    const allImgs = [...line1Imgs, ...line2Imgs].filter(img => img);

    if (allImgs.length === 0) {
      return NextResponse.json({ error: 'Inga giltiga tecken' }, { status: 400 });
    }

    const scaleFactor = Math.min(
      (canvasWidth - 2 * margin - spacing * (line1Imgs.length - 1)) /
        line1Imgs.reduce((sum, img) => sum + (img ? img.width * (maxCharHeight / img.height) : 30), 0),
      1
    );

    const charHeight = maxCharHeight * scaleFactor;

    const drawLine = (images, y) => {
      const totalWidth = images.reduce((sum, img) => {
        if (!img) return sum + 30;
        const scale = charHeight / img.height;
        return sum + img.width * scale + spacing;
      }, -spacing);

      let x = (canvasWidth - totalWidth) / 2;

      for (const img of images) {
        if (!img) {
          x += 30; // Space
          continue;
        }
        const scale = charHeight / img.height;
        const width = img.width * scale;
        ctx.drawImage(img, x, y, width, charHeight);
        x += width + spacing;
      }
    };

    const yStart = 150;
    const lineSpacing = charHeight * 1.2;

    drawLine(line1Imgs, yStart);
    drawLine(line2Imgs, yStart + lineSpacing);

    const likesItPath = path.resolve(process.cwd(), 'public/images/likes-it.png');
    const likesIt = await loadImage(likesItPath);
    const likesItScale = charHeight / likesIt.height;
    const likesItWidth = likesIt.width * likesItScale;
    const likesItX = (canvasWidth - likesItWidth) / 2;
    const likesItY = yStart + lineSpacing * 2;
    ctx.drawImage(likesIt, likesItX, likesItY, likesItWidth, charHeight);

    const buffer = canvas.toBuffer('image/png');
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png'
      }
    });
  } catch (err) {
    console.error('SERVER FEL:', err);
    return NextResponse.json({ error: 'Intern server error', details: err.message }, { status: 500 });
  }
}
