import { Game } from "./controller/Game";
import { gFactory } from "./controller/GameFactory";

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

enum CardState {
  Front,
  Back
}

@ccclass
export default class Poker extends cc.Component {
  @property(cc.Sprite)
  frontCard: cc.Sprite = null;

  @property(cc.Sprite)
  backCard: cc.Sprite = null;

  @property(cc.SpriteAtlas)
  pokerAtlas: cc.SpriteAtlas = null;

  private carState: CardState;
  private flips: number[] = [];
  private value: number = 0;

  private defaultPos: cc.Vec2;
  private canMove: boolean = false;

  private key: number = -1;
  private next: Poker = null;
  private forward: Poker = null;

  private defualtChildCount = 0;

  private isCheck: boolean = false;

  reuse() {
    this.value = arguments[0][0][0];
    this.frontCard.spriteFrame = this.pokerAtlas.getSpriteFrame(
      "spade_" + this.value
    );
    this.setCardState(CardState.Back);
    this.initEvent();
  }

  unuse() {
    this.node.targetOff(this);
  }

  getValue() {
    return this.value;
  }

  onLoad() {
    this.defualtChildCount = this.node.childrenCount;
    this.setCardState(CardState.Back);
    this.node["_onSetParent"] = this.onSetParent.bind(this);
  }

