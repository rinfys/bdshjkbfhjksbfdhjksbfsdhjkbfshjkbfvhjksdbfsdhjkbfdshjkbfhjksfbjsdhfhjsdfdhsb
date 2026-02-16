import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, set, remove, onValue, update, get } from "firebase/database";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import type { Player, TeamSlot, UserSettings, UserData } from "./types";
import { LOGOS } from "./constants";

const firebaseConfig = {
    apiKey: "AIzaSyD5I-udG4s1pRRdFWLun6ThC3h9xLlattQ",
    authDomain: "rwafantasy.firebaseapp.com",
    projectId: "rwafantasy",
    storageBucket: "rwafantasy.firebasestorage.app",
    messagingSenderId: "835153782127",
    appId: "1:835153782127:web:4e9419866cd0b38ee6749a",
    measurementId: "G-LHEZJXEGYK",
    databaseURL: "https://rwafantasy-default-rtdb.europe-west1.firebasedatabase.app/",
};

let app;
let db: ReturnType<typeof getDatabase> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let isFirebaseAvailable = false;

// Versioned collection to allow "wiping" accounts by changing this string
// UPDATED: Nested under 'rwafantasy' root as requested
const USERS_COLLECTION = 'rwafantasy/users';
const PLAYERS_COLLECTION = 'rwafantasy/players';

