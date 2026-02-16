import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") return res.status(405).send("Method not allowed");

    try {
        const r = await fetch("https://users.roblox.com/v1/usernames/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body),
        });

        const data = await r.json();
        return res.status(r.status).json(data);
    } catch (e: any) {
        return res.status(500).json({ error: e?.message ?? "Unknown error" });
    }
}