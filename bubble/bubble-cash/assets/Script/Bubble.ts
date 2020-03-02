import { gEventMgr } from "./Controller/EventManager";
import { Game } from "./Controller/Game";
import { GlobalEvent } from "./Controller/EventName";
import { BubbleType } from "./Const";
import BubbleMove from "./BubbleMove";
import { gFactory } from "./Controller/GameFactory";


/**
 * 泡泡action标签
 */
export const enum BubbleAction {
    /** Q弹 */
    Bubble,
    Collision
}

const {ccclass, property} = cc._decorator;

@ccclass
export default class Bubble extends cc.Component {

    /** 泡泡对应的矩阵index */
    private index: number = -1;

    /** 泡泡的颜色 */
    private color: BubbleType = BubbleType.Blank;
    
    private animationCallback = {};

    private spriteFrameLight: cc.SpriteFrame = null;

    get Animation() {
        return this.getComponent(cc.Animation);
    }

    get sprite() {
        return this.node.getChildByName('Bubble').getComponent(cc.Sprite);
    }

    get move() {
        return this.getComponent(BubbleMove)
    }

    get IndexLabel() {
        return this.node.getChildByName('Index').getComponent(cc.Label);
    }

    get Color() {
        return this.color;
    }

    reuse() {
        this.node.active = false;
        this.node.scale = 0;
        this.sprite.spriteFrame = arguments[0][0];
        this.spriteFrameLight = arguments[0][3];
        this.sprite.node.opacity = 255;
        this.setIndex(arguments[0][1]);
        this.color = arguments[0][2];
        this.initEvent();
    }

    unuse() {
        gEventMgr.targetOff(this);
        this.index = -1;
        this.IndexLabel.string = '';
    }


    setIndex(index: number) {
        if (index == this.index) return;
        this.index = index;
        let bubbleMatrix = Game.getMatrix();

        if (!bubbleMatrix.data[index] || !bubbleMatrix.data[index].bubble) {
            //console.log('新增泡泡：', index);
            bubbleMatrix.data[index] = {
                color: this.color,
                bubble: this
            }

            
        } else if (bubbleMatrix.data[index].bubble != this) {
            console.warn('数据不同步！', index);

        }


        //this.IndexLabel.string = index.toString();
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
        this.Animation.on(cc.Animation.EventType.FINISHED, this.onAnimationComplete, this);


        this.node["_onSetParent"] = this.onSetParent.bind(this);
    }

    updateActive(delay: number = 0) {
        this.setActive(this.node.y < this.node.parent.height, true, delay);
    }

    scaleTest(indexs: number[]) {
        if (indexs.indexOf(this.index) < 0) return;
        this.bubbleScale();
    }

    bubbleScale(delayTime: number = 0) {
        let action = cc.sequence(cc.scaleTo(0, 0), cc.delayTime(delayTime), cc.scaleTo(0.2, 0.9), cc.scaleTo(0.1, 1.1), cc.scaleTo(0.1, 1));
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



    }

    /** 消除 */
    onClear(delayTime: number) {
        
       
        this.node.runAction(cc.sequence(
            cc.delayTime(delayTime * 0.7),
          
            cc.callFunc(()=>{
                this.sprite.spriteFrame = this.spriteFrameLight;
                this.playAnimation("bubble_disappear", ()=>{
                     gFactory.putBubble(this.node);
                 });
            }, this)
        ));
        
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
