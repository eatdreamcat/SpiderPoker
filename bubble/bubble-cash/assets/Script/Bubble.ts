import { gEventMgr } from "./Controller/EventManager";
import { Game } from "./Controller/Game";
import { GlobalEvent } from "./Controller/EventName";

// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class Bubble extends cc.Component {

    /** 泡泡对应的矩阵index */
    private index: number = 0;
    get sprite() {
        return this.getComponent(cc.Sprite);
    }

    reuse() {
        this.sprite.spriteFrame = arguments[0][0];
        this.index = arguments[0][1];
        this.initEvent();
    }

    unuse() {
        gEventMgr.targetOff(this);
    }

    initEvent() {

        this.node.on(cc.Node.EventType.TOUCH_END, ()=>{
            let neibers = Game.getMatrix().getNeiborMatrix(this.index, 4);
            gEventMgr.emit(GlobalEvent.BUBBLE_SCALE_TEST, neibers)
        }, this);

        gEventMgr.on(GlobalEvent.BUBBLE_SCALE_TEST, this.scaleTest, this)
    }

    updateActive() {
        this.node.active = this.node.y < this.node.parent.height / 2;
    }

    scaleTest(indexs: number[]) {
        if (indexs.indexOf(this.index) < 0) return;
        this.node.runAction(cc.sequence(cc.scaleTo(0.1, 0.9), cc.scaleTo(0.1, 1.1), cc.scaleTo(0.1, 1)))
    }

}
