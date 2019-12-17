import { Game } from "./controller/Game";
import Poker from "./Poker";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PokerRoot extends cc.Component {
  private next: Poker;
  onLoad() {
    this.node.on(cc.Node.EventType.CHILD_ADDED, this.onAddChild, this);
    this.node.on(cc.Node.EventType.CHILD_REMOVED, this.onChildRemove, this);
  }

  start() {}

  onChildRemove() {
    console.warn(" PokerRoot update root node");
    Game.placePokerRoot.add(parseInt(this.node.name), this.node);
  }

  onAddChild(child: cc.Node) {
    let poker = child.getComponent(Poker);
    if (!poker) {
      console.error(" 没有 Poker类");
      return;
    }
    this.setNewRoot(poker);
    this.next = poker;
  }

  setNewRoot(poker: Poker) {
    if (poker.getNext()) {
      this.setNewRoot(poker.getNext());
    } else {
      console.warn("PokerRoot setNewRoot:", poker.getValue());
      Game.placePokerRoot.add(parseInt(this.node.name), poker.node);
      poker.setNormal();
    }
  }

  update(dt: number) {
    if (Game.placePokerRoot.keyOf(this.node) != null) {
      this.node.color = cc.Color.RED;
    } else {
      this.node.color = cc.Color.WHITE;
    }
  }
}
