import { gEventMgr } from "./Controller/EventManager";
import { Game } from "./Controller/Game";
import { GlobalEvent } from "./Controller/EventName";


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
    get sprite() {
        return this.getComponent(cc.Sprite);
    }

    get IndexLabel() {
        return this.node.getChildByName('Index').getComponent(cc.Label);
    }

    reuse() {
        this.node.active = false;
        this.sprite.spriteFrame = arguments[0][0];
        this.setIndex(arguments[0][1]);
        this.initEvent();
    }

    unuse() {
        gEventMgr.targetOff(this);
    }


    setIndex(index: number) {
        if (index == this.index) return;
        this.index = index;
        this.IndexLabel.string = index.toString();
    }

    setActive(active: boolean) {
      
        if (this.node.active == active) return;
        this.node.active = active;
        if (this.node.active) {
            
            this.bubbleScale();
        }
    }

    initEvent() {

        this.node.on(cc.Node.EventType.TOUCH_END, ()=>{
            let neibers = Game.getMatrix().getNeiborMatrix(this.index, 3);
            gEventMgr.emit(GlobalEvent.BUBBLE_SCALE_TEST, neibers);
        }, this);

        gEventMgr.on(GlobalEvent.BUBBLE_SCALE_TEST, this.scaleTest, this)
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

}
