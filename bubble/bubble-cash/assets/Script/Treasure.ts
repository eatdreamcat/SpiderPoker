import { Game } from "./Controller/Game";
import { BubbleType } from "./Const";
import { gEventMgr } from "./Controller/EventManager";
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
export default class Treasure extends cc.Component {


    private isCollider: boolean = true;


    onLoad() {
        this.node.group = "default"
        this.node.opacity = 255;
        gEventMgr.on(GlobalEvent.CHECK_TREASURE, ()=>{
            if (!Game.isStart) return;


             this.checkCollider();
        }, this)
    }

    
    update() {

        
    }

    checkCollider() {

        this.isCollider = false;
        let matrix = Game.getMatrix();
        for (let i = Game.startIndex; i < matrix.data.length; i ++ ){
            if (!matrix.data[i] || !matrix.data[i].bubble || !matrix.data[i].bubble.node.active) {
                continue;
            }

            let bubble = matrix.data[i].bubble;
            if (cc.Intersection.polygonCircle(this.getComponent(cc.PolygonCollider).points, {
                position: CMath.ConvertToNodeSpaceAR(bubble.node, this.node.getParent()),
                radius: bubble.getComponent(cc.CircleCollider).radius
            })) {
                this.isCollider = true;
                break;
            }
        }


        if (!this.isCollider) {
           
            this.getTreasure();
        }
    }

    getTreasure() {
        

        let speed = 1500;
        let targetPos = CMath.ConvertToNodeSpaceAR(Game.TopNode.getChildByName('TreasureRoot').getChildByName(this.node.name), this.node.getParent());
        let time = CMath.Distance(targetPos, this.node.position) / speed;
        
        this.enabled = false;

        // this.node.runAction(cc.sequence(
        //     cc.delayTime(0.35),
        //     cc.delayTime(time / 2),
        //     cc.fadeTo(time / 2, 0)
        // ));

        this.node.group = "treasure";
        this.node.runAction(cc.sequence(
            cc.delayTime(0.1),
            cc.scaleTo(0.1, 1.2 * 1.2),
            cc.delayTime(0.3),
            cc.callFunc(() => {
               
                Game.addScore(BubbleType["Treasure_" + this.node.name], parseInt(this.node.name), parseInt(this.node.name) / 200 * 0.1 + 1, CMath.ConvertToNodeSpaceAR(this.node, Game.TopNode))
            }),
            cc.scaleTo(0.1, 1),
            
            cc.moveTo(time, targetPos),
            cc.fadeTo(0.1, 0),
            cc.callFunc(() => {
                gEventMgr.emit(GlobalEvent.GET_TREASURE, this.node.name);
                this.node.removeFromParent()
            })
        ));
    }
    
}
