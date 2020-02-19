/**
 * 游戏配置
 */
export const Config = {
  FPS: 60,
  WinSize: cc.size(1080, 1920),
  Grid: cc.v2(8, 8),
  /** 单局游戏时间s */
  GameTime: 180
};

CC_DEBUG && (window["Config"] = Config);
