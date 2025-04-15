import { createCanvas, loadImage } from 'canvas';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Endast POST är tillåtet' });
  }

  const { name1, name2 } = req.body;

  if (!name1 || !name2) {
    return res.status(400).json({ error: 'Båda namn krävs' });
  }

  try {
    // Här skapar vi canvas, lägger till bakgrund + bokstäver (samma logik som i din frontend)
    const canvas = createCanvas(1200, 630);
    const ctx = canvas.getContext('2d');

    const background = await loadImage('public/images/background.png');
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // TODO: Lägg till kod för att rendera name1, name2 och likes-it.png som du har i frontend

    const buffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);

  } catch (err) {
    console.error('Fel i API:', err);
    res.status(500).json({ error: 'Något gick fel vid genereringen' });
  }
}
