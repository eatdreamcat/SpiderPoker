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

  public addScore(score: number) {
    this.score += score;
    this.score = Math.max(this.score, 0);
    gEventMgr.emit(GlobalEvent.UPDATE_SCORE);
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

  public addStep(
    node: cc.Node[],
    lastParent: cc.Node[],
    lastPos: cc.Vec2[],
    func?: StepFunc[]
  ) {
    this.stepInfoArray.push({
      node: node,
      lastParent: lastParent,
      lastPos: lastPos,
      func: func
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
            returnPos.y = OFFSET_Y;
          }
        }

        let action = cc.sequence(
          cc.delayTime(count / 500),
          cc.callFunc(() => {
            poker.node.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_REMOVE);
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
