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

export const Empty_Offset = -110;

export const GuidePokers = [

  "diamond_,1", //3
  "spade_,1", //0
  "heart_,1", //1
  "club_,1", //2
  

  "spade_,2", //4
  "heart_,2", //5
  "club_,2", //6
  "club_,5", //7

  "spade_,3", //8
  "heart_,3", //9
  "club_,3", //10
  "diamond_,3", //11

  "spade_,4", //12
  "heart_,13", //13
  "club_,4",  //14
  "diamond_,4",//15

  "spade_,5", //16
  "heart_,5", //17
  "diamond_,2",  //18
  "spade_,6", //19

  "club_,6", //20
  "heart_,6", //21
  "diamond_,5",  //22
  "diamond_,6", //23

  "heart_,7", //24
  "spade_,7", //25
  "club_,8",  //26
  "diamond_,7", //27

  "spade_,8", //28
  "heart_,8", //29
  "club_,7",  //30
  "diamond_,8", //31

  "spade_,9", //32
  "heart_,9", //33
  "club_,9",  //34
  "diamond_,9", //35

  "spade_,10", //36
  "heart_,10", //37
  "club_,10",  //38
  "diamond_,10", //39

  "spade_,11", //40
  "heart_,11", //41
  "club_,11",  //42
  "diamond_,11", //43

  "spade_,12", //44
  "heart_,12", //45
  "club_,12",  //46
  "diamond_,12", //47

  "spade_,13", //48
  "heart_,4", //49
  "club_,13", //50
  "diamond_,13" //51
];


export const Pokers = [
  "spade_,1", //0
  "heart_,1", //1
  "club_,1", //2
  "diamond_,1", //3

  "spade_,2", //4
  "heart_,2", //5
  "club_,2", //6
  "diamond_,2", //7

  "spade_,3", //8
  "heart_,3", //9
  "club_,3", //10
  "diamond_,3", //11

  "spade_,4",
  "heart_,4",
  "club_,4",
  "diamond_,4",

  "spade_,5",
  "heart_,5",
  "club_,5",
  "diamond_,5",

  "spade_,6",
  "heart_,6",
  "club_,6",
  "diamond_,6",

  "spade_,7",
  "heart_,7",
  "club_,7",
  "diamond_,7",

  "spade_,8",
  "heart_,8",
  "club_,8",
  "diamond_,8",

  "spade_,9",
  "heart_,9",
  "club_,9",
  "diamond_,9",

  "spade_,10",
  "heart_,10",
  "club_,10",
  "diamond_,10",

  "spade_,11",
  "heart_,11",
  "club_,11",
  "diamond_,11",

  "spade_,12",
  "heart_,12",
  "club_,12",
  "diamond_,12",

  "spade_,13",
  "heart_,13",
  "club_,13",
  "diamond_,13"
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
  RECYCLE
}

export const OFFSET_Y = -70;
export const OFFSET_X = 0;

export const FREE_TIME_LIMIT = 5;
