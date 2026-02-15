import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { userIds, size, format, isCircular } = req.query;

    if (!userIds) {
        return res.status(400).json({ error: "Missing userIds" });
    }

    try {
        const url = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userIds}&size=${size || '150x150'}&format=${format || 'Png'}&isCircular=${isCircular || 'true'}`;
        const r = await fetch(url);
        const data = await r.json();
        return res.status(r.status).json(data);
    } catch (e: any) {
        return res.status(500).json({ error: e?.message ?? "Unknown error" });
    }
}