// --- INITIAL DATABASE SEED DATA ---
// This serves as the "Master List" only for initializing the DB.
// Random decimal prices applied (0-9).
export const INITIAL_DB_DATA: Player[] = [
    // AQUAPOLIS WC (Sky)
    { id: 1, name: "LostEzyxn", teamColor: "sky", position: "RW", price: 16.8, points: 0, avgRating: 0, imageUrl: LOGOS.aquapolis },
    { id: 19, name: "zvafkez", teamColor: "sky", position: "HS", price: 12.3, points: 0, avgRating: 0, imageUrl: LOGOS.aquapolis },
    { id: 20, name: "ysIswag", teamColor: "sky", position: "LW", price: 16.4, points: 0, avgRating: 0, imageUrl: LOGOS.aquapolis },
    { id: 43, name: "ethansmemory", teamColor: "sky", position: "HS", price: 12.1, points: 0, avgRating: 0, imageUrl: LOGOS.aquapolis },
    { id: 44, name: "4003s", teamColor: "sky", position: "RW", price: 11.9, points: 0, avgRating: 0, imageUrl: LOGOS.aquapolis },
    { id: 45, name: "Saintmoise", teamColor: "sky", position: "LW", price: 12.4, points: 0, avgRating: 0, imageUrl: LOGOS.aquapolis },
    { id: 46, name: "GREENBEAN_4S0", teamColor: "sky", position: "LW", price: 11.2, points: 0, avgRating: 0, imageUrl: LOGOS.aquapolis },
    { id: 47, name: "hurt3184", teamColor: "sky", position: "CD", price: 11.7, points: 0, avgRating: 0, imageUrl: LOGOS.aquapolis },

    // SIREN CITY WC (Purple)
    { id: 2, name: "mateiryan", teamColor: "purple", position: "HS", price: 19.2, points: 0, avgRating: 0, imageUrl: LOGOS.siren },
    { id: 16, name: "Kirkifled", teamColor: "purple", position: "HS", price: 17.8, points: 0, avgRating: 0, imageUrl: LOGOS.siren },
    { id: 29, name: "410xqlrz", teamColor: "purple", position: "RW", price: 10.6, points: 0, avgRating: 0, imageUrl: LOGOS.siren },
    { id: 36, name: "vzlyria", teamColor: "purple", position: "RW", price: 15.3, points: 0, avgRating: 0, imageUrl: LOGOS.siren },
    { id: 37, name: "Subl1t", teamColor: "purple", position: "LW", price: 10.1, points: 0, avgRating: 0, imageUrl: LOGOS.siren },
    { id: 38, name: "SiriSxys", teamColor: "purple", position: "HS", price: 5.7, points: 0, avgRating: 0, imageUrl: LOGOS.siren },
    { id: 39, name: "stzrridge", teamColor: "purple", position: "RW", price: 10.9, points: 0, avgRating: 0, imageUrl: LOGOS.siren },
    { id: 40, name: "burgerfan142", teamColor: "purple", position: "LW", price: 16.1, points: 0, avgRating: 0, imageUrl: LOGOS.siren },
    { id: 41, name: "Chramephobia", teamColor: "purple", position: "HS", price: 9.4, points: 0, avgRating: 0, imageUrl: LOGOS.siren },
    { id: 42, name: "smurfxed", teamColor: "purple", position: "CD", price: 9.8, points: 0, avgRating: 0, imageUrl: LOGOS.siren },
    { id: 62, name: "hooomantan2 ", teamColor: "purple", position: "HS", price: 10.3, points: 0, avgRating: 0, imageUrl: LOGOS.siren },

    // ATLANTIS WC (Yellow)
    { id: 31, name: "simswapd", teamColor: "yellow", position: "GK", price: 9.6, points: 0, avgRating: 0, imageUrl: LOGOS.atlantis },
    { id: 32, name: "paralamogram", teamColor: "yellow", position: "RW", price: 16.2, points: 0, avgRating: 0, imageUrl: LOGOS.atlantis },
    { id: 33, name: "thisinvasion", teamColor: "yellow", position: "RW", price: 19.1, points: 0, avgRating: 0, imageUrl: LOGOS.atlantis },
    { id: 34, name: "jzidenn", teamColor: "yellow", position: "LW", price: 17.4, points: 0, avgRating: 0, imageUrl: LOGOS.atlantis },
    { id: 35, name: "awfull_2", teamColor: "yellow", position: "GK", price: 16.3, points: 0, avgRating: 0, imageUrl: LOGOS.atlantis },
    { id: 60, name: "poncuil", teamColor: "yellow", position: "HS", price: 15.8, points: 0, avgRating: 0, imageUrl: LOGOS.atlantis },
    { id: 61, name: "payystub", teamColor: "yellow", position: "CD", price: 15.9, points: 0, avgRating: 0, imageUrl: LOGOS.atlantis },
    { id: 63, name: "mayendaa", teamColor: "yellow", position: "HS", price: 10.2, points: 0, avgRating: 0, imageUrl: LOGOS.atlantis },
    { id: 64, name: "cuethemoon", teamColor: "yellow", position: "LW", price: 13.5, points: 0, avgRating: 0, imageUrl: LOGOS.atlantis },
    { id: 65, name: "NOON_NOONS", teamColor: "yellow", position: "CD", price: 10.8, points: 0, avgRating: 0, imageUrl: LOGOS.atlantis },
    { id: 66, name: "Nourbirb", teamColor: "yellow", position: "CD", price: 9.3, points: 0, avgRating: 0, imageUrl: LOGOS.atlantis },

    // THAMES VALLEY HAMMERHEADS WC (Claret)
    { id: 22, name: "Infinite_10071", teamColor: "claret", position: "HS", price: 11.4, points: 0, avgRating: 0, imageUrl: LOGOS.hammerheads },
    { id: 23, name: "kyogre124345", teamColor: "claret", position: "LW", price: 9.7, points: 0, avgRating: 0, imageUrl: LOGOS.hammerheads },
    { id: 24, name: "cristianak_yt", teamColor: "claret", position: "RW", price: 9.2, points: 0, avgRating: 0, imageUrl: LOGOS.hammerheads },
    { id: 25, name: "Heyguysitsme72928", teamColor: "claret", position: "LW", price: 9.9, points: 0, avgRating: 0, imageUrl: LOGOS.hammerheads },
    { id: 26, name: "phantomlayer67", teamColor: "claret", position: "RW", price: 9.1, points: 0, avgRating: 0, imageUrl: LOGOS.hammerheads },
    { id: 27, name: "Gamer_Max3333", teamColor: "claret", position: "HS", price: 5.3, points: 0, avgRating: 0, imageUrl: LOGOS.hammerheads },
    { id: 28, name: "ilxvinglxfee", teamColor: "claret", position: "RW", price: 9.6, points: 0, avgRating: 0, imageUrl: LOGOS.hammerheads },

    // LST JAMES WC (Red)
    { id: 18, name: "RaineJol", teamColor: "red", position: "LW", price: 5.4, points: 0, avgRating: 0, imageUrl: LOGOS.lst },
    { id: 51, name: "g_rxgson", teamColor: "red", position: "HS", price: 9.8, points: 0, avgRating: 0, imageUrl: LOGOS.lst },
    { id: 52, name: "Willduzza1", teamColor: "red", position: "RW", price: 5.2, points: 0, avgRating: 0, imageUrl: LOGOS.lst },
    { id: 53, name: "afkssammy", teamColor: "red", position: "LW", price: 5.1, points: 0, avgRating: 0, imageUrl: LOGOS.lst },
    { id: 54, name: "XeoJol", teamColor: "red", position: "CD", price: 4.9, points: 0, avgRating: 0, imageUrl: LOGOS.lst },
    { id: 55, name: "levi072009", teamColor: "red", position: "RW", price: 4.8, points: 0, avgRating: 0, imageUrl: LOGOS.lst },
    { id: 56, name: "smithyboypq", teamColor: "red", position: "LW", price: 12.2, points: 0, avgRating: 0, imageUrl: LOGOS.lst },
    { id: 57, name: "Ninjatdog2011", teamColor: "red", position: "HS", price: 9.3, points: 0, avgRating: 0, imageUrl: LOGOS.lst },
    { id: 58, name: "SpeyFVZ", teamColor: "red", position: "CD", price: 12.5, points: 0, avgRating: 0, imageUrl: LOGOS.lst },
    { id: 59, name: "jp_webb7", teamColor: "red", position: "CD", price: 11.8, points: 0, avgRating: 0, imageUrl: LOGOS.lst },
    { id: 90, name: "TreepTreeps", teamColor: "green", position: "CD", price: 10.1, points: 0, avgRating: 0, imageUrl: LOGOS.kraken },

    // KRAKEN CREW WC (Green)
    { id: 3, name: "Frknky_12", teamColor: "green", position: "LW", price: 12.1, points: 0, avgRating: 0, imageUrl: LOGOS.kraken },
    { id: 4, name: "ax011xz", teamColor: "green", position: "CD", price: 9.4, points: 0, avgRating: 0, imageUrl: LOGOS.kraken },
    { id: 5, name: "Fruktsallado", teamColor: "green", position: "RW", price: 5.5, points: 0, avgRating: 0, imageUrl: LOGOS.kraken },
    { id: 6, name: "d3siredsouls", teamColor: "green", position: "HS", price: 9.7, points: 0, avgRating: 0, imageUrl: LOGOS.kraken },
    { id: 7, name: "artiq", teamColor: "green", position: "LW", price: 12.3, points: 0, avgRating: 0, imageUrl: LOGOS.kraken },
    { id: 8, name: "realzvn", teamColor: "green", position: "RW", price: 9.2, points: 0, avgRating: 0, imageUrl: LOGOS.kraken },
    { id: 9, name: "Mecoolboy123457", teamColor: "green", position: "HS", price: 9.9, points: 0, avgRating: 0, imageUrl: LOGOS.kraken },
    { id: 10, name: "noppiex", teamColor: "green", position: "CD", price: 11.6, points: 0, avgRating: 0, imageUrl: LOGOS.kraken },
    { id: 11, name: "jankostankovic10", teamColor: "green", position: "RW", price: 9.1, points: 0, avgRating: 0, imageUrl: LOGOS.kraken },
    { id: 12, name: "Fanxzxs", teamColor: "green", position: "CD", price: 9.5, points: 0, avgRating: 0, imageUrl: LOGOS.kraken },
    { id: 13, name: "17arxx", teamColor: "green", position: "GK", price: 11.9, points: 0, avgRating: 0, imageUrl: LOGOS.kraken },
    { id: 14, name: "dxrkzzq", teamColor: "green", position: "LW", price: 4.7, points: 0, avgRating: 0, imageUrl: LOGOS.kraken },
    { id: 30, name: "zanitoni123", teamColor: "green", position: "HS", price: 15.7, points: 0, avgRating: 0, imageUrl: LOGOS.kraken },

    // NEPTUNUS WC (Blue)
    { id: 15, name: "bromosomes", teamColor: "blue", position: "RW", price: 16.6, points: 0, avgRating: 0, imageUrl: LOGOS.neptunus },
    { id: 17, name: "datidati888", teamColor: "blue", position: "HS", price: 4.4, points: 0, avgRating: 0, imageUrl: LOGOS.neptunus },
    { id: 21, name: "lolrayansuper", teamColor: "blue", position: "CD", price: 11.8, points: 0, avgRating: 0, imageUrl: LOGOS.neptunus },
    { id: 48, name: "ElProLoayecrReboot", teamColor: "blue", position: "CD", price: 12.5, points: 0, avgRating: 0, imageUrl: LOGOS.neptunus },
    { id: 50, name: "gigagiga888", teamColor: "blue", position: "LW", price: 12.1, points: 0, avgRating: 0, imageUrl: LOGOS.neptunus },
];

