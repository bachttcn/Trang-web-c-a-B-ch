import { redis } from './_utils.js';

export default async function handler(req, res) {
  try {
    const code = String(req.query.code || '').trim();
    if (!code) return res.status(400).json({ ok: false, error: 'Thiếu mã link.' });

    const data = await redis.get(`short:${code}`);
    if (!data) return res.status(404).json({ ok: false, error: 'Không tìm thấy link.' });

    const clicks = Number(await redis.get(`clicks:${code}`) || 0);
    return res.status(200).json({ ok: true, code, originalUrl: data.url, createdAt: data.createdAt, clicks });
  } catch (error) {
    return res.status(500).json({ ok: false, error: 'Không đọc được thống kê.' });
  }
}
