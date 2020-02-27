import { gEventMgr } from "./Controller/EventManager";
import { Game } from "./Controller/Game";
import { GlobalEvent } from "./Controller/EventName";
import { BubbleType } from "./Const";
import BubbleMove from "./BubbleMove";


/**
 * 泡泡action标签
 */
enum BubbleAction {
    /** Q弹 */
    Bubble,
}

const {ccclass, property} = cc._decorator;

@ccclass
export default class Bubble extends cc.Component {

    /** 泡泡对应的矩阵index */
    private index: number = -1;

    /** 泡泡的颜色 */
    private color: BubbleType = BubbleType.Blank;
    
    get sprite() {
        return this.getComponent(cc.Sprite);
    }

    get move() {
        return this.getComponent(BubbleMove)
    }

    get IndexLabel() {
        return this.node.getChildByName('Index').getComponent(cc.Label);
    }

    reuse() {
        this.node.active = false;
        this.sprite.spriteFrame = arguments[0][0];
        this.setIndex(arguments[0][1]);
        this.color = arguments[0][2];
        this.initEvent();
    }

    unuse() {
        gEventMgr.targetOff(this);
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


        this.IndexLabel.string = index.toString();
    }

    setActive(active: boolean, isAction: boolean = true) {
      
        if (this.node.active == active) return;
        this.node.active = active;
        if (this.node.active && isAction) {
            
            this.bubbleScale();
        }
    }

    initEvent() {

        // this.node.on(cc.Node.EventType.TOUCH_END, ()=>{
        //     let neibers = Game.getMatrix().getNeiborMatrix(this.index, 1);
        //     console.log(neibers)
        //     gEventMgr.emit(GlobalEvent.BUBBLE_SCALE_TEST, neibers);
        // }, this);

        gEventMgr.on(GlobalEvent.BUBBLE_SCALE_TEST, this.scaleTest, this);

        this.node["_onSetParent"] = this.onSetParent.bind(this);
    }

    updateActive() {
        this.setActive(this.node.y < this.node.parent.height);
    }

    scaleTest(indexs: number[]) {
        if (indexs.indexOf(this.index) < 0) return;
        this.bubbleScale();
    }

    bubbleScale() {
        let action = cc.sequence(cc.scaleTo(0.1, 0.9), cc.scaleTo(0.1, 1.1), cc.scaleTo(0.1, 1));
        action.setTag(BubbleAction.Bubble);
        this.node.stopActionByTag(BubbleAction.Bubble);
        this.node.runAction(action);
    }

    onSetParent(parent: cc.Node) {
        this.move.enabled = parent.name == "Shooter";
    }

    /** 被泡泡碰到 */
    onCollision() {

    }

    update(dt: number) {

        let collision = Game.getCollisionIndexes();
        
        if (collision.indexOf(this.index) >= 0) {
            this.IndexLabel.node.color = cc.Color.BLACK;
        } else {
            this.IndexLabel.node.color = cc.Color.WHITE;
        }
    }

    

}
