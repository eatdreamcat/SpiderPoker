import { HashMap } from "../utils/HashMap";
import Poker from "../Poker";

interface StepInfo {
  node: cc.Node[];
  lastParent: cc.Node[];
  lastPos: cc.Vec2[];
  func?: {
    callback: Function;
    target: any;
    args: any[];
  }[];
}

class GameMgr {
  private static _inst: GameMgr;
  private GameMgr() {}
  public static get inst() {
    return this._inst ? this._inst : (this._inst = new GameMgr());
  }

  public placePokerRoot: HashMap<number, cc.Node> = new HashMap();
  public removeNode: cc.Node;

  private stepInfoArray: StepInfo[] = [];

  public addStep(
    node: cc.Node[],
    lastParent: cc.Node[],
    lastPos: cc.Vec2[],
    func?: {
      callback: Function;
      target: any;
      args: any[];
    }[]
  ) {
    this.stepInfoArray.push({
      node: node,
      lastParent: lastParent,
      lastPos: lastPos,
      func: func
    });
  }

  public backStep() {
    if (this.stepInfoArray.length <= 0) return;
    let step = this.stepInfoArray.pop();
    while (step.node.length > 0) {
      let node = step.node.pop();
      let parent = step.lastParent.pop();
      let pos = step.lastPos.pop();
      let func = step.func ? step.func.pop() : null;
      node.setParent(parent);
      node.setPosition(pos);
      node.group = "top";
      if (func && func.callback && func.target) {
        func.callback.apply(func.target, func.args);
      }
      let poker = node.getComponent(Poker);
      if (step)
        if (poker) {
          poker.node.runAction(
            cc.sequence(
              cc.moveTo(
                0.1,
                poker.getDefaultPosition().x,
                poker.getDefaultPosition().y
              ),
              cc.callFunc(() => {
                node.group = "default";
              }, this)
            )
          );
        }
    }
  }
}

export const Game = GameMgr.inst;
CC_DEBUG && (window["Game"] = Game);
