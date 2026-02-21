import express from 'express';
import { createServer as createViteServer } from 'vite';
import admin from 'firebase-admin';
import cors from 'cors';

// Initialize Firebase Admin
try {
    if (!admin.apps.length) {
        // Check for service account in env var
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
            : undefined;

        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: "https://rwafantasy-default-rtdb.europe-west1.firebasedatabase.app/"
            });
            console.log("✅ Firebase Admin initialized with Service Account");
        } else {
            // Fallback: Try default credentials (might work in some cloud environments)
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                databaseURL: "https://rwafantasy-default-rtdb.europe-west1.firebasedatabase.app/"
            });
            console.log("⚠️ Firebase Admin initialized with Default Credentials (might fail without permissions)");
        }
    }
} catch (error) {
    console.error("❌ Firebase Admin Initialization Error:", error);
}

const db = admin.database();
const MATCHES_COLLECTION = 'rwafantasy/matches';
const PLAYERS_COLLECTION = 'rwafantasy/players';

async function startServer() {
    const app = express();
    const PORT = 3000;

    app.use(cors());
    app.use(express.json());

    // --- API Routes ---

    // Endpoint to get live player points calculated from matches
    app.get('/api/live-points', async (req, res) => {
        try {
            // Fetch Matches
            const matchesRef = db.ref(MATCHES_COLLECTION);
            const matchesSnapshot = await matchesRef.once('value');
            const matches = matchesSnapshot.val() || {};
            console.log(`Found ${Object.keys(matches).length} entries in matches collection.`);

            // Fetch Players
            const playersRef = db.ref(PLAYERS_COLLECTION);
            const playersSnapshot = await playersRef.once('value');
            const playersData = playersSnapshot.val() || {};

            // Convert players map to array
            const players: any[] = Object.values(playersData);

            const results = players.map(p => {
                let points = 0;

                Object.keys(matches).forEach(matchKey => {
                    const match = matches[matchKey];
                    if (!match || !match.players) return;

                    // The structure is rwafantasy/matches/[MATCH_ID]/players/[User Key]
                    // User Key often looks like "1421734370 (burgerfan142)" or simply "1421734370"
                    // We need to find the entry where user ID matches OR username matches

                    let matchPlayerKey = Object.keys(match.players).find(key => {
                        const playerStats = match.players[key];
                        // 1. Check if the key itself contains the username (case insensitive)
                        if (key.toLowerCase().includes(p.name.toLowerCase())) return true;

                        // 2. Check if the data inside has a matching 'username' property
                        if (playerStats?.username?.toLowerCase() === p.name.toLowerCase()) return true;

                        return false;
                    });

                    if (matchPlayerKey) {
                        const stats = match.players[matchPlayerKey];
                        const team = stats.team;

                        // Individual Stats
                        points += ((stats.goals || 0) * 2);
                        points += ((stats.assists || 0) * 1);
                        if (stats.mvp) points += 4;
                        // Saves usually for GK, but we count them if present
                        if (p.position === 'GK') {
                            points += ((stats.saves || 0) * 1);
                        }

                        // Team Stats (Require Summary)
                        if (match.summary) {
                            const isWinner = match.summary.winner === team;
                            const isLoser = match.summary.winner && match.summary.winner !== team && match.summary.winner !== 'Draw';

                            if (isWinner) points += 4;
                            if (isLoser) points -= 2;

                            // Defender/GK Clean Sheet
                            if (p.position === 'CD' || p.position === 'GK') {
                                // Determine opponent score
                                const team1 = match.summary.score?.team1Name;
                                const team2 = match.summary.score?.team2Name;
                                let opponentScore = 100; // Default high

                                if (team === team1) {
                                    opponentScore = match.summary.score?.team2Score || 0;
                                } else if (team === team2) {
                                    opponentScore = match.summary.score?.team1Score || 0;
                                }

                                if (opponentScore < 12) { // 12 is arbitrary threshold from earlier code, keeping it
                                    points += 6;
                                }
                            }
                        }
                    }
                });

                return { ...p, points: points > 0 ? points : 0 };
            });

            res.json(results);

        } catch (error: any) {
            console.error("Error fetching live points:", error);
            res.status(500).json({ error: error.message });
        }
    });

    // Endpoint to update player points in the database based on matches
    app.post('/api/update-points', async (req, res) => {
        try {
            console.log("Starting points update...");
            // Fetch Matches
            const matchesRef = db.ref(MATCHES_COLLECTION);
            const matchesSnapshot = await matchesRef.once('value');
            const matches = matchesSnapshot.val() || {};

            // Fetch Players
            const playersRef = db.ref(PLAYERS_COLLECTION);
            const playersSnapshot = await playersRef.once('value');
            const playersData = playersSnapshot.val() || {};

            // Convert players map to array
            const players: any[] = Object.values(playersData);
            const updates: Record<string, any> = {};
            let updatedCount = 0;

            players.forEach(p => {
                let points = 0;

                Object.keys(matches).forEach(matchKey => {
                    const match = matches[matchKey];
                    if (!match || !match.players) return;

                    // Match matching logic (duplicate of above)
                    let matchPlayerKey = Object.keys(match.players).find(key => {
                        const playerStats = match.players[key];
                        // 1. Check if the key itself contains the username (case insensitive)
                        if (key.toLowerCase().includes(p.name.toLowerCase())) return true;

                        // 2. Check if the data inside has a matching 'username' property
                        if (playerStats?.username?.toLowerCase() === p.name.toLowerCase()) return true;

                        return false;
                    });

                    if (matchPlayerKey) {
                        const stats = match.players[matchPlayerKey];
                        const team = stats.team;

                        // Individual Stats
                        points += ((stats.goals || 0) * 2);
                        points += ((stats.assists || 0) * 1);
                        if (stats.mvp) points += 4;
                        if (p.position === 'GK') {
                            points += ((stats.saves || 0) * 1);
                        }

                        // Team Stats (Require Summary)
                        if (match.summary) {
                            const isWinner = match.summary.winner === team;
                            const isLoser = match.summary.winner && match.summary.winner !== team && match.summary.winner !== 'Draw';

                            if (isWinner) points += 4;
                            if (isLoser) points -= 2;

                            // Defender/GK Clean Sheet
                            if (p.position === 'CD' || p.position === 'GK') {
                                const team1 = match.summary.score?.team1Name;
                                const team2 = match.summary.score?.team2Name;
                                let opponentScore = 100;

                                if (team === team1) {
                                    opponentScore = match.summary.score?.team2Score || 0;
                                } else if (team === team2) {
                                    opponentScore = match.summary.score?.team1Score || 0;
                                }

                                if (opponentScore < 12) {
                                    points += 6;
                                }
                            }
                        }
                    }
                });

                const playerKey = Object.keys(playersData).find(key => playersData[key].id === p.id);
                if (playerKey) {
                     updates[`${PLAYERS_COLLECTION}/${playerKey}/points`] = points > 0 ? points : 0;
                     updatedCount++;
                }
            });

            if (Object.keys(updates).length > 0) {
                await db.ref().update(updates);
                console.log(`Updated points for ${updatedCount} players.`);
                res.json({ success: true, message: `Updated points for ${updatedCount} players.` });
            } else {
                 console.log("No updates needed.");
                 res.json({ success: true, message: "No updates needed." });
            }

        } catch (error: any) {
            console.error("Error updating points:", error);
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/roblox-usernames', async (req, res) => {
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
    });

    // Health check
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', adminInitialized: !!admin.apps.length });
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();