  initEvent() {
    this.node.on(cc.Node.EventType.CHILD_ADDED, this.onAddChild, this);
    this.node.on(cc.Node.EventType.CHILD_REMOVED, this.onChildRemove, this);

    this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onMove, this);
    this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onMoveEnd, this);
    this.node.on(cc.Node.EventType.TOUCH_END, this.onMoveEnd, this);

    this.node.on("check-done", this.onCheckDone, this);
  }

  onCheckDone(key: number) {
    if (this.key != key || !this.isCheck) return;
    this.node.runAction(
      cc.sequence(
        cc.spawn(cc.rotateBy(2, 360), cc.moveBy(1, 30)),
        cc.callFunc(() => {
          gFactory.putPoker(this.node);
        }, this)
      )
    );
  }

  setDefaultPosition(pos?: cc.Vec2) {
    this.defaultPos = pos ? pos : this.node.position.clone();
  }

  setKey(key: number) {
    this.key = key;
    this.node
      .getChildByName("Label")
      .getComponent(cc.Label).string = key.toString();
    if (this.next) {
      this.next.setKey(key);
    }
  }

  getKey() {
    return this.key;
  }

  onTouchStart(e: cc.Event.EventTouch) {}

  onMove(e: cc.Event.EventTouch) {
    e.bubbles = false;
    if (!this.canMove) return;
    this.node.group = "top";
    let move = e.getDelta();
    this.node.x += move.x;
    this.node.y += move.y;
  }

  onMoveEnd(e: cc.Event.EventTouch) {
    e.bubbles = false;
    if (this.defaultPos && this.canMove) {
      let placeIndex = this.checkCanPlace();
      if (placeIndex >= 0) {
        this.placeToNewRoot(placeIndex);
      } else {
        this.node.runAction(
          cc.sequence(
            cc.moveTo(0.1, this.defaultPos.x, this.defaultPos.y),
            cc.callFunc(() => {
              this.node.group = "default";
            }, this)
          )
        );
      }
    }
  }

  checkCanPlace(): number {
    let distance = 50;
    let index = -1;
    Game.placePokerRoot.forEach((key: number, root: cc.Node) => {
      let poker = root.getComponent(Poker);

      if ((poker && poker.getValue() - this.value == 1) || !poker) {
        let dis = CMath.Distance(
          this.node.parent.convertToNodeSpaceAR(
            root.convertToWorldSpaceAR(root.position)
          ),
          this.node.position
        );

        if (dis < distance) {
          distance = dis;
          index = key;
        }
      }
    });

    return index;
  }

  updateRootNode(index: number) {
    if (this.node.childrenCount <= this.defualtChildCount) {
      Game.placePokerRoot.add(index, this.node);
      this.check(1);
    } else {
      if (this.next) {
        this.next.updateRootNode.call(this.next, index);
      } else {
        return;
      }
    }
  }

  placeToNewRoot(index: number) {
    let root = Game.placePokerRoot.get(index);

    let selfPos = root.convertToNodeSpaceAR(
      this.node.convertToWorldSpaceAR(this.node.position)
    );

    this.node.setParent(root);
    this.node.setPosition(selfPos);

    this.node.runAction(
      cc.sequence(
        cc.moveTo(0.1, 0, -30),
        cc.callFunc(() => {
          this.setDefaultPosition();
          this.node.group = "default";
        }, this)
      )
    );
  }

  /** 从A开始检测到K */
  check(valua: number) {
    console.log(" check :", valua, this.value);
    if (this.value == valua) {
      this.isCheck = true;
      if (valua == 13) {
        console.log(" check done ");
        this.node.emit("check-done", this.key);
      } else {
        if (this.forward) {
          this.forward.check.call(this.forward, valua + 1);
        }
      }
    } else {
      this.isCheck = false;
    }
  }

  onAddChild(child: cc.Node) {
    let poker = child.getComponent(Poker);
    if (!poker) {
      console.error(" 没有 Poker类");
      return;
    }
    this.next = poker;
    if (this.value - poker.getValue() == 1) {
      this.setNormal();
    } else {
      this.setAllGray();
    }

    poker.setNormal();
    this.updateRootNode(this.key);
  }

  onChildRemove() {
    console.log(" onChildRemove:", this.node.childrenCount);
    if (this.node.childrenCount <= this.defualtChildCount) {
      this.next = null;
      Game.placePokerRoot.add(this.key, this.node);
      if (this.carState == CardState.Back) {
        this.flipCard(0.1);
      }
      this.setNormal();
      if (this.forward) {
        this.forward.updateState.call(this.forward);
      }
    }
  }

  updateState() {
    if (
      this.next &&
      this.value - this.next.getValue() == 1 &&
      this.next.isNormal()
    ) {
      this.setNormal();
    } else {
      this.setAllGray();
      return;
    }
    if (this.forward) {
      this.forward.updateState.call(this.forward);
    }
  }

  setAllGray() {
    if (!this.node.parent) return;
    let poker = this.node.parent.getComponent(Poker);
    if (!poker) return;
    this.frontCard.node.color = cc.Color.GRAY;
    this.canMove = false;
    poker.setAllGray();
  }

  setNormal() {
    this.frontCard.node.color = cc.Color.WHITE;
    this.canMove = this.carState == CardState.Front;
  }

  setCardState(state: CardState) {
    this.carState = state;
    this.frontCard.node.scaleX = this.carState == CardState.Front ? 1 : 0;
    this.backCard.node.scaleX = this.carState == CardState.Back ? 1 : 0;
    this.canMove = this.carState == CardState.Front;
    if (this.canMove) {
      this.frontCard.node.color = cc.Color.WHITE;
      this.setDefaultPosition();
    }
  }

  isNormal() {
    return this.carState == CardState.Front;
  }

  flipCard(duration: number = 1) {
    if (
      this.frontCard.node.getNumberOfRunningActions() > 0 ||
      this.backCard.node.getNumberOfRunningActions() > 0
    ) {
      console.warn("翻面未完成");
      this.flips.push(duration);
      return;
    }
    // 背面翻正面
    if (this.carState == CardState.Back) {
      this.frontCard.node.runAction(
        cc.sequence(
          cc.delayTime(duration),
          cc.scaleTo(duration, 1, 1),
          cc.callFunc(() => {
            this.setCardState(CardState.Front);
            if (this.flips.length > 0) {
              this.frontCard.node.stopAllActions();
              this.flipCard.call(this, this.flips.pop());
            }
          }, this)
        )
      );
      this.backCard.node.runAction(cc.scaleTo(duration, 0, 1));
    } else {
      // 正面翻背面
      this.backCard.node.runAction(
        cc.sequence(
          cc.delayTime(duration),
          cc.scaleTo(duration, 1, 1),
          cc.callFunc(() => {
            this.setCardState(CardState.Back);
            if (this.flips.length > 0) {
              this.backCard.node.stopAllActions();
              this.flipCard.call(this, this.flips.pop());
            }
          }, this)
        )
      );
      this.frontCard.node.runAction(cc.scaleTo(duration, 0, 1));
    }
  }

  start() {}

  update(dt: number) {
    if (Game.placePokerRoot.keyOf(this.node) != null) {
      this.frontCard.node.color = this.canMove ? cc.Color.GREEN : cc.Color.RED;
    } else {
      this.frontCard.node.color = this.canMove ? cc.Color.WHITE : cc.Color.GRAY;
    }
  }

  onSetParent(parent: cc.Node) {
    if (!parent) return;
    let poker = parent.getComponent(Poker);
    if (poker) {
      this.forward = poker;
      this.setKey(poker.getKey());
    } else {
      this.setKey(parseInt(parent.name));
    }
  }
}
