import { Game } from "./controller/Game";
import { gFactory } from "./controller/GameFactory";
import { OFFSET_Y, ACTION_TAG } from "./Pokers";
import { gEventMgr } from "./controller/EventManager";
import { GlobalEvent } from "./controller/EventName";

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

export enum CardState {
  Front,
  Back
}

export enum PokerColor {
  Red,
  Black
}

export enum PokerType {
  Club,
  Spade,
  Heart,
  Diamond
}

@ccclass
export default class Poker extends cc.Component {
  @property(cc.Sprite)
  frontCard: cc.Sprite = null;

  @property(cc.Sprite)
  backCard: cc.Sprite = null;

  @property(cc.SpriteAtlas)
  pokerAtlas: cc.SpriteAtlas = null;

  @property(cc.Animation)
  RecycleAnimation: cc.Animation = null;

  private static DebugRecycIndex: number = 0;

  private carState: CardState;
  private flips: number[] = [];
  private value: number = 0;

  private defaultPos: cc.Vec2;
  private lastPos: cc.Vec2;
  private flipPos: cc.Vec2;
  private canMove: boolean = false;

  private key: number = -1;
  private next: Poker = null;
  private forward: Poker = null;
  private pokerColer: PokerColor;
  private pokerType: PokerType;

  private defualtChildCount = 0;

  private isCheck: boolean = false;

  private cycled: boolean = false;

  private placeLimit: cc.Size = cc.size(0, 0);

  private isReadyAutoComplete: boolean = false;

  private recycleActionInfo: {
    startTime: number;
    duration: number;
  } = { startTime: 0, duration: 0 };
  reuse() {
    this.isReadyAutoComplete = false;
    let pokerInfo: string = arguments[0][0][0];
    console.log(
      " ----------------------- poker reuse ---------------------------"
    );
    console.log(arguments[0][0][0]);
    this.value = parseInt(pokerInfo.split(",")[1]);
    let type = pokerInfo.split(",")[0];
    this.pokerColer =
      type == "spade_" || type == "club_" ? PokerColor.Black : PokerColor.Red;
    switch (type) {
      case "spade_":
        this.pokerType = PokerType.Spade;
        break;
      case "club_":
        this.pokerType = PokerType.Club;
        break;
      case "heart_":
        this.pokerType = PokerType.Heart;
        break;
      case "diamond_":
        this.pokerType = PokerType.Diamond;
        break;
    }

    this.frontCard.spriteFrame = this.pokerAtlas.getSpriteFrame(
      pokerInfo.split(",")[0] + this.value
    );
    if (!this.frontCard.spriteFrame) {
      console.error(pokerInfo.split(",")[0] + this.value);
    }
    this.setCardState(CardState.Back);
    this.initEvent();
  }

  getPokerColor() {
    return this.pokerColer;
  }

  getPokerType() {
    return this.pokerType;
  }

  unuse() {
    this.node.targetOff(this);
    gEventMgr.targetOff(this);
    this.cycled = false;
  }

  getNext() {
    return this.next;
  }

  getForward() {
    return this.forward;
  }

  setNext(next: Poker) {
    this.next = next;
    this.node.getChildByName("Label").getComponent(cc.Label).string =
      "next:" +
      (this.next ? this.next.getValue() : "null") +
      ", key:" +
      this.key;
  }

  setForward(forward: Poker) {
    this.forward = forward;
  }

  setRecycle(cycled: boolean) {
    if (this.cycled == cycled) return;

    this.cycled = cycled;
    if (this.cycled) {
      Game.addRecycleCount(1);
    } else {
      Game.addRecycleCount(-1);
    }
  }

  getValue() {
    return this.value;
  }

  getCardState() {
    return this.carState;
  }

  onLoad() {
    this.RecycleAnimation.node.opacity = 0;
    this.placeLimit.width = this.node.width / 2;
    this.placeLimit.height = this.node.height * 0.75;
    this.node.getChildByName("Label").active = false; // CC_DEBUG;
    this.defualtChildCount = this.node.childrenCount;
    // console.log(" default children count:", this.defualtChildCount);
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

    gEventMgr.once(GlobalEvent.COMPLETE, this.autoComplete, this);

    gEventMgr.once(GlobalEvent.AUTO_COMPLETE_DONE, this.autoCompleteDone, this);
  }

