import { HashMap } from "../utils/HashMap";
import Poker, { CardState, POS_STATE } from "../Poker";
import {
  ACTION_TAG,
  OFFSET_Y,
  BOOOOM_LIMIT,
  TOTAL_POKER_COUNT
} from "../Pokers";
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
  zIndex?: number[];
}

class GameMgr {
  private static _inst: GameMgr;
  private GameMgr() {}
  public static get inst() {
    return this._inst ? this._inst : (this._inst = new GameMgr());
  }

  private placePokerRoot: HashMap<number, cc.Node> = new HashMap();
  private cyclePokerRoot: HashMap<number, cc.Node> = new HashMap();
  private posOffsetCal: HashMap<number, number> = new HashMap();
  public removeNode: cc.Node;

  private stepInfoArray: StepInfo[] = [];

  private score: number = 0;
  private timeBonus: number = 0;
  private freeDrawTimes: number = 3;
  private flipCounts: number = 0;
  public pokerClip: cc.Node = null;
  private curSelectPoker: Poker = null;

  private gameStart: boolean = false;

  private gameTime = 300;

  public removePokerCount = 0;

  private recycleCount: number = 0;

  public pokerFlipRoot: cc.Node = null;

  private combo: number = -1;

  private streakCount: number = 0;

  private recyclePoker: number = 0;

  public addRecyclePoker(count: number) {
    this.recyclePoker += count;
    this.recyclePoker = Math.max(0, this.recyclePoker);
    if (this.recyclePoker >= BOOOOM_LIMIT && !window["CheatOpen"]) {
      console.error(" recycle poker error!!!!");
      setTimeout(() => {
        gEventMgr.emit(GlobalEvent.OPEN_RESULT);
      }, 1000);
    }
    gEventMgr.emit(GlobalEvent.UPDATE_RECYCLE_POKER, this.recyclePoker);
  }

  getCurSelectPoker() {
    if (!this.curSelectPoker) {
      console.error(" cur select poker is null");
    }
    return this.curSelectPoker;
  }

  setCurSelectPoker(poker: Poker) {
    if (poker == null) {
    }
    console.log(" set cur select poker ------------------");
    console.log(poker);
    this.curSelectPoker = poker;
  }

  public addPosOffset(key: number, offset: number) {
    let pos = this.posOffsetCal.get(key);
    if (pos) {
      let off = Math.max(0, pos + offset);
      //this.posOffsetCal.add(key, off);
      this.posOffsetCal.add(key, pos + offset);
    } else {
      //offset = Math.max(0, offset);
      this.posOffsetCal.add(key, offset);
    }

    for (let i = 0; i < 8; i++) {
      console.log(" --------addPosOffset key:", i, ":", this.getPosOffset(i));
    }
  }

  public getPosOffset(key: number) {
    let pos = this.posOffsetCal.get(key);
    return pos == null ? 0 : pos;
  }

  public getCombo() {
    return this.combo;
  }

  public resetCombo() {
    this.combo = -1;
  }

  public addCombo(combo: number) {
    this.combo += combo;
    this.combo = Math.max(0, this.combo % 13);
    console.log(" combo:", this.combo);
  }

  public addStreak(streak: number) {
    this.streakCount += streak;
  }

  public getStreak() {
    return this.streakCount;
  }

  public clearStreak() {
    this.streakCount = 0;
  }

  public getGameTime() {
    return this.gameTime;
  }

  public addRecycleCount(count: number) {
    this.recycleCount += count;
    console.log(" ---------------------recycle count :", this.recycleCount);
    if (this.recycleCount > 78 || this.recycleCount < 0) {
      console.error(" recycle count error! ", this.recycleCount);
      this.recycleCount = CMath.Clamp(this.recycleCount, 78, 0);
    }
  }

