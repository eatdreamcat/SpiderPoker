/**
 * 拓展的一些数学方法
 */
interface CMath {
  /** 随机数种子 */
  randomSeed: number;
  sharedSeed: number;
  /**
   * return a new val between max and min
   * @param val
   * @param max
   * @param min
   */
  Clamp(val: number, max: number, min: number);

  /**
   * cal diatance of two points
   * @param p1
   * @param p2
   */
  Distance(p1: cc.Vec2, p2: cc.Vec2);

  NumberFormat(val: string | number): string;

  getRandom(min?: number, max?: number): number;

  isInRange(val: cc.Vec2, min: cc.Vec2, max: cc.Vec2): boolean;

  TimeFormat(val: number): string;

  GetWorldPosition(node: cc.Node): cc.Vec2;

  /**
   * 检测两个不同的数是否含有相同的bit
   * @param a
   * @param b
   */
  CheckNumberBit(a: number, b: number): boolean;

  /**
   *
   * @param node 转换的节点
   * @param spaceNode 目标坐标空间节点
   */
  ConvertToNodeSpaceAR(node: cc.Node, spaceNode: cc.Node): cc.Vec2;
}

// interface celerx {
//   start();
//   getMatch(): { sharedRandomSeed: number };
//   submitScore(score: number);
// }

// declare var celerx: celerx;
declare var CMath: CMath;
/** 是否显示整个场景 （调试用）*/
declare var CAMERA_SHOW_ALL;

/** 是否无敌 （调试用）*/
declare var INVINCIBLE;

/** */
declare var CHEAT_OPEN;

/** 是否像素风 （调试用）*/
declare var PXIEL;

/** 指引*/
declare var GUIDE;

declare var require;
