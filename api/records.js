import { list } from '@vercel/blob';

export default async function handler(req, res) {
  const pwd = (req.query && req.query.key) || '';
  if (!process.env.ADMIN_PASSWORD || pwd !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  try {
    const { blobs } = await list({ prefix: 'records/', limit: 500 });
    blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    const items = await Promise.all(blobs.slice(0, 200).map(async (b) => {
      try { const r = await fetch(b.url); return await r.json(); } catch (e) { return null; }
    }));
    return res.status(200).json({ records: items.filter(Boolean) });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
