import { redis, getBaseUrl, htmlPage } from './_utils.js';

export default async function handler(req, res) {
  try {
    const code = String(req.query.code || '').trim();
    if (!code) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(404).send(htmlPage('Thiếu mã link', 'Không tìm thấy mã liên kết cần chuyển hướng.', `${getBaseUrl(req)}/link`));
    }

    const data = await redis.get(`short:${code}`);
    if (!data || !data.url) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(404).send(htmlPage('Link không tồn tại', 'Liên kết này chưa được tạo hoặc đã bị xóa.', `${getBaseUrl(req)}/link`));
    }

    await redis.incr(`clicks:${code}`);
    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(302, data.url);
  } catch (error) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(htmlPage('Lỗi chuyển hướng', 'Hệ thống chưa kết nối được cơ sở dữ liệu hoặc đang gặp lỗi.', `${getBaseUrl(req)}/link`));
  }
}
