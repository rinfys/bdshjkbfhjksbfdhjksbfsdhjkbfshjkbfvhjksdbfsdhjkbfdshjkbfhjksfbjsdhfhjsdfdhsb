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

// Initial slots
// Slot 0: GK
// Slot 1-4: Outfield Starters (Flexible position, starts empty)
// Slot 5: Bench GK
// Slot 6-7: Bench Outfield
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