  autoCompleteDone() {
    let time = 0;
    time = Math.max(
      0,
      this.recycleActionInfo.duration -
        (Date.now() - this.recycleActionInfo.startTime)
    );
    time += 100;

    this.scheduleOnce(() => {
      let selfPos = CMath.ConvertToNodeSpaceAR(this.node, Game.removeNode);
      this.node.setParent(Game.removeNode);
      this.node.setPosition(selfPos);
      this.node.zIndex = this.value;
    }, time / 1000);

    this.scheduleOnce(() => {
      let dir = this.value % 2 == 1 ? 1 : 1;
      let offsetX = CMath.getRandom(0, 2);
      this.canMove = false;

      this.node.runAction(
        cc.sequence(
          cc.delayTime((13 - this.value) / 10 + CMath.getRandom(0, 2)),
          cc.callFunc(() => {
            this.frontCard.node.opacity = 255;
            this.node.group = "top";
            this.node.zIndex = this.value;
            gEventMgr.emit(GlobalEvent.PLAY_POKER_FLY);
          }, this),
          cc.sequence(
            cc.repeat(
              cc.spawn(
                cc
                  .moveBy(0.01, dir * 1.5 + offsetX, 25)
                  .easing(cc.easeQuinticActionOut()),
                cc.rotateBy(0.01, dir * 20).easing(cc.easeQuadraticActionIn())
              ),

              30
            ),
            cc.repeat(
              cc.spawn(
                cc
                  .moveBy(0.01, dir * 2 + offsetX, -25)
                  .easing(cc.easeQuinticActionIn()),
                cc.rotateBy(0.01, dir * 20).easing(cc.easeQuadraticActionIn())
              ),
              180
            ),
            cc.callFunc(() => {
              console.log("done!");
              gFactory.putPoker(this.node);
              Game.addRemovePokerCount(1);
            }, this)
          )
        )
      );
    }, (13 - this.value) / 500 + time / 1000 + 0.05);
  }

  autoComplete() {
    if (
      (!this.next && this.node.getParent().name != "PokerFlipRoot") ||
      this.isCycled()
    ) {
      this.isReadyAutoComplete = true;
      console.error(" isAutoComplete:", this.isReadyAutoComplete);
    } else {
      this.isReadyAutoComplete = false;
    }
  }

  onCheckDone(key: number) {
    // console.log(" check done: ", key, ":", this.key, this.value);
    if (this.key != key || !this.isCheck) return;
  }

  setDefaultPosition(pos?: cc.Vec2) {
    this.defaultPos = pos ? pos : this.node.position.clone();
  }

  setLastPosition(pos?: cc.Vec2) {
    this.lastPos = pos ? pos : this.node.position.clone();
  }

  setFlipPos(pos?: cc.Vec2) {
    this.flipPos = pos ? pos : this.node.position.clone();
  }

  getFlipPos() {
    return this.flipPos ? this.flipPos.clone() : this.node.position.clone();
  }

  getDefaultPosition() {
    return this.defaultPos
      ? this.defaultPos.clone()
      : this.node.position.clone();
  }

  getLastPosition() {
    return this.lastPos ? this.lastPos.clone() : this.node.position.clone();
  }

  setKey(key: number) {
    this.key = key;
    if (key && key.toString() == "NaN") {
      this.node.getChildByName("Label").getComponent(cc.Label).string +=
        "value:" + this.value.toString();
    } else {
      this.node.getChildByName("Label").getComponent(cc.Label).string =
        "next:" +
        (this.next ? this.next.getValue() : "null") +
        ", key:" +
        this.key;
    }
    if (this.next && this.next.getKey() != this.key) {
      this.next.setKey(key);
    }
  }

  getKey() {
    return this.key;
  }

  onTouchStart(e: cc.Event.EventTouch) {
    e.bubbles = !this.isNormal();
    this.node.stopActionByTag(ACTION_TAG.SHAKE);
    if (Game.isTimeOver() || Game.isComplete()) return;
    if (!Game.isGameStarted()) Game.start();

    gEventMgr.emit(GlobalEvent.PLAY_POKER_PLACE);
  }

