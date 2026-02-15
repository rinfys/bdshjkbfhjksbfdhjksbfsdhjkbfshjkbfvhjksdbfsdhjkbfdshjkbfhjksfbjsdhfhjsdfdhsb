import { Player, League, Cup, TeamSlot } from './types';

// Team Logos
const LOGOS = {
  aquapolis: "https://i.imgur.com/0cLCiWZ.png",
  siren: "https://i.imgur.com/SIid1r1.png",
  atlantis: "https://i.imgur.com/WRGhOQp.png",
  hammerheads: "https://i.imgur.com/uWlIzhB.png",
  lst: "https://i.imgur.com/kVrXxte.png",
  kraken: "https://i.imgur.com/FFmJ2jn.png",
  neptunus: "https://i.imgur.com/ssbFsUS.png",
  default: "https://i.imgur.com/AZYKczg.png"
};

// BALANCED PRICING (REDUCED):
// Top Stars: 16.0 - 19.0
// High Tier: 11.0 - 14.5
// Mid Tier: 7.5 - 10.0
// Budget/Bench: 4.0 - 6.5

export const MARKET_PLAYERS: Player[] = [
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
