import { Redis } from '@upstash/redis';
import crypto from 'crypto';

export const redis = Redis.fromEnv();
const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function getBaseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}

export function makeCode(length = 5) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[crypto.randomInt(0, ALPHABET.length)];
  }
  return code;
}

export function normalizeUrl(rawUrl) {
  let value = String(rawUrl || '').trim();
  if (!value) throw new Error('Vui lòng nhập liên kết cần rút gọn.');

  // Cho phép người dùng nhập toanbach.vercel.app thay vì https://toanbach.vercel.app
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;

  let parsed;
  try {
    parsed = new URL(value);
  } catch (_) {
    throw new Error('Liên kết không hợp lệ.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Chỉ hỗ trợ liên kết http hoặc https.');
  }

  const hostname = parsed.hostname.toLowerCase();
  const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0'];
  if (blockedHosts.includes(hostname) || hostname.endsWith('.local')) {
    throw new Error('Không hỗ trợ liên kết nội bộ hoặc localhost.');
  }

  return parsed.toString();
}

export function cleanAlias(alias) {
  const value = String(alias || '').trim();
  if (!value) return '';
  if (!/^[a-zA-Z0-9_-]{3,30}$/.test(value)) {
    throw new Error('Tên tùy chỉnh chỉ dùng chữ, số, dấu gạch ngang hoặc gạch dưới, dài 3–30 ký tự.');
  }
  const reserved = new Set(['link', 'go', 'bach', 'api', 'admin', 'index', 'assets']);
  if (reserved.has(value.toLowerCase())) {
    throw new Error('Tên tùy chỉnh này đang được hệ thống giữ lại, vui lòng chọn tên khác.');
  }
  return value;
}

export function htmlPage(title, message, link) {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const linkHtml = link ? `<p><a href="${escapeHtml(link)}">Quay về trang rút gọn link</a></p>` : '';
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle}</title><style>body{font-family:Arial,sans-serif;background:#f6f7fb;color:#111827;display:grid;place-items:center;min-height:100vh;margin:0}.box{background:white;max-width:520px;padding:28px;border-radius:18px;box-shadow:0 10px 30px #0001;text-align:center}a{color:#0f766e;font-weight:700}</style></head><body><div class="box"><h1>${safeTitle}</h1><p>${safeMessage}</p>${linkHtml}</div></body></html>`;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]));
}
