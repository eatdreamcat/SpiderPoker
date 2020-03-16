import { gEventMgr } from "./Controller/EventManager";
import { Game } from "./Controller/Game";
import { GlobalEvent } from "./Controller/EventName";
import {
  BubbleType,
  BubbleLightColor,
  BubbleSize,
  BubbleColor,
  BoomBubbleColor,
  HorseBubble,
  MagicBubble,
  BoomBubbleLightColor,
  HorseBubbleLight,
  MagicBubbleLight
} from "./Const";
import BubbleMove from "./BubbleMove";
import { gFactory } from "./Controller/GameFactory";
import { SpecialType } from "./Data/BubbleMatrix";

/** 泡泡掉落的分数 */
export const BubbleDropScore = 10;

/** 每行加分的步长 */
export const BubbleScoreStep = 10;

/**
 * 泡泡action标签
 */
export const enum BubbleAction {
  /** Q弹 */
  Bubble,
  Collision
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class Bubble extends cc.Component {
  /** 泡泡对应的矩阵index */
  private index: number = -1;

  /** 泡泡的颜色 */
  private color: BubbleType = BubbleType.Blank;

  private type: SpecialType = SpecialType.Normal;

  private animationCallback = {};

  private spriteAtlas: cc.SpriteAtlas = null;

  private doubleScore: boolean = false;

  get Animation() {
    return this.getComponent(cc.Animation);
  }

  get sprite() {
    return this.node.getChildByName("Bubble").getComponent(cc.Sprite);
  }

  get move() {
    return this.getComponent(BubbleMove);
  }

  get IndexLabel() {
    return this.node.getChildByName("Index").getComponent(cc.Label);
  }

  get Color() {
    return this.color;
  }

  get Type() {
    return this.type;
  }

  get Double() {
    return this.node.getChildByName("Bubble").getChildByName("Double");
  }

  get isDouble() {
    return this.type == SpecialType.Double;
  }

  set DoubleScore(double: boolean) {
    this.doubleScore = double;
  }

  get DoubleScore() {
    return this.doubleScore;
  }

  reuse() {
    this.node.active = false;
    this.node.scale = 0;

    this.type = arguments[0][0];

    this.color = arguments[0][2];
    this.spriteAtlas = arguments[0][3];

    this.sprite.node.opacity = 255;

    this.Double.active = this.type == SpecialType.Double;
    this.doubleScore = false;
    this.setIndex(arguments[0][1]);
    this.updateSprite();

    this.initEvent();
  }

  unuse() {
    gEventMgr.targetOff(this);
    this.index = -1;
    this.IndexLabel.string = "";
  }

  setColor(color: BubbleType, type: SpecialType) {
    if (this.color == color) {
      console.warn(" color:", BubbleType[this.color], BubbleType[color]);
      return;
    }
    this.color = color;
    this.type = type;
    // Game.getMatrix().data[this.index].type = this.type;
    // Game.getMatrix().data[this.index].color = this.color;
  }

  updateSprite(light: boolean = false) {
    switch (this.type) {
      case SpecialType.Normal:
      case SpecialType.Double:
        if (light) {
          this.sprite.spriteFrame = this.spriteAtlas.getSpriteFrame(
            BubbleLightColor[this.Color]
          );
        } else {
          this.sprite.spriteFrame = this.spriteAtlas.getSpriteFrame(
            BubbleColor[this.Color]
          );
        }
        break;
      case SpecialType.Boom:
        if (light) {
          this.sprite.spriteFrame = this.spriteAtlas.getSpriteFrame(
            BoomBubbleLightColor[this.Color]
          );
        } else {
          this.sprite.spriteFrame = this.spriteAtlas.getSpriteFrame(
            BoomBubbleColor[this.Color]
          );
        }
        break;
      case SpecialType.Horce:
        if (light) {
          this.sprite.spriteFrame = this.spriteAtlas.getSpriteFrame(
            HorseBubbleLight
          );
        } else {
          this.sprite.spriteFrame = this.spriteAtlas.getSpriteFrame(
            HorseBubble
          );
        }
        break;
      case SpecialType.Magic:
        if (light) {
          this.sprite.spriteFrame = this.spriteAtlas.getSpriteFrame(
            MagicBubbleLight
          );
        } else {
          this.sprite.spriteFrame = this.spriteAtlas.getSpriteFrame(
            MagicBubble
          );
        }
        break;
    }
  }

  setIndex(index: number) {
    if (index == this.index) return;

    let bubbleMatrix = Game.getMatrix();

    if (!bubbleMatrix.data[index] || !bubbleMatrix.data[index].bubble) {
      //console.log('新增泡泡：', index);
      bubbleMatrix.data[index] = {
        color: this.color,
        bubble: this,
        type: this.type
      };
    } else if (bubbleMatrix.data[index].bubble != this) {
      console.error(
        this.index,
        "数据不同步！",
        index,
        ", oldIndex:",
        bubbleMatrix.data[index].bubble.getIndex()
      );
      console.log(bubbleMatrix.data[index]);
    }

    this.index = index;
    //
  }

  updateIndex() {
    if (this.IndexLabel.string == "") {
      this.IndexLabel.string = this.index.toString();
    } else {
      this.IndexLabel.string = "";
    }
  }

  getIndex(): number {
    return this.index;
  }

  setActive(active: boolean, isAction: boolean, delayTime: number) {
    if (this.node.active == active) return;
    this.node.active = active;
    if (!this.node.active) this.node.scale = 0;
    if (this.node.active && isAction) {
      this.bubbleScale(delayTime);
    }
  }

  initEvent() {
    // this.node.on(cc.Node.EventType.TOUCH_END, ()=>{
    //     let neibers = Game.getMatrix().getNeiborMatrix(this.index, 1);
    //     console.log(neibers)
    //     gEventMgr.emit(GlobalEvent.BUBBLE_SCALE_TEST, neibers);
    // }, this);

    gEventMgr.on(GlobalEvent.BUBBLE_SCALE_TEST, this.scaleTest, this);
    this.Animation.on(
      cc.Animation.EventType.FINISHED,
      this.onAnimationComplete,
      this
    );

    this.node["_onSetParent"] = this.onSetParent.bind(this);

    if (CC_DEBUG) {
      cc.systemEvent.on(
        cc.SystemEvent.EventType.KEY_UP,
        event => {
          switch (event.keyCode) {
            case cc.macro.KEY.w:
              this.updateIndex();
              break;
          }
        },
        this
      );
    }
  }

  updateActive(delay: number = 0) {
    this.setActive(this.node.y < this.node.parent.height, true, delay);

    // if (this.index < Game.startIndex && this.index > 0) {
    //     this.sprite.node.color = cc.Color.BLACK;
    //     this.sprite.node.opacity = 100;
    // } else {
    //     this.sprite.node.color = cc.Color.WHITE;
    //     this.sprite.node.opacity = 255;
    // }
  }

  scaleTest(indexs: number[]) {
    if (indexs.indexOf(this.index) < 0) return;
    this.bubbleScale();
  }

  bubbleScale(delayTime: number = 0) {
    let action = cc.sequence(
      cc.scaleTo(0, 0),
      cc.delayTime(delayTime),
      cc.scaleTo(0.2, 0.9),
      cc.scaleTo(0.1, 1.1),
      cc.scaleTo(0.1, 1)
    );
    action.setTag(BubbleAction.Bubble);
    this.node.stopActionByTag(BubbleAction.Bubble);
    this.node.runAction(action);
  }

  onSetParent(parent: cc.Node) {
    if (!parent) return;
    this.move.enabled = parent.name == "Shooter";
  }

  /** 被泡泡碰到 */
  onCollision() {
    gEventMgr.emit(GlobalEvent.PLAY_EFFECT, "colision");
  }

  /** 消除 */
  onClear(delayTime: number, fromIndex: number) {
    Game.addBubbleClear(this.Color);

    gEventMgr.emit(
      GlobalEvent.PLAY_EFFECT,
      this.type == SpecialType.Boom ? "boom" : "clear"
    );
    this.node.runAction(
      cc.sequence(
        cc.delayTime(delayTime * 0.7),

        cc.callFunc(() => {
          let selfI = Game.getMatrix().index2i(this.index);
          let selfJ = Game.getMatrix().index2j(this.index);
          let fromI = Game.getMatrix().index2i(fromIndex);
          let fromJ = Game.getMatrix().index2j(fromIndex);

          let factor = Math.max(
            Math.abs(selfI - fromI) + 1,
            Math.abs(selfJ - fromJ) + 1
          );
          let score = Math.max(1, factor) * BubbleScoreStep;

          if (this.DoubleScore) {
            score *= 2;
          }

          let scale = factor * 0.1 + 1;
          Game.addScore(
            this.color,
            score,
            scale,
            CMath.ConvertToNodeSpaceAR(this.node, Game.TopNode).add(
              cc.v2(BubbleSize.width * 0.5, BubbleSize.height * 0.5)
            )
          );

          this.updateSprite(true);
          let animation =
            this.type == SpecialType.Boom ? "bubble_boom" : "bubble_disappear";
          this.playAnimation(animation, () => {
            gFactory.putBubble(this.node);
          });
        }, this)
      )
    );
  }

  playAnimation(name: string, complete?: Function) {
    this.animationCallback[name] = complete;
    this.Animation.playAdditive(name);
  }

  onAnimationComplete(event?: string, aniState?: cc.AnimationState) {
    if (!aniState) return;
    if (this.animationCallback[aniState.name]) {
      this.animationCallback[aniState.name]();
      this.animationCallback[aniState.name] = null;
    }
  }

  update(dt: number) {
    let collision = Game.getCollisionIndexes();

    if (collision.indexOf(this.index) >= 0) {
      this.IndexLabel.node.color = cc.Color.BLACK;
      // if (Math.abs(this.node.scaleX - 1) > 0.05 || Math.abs(this.node.scaleY - 1) > 0.05) {
      //     console.error(this.index, this.node.scaleX, this.node.scaleY);
      // }
    } else {
      this.IndexLabel.node.color = cc.Color.WHITE;
    }
  }
}