try {
    // Check if any apps are already initialized
    if (getApps().length > 0) {
        app = getApp();
    } else {
        app = initializeApp(firebaseConfig);
    }

    // App Check removed to fix build errors in this environment

    db = getDatabase(app);
    auth = getAuth(app);
    isFirebaseAvailable = true;
    console.log("✅ Firebase initialized successfully");
} catch (error: any) {
    console.error("❌ Firebase Initialization Error:", error?.message || error);
    isFirebaseAvailable = false;
}

// --- AUTH FUNCTIONS ---
const provider = new GoogleAuthProvider();

export const loginUser = async () => {
    if(!auth) {
        alert("Authentication service is unavailable. Please check console for errors.");
        return;
    }
    return signInWithPopup(auth, provider);
}

export const logoutUser = async () => {
    if(!auth) return;
    return signOut(auth);
}

export const subscribeToAuth = (callback: (user: User | null) => void) => {
    if(!auth) {
        console.warn("Auth not initialized. Defaulting to logged out state.");
        setTimeout(() => callback(null), 0);
        return () => {};
    }
    return onAuthStateChanged(auth, callback);
}

// --- DATA FUNCTIONS ---

const playerPath = (id: number) => `${PLAYERS_COLLECTION}/player_${id}`;

// HELPER: Check Username Uniqueness
export const checkUsernameTaken = async (username: string): Promise<boolean> => {
    if (!isFirebaseAvailable || !db) return false;

    try {
        const snapshot = await get(ref(db, USERS_COLLECTION));
        if (!snapshot.exists()) return false;

        const users = snapshot.val();
        const lowerUsername = username.toLowerCase();

        for (const uid in users) {
            const userSettings = users[uid]?.settings;
            if (userSettings?.username?.toLowerCase() === lowerUsername) {
                return true;
            }
        }
        return false;
    } catch (e: any) {
        // PERMISSION ERROR HANDLING
        // We do NOT suppress this anymore to ensure developer sees why DB is empty if rules are strict.
        console.error("Error checking username (possibly permission denied):", e);
        // We assume false to not block UI, but the save will likely fail too if permissions are off.
        return false;
    }
}

