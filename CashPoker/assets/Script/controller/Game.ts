import { HashMap } from "../utils/HashMap";
import Poker, { CardState } from "../Poker";
import { ACTION_TAG, OFFSET_Y } from "../Pokers";
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
  private freeDrawTimes: number = 3;
  private flipCounts: number = 0;

  private gameStart: boolean = false;

  private gameTime = 300;

  public getGameTime() {
    return this.gameTime;
  }

  public addGameTime(time: number) {
    if (CC_DEBUG) return;
    this.gameTime += time;
    this.gameTime = Math.max(this.gameTime, 0);
    if (this.gameTime <= 0) {
      this.gameStart = false;
    }
  }

  public isTimeOver() {
    return this.gameTime <= 0;
  }

  public start() {
    this.gameStart = true;
  }

  public isGameStarted() {
    return this.gameStart;
  }

  public addScore(score: number) {
    if (score == 0) return;
    this.score += score;
    this.score = Math.max(this.score, 0);
    console.log("------------------- score:", this.score, score);
    gEventMgr.emit(GlobalEvent.UPDATE_SCORE, score);
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
    console.log(
      "-----------------------------------flipCounts:",
      this.flipCounts
    );
    if (this.flipCounts >= 21) {
      console.error(
        "-----------------------------------flipCounts:",
        this.flipCounts
      );
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
    scores?: number[]
  ) {
    this.stepInfoArray.push({
      node: node,
      lastParent: lastParent,
      lastPos: lastPos,
      func: func,
      scores: scores
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
    this.placePokerRoot.add(key, node);
    if (this.placePokerRoot.length > 7) {
      console.error(
        " place Poker Root over size!!!!!:",
        this.placePokerRoot.length
      );
    }
  }

  addCycledPokerRoot(key: number, node: cc.Node) {
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
  }

  public backStep() {
    if (this.stepInfoArray.length <= 0) {
      console.warn(" no cache step!");
      return;
    }
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

      Game.addScore(score);

      if (parent.name == "PokerClip" || parent.name == "PokerFlipRoot") {
        let selfPos = parent.convertToNodeSpaceAR(
          node.getParent().convertToWorldSpaceAR(node.position)
        );
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

      let poker = node.getComponent(Poker);

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
            returnPos.y = 0;
          }
        } else {
          if (parent.getComponent(Poker).isCycled()) {
            returnPos.x = 0;
            returnPos.y = 0;
          } else {
            if (func.callback == parent.getComponent(Poker).flipCard) {
              returnPos.y = OFFSET_Y / 3;
            } else {
              returnPos.y = OFFSET_Y;
            }
          }
        }

        let action = cc.sequence(
          cc.delayTime(count / 500),
          cc.callFunc(() => {
            poker.node.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_REMOVE);
            poker.node.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_ADD);
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
CC_DEBUG && (window["Game"] = Game);
