export const SpadeStartIndex = 0;
export const HeartStartIndex = 1;
export const ClubStartIndex = 2;
export const DiamondStartIndex = 3;

export const PokerTypes = {
  spade_: 3,
  club_: 10,
  diamond_: 5,
  heart_: 12
};

// console.log(PokerTypes);
// console.log(
//   "------------------AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA----------------"
// );
// console.log(
//   "spade - spade:",
//   CMath.CheckNumberBit(PokerTypes.spade_, PokerTypes.spade_),
//   "spade - club:",
//   CMath.CheckNumberBit(PokerTypes.spade_, PokerTypes.club_),
//   ", spade - diamond:",
//   CMath.CheckNumberBit(PokerTypes.spade_, PokerTypes.diamond_),
//   ",spade - heart:",
//   CMath.CheckNumberBit(PokerTypes.spade_, PokerTypes.heart_)
// );

// console.log(
//   "club - club:",
//   CMath.CheckNumberBit(PokerTypes.club_, PokerTypes.club_),
//   ", club - diamond:",
//   CMath.CheckNumberBit(PokerTypes.club_, PokerTypes.diamond_),
//   ",club - heart:",
//   CMath.CheckNumberBit(PokerTypes.club_, PokerTypes.heart_)
// );

// console.log(
//   "diamond - diamond:",
//   CMath.CheckNumberBit(PokerTypes.diamond_, PokerTypes.diamond_),
//   ",diamond - heart:",
//   CMath.CheckNumberBit(PokerTypes.diamond_, PokerTypes.heart_)
// );
// console.log(
//   "heart - heart:",
//   CMath.CheckNumberBit(PokerTypes.heart_, PokerTypes.heart_)
// );

// console.log(
//   "----------------AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA------------------"
// );
export const Pokers = [
  "spade_,1", //0
  "spade_,1", //1
  "spade_,1", //2
  "spade_,1", //3
  "spade_,1", //2
  "spade_,1",

  "spade_,2", //4
  "spade_,2", //5
  "spade_,2", //6
  "spade_,2", //7
  "spade_,2", //6
  "spade_,2", //7

  "spade_,3", //8
  "spade_,3", //9
  "spade_,3", //10
  "spade_,3", //11
  "spade_,3", //10
  "spade_,3", //1

  "spade_,4",
  "spade_,4",
  "spade_,4",
  "spade_,4",
  "spade_,4",
  "spade_,4",

  "spade_,5",
  "spade_,5",
  "spade_,5",
  "spade_,5",
  "spade_,5",
  "spade_,5",

  "spade_,6",
  "spade_,6",
  "spade_,6",
  "spade_,6",
  "spade_,6",
  "spade_,6",

  "spade_,7",
  "spade_,7",
  "spade_,7",
  "spade_,7",
  "spade_,7",
  "spade_,7",

  "spade_,8",
  "spade_,8",
  "spade_,8",
  "spade_,8",
  "spade_,8",
  "spade_,8",

  "spade_,9",
  "spade_,9",
  "spade_,9",
  "spade_,9",
  "spade_,9",
  "spade_,9",

  "spade_,10",
  "spade_,10",
  "spade_,10",
  "spade_,10",
  "spade_,10",
  "spade_,10",

  "spade_,11",
  "spade_,11",
  "spade_,11",
  "spade_,11",
  "spade_,11",
  "spade_,11",

  "spade_,12",
  "spade_,12",
  "spade_,12",
  "spade_,12",
  "spade_,12",
  "spade_,12",

  "spade_,13",
  "spade_,13",
  "spade_,13",
  "spade_,13",
  "spade_,13",
  "spade_,13"
];

export const PokerIndex = [
  6,
  5,
  4,
  3,
  2,
  1,
  0,
  12,
  11,
  10,
  9,
  8,
  7,
  17,
  16,
  15,
  14,
  13,
  21,
  20,
  19,
  18,
  24,
  23,
  22,
  26,
  25,
  27,
  28,
  29,
  50,
  49,
  46,
  43,
  40,
  37,
  34,
  31,
  30,
  33,
  36,
  39,
  42,
  45,
  48,
  51
];

export const enum ACTION_TAG {
  FLIP_CARD_REPOS_ON_ADD,
  FLIP_CARD_REPOS_ON_REMOVE,
  BACK_STEP,
  DEV_POKER,
  RE_DEV_POKER,
  SHAKE,
  RECYCLE,
  POS_SCALE,
  POS_NORMAL,
  SELECT_POKER
}

export const COLOR_GRAY = cc.color(238, 218, 166);

export const OFFSET_Y = -70;
export const OFFSET_X = 0;
export const OFFSET_SCALE = 15;
export const FLIP_SCORE = 50;
export const BACK_STEP_SCORE = 20;

export const TARGET_POINT = 21;
export const BOOOOM_LIMIT = 3;
