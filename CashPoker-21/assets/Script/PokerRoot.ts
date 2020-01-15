import { Game } from "./controller/Game";
import Poker from "./Poker";
import {
  TARGET_POINT,
  OFFSET_Y,
  ACTION_TAG,
  OVER_5_SCORE,
  WILD_21_SCORE,
  NORMAL_21_SCORE,
  STREAK_SCORE
} from "./Pokers";
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
    if (!Game.isGameStarted()) Game.start();

    let curSelectPoker = Game.getCurSelectPoker();
    Game.setCurSelectPoker(null);
    if (!curSelectPoker) return;
    if (!this.canTouch) return;
    if (Game.isBoom() || Game.isComplete()) return;

    // console.log(" on poker root recycle count");
    curSelectPoker.setRecycle(true);

    this.canTouch = false;

    let pos = CMath.ConvertToNodeSpaceAR(curSelectPoker.node, this.node);
    let oldParent = curSelectPoker.node.getParent();
    let lastPos = curSelectPoker.node.getPosition();
    let childrenCount = this.node.childrenCount;
    let offset = OFFSET_Y * childrenCount - curSelectPoker.node.height / 2;
    curSelectPoker.setDefaultPosition(cc.v2(0, offset));
    curSelectPoker.node.setParent(this.node);
    console.error(" onTouchStart set parent ");
    curSelectPoker.node.setPosition(pos);

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

    let addScore = this.checkAddScore(curSelectPoker.isWildCard());
    // if (curSelectPoker.isWildCard()) {
    //   let value = TARGET_POINT - this.totalValue0;
    //   addScore = this.setTotalValue(value, true, true, this.node.childrenCount);
    // } else {
    //   addScore = this.setTotalValue(
    //     curSelectPoker.getValue(),
    //     false,
    //     true,
    //     this.node.childrenCount
    //   );
    // }

    console.error(" on touch start add score:", addScore);

    Game.addStep(
      [curSelectPoker.node],
      [oldParent],
      [lastPos],
      [],
      [-addScore],
      [CMath.ConvertToNodeSpaceAR(this.node, Game.removeNode)]
    );
  }

  onChildRemove(child: cc.Node) {
    if (Game.isGameStarted()) {
      // console.warn(" PokerRoot update root node");
      Game.addPlacePokerRoot(parseInt(this.node.name), this.node);
    }

    let poker = child.getComponent(Poker);
    if (poker) {
      poker.setRecycle(false);
    }

    console.warn(" on child remove update value!!!: ", this.node.childrenCount);
    this.updateTotalValue();
  }

  updateTotalValue() {
    this.totalValue0 = 0;
    this.totalValue1 = 0;
    let count = 0;
    for (let pokerNode of this.node.children) {
      let poker = pokerNode.getComponent(Poker);
      count++;
      if (poker.isWildCard()) {
        let value = TARGET_POINT - this.totalValue0;

        this.setTotalValue(value, true, false, count);
      } else {
        this.setTotalValue(poker.getValue(), false, false, count);
      }
    }

    this.updateValueLabel();
  }

  onAddChild(child: cc.Node) {
    let poker = child.getComponent(Poker);
    child.zIndex = Math.floor(Math.abs(poker.getDefaultPosition().y));
    console.error(" zIndez child value:", poker.getValue(true));
    if (!poker) return;
    poker.setRecycle(true);
    console.warn(" on child add update value!!!:", this.node.childrenCount);
    this.updateTotalValue();
  }

  setTotalValue(
    value: number,
    isWild: boolean,
    isCheck: boolean,
    count: number
  ): number {
    let addScore = 0;

    let totalValue0_test = this.totalValue0;
    let totalValue1_test = this.totalValue1;
    totalValue0_test += value;
    totalValue1_test += value;
    if (value == 1) {
      if (totalValue0_test + 10 == 21) {
        totalValue0_test = 21;
      }
      if (totalValue1_test != 21) {
        totalValue1_test += 10;
      }
    }

    if (totalValue1_test > 21 || totalValue1_test == totalValue0_test)
      totalValue1_test = 0;

    totalValue0_test = Math.max(0, totalValue0_test);
    totalValue1_test = Math.max(0, totalValue1_test);

    if (totalValue0_test > 21) {
      this.boom(isCheck);
    } else {
      if (totalValue0_test == 21 || totalValue1_test == 21) {
        addScore += this.complete(isWild, isCheck);
        console.error(" add Score:", addScore);
      } else {
        if (count >= 5) {
          addScore += this.overFive(isCheck);
        } else {
          Game.clearStreak();
        }
      }
    }

    if (!isCheck) {
      this.totalValue0 = totalValue0_test;
      this.totalValue1 = totalValue1_test;
    }
    console.error(" set total value score:", addScore);
    return addScore;
  }

  checkAddScore(isWild: boolean) {
    let addScore = 0;
    let totalValue0_test = this.totalValue0;
    let totalValue1_test = this.totalValue1;
    if (totalValue0_test > 21) {
    } else {
      if (totalValue0_test == 21 || totalValue1_test == 21) {
        addScore += this.complete(isWild, true);
        console.error(" add Score:", addScore);
      } else {
        if (this.node.childrenCount >= 5) {
          addScore += this.overFive(true);
        } else {
          Game.clearStreak();
        }
      }
    }
    return addScore;
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
  boom(isCheck: boolean) {
    if (!isCheck) {
      console.log(" 超过21点爆掉");
      this.flyALLChildren(0);
      this.totalValue0 = 0;
      this.totalValue1 = 0;
      this.updateValueLabel();
      Game.clearStreak();
      Game.addRecyclePoker(1);
    }
  }

  /** 完成 */
  complete(isWild: boolean, isCheck: boolean): number {
    let score = isWild ? WILD_21_SCORE : NORMAL_21_SCORE;
    if (Game.getStreak() >= 3) {
      score += (Game.getStreak() - 2) * STREAK_SCORE;
    }
    if (!isCheck) {
      console.log(" 完成 21点");
      this.flyALLChildren(isWild ? WILD_21_SCORE : NORMAL_21_SCORE);
      this.totalValue0 = 0;
      this.totalValue1 = 0;
      this.updateValueLabel();
      Game.addStreak(1);
      if (Game.getStreak() >= 2) {
        Game.addScore(
          (Game.getStreak() - 1) * STREAK_SCORE,
          CMath.ConvertToNodeSpaceAR(this.node, Game.removeNode)
        );
      }
    }

    return score;
  }

  /** 超过五张 */
  overFive(isCheck: boolean): number {
    let score = OVER_5_SCORE;
    if (Game.getStreak() >= 3) {
      score += (Game.getStreak() - 2) * STREAK_SCORE;
    }
    if (!isCheck) {
      console.log(" 超过5张 ");
      this.flyALLChildren(OVER_5_SCORE);
      this.totalValue0 = 0;
      this.totalValue1 = 0;
      this.updateValueLabel();
      Game.addStreak(1);
      if (Game.getStreak() >= 2) {
        Game.addScore(
          (Game.getStreak() - 1) * STREAK_SCORE,
          CMath.ConvertToNodeSpaceAR(this.node, Game.removeNode)
        );
      }
    }
    return score;
  }

  flyALLChildren(addScore: number) {
    let children = this.node.children.reverse();
    let count = children.length;
    for (let child of children) {
      let poker = child.getComponent(Poker);

      poker.autoCompleteDone(
        count * 0.05,
        parseInt(this.node.name) > 1 ? -1 : 1,
        count,
        addScore == 0
      );
      count--;
      if (count == children.length - 1 && addScore > 0) {
        Game.addScore(
          addScore,
          CMath.ConvertToNodeSpaceAR(child, Game.removeNode)
        );
      }
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
