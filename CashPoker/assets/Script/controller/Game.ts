import { HashMap } from "../utils/HashMap";
import Poker, { CardState } from "../Poker";
import { ACTION_TAG, OFFSET_Y, FREE_TIME_LIMIT, Empty_Offset } from "../Pokers";
import { gEventMgr } from "./EventManager";
import { GlobalEvent } from "./EventName";

export interface StepFunc {
  callback: Function;
  target: any;
  args: any[];
}
export interface StepInfo {
  node: cc.Node[];
  lastParent: cc.Node[];
  lastPos: cc.Vec2[];
  scores?: number[];
  scoresPos?: cc.Vec2[];
  func?: StepFunc[];
}

class GameMgr {
  private static _inst: GameMgr;
  private GameMgr() {}
  public static get inst() {
    return this._inst ? this._inst : (this._inst = new GameMgr());
  }

  private placePokerRoot: HashMap<number, cc.Node> = new HashMap();
  private cyclePokerRoot: HashMap<number, cc.Node> = new HashMap();
  public removeNode: cc.Node;

  private stepInfoArray: StepInfo[] = [];

  private score: number = 0;
  private timeBonus: number = 0;
  private freeDrawTimes: number = 3;
  private flipCounts: number = 0;

  private gameStart: boolean = false;

  private gameTime = 300;

  public removePokerCount = 0;

  private recycleCount: number = 0;

  public pokerFlipRoot: cc.Node = null;

  private combo: number = -1;

  private freeTime: number = 0;

  public allPokers: Poker[] = [];

  public initAllData() {
    this.timeBonus = 0;
    this.flipCounts = 0;
    this.gameTime = 300;
    this.removePokerCount = 0;
    this.combo = -1;
    this.freeTime = 0;
    this.freeDrawTimes = 3;
    this.stepInfoArray.length = 0;
    this.recycleCount = 0;
  }

  public addFreeTime(count: number) {
    this.freeTime += count;
    if (this.freeTime >= FREE_TIME_LIMIT) {
      gEventMgr.emit(GlobalEvent.UPDATE_TIP_ANIMATION, true);
    }
  }

  public resetFreeTime() {
    this.freeTime = 0;
    gEventMgr.emit(GlobalEvent.UPDATE_TIP_ANIMATION, false);
  }

  public getCombo() {
    return this.combo;
  }

  public resetCombo() {
    this.combo = -1;
  }

  public addCombo(combo: number) {
    this.combo += combo;
    this.combo = Math.max(0, this.combo % 8);
    console.log(" combo:", this.combo);
  }

  public getGameTime() {
    return this.gameTime;
  }

  public addRecycleCount(count: number) {
    this.recycleCount += count;
    console.log(" ---------------------recycle count :", this.recycleCount);
    if (this.recycleCount > 52 || this.recycleCount < 0) {
      console.error(" recycle count error! ", this.recycleCount);
      this.recycleCount = CMath.Clamp(this.recycleCount, 52, 0);
    }
  }

  public addGameTime(time: number) {
    if (Game.isComplete()) return;

    this.gameTime += time;
    this.gameTime = Math.max(this.gameTime, 0);
    if (this.gameTime <= 0) {
      this.gameStart = false;

      gEventMgr.emit(GlobalEvent.OPEN_RESULT);
    }
  }

  public calTimeBonus() {
    if (this.gameTime >= 300 || this.gameTime <= 0 || this.flipCounts <= 0)
      return;

    this.timeBonus =
      ((this.flipCounts / 30) * (1.2 / 0.5) + 0.3) * this.gameTime;

    this.timeBonus = Math.floor(this.timeBonus);

    Game.addScore(this.timeBonus);
  }

  public getTimeBonus() {
    return this.timeBonus;
  }

  public isTimeOver() {
    return this.gameTime <= 0;
  }

  public start() {
    this.gameStart = true;
    gEventMgr.emit(GlobalEvent.PLAY_START);
  }

  public isComplete() {
    // return (
    //   this.flipCounts >= 45 ||
    //   (this.flipCounts >= 44 &&
    //     Game.pokerFlipRoot &&
    //     Game.pokerFlipRoot.childrenCount == 1)
    // );
    return this.flipCounts >= 45;
  }

  public checkIsRecycleComplete() {
    let isComplete = this.recycleCount == 52;

    if (isComplete) {
      console.log(" isComplete isComplete ");
      gEventMgr.emit(GlobalEvent.AUTO_COMPLETE_DONE);
    }
    return isComplete;
  }

  public restart() {
    this.gameTime = 300;
    this.score = 0;
    this.flipCounts = 0;
    this.stepInfoArray = [];
    this.timeBonus = 0;
    this.cyclePokerRoot.clear();
    this.placePokerRoot.clear();
    this.gameStart = false;
    this.removePokerCount = 0;
  }

  public addRemovePokerCount(count: number) {
    this.removePokerCount += count;
    if (this.removePokerCount == 52) {
      this.calTimeBonus();
      gEventMgr.emit(GlobalEvent.OPEN_RESULT);
    }
  }

  public setPause(pause: boolean) {
    this.gameStart = !pause;
  }

  public isGameStarted() {
    return this.gameStart;
  }

  public resetscore() {
    this.score = 0;
  }

  public addScore(score: number, pos: cc.Vec2 = cc.v2(-200, 700)) {
    if (score == 0) return;
    score = Math.floor(score);
    this.score += score;
    this.score = Math.max(this.score, 0);
    console.log("------------------- score:", this.score, score);
    gEventMgr.emit(GlobalEvent.UPDATE_SCORE, score, pos);
  }

