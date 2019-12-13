import { HashMap } from "../utils/HashMap";
import Poker, { CardState } from "../Poker";

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

  public placePokerRoot: HashMap<number, cc.Node> = new HashMap();
  public removeNode: cc.Node;

  private stepInfoArray: StepInfo[] = [];

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
    while (step.node.length > 0) {
      let node = step.node.pop();
      let parent = step.lastParent.pop();
      let pos = step.lastPos.pop();
      let func = step.func ? step.func.pop() : null;

      if (parent.name == "PokerClip") {
        let selfPos = parent.convertToNodeSpaceAR(
          node.getParent().convertToWorldSpaceAR(node.position)
        );
        node.setPosition(selfPos);
      } else {
        node.setPosition(pos);
      }

      node.setParent(parent);

      node.group = "top";

      if (func && func.callback && func.target) {
        func.callback.apply(func.target, func.args);
      }

      let poker = node.getComponent(Poker);

      if (poker) {
        let returnPos =
          parent.name == "PokerClip"
            ? poker.getLastPosition()
            : poker.getDefaultPosition();
        if (!parent.getComponent(Poker)) {
          returnPos.y = 0;
        } else if (
          (parent.getComponent(Poker).getForward() &&
            parent
              .getComponent(Poker)
              .getForward()
              .getCardState() == CardState.Back) ||
          !parent.getComponent(Poker).getForward() ||
          parent.getComponent(Poker).getCardState() == CardState.Back
        ) {
          returnPos.y = -15;
        }
        poker.node.runAction(
          cc.sequence(
            cc.moveTo(0.1, returnPos.x, returnPos.y),
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