// GLOBAL MARKET PLAYERS
export const subscribeToPlayers = (callback: (players: Player[]) => void) => {
    if (!isFirebaseAvailable || !db) {
        console.warn("Firebase not available during subscribe, returning mock data.");
        setTimeout(() => callback(INITIAL_DB_DATA), 0);
        return () => {};
    }

    const playersRef = ref(db, PLAYERS_COLLECTION);

    return onValue(
        playersRef,
        (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                // Return empty array so consumer can decide to seed
                return callback([]);
            }

            const list: Player[] = Object.entries<any>(data).map(([key, value]) => {
                const fromKey =
                    typeof key === "string" && key.startsWith("player_")
                        ? Number(key.replace("player_", ""))
                        : undefined;

                const id = Number(value?.id ?? fromKey);

                return {
                    ...value,
                    id: Number.isFinite(id) ? id : 0,
                } as Player;
            });

            callback(list);
        },
        (error) => {
            console.error("Database Read Error (Players):", error);
            // On error, we fallback to seed, but note that it's an error state
            callback(INITIAL_DB_DATA);
        }
    );
};

// USER SPECIFIC DATA
export const subscribeToUserTeam = (userId: string, callback: (data: any) => void) => {
    if(!db) {
        console.warn("DB not initialized, returning null for user team");
        setTimeout(() => callback(null), 0);
        return () => {};
    }
    const userRef = ref(db, `${USERS_COLLECTION}/${userId}`);
    return onValue(userRef, (snapshot) => {
        const val = snapshot.val();
        callback(val);
    }, (error) => {
        console.error("User Sync Error:", error);
        callback(null);
    });
}

