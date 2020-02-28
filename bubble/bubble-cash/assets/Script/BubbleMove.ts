import Bubble from "./Bubble";
import { gEventMgr } from "./Controller/EventManager";
import { GlobalEvent } from "./Controller/EventName";
import { Game } from "./Controller/Game";
import { BubbleSize } from "./Const";
import { gFactory } from "./Controller/GameFactory";


const {ccclass, property} = cc._decorator;

const BorderX = 455;

const ShootSpeed = 4800;
const ShootAcceleration = 800;
@ccclass
export default class BubbleMove extends cc.Component {


    private speed: cc.Vec2 = cc.v2(0, 0);
    private acceleration: cc.Vec2 = cc.v2(0, 0);

    private hasCollision: boolean = false;
    private shooted: boolean = false;
    private isDrop: boolean = false;

    get bubble() {
        return this.getComponent(Bubble)
    }


    get radis() {
        return this.node.width / 2;
    }

    /** 是否是在飞行状态 */
    get isShooterState() {
        return this.node.getParent().name == "Shooter" && this.node.getNumberOfRunningActions() <= 0 && !this.hasCollision && this.shooted;
    }

    /** 是否在准备发射的状态 */
    get isReady2Shoot() {
        return this.node.getParent().name == "Shooter" && Math.abs(this.node.x) <= 0.0001 && Math.abs(this.node.y) <= 0.0001;
    }


    /** 检测飞行时是否碰到边界 */
    checkBorder() {
        if (!this.isShooterState) return;
        if (this.isDrop) return;

        if (this.node.x <= -BorderX || this.node.x >= BorderX) {

            this.node.x = this.node.x > 0 ? BorderX : -BorderX;
            this.speed.x = -this.speed.x;
            this.acceleration.x = -this.acceleration.x;
        }

    }

    /** 检测飞行时是否碰到泡泡 */
    checkCollisionBubble() {

        if (!this.isShooterState) return;
        if (this.isDrop) return;

        
        let bubbleIndexes = Game.getCollisionIndexes();
        let bubbleMatrix = Game.getMatrix();

        for (let index of bubbleIndexes) {
            let bubble = bubbleMatrix.data[index].bubble;
            if (!bubble) {
                console.warn(' bubble 不存在！');
            }

            let bubblePos = CMath.ConvertToNodeSpaceAR(this.node, bubble.node.parent)
            if (CMath.Distance(bubblePos, bubble.node.position) <= 2 * this.radis * 0.8) {

                /**
                 * 计算最近的落点位置
                 */
                let targetNeiber = bubbleMatrix.getNeiborMatrix(index, 1, true);
                let targetIndex = -1;
                let minDistance = 100;
                console.log('碰到：', index)
                console.log(targetNeiber)
                for (let neiberIndex of targetNeiber) {
                    let i = bubbleMatrix.index2i(neiberIndex);
                    let j = bubbleMatrix.index2j(neiberIndex);
                    let pos = bubbleMatrix.getPosOfij(i, j);
                    if (CMath.Distance(pos, bubblePos) < minDistance) {
                        minDistance = CMath.Distance(pos, bubblePos);
                        targetIndex = neiberIndex;
                    }
                }

                bubble.onCollision();

                // 碰撞
                this.onCollision(targetIndex);
            
                

                
            }
        }
    }



    /** 飞行碰到泡泡 */
    onCollision(targetIndex: number) {

        this.speed.x = 0;
        this.speed.y = 0;
        this.acceleration.x = 0;
        this.acceleration.y = 0;

        this.hasCollision = true;

        let bubbleMatrix = Game.getMatrix();
        let i = bubbleMatrix.index2i(targetIndex);
        let j = bubbleMatrix.index2j(targetIndex);
        let targetPos = bubbleMatrix.getPosOfij(i, j);
        
        let pos = CMath.ConvertToNodeSpaceAR(this.node, Game.BubbleLayer);
        this.node.x = pos.x;
        this.node.y = pos.y;
        this.node.setParent(Game.BubbleLayer);


        this.node.stopAllActions();
        this.node.runAction(cc.sequence(
            cc.moveTo(0.1, targetPos),
            cc.callFunc(()=>{

                
                this.bubble.setIndex(targetIndex);
                Game.checkClear(this.bubble.getIndex(), this.bubble);

                Game.updateCollisionIndexes();
                

            }, this)
        ));

    }

    initEvent() {
        gEventMgr.targetOff(this);
        gEventMgr.on(GlobalEvent.SHOOT, this.shoot, this);
    }

    reuse() {
        this.initEvent();
        this.hasCollision = false;
        this.isDrop = false;
        this.speed = cc.v2(0, 0);
        this.acceleration = cc.v2(0, 0);
        this.shooted = false;
        this.node.group = "default";
    }

    unuse() {
        gEventMgr.targetOff(this);
    }


    /** 发射 */
    shoot(deltaP: cc.Vec2) {
        
        if (this.node.parent.name != "Shooter") return;

        if (!this.isReady2Shoot) {
            console.warn(this.node.x, this.node.y)
            return;
        }

        console.log("发射！");
        this.shooted = true;
        deltaP.normalizeSelf();

        this.speed.x = deltaP.x * ShootSpeed;
        this.speed.y = deltaP.y * ShootSpeed;

        this.acceleration.x = deltaP.x * ShootAcceleration;
        this.acceleration.y = deltaP.y * ShootAcceleration;
    }

    drop() {

        console.log(' 掉落:', this.enabled, this.bubble.getIndex());
        this.isDrop = true;
        this.enabled = true;

        this.speed.y = 800 + CMath.getRandom(0, 1000);
        this.acceleration.y = -this.speed.y * 3.5;
        this.speed.x = this.node.x > 0 ? -100 : 100;
        this.speed.x *= (CMath.getRandom(0, 0.8) + 1);

        this.node.group = "drop";
    }


    update(dt: number) {

         
       

        if (this.isShooterState || this.isDrop) {

            let count = 10;
            for (let i = 0; i < count; i++) {

                
                 this.checkBorder();

                 this.checkCollisionBubble();

            
                 
                 this.node.x += this.speed.x * dt / count;
                 this.node.y += this.speed.y * dt / count;

                 this.speed.x += this.acceleration.x * dt / count;
                 this.speed.y += this.acceleration.y * dt / count;


                 if (this.isDrop && this.node.y <= -500) {
                     this.enabled = false;
                     gFactory.putBubble(this.node);
                     break;
                 }

            
            }

        }

        
    }
   
}
