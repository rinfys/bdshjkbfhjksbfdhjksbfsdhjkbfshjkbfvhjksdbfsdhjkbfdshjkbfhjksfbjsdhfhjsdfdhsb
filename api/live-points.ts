import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

// Initialize Firebase Admin
// Check if already initialized to prevent "App already exists" error
if (!admin.apps.length) {
    try {
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
            // Fallback: Try default credentials
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                databaseURL: "https://rwafantasy-default-rtdb.europe-west1.firebasedatabase.app/"
            });
            console.log("⚠️ Firebase Admin initialized with Default Credentials");
        }
    } catch (error) {
        console.error("❌ Firebase Admin Initialization Error:", error);
    }
}

const db = admin.database();
const MATCHES_COLLECTION = 'rwafantasy/matches';
const PLAYERS_COLLECTION = 'rwafantasy/players';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
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

        const results = players.map(p => {
            let points = 0;

            Object.values(matches).forEach((match: any) => {
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

        res.status(200).json(results);

    } catch (error: any) {
        console.error("Error fetching live points:", error);
        res.status(500).json({ error: error.message });
    }
}