  checkAutoRecycle() {
    if (this.cycled) {
      // console.log(" poker is recycled !!! recycle count");
      return false;
    }

    if (this.node.childrenCount > this.defualtChildCount) {
      // console.log(
      //   " poker has next !!!, childcount:",
      //   this.node.childrenCount,
      //   ", default:",
      //   this.defualtChildCount
      // );
      // this.frontCard.node.color = cc.Color.RED;
      return false;
    }

    let index = -1;

    if (window["CheatOpen"]) {
      index = Poker.DebugRecycIndex++ % 4;
    } else {
      Game.getCycledPokerRoot().forEach((key: number, node: cc.Node) => {
        let poker = node.getComponent(Poker);
        if (poker) {
          if (Poker.checkRecycled(poker, this)) {
            index = key;
          }
        } else {
          if (this.value == 1) {
            index = key;
          }
        }
      });
    }

    if (index >= 0) {
      // console.log(" recycle count auto place to recycled root:", index);
      this.placeToNewCycleNode(index);
    }

    return index >= 0;
  }

  onMove(e: cc.Event.EventTouch) {
    e.bubbles = false;
    if (Game.isTimeOver() || Game.isComplete()) return;
    if (!this.canMove) return;

    if (this.isCycled() && this.next) return;

    let action = this.node.getActionByTag(ACTION_TAG.RECYCLE);
    if (action && !action.isDone()) return;

    this.node.group = "top";
    let move = e.getDelta();
    this.node.x += move.x;
    this.node.y += move.y;
  }

  setCanMove(isCanMove: boolean) {
    // console.log("setCanMove:", isCanMove);
    this.canMove = isCanMove;
  }

