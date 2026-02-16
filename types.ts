
export interface Player {
  id: number;
  name: string;
  teamColor: 'red' | 'blue' | 'sky' | 'green' | 'yellow' | 'purple' | 'claret';
  points: number;
  position: 'GK' | 'CD' | 'LW' | 'RW' | 'HS';
  imageUrl?: string;
  price: number; // e.g., 10.5 (million)
  avgRating: number; // e.g., 7.8
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  warnings?: boolean;
}

export interface TeamSlot {
  index: number;
  position: 'GK' | 'CD' | 'LW' | 'RW' | 'HS' | 'C' | 'OUTFIELD'; // OUTFIELD allows flexibility
  type: 'starter' | 'bench';
  player: Player | null;
}

export interface UserSettings {
  username: string;
  usernameLastChanged: number; // timestamp
  nickname: string;
  theme: 'dark' | 'light';
  currency: 'GBP' | 'USD' | 'EUR';
  totalHistoryPoints?: number; // Previous gameweeks total
  profilePictureUrl?: string;
  tutorialCompleted?: boolean;
}

export interface UserData {
  uid?: string;
  settings: UserSettings;
  teamName: string;
  logoUrl: string;
  slots: TeamSlot[];
  isSquadComplete?: boolean; // Validation flag
  formation?: string; // e.g. "1-2-1", "0-4-0"
  isSubmitted?: boolean;
  lastGameweekSaved?: number;
}

export interface League {
  name: string;
  rank: string;
  trend?: 'up' | 'down' | 'same';
  variant?: 'broadcaster' | 'general';
}

export interface Cup {
  name: string;
  gw: string;
  status: 'active' | 'out';
}