// Generic save function
export const saveUserTeam = (userId: string, data: {
    slots?: TeamSlot[],
    teamName?: string,
    logoUrl?: string,
    settings?: UserSettings,
    isSquadComplete?: boolean,
    formation?: string,
    isSubmitted?: boolean,
    lastGameweekSaved?: number
}) => {
    if(!db) return;
    const userRef = ref(db, `${USERS_COLLECTION}/${userId}`);

    // Explicitly return the promise so we can debug it
    return update(userRef, data).then(() => {
        console.log(`✅ Data saved successfully for user ${userId}`);
    }).catch(err => {
        console.error("❌ Save failed (Check Firebase Rules):", err);
        alert("Database Save Failed! Check console for permission errors.");
    });
}

// LEADERBOARD DATA
export const fetchAllUsers = async (): Promise<UserData[]> => {
    if (!isFirebaseAvailable || !db) return [];
    try {
        const snapshot = await get(ref(db, USERS_COLLECTION));
        if (!snapshot.exists()) return [];
        const usersObj = snapshot.val();
        return Object.keys(usersObj).map(uid => ({
            uid,
            ...usersObj[uid]
        }));
    } catch (e: any) {
        console.error("Error fetching leaderboard:", e);
        return [];
    }
};


// ADMIN FUNCTIONS
export const updatePlayerInDb = (player: Player) => {
    if (!isFirebaseAvailable || !db) {
        alert("Firebase not connected. Check console.");
        return Promise.reject(new Error("Firebase not connected"));
    }
    return set(ref(db, playerPath(player.id)), player)
        .then(() => console.log("Player updated in DB"))
        .catch(err => {
            console.error("Player Update Failed:", err);
            alert("Failed to update player. Check permissions.");
        });
};

export const addPlayerToDb = (player: Player) => updatePlayerInDb(player);

export const deletePlayerFromDb = (id: number) => {
    if (!isFirebaseAvailable || !db) {
        return Promise.reject(new Error("Firebase not connected"));
    }
    return remove(ref(db, playerPath(id)))
        .catch(err => console.error("Delete failed:", err));
};

export const seedDatabase = async (initialPlayers: Player[], silent = false) => {
    if (!isFirebaseAvailable || !db) {
        if (!silent) alert("Firebase not connected.");
        return;
    }

    console.log("Attempting to seed database...");

    try {
        await Promise.all(initialPlayers.map((p) => addPlayerToDb(p)));
        console.log("✅ Database seeded successfully!");
        if (!silent) alert("Database seeded successfully!");
    } catch (e: any) {
        console.error("❌ Seeding failed:", e);
        if (!silent) alert("Seeding failed: " + e.message);
    }
};

export { db, auth };