  onMoveEnd(e: cc.Event.EventTouch) {
    e.bubbles = false;
    if (Game.isTimeOver() || Game.isComplete()) return;
    let action = this.node.getActionByTag(ACTION_TAG.RECYCLE);
    if (action && !action.isDone()) return;

    if (this.defaultPos && this.canMove) {
      let placeIndex = this.checkCanPlace();
      if (placeIndex >= 0) {
        // console.log(" place to new Root:", placeIndex);
        this.placeToNewRoot(placeIndex);
      } else {
        let recycleIndex = this.checkCanRecycled();

        // console.log("recycle count recycleIndex:", recycleIndex);
        if (recycleIndex >= 0) {
          // console.error(
          //   " recycle count place to new Cycled Root:",
          //   recycleIndex
          // );

          this.placeToNewCycleNode(recycleIndex);
        } else if (!this.checkAutoRecycle()) {
          if (CMath.Distance(this.node.position, this.defaultPos) < 5) {
            this.node.group = "default";
            this.node.setPosition(this.defaultPos);
            if (!this.next) this.shake();
          } else {
            gEventMgr.emit(GlobalEvent.DEV_POKERS);
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
    }
  }

  checkCanPlace(): number {
    let index = -1;
    Game.getPlacePokerRoot().forEach((key: number, root: cc.Node) => {
      let poker = root.getComponent(Poker);
      if (this.node.name == root.name && poker) return;

      if (poker && poker.getKey() == this.getKey()) return;

      if (
        (poker && Poker.checkBeNext(poker, this)) ||
        (!poker && this.value == 13)
      ) {
        let pos = CMath.ConvertToNodeSpaceAR(root, this.node.parent);
        if (
          Math.abs(pos.x - this.node.position.x) <= this.placeLimit.width &&
          Math.abs(pos.y - this.node.position.y) <= this.placeLimit.height
        ) {
          index = key;
        }
      }
    });

    return index;
  }

  checkCanRecycled() {
    let index = -1;

    if (this.node.childrenCount > this.defualtChildCount) return index;

    Game.getCycledPokerRoot().forEach((key: number, root: cc.Node) => {
      let poker = root.getComponent(Poker);
      if (this.node.name != root.name || !poker) {
        if (
          (poker && Poker.checkRecycled(poker, this)) ||
          (!poker && this.value == 1)
        ) {
          let pos = CMath.ConvertToNodeSpaceAR(root, this.node.parent);
          // console.log("recycle count:", pos);
          if (
            Math.abs(pos.x - this.node.x) <= this.placeLimit.width &&
            Math.abs(pos.y - this.node.y) <= this.placeLimit.height
          ) {
            index = key;
          }
        }
      } else {
        // console.error(
        //   " recycle count == this.node.name:",
        //   this.node.name,
        //   ", root.name:",
        //   root.name,
        //   ", key:",
        //   key,
        //   "value:",
        //   this.getValue()
        // );
        // if (poker) {
        //   console.error("recycle count :", poker.getValue());
        // }
      }
    });

    return index;
  }

  updateRootNode(index: number) {
    // console.log(
    //   "this.node.childrenCount：",
    //   this.node.childrenCount,
    //   "name:",
    //   this.node.name,
    //   "key:",
    //   this.key,
    //   "value:",
    //   this.value,
    //   "this.defualtChildCount:",
    //   this.defualtChildCount
    // );

    if (this.cycled || this.key == null || index == null) return;
    if (this.node.childrenCount <= this.defualtChildCount) {
      // console.warn("update poker root:", index, ", value:", this.value);
      Game.addPlacePokerRoot(index, this.node);
      //this.check(1);
    } else {
      if (this.next) {
        // console.log(
        //   "this.next:",
        //   this.next.getValue(),
        //   ",key:" + this.next.getKey()
        // );
        this.next.updateRootNode.call(this.next, index);
      } else {
        // console.log("no next, value:", this.value, ", key:", this.key);
        return;
      }
    }
  }

  placeToNewRoot(index: number) {
    let root = Game.getPlacePokerRoot().get(index);

    let selfPos = CMath.ConvertToNodeSpaceAR(this.node, root);

    let score = 0;
    if (this.isCycled()) {
      score = -(13 - this.value) * 10;
    }

    let socre2 = 0;
    let addFlip = this.node.getParent().name == "PokerFlipRoot";
    if (addFlip) {
      socre2 = 20;
    }

    Game.resetCombo();

    let scorePos = CMath.ConvertToNodeSpaceAR(this.node, Game.removeNode);

    Game.addScore(score, scorePos);
    Game.addScore(
      socre2,
      CMath.ConvertToNodeSpaceAR(this.node.getParent(), Game.removeNode)
    );

    if (this.forward && this.forward.carState == CardState.Back) {
      Game.addStep(
        [this.node],
        [this.forward.node],
        [this.node.position.clone()],
        [
          {
            callback: this.forward.flipCard,
            args: [
              0.1,
              false,
              () => {
                Game.addFlipCounts(-1);
              }
            ],
            target: this.forward
          }
        ],
        [-20 - score - socre2],
        [scorePos]
      );
    } else {
      let funs = [];
      if (addFlip) {
        funs = [
          {
            callback: Game.addFlipCounts,
            args: [-1],
            target: Game
          }
        ];
      }
      Game.addStep(
        [this.node],
        [this.node.getParent()],
        [this.node.position.clone()],
        funs,
        [-score - socre2],
        [scorePos]
      );
    }
    // console.log(" recycle count -- place new root setParent");
    this.node.setParent(root);
    this.node.setPosition(selfPos);

    let offset = 0;
    if (root.getComponent(Poker)) {
      offset = OFFSET_Y;
    }

    this.setDefaultPosition(cc.v2(0, offset));
    gEventMgr.emit(GlobalEvent.DEV_POKERS);
    this.node.runAction(
      cc.sequence(
        cc.moveTo(0.1, 0, offset),
        cc.callFunc(() => {
          if (addFlip) {
            Game.addFlipCounts(1);
          }
          this.node.group = "default";
        }, this)
      )
    );
  }

  isCycled() {
    return this.cycled;
  }

  placeToNewCycleNode(index: number, delay: number = 0) {
    let root = Game.getCycledPokerRoot().get(index);
    if (this.node.getParent() == root) {
      console.error(" click too quick recycle count");
      return;
    }

    let selfPos = CMath.ConvertToNodeSpaceAR(this.node, root);

    let score = (13 - this.value) * 10;
    let socre2 = 0;
    let addFlip = this.node.getParent().name == "PokerFlipRoot";
    if (addFlip) {
      socre2 = 20;
      Game.addFlipCounts(1);
    }

    if (this.isCycled()) {
      score = 0;
      socre2 = 0;
    } else {
      Game.addCombo(1);
    }

    let scorePos = CMath.ConvertToNodeSpaceAR(root, Game.removeNode);
    this.setRecycle(true);
    Game.addScore(score, scorePos);
    Game.addScore(
      socre2,
      CMath.ConvertToNodeSpaceAR(this.node, Game.removeNode)
    );

    if (this.forward && this.forward.carState == CardState.Back) {
      Game.addStep(
        [this.node],
        [this.forward.node],
        [this.node.position.clone()],
        [
          {
            callback: this.forward.flipCard,
            args: [
              0.1,
              false,
              () => {
                Game.addFlipCounts(-1);
              }
            ],
            target: this.forward
          }
        ],
        [-20 - score - socre2],
        [scorePos]
      );
    } else {
      let funs = [];
      if (addFlip) {
        funs = [
          {
            callback: Game.addFlipCounts,
            args: [-1],
            target: Game
          }
        ];
      }
      Game.addStep(
        [this.node],
        [this.node.getParent()],
        [this.node.position.clone()],
        funs,
        [-score - socre2],
        [scorePos]
      );
    }

    let completeFunc: Function;
    if (Game.isComplete()) {
      if (this.forward) {
        completeFunc = this.forward.autoComplete.bind(this.forward);
      }
    }

    this.node.setParent(root);
    this.node.setPosition(selfPos);
    let distance = CMath.Distance(selfPos, cc.v2(0, 0));
    let time = distance / 2500;
    this.setKey(null);
    this.setNext(null);
    Game.addCycledPokerRoot(index, this.node);
    this.node.group = "top";
    this.setDefaultPosition(cc.v2(0, 0));

    let action = cc.sequence(
      cc.delayTime(delay),

      cc.moveTo(time, 0, 0),
      cc.callFunc(() => {
        gEventMgr.emit(GlobalEvent.DEV_POKERS);
        gEventMgr.emit(GlobalEvent.PLAY_RECYCLE);
      }),
      cc.delayTime(0),
      cc.callFunc(() => {
        this.node.group = "default";
        this.RecycleAnimation.play();
        if (!Game.checkIsRecycleComplete() && completeFunc) {
          setTimeout(completeFunc, index / 5);
        }
      }, this)
    );

    (this.recycleActionInfo.duration = (delay + time) * 1000),
      (this.recycleActionInfo.startTime = Date.now());
    action.setTag(ACTION_TAG.RECYCLE);
    this.node.runAction(action);
  }

  /** 从A开始检测到K */
  check(valua: number) {
    if (this.carState == CardState.Back) return;
    // console.log(" check :", valua, this.value);
    if (this.value == valua) {
      this.isCheck = true;
      if (valua == 13) {
        this.emitCheckDone();
        Game.clearStep();
      } else {
        if (this.forward) {
          this.forward.check.call(this.forward, valua + 1);
        }
      }
    } else {
      this.isCheck = false;
    }
  }

  shake() {
    if (this.isCycled()) return;
    this.node.group = "default";
    let pos = this.getDefaultPosition();
    let shake = cc.sequence(
      cc.repeat(
        cc.sequence(
          cc.moveTo(0.02, pos.x - 10, pos.y),
          cc.moveTo(0.04, pos.x + 20, pos.y),
          cc.moveTo(0.02, pos.x - 10, pos.y)
        ),
        5
      ),
      cc.moveTo(0.01, pos.x, pos.y)
    );
    shake.setTag(ACTION_TAG.SHAKE);
    this.node.stopActionByTag(ACTION_TAG.SHAKE);
    this.node.runAction(shake);
    gEventMgr.emit(GlobalEvent.PLAY_SHAKE);
  }

  emitCheckDone() {
    this.node.emit("check-done", this.key);
    if (this.next) {
      this.next.emitCheckDone.call(this.next);
    }
  }

  onAddChild(child: cc.Node) {
    // console.log("onAddChild:", this.value, this.key);
    let poker = child.getComponent(Poker);
    if (!poker) {
      console.error(" 没有 Poker类");
      return;
    }

    this.setNext(poker);
    if (this.cycled) {
      // console.log("----------------------- cycled -----------------");
      poker.setRecycle(true);
      if (this.forward && this.forward.forward) {
        let forward = this.forward.forward;
        this.scheduleOnce(() => {
          forward.frontCard.node.opacity = 0;
        }, 0.1);
      }
      return;
    }

    // console.log("  on addChild poker recycle count");
    poker.setRecycle(false);

    if (Poker.checkBeNext(this, this.next)) {
      this.setNormal();
    } else {
      // console.log(
      //   " onAddChild call setAllGray:",
      //   this.value,
      //   ",key:",
      //   this.key
      // );
      this.setAllGray();
    }

    poker.setNormal();
    this.updateRootNode(this.key);
  }

  public static checkBeNext(poker: Poker, next: Poker) {
    if (!next || !poker) return false;
    if (window["CheatOpen"]) {
      return true;
    }
    return (
      poker.getValue() - next.getValue() == 1 &&
      poker.getPokerColor() != next.getPokerColor()
    );
  }

  public static checkRecycled(poker: Poker, next: Poker) {
    if (!next || !poker) return false;
    if (window["CheatOpen"]) {
      console.log("  checkRecycled recycle count ", poker != next);
      return poker != next;
    }

    return (
      poker.getValue() - next.getValue() == -1 &&
      poker.getPokerType() == next.getPokerType()
    );
  }

  onChildRemove(child: cc.Node) {
    this.setNext(null);
    if (!Game.isGameStarted() || Game.isComplete()) return;

    if (this.cycled) {
      if (this.forward && this.forward.forward) {
        this.forward.forward.frontCard.node.opacity = 255;
      }

      let poker = child.getComponent(Poker);
      let index = Game.getCycledPokerRoot().keyOf(child);

      if (index != null) {
        // console.log(" onChildRemove cycled ------------recycle count:", index);
        Game.addCycledPokerRoot(index, this.node);
      }
      let parentPoker = child.getParent().getComponent(Poker);
      if (
        poker &&
        ((parentPoker && !parentPoker.isCycled()) ||
          (!parentPoker && child.getParent().getParent().name != "CycleRoot"))
      ) {
        poker.setRecycle(false);
      }
      return;
    }

    if (this.node.childrenCount <= this.defualtChildCount) {
      // console.warn(
      //   "onChildRemove update poker root:",
      //   this.key,
      //   ",value:",
      //   this.value
      // );
      Game.addPlacePokerRoot(this.key, this.node);
      this.setNormal();
      if (this.carState == CardState.Back) {
        this.flipCard(0.1);
        Game.addFlipCounts(1);
        Game.addScore(
          20,
          CMath.ConvertToNodeSpaceAR(this.node, Game.removeNode)
        );
      } else {
        if (this.forward) {
          this.forward.updateState.call(this.forward);
        }
      }
    }
  }

  updateState() {
    if (this.next) {
      if (Poker.checkBeNext(this, this.next) && this.next.isNormal()) {
        this.setNormal();
      } else {
        this.frontCard.node.color = cc.Color.GRAY;
        this.canMove = false;
      }
      if (this.forward) {
        this.forward.updateState.call(this.forward);
      }
    } else {
      this.setNormal();
    }
  }

  setAllGray() {
    if (!this.node.parent) return;
    // console.warn(" setGray:", this.value, ",key:", this.key);
    this.frontCard.node.color = cc.Color.GRAY;
    this.canMove = false;
    if (this.forward) {
      // console.log(
      //   " self call setAllGray:",
      //   this.forward.getValue(),
      //   ",key:",
      //   this.forward.getKey()
      // );
      this.forward.setAllGray.call(this.forward);
    }
  }

  setNormal() {
    // console.log("setNormal:", this.value, ", setNormal key:", this.key);
    this.frontCard.node.color = cc.Color.WHITE;
    this.canMove = this.carState == CardState.Front;
  }

  isGray() {
    return this.frontCard.node.color == cc.Color.GRAY && this.canMove == false;
  }

  setCardState(state: CardState, canMove: boolean = true) {
    // console.log("setCardState:", this.value, this.key, canMove);
    this.carState = state;
    this.frontCard.node.scaleX = this.carState == CardState.Front ? 1 : 0;
    this.backCard.node.scaleX = this.carState == CardState.Back ? 1 : 0;
    this.canMove = this.carState == CardState.Front && canMove;

    if (this.canMove) {
      if (this.next && !Poker.checkBeNext(this, this.next)) {
        this.canMove = false;
      }
    }

    if (this.canMove) {
      this.frontCard.node.color = cc.Color.WHITE;
      this.setDefaultPosition();
    } else if (this.forward) {
      this.frontCard.node.color = cc.Color.GRAY;
    }
  }

  isNormal() {
    return this.carState == CardState.Front && this.canMove;
  }

  isFront() {
    return this.carState == CardState.Front;
  }

  flipCard(duration: number = 1, canMove: boolean = true, callback?: Function) {
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
            this.setCardState(CardState.Front, canMove);
            callback && callback();
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
            this.setCardState(CardState.Back, false);
            callback && callback();
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
    if (this.isCycled()) return;

    if (this.isReadyAutoComplete) {
      this.isReadyAutoComplete = !this.checkAutoRecycle();
    }
  }

  onSetParent(parent: cc.Node) {
    if (!parent) {
      this.setForward(null);
      return;
    }

    let poker = parent.getComponent(Poker);
    if (poker) {
      this.setForward(poker);
      this.setKey(poker.getKey());
    } else {
      this.setForward(null);
      this.setKey(parseInt(parent.name));
    }
  }
}
