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
                    // Filter for keys starting with "match" as requested
                    if (!matchKey.startsWith('match')) return;

                    const match = matches[matchKey];
                    if (!match || !match.players) return;

                    // Find player in match stats
                    const matchPlayerKey = Object.keys(match.players).find(key =>
                        match.players[key]?.username?.toLowerCase() === p.name.toLowerCase()
                    );

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
                                const opponentScore = team === match.summary.score?.team1Name
                                    ? match.summary.score?.team2Score
                                    : match.summary.score?.team1Score;

                                if (opponentScore !== undefined && opponentScore < 12) {
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
                // Also accumulate stats if needed, but user asked for points conversion
                // We'll recalculate the points from scratch based on matches

                Object.keys(matches).forEach(matchKey => {
                    // Filter for keys starting with "match" as requested
                    if (!matchKey.startsWith('match')) return;

                    const match = matches[matchKey];
                    if (!match || !match.players) return;

                    // Find player in match stats
                    const matchPlayerKey = Object.keys(match.players).find(key =>
                        match.players[key]?.username?.toLowerCase() === p.name.toLowerCase()
                    );

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
                                const opponentScore = team === match.summary.score?.team1Name
                                    ? match.summary.score?.team2Score
                                    : match.summary.score?.team1Score;

                                if (opponentScore !== undefined && opponentScore < 12) {
                                    points += 6;
                                }
                            }
                        }
                    }
                });

                // Prepare update for this player
                // We need to find the key in the playersData object that corresponds to this player
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
    } else {
        // In production, serve static files (if built)
        // app.use(express.static('dist'));
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
