
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
  isCaptain?: boolean;
  isViceCaptain?: boolean;
}

export interface ChipStatus {
  available: number;
  usedInGw?: number[];
}

export interface UserChips {
  benchBoost: ChipStatus;
  tripleCaptain: ChipStatus;
  freeHit: ChipStatus;
  wildcard: ChipStatus;
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
  chips?: UserChips;
  activeChip?: string | null; // 'benchBoost', 'tripleCaptain', etc. for current GW
  isSquadComplete?: boolean;
  formation?: string;
  isSubmitted?: boolean;
  lastGameweekSaved?: number;
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