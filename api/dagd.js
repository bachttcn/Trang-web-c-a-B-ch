export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Chỉ hỗ trợ phương thức POST." });
  }

  try {
    const body = req.body || {};
    const rawUrl = String(body.url || "").trim();
    const custom = String(body.custom || "").trim();

    if (!rawUrl) {
      return res.status(400).json({ ok: false, error: "Thiếu link cần rút gọn." });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      return res.status(400).json({ ok: false, error: "Link không hợp lệ. Ví dụ đúng: https://toanbach.vercel.app/" });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return res.status(400).json({ ok: false, error: "Chỉ nhận link bắt đầu bằng http:// hoặc https://." });
    }

    if (custom && !/^[A-Za-z0-9_-]{3,40}$/.test(custom)) {
      return res.status(400).json({
        ok: false,
        error: "Tên tùy chỉnh chỉ dùng chữ không dấu, số, dấu gạch ngang hoặc gạch dưới; dài 3–40 ký tự."
      });
    }

    const params = new URLSearchParams();
    params.set("url", parsedUrl.toString());
    if (custom) params.set("shorturl", custom);

    const candidateEndpoints = [
      `https://da.gd/?${params.toString()}`,
      `https://da.gd/s?${params.toString()}`
    ];

    let lastText = "";
    let shortUrl = "";

    for (const endpoint of candidateEndpoints) {
      const response = await fetch(endpoint, {
        headers: {
          "Accept": "text/plain, */*",
          "User-Agent": "toanbach-vercel-dagd-shortener/1.0"
        }
      });

      const text = (await response.text()).trim();
      lastText = text;

      if (response.ok && /^https?:\/\/da\.gd\/[A-Za-z0-9_-]+$/i.test(text)) {
        shortUrl = text.replace(/^http:\/\//i, "https://");
        break;
      }
    }

    if (!shortUrl) {
      const message = lastText && lastText.length < 180
        ? lastText
        : "da.gd chưa tạo được link. Có thể đuôi tùy chỉnh đã bị dùng hoặc link bị từ chối.";
      return res.status(502).json({ ok: false, error: message });
    }

    return res.status(200).json({ ok: true, shortUrl });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error?.message || "Lỗi máy chủ khi gọi da.gd." });
  }
}
