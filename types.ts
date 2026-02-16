
export interface Player {
  id: number;
  name: string;
  teamColor: 'red' | 'blue' | 'sky' | 'green' | 'yellow' | 'purple' | 'claret';
  points: number;
  position: 'GK' | 'CD' | 'LW' | 'RW' | 'HS';
  imageUrl?: string;
  price: number;
  avgRating: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  warnings?: boolean;
}

export interface TeamSlot {
  index: number;
  position: 'GK' | 'CD' | 'LW' | 'RW' | 'HS' | 'C' | 'OUTFIELD';
  type: 'starter' | 'bench';
  player: Player | null;
  isCaptain?: boolean; // Track captaincy on the slot level for persistence
}

export interface UserSettings {
  username: string;
  usernameLastChanged: number;
  nickname: string;
  theme: 'dark' | 'light';
  currency: 'GBP' | 'USD' | 'EUR';
  totalHistoryPoints?: number;
  profilePictureUrl?: string;
  tutorialCompleted?: boolean;
}

export interface UserData {
  uid?: string;
  settings: UserSettings;
  teamName: string;
  logoUrl: string;
  slots: TeamSlot[];
  isSquadComplete?: boolean;
  formation?: string;
  isSubmitted?: boolean;
  lastGameweekSaved?: number;
  // Map of gameweek ID to points scored
  history?: Record<string, number>;
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