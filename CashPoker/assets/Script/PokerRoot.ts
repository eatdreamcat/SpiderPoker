import { Game } from "./controller/Game";
import Poker from "./Poker";

// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

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