  public getScore() {
    return this.score;
  }

  public addFreeDrawTimes(times: number) {
    this.freeDrawTimes += times;
    this.freeDrawTimes = Math.max(this.freeDrawTimes, 0);
    gEventMgr.emit(GlobalEvent.UPDATE_DRAW_ICON);
  }

  public getFreeDrawTimes() {
    return this.freeDrawTimes;
  }

  public addFlipCounts(count: number) {
    if (!this.isGameStarted()) return;
    this.flipCounts += count;
    this.flipCounts = Math.max(this.flipCounts, 0);

    if (this.isComplete()) {
      gEventMgr.emit(GlobalEvent.COMPLETE);
    }
  }

  public getFlipCounts() {
    return this.flipCounts;
  }

  public addStep(
    node: cc.Node[],
    lastParent: cc.Node[],
    lastPos: cc.Vec2[],
    func?: StepFunc[],
    scores?: number[],
    scorePos?: cc.Vec2[]
  ) {
    if (!CC_DEBUG) this.stepInfoArray.length = 0;
    this.stepInfoArray.push({
      node: node,
      lastParent: lastParent,
      lastPos: lastPos,
      func: func,
      scores: scores,
      scoresPos: scorePos
    });
    gEventMgr.emit(GlobalEvent.UPDATE_BACK_BTN_ICON);
  }

  getPlacePokerRoot() {
    return this.placePokerRoot;
  }

  getCycledPokerRoot() {
    return this.cyclePokerRoot;
  }

  addPlacePokerRoot(key: number, node: cc.Node) {
    if (this.isComplete()) return;
    this.placePokerRoot.add(key, node);
    if (this.placePokerRoot.length > 7) {
      console.error(
        " place Poker Root over size!!!!!:",
        this.placePokerRoot.length
      );
    }
  }

  addCycledPokerRoot(key: number, node: cc.Node) {
    // let oldNode = this.cyclePokerRoot.get(key);
    // if (oldNode) {
    //   let poker = oldNode.getComponent(Poker);
    // }
    this.cyclePokerRoot.add(key, node);
    if (this.cyclePokerRoot.length > 4) {
      console.error(
        " cycled Poker root over size!!!!!:",
        this.cyclePokerRoot.length
      );
    }
  }

  clearStep() {
    this.stepInfoArray.length = 0;
    gEventMgr.emit(GlobalEvent.UPDATE_BACK_BTN_ICON);
  }

  public backStep() {
    if (this.stepInfoArray.length <= 0) {
      console.warn(" no cache step!");
      return;
    }

    Game.resetCombo();
    let step = this.stepInfoArray.pop();
    gEventMgr.emit(GlobalEvent.UPDATE_BACK_BTN_ICON);
    let count = 0;
    while (step.node.length > 0) {
      count++;
      let node = step.node.pop();
      let parent = step.lastParent.pop();
      let pos = step.lastPos.pop();
      let func = step.func ? step.func.pop() : null;
      let score = step.scores && step.scores.length > 0 ? step.scores.pop() : 0;
      let scorePos =
        step.scoresPos && step.scoresPos.length > 0
          ? step.scoresPos.pop()
          : null;

      if (scorePos) {
        Game.addScore(score, scorePos);
      } else {
        Game.addScore(score);
      }

      let poker = node.getComponent(Poker);

      if (
        parent.name == "PokerClip" ||
        parent.name == "PokerFlipRoot" ||
        (poker && poker.isCycled())
      ) {
        let selfPos = CMath.ConvertToNodeSpaceAR(node, parent);
        node.setPosition(selfPos);
      } else {
        node.setPosition(pos);
      }

      if (func && func.callback && func.target) {
        console.log("call func !");
        func.callback.apply(func.target, func.args);
      }

      node.setParent(parent);

      node.group = "top";

      if (poker) {
        let returnPos =
          parent.name == "PokerClip"
            ? poker.getLastPosition()
            : parent.name == "PokerFlipRoot"
            ? poker.getFlipPos()
            : poker.getDefaultPosition();
        if (!parent.getComponent(Poker)) {
          if (parent.name != "PokerFlipRoot") {
            returnPos.x = 0;
            returnPos.y = parent.name != "PokerDevl" ? Empty_Offset : 0;
          }
        } else {
          if (parent.getComponent(Poker).isCycled()) {
            returnPos.x = 0;
            returnPos.y = 0;
          } else {
            if (
              func &&
              func.callback &&
              func.callback == parent.getComponent(Poker).flipCard
            ) {
              returnPos.y = OFFSET_Y / 3;
            } else {
              returnPos.y = OFFSET_Y;
            }
          }
        }

        let action = cc.sequence(
          cc.delayTime(count / 500),
          cc.callFunc(() => {
            gEventMgr.emit(GlobalEvent.DEV_POKERS);
            poker.node.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_REMOVE);
            poker.node.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_ADD);
            poker.node.stopActionByTag(ACTION_TAG.SHAKE);
          }, this),
          cc.moveTo(0.1, returnPos.x, returnPos.y),
          cc.callFunc(() => {
            node.group = "default";
            poker.setDefaultPosition();
          }, this)
        );
        action.setTag(ACTION_TAG.BACK_STEP);

        poker.node.runAction(action);
      }
    }
  }

  public canBackStep() {
    return this.stepInfoArray.length > 0;
  }
}

export const Game = GameMgr.inst;
