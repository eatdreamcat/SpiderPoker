import { Game } from "./controller/Game";
import Poker from "./Poker";
import { TARGET_POINT, OFFSET_Y, ACTION_TAG } from "./Pokers";
import { gEventMgr } from "./controller/EventManager";
import { GlobalEvent } from "./controller/EventName";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PokerRoot extends cc.Component {
  @property(cc.Node)
  SingleValueNode: cc.Node = null;

  @property(cc.Node)
  MutilpValueNode: cc.Node = null;

  @property(cc.Label)
  totalValue0Label: cc.Label = null;

  @property(cc.Label)
  totalValue0Label_MUTIP: cc.Label = null;

  @property(cc.Label)
  totalValue1Label: cc.Label = null;

  private totalValue0: number = 0;
  private totalValue1: number = 0;

  private canTouch: boolean = false;
  onLoad() {
    this.node.on(cc.Node.EventType.CHILD_ADDED, this.onAddChild, this);
    this.node.on(cc.Node.EventType.CHILD_REMOVED, this.onChildRemove, this);
    this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);

    this.SingleValueNode.active = true;
    this.MutilpValueNode.active = false;
  }

  start() {
    this.canTouch = true;
  }

  onTouchStart(e: cc.Event.EventTouch) {
    let curSelectPoker = Game.getCurSelectPoker();
    Game.setCurSelectPoker(null);
    if (!curSelectPoker) return;
    if (!this.canTouch) return;

    this.canTouch = false;

    let pos = CMath.ConvertToNodeSpaceAR(curSelectPoker.node, this.node);
    curSelectPoker.node.setParent(this.node);
    curSelectPoker.node.setPosition(pos);
    let childrenCount = this.node.childrenCount;
    let offset = OFFSET_Y * childrenCount - curSelectPoker.node.height / 2;

    curSelectPoker.setDefaultPosition(cc.v2(0, offset));
    gEventMgr.emit(GlobalEvent.DEV_POKERS);
    curSelectPoker.node.group = "top";
    curSelectPoker.node.stopActionByTag(ACTION_TAG.SELECT_POKER);
    curSelectPoker.node.runAction(
      cc.sequence(
        cc.moveTo(0.1, 0, offset),
        cc.callFunc(() => {
          curSelectPoker.node.group = "default";
          this.canTouch = true;
        }, this)
      )
    );
  }

  onChildRemove() {
    if (Game.isGameStarted()) {
      // console.warn(" PokerRoot update root node");
      Game.addPlacePokerRoot(parseInt(this.node.name), this.node);
    }
  }

  onAddChild(child: cc.Node) {
    let poker = child.getComponent(Poker);
    if (!poker) {
      console.error(" 没有 Poker类");
      return;
    }

    if (poker.isWildCard()) {
      let value = TARGET_POINT - this.totalValue0;
      this.setTotalValue(value);
    } else {
      this.setTotalValue(poker.getValue());
    }

    // console.log(" on poker root recycle count");
    poker.setRecycle(true);
  }

  setTotalValue(value: number) {
    this.totalValue0 += value;
    if (value == 1) {
      this.totalValue1 += this.totalValue0 + 10;
    } else {
      if (this.totalValue1 != 0) {
        this.totalValue1 += value;
      }
    }

    if (this.totalValue1 > 21) this.totalValue1 = 0;

    if (this.totalValue0 > 21) {
      this.boom();
    } else {
      if (this.totalValue0 == 21 || this.totalValue1 == 21) {
        this.complete();
      } else {
        if (this.node.childrenCount >= 5) {
          this.overFive();
        } else {
          Game.clearStreak();
        }
      }
    }

    console.log(
      " key:",
      this.node.name,
      ", value0:",
      this.totalValue0,
      ", value1:",
      this.totalValue1
    );

    this.updateValueLabel();
  }

  updateValueLabel() {
    if (this.totalValue1 == 0) {
      this.MutilpValueNode.active = false;
      this.SingleValueNode.active = true;
    } else {
      this.MutilpValueNode.active = true;
      this.SingleValueNode.active = false;
    }

    this.totalValue0Label.string = this.totalValue0.toString();
    this.totalValue0Label_MUTIP.string = this.totalValue0.toString();
    this.totalValue1Label.string = this.totalValue1.toString();
  }
  /** 爆掉 */
  boom() {
    console.log(" 超过21点爆掉");
    this.flyALLChildren(false);
    this.totalValue0 = 0;
    this.totalValue1 = 0;
    this.updateValueLabel();
    Game.clearStreak();
    Game.clearStep();
    Game.addRecyclePoker(1);
  }

  /** 完成 */
  complete() {
    console.log(" 完成 21点");
    this.flyALLChildren(true);
    this.totalValue0 = 0;
    this.totalValue1 = 0;
    this.updateValueLabel();
    Game.addStreak(1);
    Game.clearStep();
    if (Game.getStreak() >= 2) {
      Game.addScore(
        Game.getStreak() * 100,
        CMath.ConvertToNodeSpaceAR(this.node, Game.removeNode)
      );
    }
  }

  /** 超过五张 */
  overFive() {
    console.log(" 超过5张 ");
    this.flyALLChildren(true);
    this.totalValue0 = 0;
    this.totalValue1 = 0;
    this.updateValueLabel();
    Game.addStreak(1);
    Game.clearStep();
    if (Game.getStreak() >= 2) {
      Game.addScore(
        Game.getStreak() * 100,
        CMath.ConvertToNodeSpaceAR(this.node, Game.removeNode)
      );
    }
  }

  flyALLChildren(isAddScore: boolean) {
    let children = this.node.children;
    let count = children.length;
    let zIndex = 0;
    for (let child of children) {
      let poker = child.getComponent(Poker);

      poker.autoCompleteDone(
        count * 0.05,
        count % 2 ? 1 : -1,
        isAddScore,
        zIndex++
      );
      count--;
    }
  }

  setNewRoot(poker: Poker) {
    // if (poker.getNext()) {
    //   this.setNewRoot(poker.getNext());
    // } else {
    //   // console.warn("PokerRoot setNewRoot:", poker.getValue());
    //   Game.addPlacePokerRoot(parseInt(this.node.name), poker.node);
    //   poker.setNormal();
    // }
  }

  update(dt: number) {
    // if (Game.getPlacePokerRoot().keyOf(this.node) != null) {
    //   this.node.color = cc.Color.RED;
    // } else {
    //   this.node.color = cc.Color.WHITE;
    // }
  }
}
