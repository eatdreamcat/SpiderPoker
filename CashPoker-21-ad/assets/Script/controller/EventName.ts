/**
 * 全局事件名字定义
 */
export enum GlobalEvent {
  UPDATE_DRAW_ICON,
  UPDATE_SCORE,
  UPDATE_BACK_BTN_ICON,
  UPDATE_RECYCLE_POKER,
  OPEN_RESULT,
  RESTART,
  COMPLETE,
  AUTO_COMPLETE_DONE,
  UPDATE_CUR_SELECT_POKER,
  UPDATE_WILD_COUNT,

  UPDATE_STREAK_COUNT,

  /** 主场景的特殊表现 */
  BUST,
  COMPLETE_21,
  OVER_FIVE_CARDS,
  COMBO,
  SUPER_COMBO,
  WILD,
  NO_BUST,

  CHECK_COMPLETE,

  PLAY_RECYCLE_POKERS,
  DEV_POKERS,
  PLAY_POKER_PLACE,
  PLAY_POKER_FLY,
  PLAY_OVER_1,
  PLAY_OVER_2,
  PLAY_PAUSE,
  PLAY_START,
  PLAY_SHAKE,
  PLAY_BUST,
  SMALL_BGM,
  NORMAL_BGM,
  PLAY_RECYCLE,
  PLAY_CHANGE_2_WILD,
  PLAY_WILD_ANI,

  POP_GUIDE_STEP
}
