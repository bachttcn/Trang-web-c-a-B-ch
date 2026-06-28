import { redis, getBaseUrl, makeCode, normalizeUrl, cleanAlias } from './_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Chỉ hỗ trợ phương thức POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const url = normalizeUrl(body.url);
    const alias = cleanAlias(body.alias);
    const baseUrl = getBaseUrl(req);

    let code = alias;
    if (code) {
      const existed = await redis.exists(`short:${code}`);
      if (existed) {
        return res.status(409).json({ ok: false, error: 'Tên tùy chỉnh này đã có người dùng rồi.' });
      }
    } else {
      const len = Number(process.env.SHORT_CODE_LENGTH || 5);
      for (let i = 0; i < 8; i++) {
        code = makeCode(Math.min(Math.max(len, 4), 12));
        const existed = await redis.exists(`short:${code}`);
        if (!existed) break;
        code = '';
      }
      if (!code) throw new Error('Không tạo được mã ngắn, vui lòng thử lại.');
    }

    const now = new Date().toISOString();
    await redis.set(`short:${code}`, {
      url,
      code,
      createdAt: now,
      clicks: 0
    });

    return res.status(200).json({
      ok: true,
      code,
      originalUrl: url,
      shortUrl: `${baseUrl}/go/${code}`
    });
  } catch (error) {
    return res.status(400).json({ ok: false, error: error.message || 'Có lỗi xảy ra.' });
  }
}
