import { Game } from "./controller/Game";
import Poker from "./Poker";
import {
  TARGET_POINT,
  OFFSET_Y,
  ACTION_TAG,
  OVER_5_SCORE,
  WILD_21_SCORE,
  NORMAL_21_SCORE,
  STREAK_SCORE,
  SPECIAL_TIME_OFFSET
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

  @property(cc.Node)
  TouchNode: cc.Node = null;

  private totalValue0: number = 0;
  private totalValue1: number = 0;

  private canTouch: boolean = false;

  private touchLimitTime = 0.3;
  private touchTime = 1;
  onLoad() {
    this.node.on(cc.Node.EventType.CHILD_ADDED, this.onAddChild, this);
    this.node.on(cc.Node.EventType.CHILD_REMOVED, this.onChildRemove, this);
    this.TouchNode.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.TouchNode.on(
      cc.Node.EventType.TOUCH_CANCEL,
      (e: cc.Event.EventTouch) => {
        e.bubbles = false;
      },
      this
    );

    this.TouchNode.on(
      cc.Node.EventType.TOUCH_MOVE,
      (e: cc.Event.EventTouch) => {
        e.bubbles = false;
      },
      this
    );

    this.TouchNode.on(
      cc.Node.EventType.TOUCH_END,
      (e: cc.Event.EventTouch) => {
        e.bubbles = false;
      },
      this
    );

    this.SingleValueNode.active = true;
    this.MutilpValueNode.active = false;
  }

  start() {
    this.canTouch = true;
  }

  onTouchStart(e: cc.Event.EventTouch) {
    e.bubbles = false;
    if (!Game.isGameStarted()) Game.start();
    if (this.touchTime < this.touchLimitTime) {
      console.error(" touch time limit!!!!!!!!!!!");
      return;
    }
    let curSelectPoker = Game.getCurSelectPoker();
    if (!curSelectPoker || curSelectPoker.isCycled()) {
      console.error(" curSelectPoker is null!! ");
      return;
    }
    if (!this.canTouch) {
      console.error(" curSelectPoker is null!! ");
      return;
    }
    if (Game.isBoom() || Game.isComplete()) return;

    this.touchTime = 0;
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
    curSelectPoker.node.group = curSelectPoker.isGuide ? "top-guide" : "top";
    curSelectPoker.node.stopActionByTag(ACTION_TAG.SELECT_POKER);
    curSelectPoker.node.stopActionByTag(ACTION_TAG.SHAKE);
    curSelectPoker.node.runAction(
      cc.sequence(
        cc.moveTo(0.1, 0, offset),
        cc.callFunc(() => {
          curSelectPoker.node.group = curSelectPoker.isGuide
            ? "guide"
            : "default";
          this.canTouch = true;
        }, this)
      )
    );

    let res = this.checkAddScore(curSelectPoker.isWildCard());

    let stack = 0,
      streak = 0,
      busted = 0,
      cardused = 0;

    /** 爆掉 */
    if (res[1]) {
      busted += this.node.childrenCount;
    } else {
      cardused += this.node.childrenCount;
      if (res[0] > 0) {
        stack += 1;
        Game.addClearStack(1);
        streak += 1;
      }
    }

    Game.addStep(
      [curSelectPoker.node],
      [oldParent],
      [lastPos],
      [],
      [
        {
          score: -res[0],
          stack: -stack,
          streak: -streak,
          cardused: -cardused,
          busted: -busted
        }
      ],
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
    this.updateTotalValue(false);
  }

  updateTotalValue(isAdd: boolean) {
    this.totalValue0 = 0;
    this.totalValue1 = 0;
    let count = 0;
    for (let pokerNode of this.node.children) {
      let poker = pokerNode.getComponent(Poker);
      count++;
      if (poker.isWildCard()) {
        let value = TARGET_POINT - this.totalValue0;

        this.setTotalValue(
          value,
          true,
          false,
          count,
          count == this.node.children.length && isAdd
        );
      } else {
        this.setTotalValue(
          poker.getValue(),
          false,
          false,
          count,
          count == this.node.children.length && isAdd
        );
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
    this.updateTotalValue(true);
  }

  setTotalValue(
    value: number,
    isWild: boolean,
    isCheck: boolean,
    count: number,
    isEnd: boolean
  ): number {
    let addScore = 0;

    let totalValue0_test = this.totalValue0;
    let totalValue1_test = this.totalValue1;

    if (value == 1) {
      let values = [totalValue0_test, totalValue1_test];
      let result = [];
      for (let num of [1, 11]) {
        for (let val of values) {
          let res = val + num;
          if (result.indexOf(res) < 0) {
            result.push(res);
          }
        }
      }

      result.sort((a, b) => {
        return a - b;
      });
      if (result.indexOf(TARGET_POINT) >= 0) {
        totalValue0_test = totalValue1_test = TARGET_POINT;
      } else {
        totalValue0_test = result[0];
        totalValue1_test = result[1];
      }
    } else {
      totalValue0_test += value; // 2
      totalValue1_test += value; // 12
    }

    totalValue0_test = Math.max(0, totalValue0_test);
    totalValue1_test = Math.max(0, totalValue1_test);

    if (totalValue0_test > TARGET_POINT) {
      this.boom(isCheck);
    } else if (isEnd) {
      if (
        totalValue0_test == TARGET_POINT ||
        totalValue1_test == TARGET_POINT
      ) {
        addScore += this.complete(isWild, isCheck);
        console.error(" add Score:", addScore);
      } else {
        if (count >= 5) {
          addScore += this.overFive(isCheck);
        } else {
          if (!isCheck) {
            this.scheduleOnce(() => {
              gEventMgr.emit(GlobalEvent.CHECK_COMPLETE, 0);
            }, 0.1);
          }
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
    let isBusted: boolean = false;
    if (totalValue0_test > TARGET_POINT) {
      isBusted = true;
    } else {
      if (
        totalValue0_test == TARGET_POINT ||
        totalValue1_test == TARGET_POINT
      ) {
        addScore += this.complete(isWild, true);
        if (this.node.childrenCount >= 5) {
          addScore += OVER_5_SCORE;
        }
        console.error(" add Score:", addScore);
      } else {
        if (this.node.childrenCount >= 5) {
          addScore += this.overFive(true);
        } else {
          Game.clearStreak();
        }
      }
    }
    return [addScore, isBusted];
  }

  updateValueLabel() {
    if (
      this.totalValue1 == 0 ||
      this.totalValue0 == this.totalValue1 ||
      this.totalValue1 > 21
    ) {
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
      gEventMgr.emit(GlobalEvent.PLAY_BUST);
      gEventMgr.emit(GlobalEvent.BUST, parseInt(this.node.name));
      this.scheduleOnce(() => {
        gEventMgr.emit(GlobalEvent.CHECK_COMPLETE, SPECIAL_TIME_OFFSET);
      }, 0.1);
    }
  }

  /** 完成 */
  complete(isWild: boolean, isCheck: boolean): number {
    let score = isWild ? WILD_21_SCORE : NORMAL_21_SCORE;
    if (Game.getStreak() >= 2) {
      score += (Math.min(3, Game.getStreak()) - 1) * STREAK_SCORE;
    }

    let timeDelay = 0;
    if (!isCheck) {
      console.log(" 完成 21点");

      if (this.node.childrenCount >= 5) {
        setTimeout(() => {
          Game.addScore(
            OVER_5_SCORE,
            CMath.ConvertToNodeSpaceAR(this.node, Game.removeNode).add(
              cc.v2(0, -300)
            )
          );
          gEventMgr.emit(GlobalEvent.OVER_FIVE_CARDS, parseInt(this.node.name));
        }, SPECIAL_TIME_OFFSET);
        timeDelay = SPECIAL_TIME_OFFSET;
      }

      this.flyALLChildren(isWild ? WILD_21_SCORE : NORMAL_21_SCORE);

      if (isWild) {
        gEventMgr.emit(GlobalEvent.WILD, parseInt(this.node.name));
      } else {
        gEventMgr.emit(GlobalEvent.COMPLETE_21, parseInt(this.node.name));
      }

      this.totalValue0 = 0;
      this.totalValue1 = 0;
      this.updateValueLabel();
      Game.addStreak(1);
      if (Game.getStreak() >= 2) {
        let streak = Math.min(Game.getStreak(), 3);
        setTimeout(() => {
          Game.addScore(
            (streak - 1) * STREAK_SCORE,
            CMath.ConvertToNodeSpaceAR(this.node, Game.removeNode)
          );
          if (streak >= 3) {
            gEventMgr.emit(GlobalEvent.SUPER_COMBO, parseInt(this.node.name));
          } else {
            gEventMgr.emit(GlobalEvent.COMBO, parseInt(this.node.name));
          }
        }, timeDelay + SPECIAL_TIME_OFFSET);
      }
      this.scheduleOnce(() => {
        gEventMgr.emit(
          GlobalEvent.CHECK_COMPLETE,
          timeDelay + SPECIAL_TIME_OFFSET - 100
        );
      }, 0.1);
    }

    return score;
  }

  /** 超过五张 */
  overFive(isCheck: boolean): number {
    let score = OVER_5_SCORE;
    if (Game.getStreak() >= 2) {
      score += (Game.getStreak() - 1) * STREAK_SCORE;
    }
    if (!isCheck) {
      console.log(" 超过5张 ");
      let timeDelay = 0;
      this.flyALLChildren(OVER_5_SCORE);
      gEventMgr.emit(GlobalEvent.OVER_FIVE_CARDS, parseInt(this.node.name));
      this.totalValue0 = 0;
      this.totalValue1 = 0;
      this.updateValueLabel();
      Game.addStreak(1);
      if (Game.getStreak() >= 2) {
        let streak = Math.min(Game.getStreak(), 3);
        setTimeout(() => {
          Game.addScore(
            (streak - 1) * STREAK_SCORE,
            CMath.ConvertToNodeSpaceAR(this.node, Game.removeNode)
          );
          if (streak >= 3) {
            gEventMgr.emit(GlobalEvent.SUPER_COMBO, parseInt(this.node.name));
          } else {
            gEventMgr.emit(GlobalEvent.COMBO, parseInt(this.node.name));
          }
        }, SPECIAL_TIME_OFFSET);
        timeDelay += SPECIAL_TIME_OFFSET;
      }
      this.scheduleOnce(() => {
        gEventMgr.emit(GlobalEvent.CHECK_COMPLETE, timeDelay);
      }, 0.1);
    }
    return score;
  }

  completeFly() {
    this.flyCount++;
    if (this.flyCount >= this.totalFlyCount) {
      this.canTouch = true;
    }
  }

  private flyCount: number = 0;
  private totalFlyCount: number = 0;
  flyALLChildren(addScore: number) {
    let children = this.node.children.reverse();
    let count = children.length;
    this.totalFlyCount = count;
    this.flyCount = 0;
    this.canTouch = false;
    for (let child of children) {
      let poker = child.getComponent(Poker);

      poker.autoCompleteDone(
        count * 0.05,
        parseInt(this.node.name) > 1 ? -1 : 1,
        count,
        addScore == 0,
        () => {
          this.completeFly();
        }
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
    this.touchTime += dt;
  }
}
