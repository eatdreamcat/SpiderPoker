import { Game } from "./controller/Game";
import Poker from "./Poker";

const { ccclass, property } = cc._decorator;

@ccclass
export default class RecycleRoot extends cc.Component {
  // LIFE-CYCLE CALLBACKS:

  onLoad() {
    this.node.on(cc.Node.EventType.CHILD_ADDED, this.onAddChild, this);
    this.node.on(cc.Node.EventType.CHILD_REMOVED, this.onChildRemove, this);
  }

  onAddChild(child: cc.Node) {
    console.log(" on recycle root add child ----------");
    let poker = child.getComponent(Poker);
    if (poker) {
      poker.setNext(null);
    }
    Game.cyclePokerRoot.add(parseInt(this.node.name), child);
  }

  onChildRemove(child: cc.Node) {
    let poker = child.getComponent(Poker);
    if (poker) {
      poker.setRecycle(false);
    }
    Game.cyclePokerRoot.add(parseInt(this.node.name), this.node);
  }

  start() {}

  update(dt: number) {
    Game.cyclePokerRoot.forEach((key: number, node: cc.Node) => {
      let poker = node.getComponent(Poker);
      if (poker) {
        poker.frontCard.node.color = cc.Color.YELLOW;
      } else {
        node.color = cc.Color.YELLOW;
      }
    });
  }
}
