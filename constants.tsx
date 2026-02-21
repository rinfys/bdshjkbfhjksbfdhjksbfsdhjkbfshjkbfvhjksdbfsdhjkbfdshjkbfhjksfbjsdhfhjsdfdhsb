import { TeamSlot } from './types';

// Team Logos
export const LOGOS = {
  aquapolis: "https://i.imgur.com/0cLCiWZ.png",
  siren: "https://i.imgur.com/SIid1r1.png",
  atlantis: "https://i.imgur.com/WRGhOQp.png",
  hammerheads: "https://i.imgur.com/uWlIzhB.png",
  lst: "https://i.imgur.com/kVrXxte.png",
  kraken: "https://i.imgur.com/FFmJ2jn.png",
  neptunus: "https://i.imgur.com/ssbFsUS.png",
  default: "https://i.imgur.com/AZYKczg.png"
};

// Gameweek Schedule
// GW1 Skipped. GW2 is Current (Active). GW3 Future.
export const GAMEWEEK_SCHEDULE = [
  { id: 1, label: "GW 1", start: "2025-01-01T00:00:00Z", deadline: "2025-01-08T00:00:00Z" },
  { id: 2, label: "GW 2", start: "2025-02-01T00:00:00Z", deadline: "2026-02-22T13:00:00Z" },
  { id: 3, label: "GW 3", start: "2026-02-23T00:00:00Z", deadline: "2026-03-01T15:00:00Z" },
  { id: 4, label: "GW 4", start: "2026-03-02T00:00:00Z", deadline: "2026-03-08T15:00:00Z" }
];

// Initial slots
export const INITIAL_TEAM_SLOTS: TeamSlot[] = [
  // Starters
  { index: 0, position: 'GK', type: 'starter', player: null },
  { index: 1, position: 'OUTFIELD', type: 'starter', player: null },
  { index: 2, position: 'OUTFIELD', type: 'starter', player: null },
  { index: 3, position: 'OUTFIELD', type: 'starter', player: null },
  { index: 4, position: 'OUTFIELD', type: 'starter', player: null },
  // Bench
  { index: 5, position: 'GK', type: 'bench', player: null },
  { index: 6, position: 'HS', type: 'bench', player: null },
  { index: 7, position: 'RW', type: 'bench', player: null },
];

export const NAV_LINKS = [
  'Status', 'Points', 'Pick Team', 'Transfers', 'Leagues & Cups', 'Fixtures', 'The Scout', 'Injuries', 'Podcast', 'Stats', 'Prizes', 'Help', 'FPL Challenge', 'Sign Out'
];