  public addGameTime(time: number) {
    if (window["noTime"] || Game.isComplete()) return;

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
      ((this.flipCounts / TOTAL_POKER_COUNT) * (1.2 / 0.5) + 0.3) *
      this.gameTime;

    this.timeBonus = Math.floor(this.timeBonus);
    console.error(
      "this.flipCounts: ",
      this.flipCounts,
      ", this.gameTime:",
      this.gameTime,
      ",this.timbonus:",
      this.timeBonus
    );
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
    return this.flipCounts >= TOTAL_POKER_COUNT;
  }

  public isBoom() {
    return this.recyclePoker >= BOOOOM_LIMIT;
  }

  public checkIsRecycleComplete() {
    let isComplete = this.recycleCount == 78;

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
    this.removePokerCount = Game.removeNode.childrenCount;
    if (this.removePokerCount == TOTAL_POKER_COUNT) {
      console.error(
        " ---------------- addRemovePokerCount -----------------------"
      );
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
    console.error(
      "-----------------------------------flipCounts:",
      this.flipCounts
    );
    if (this.isComplete()) {
      console.error(
        "-------------emit Complete!!!----------------------flipCounts:",
        this.flipCounts
      );
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
    scorePos?: cc.Vec2[],
    zIndex?: number[]
  ) {
    this.stepInfoArray.length = 0;
    this.stepInfoArray.push({
      node: node,
      lastParent: lastParent,
      lastPos: lastPos,
      func: func,
      scores: scores,
      scoresPos: scorePos,
      zIndex: zIndex
    });
    gEventMgr.emit(GlobalEvent.UPDATE_BACK_BTN_ICON);
  }

  public getTopStep() {
    if (this.stepInfoArray.length <= 0) return null;
    return this.stepInfoArray[this.stepInfoArray.length - 1];
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
    if (this.placePokerRoot.length > 8) {
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
      return false;
    }
    Game.clearStreak();

    Game.resetCombo();

    let step = this.stepInfoArray.pop();

    gEventMgr.emit(GlobalEvent.UPDATE_BACK_BTN_ICON);
    let count = 0;
    while (step.node.length > 0) {
      count++;
      let node = step.node.shift();
      let parent = step.lastParent.shift();
      let pos = step.lastPos.shift();
      let func = step.func ? step.func.shift() : null;

      let score =
        step.scores && step.scores.length > 0 ? step.scores.shift() : 0;
      let scorePos =
        step.scoresPos && step.scoresPos.length > 0
          ? step.scoresPos.shift()
          : null;

      if (scorePos) {
        Game.addScore(score, scorePos);
      } else {
        Game.addScore(score);
      }

      let selfPos = CMath.ConvertToNodeSpaceAR(node, parent);
      node.setPosition(selfPos);

      if (func && func.callback && func.target) {
        console.log("call func !");
        func.callback.apply(func.target, func.args);
      }

      node.group = "top";
      let poker = node.getComponent(Poker);
      if (poker) {
        let returnPos;

        if (parent.name == "PokerClip") {
          returnPos = poker.getLastPosition();
        } else {
          returnPos =
            parent.name == "PokerFlipRoot"
              ? poker.getFlipPos()
              : poker.getDefaultPosition();
          if (!parent.getComponent(Poker)) {
            if (parent.name == "place_aback") {
              returnPos.x = 0;
              returnPos.y = 0;
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
        }

        poker.setDefaultPosition(cc.v2(returnPos.x, returnPos.y));
        poker.setPosState(POS_STATE.NORMAL, false);
        node.setParent(parent);

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
            if (parent.getComponent(Poker)) poker.checkPos();
          }, this)
        );
        action.setTag(ACTION_TAG.BACK_STEP);

        poker.node.stopAllActions();
        if (poker.node.rotation != 0) {
          poker.node.runAction(cc.rotateTo(0.1, 0));
        }
        poker.node.runAction(action);
      }
    }
    return count > 0;
  }

  public canBackStep() {
    return this.stepInfoArray.length > 0;
  }
}

export const Game = GameMgr.inst;
CC_DEBUG && (window["Game"] = Game);
