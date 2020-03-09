import Bubble, { BubbleAction, BubbleDropScore } from "./Bubble";
import { gEventMgr } from "./Controller/EventManager";
import { GlobalEvent } from "./Controller/EventName";
import { Game } from "./Controller/Game";
import { BubbleSize } from "./Const";
import { gFactory } from "./Controller/GameFactory";
import { SpecialType } from "./Data/BubbleMatrix";


const {ccclass, property} = cc._decorator;

/** 左右的边界 */
export const BorderX = 455;

/** 发射的速度 */
const ShootSpeed = 4800;

/** 发射的加速度 */
const ShootAcceleration = 800;

/** 掉落的地板 */
export const DropBorder = -688;

/** 碰撞衰减系数 */
export const CollsionFactor = 0.3;

/** 初始位移距离 */
export const CollsionOffset = 40;

/** 力的最小比例 */
export const CollsionMinFactor = 0.01;

@ccclass
export default class BubbleMove extends cc.Component {


    private speed: cc.Vec2 = cc.v2(0, 0);
    private acceleration: cc.Vec2 = cc.v2(0, 0);

    private hasCollision: boolean = false;
    private shooted: boolean = false;
    private isDrop: boolean = false;

    private animationCallback = {};

    get Animation() {
        return this.getComponent(cc.Animation);
    }

    get bubble() {
        return this.getComponent(Bubble)
    }


    get radis() {
        return BubbleSize.width / 2;
    }

    /** 是否是在飞行状态 */
    get isShooterState() {
        return this.node.getParent().name == "Shooter" && this.node.getNumberOfRunningActions() <= 0 && !this.hasCollision && this.shooted;
    }

    /** 是否在准备发射的状态 */
    get isReady2Shoot() {
        return this.node.getParent().name == "Shooter" && this.node.getNumberOfRunningActions() <= 0;
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

    /** 受力位移 */
    forceMove(offset: cc.Vec2) {
        let action = this.node.getActionByTag(BubbleAction.Collision);
        if (action && !action.isDone()) return;

        let actionMove = cc.sequence(
            cc.moveBy(0.1, offset).easing(cc.easeQuadraticActionIn()), 
            cc.moveBy(0.1, offset.mul(-1)).easing(cc.easeQuadraticActionOut())
        );
        actionMove.setTag(BubbleAction.Collision);
        this.node.runAction(actionMove);
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


                let callback = () => {
                    Game.checkClear(this.bubble.getIndex(), this.bubble, bubble);

                    Game.updateCollisionIndexes();
                
                    gEventMgr.emit(GlobalEvent.NEXT_BUBBLE);
                }

                /** 变色球 */
                if(this.bubble.Type == SpecialType.Magic) {
                    if (bubble.Type != SpecialType.Magic && bubble.node.active) {
                        this.bubble.setColor(bubble.Color, SpecialType.Normal);
                        gEventMgr.emit(GlobalEvent.PLAY_EFFECT, "change_color");
                        this.bubble.playAnimation('bubble_change');
                    }
                } else if (bubble.Type == SpecialType.Magic && bubble.node.active && this.bubble.Type != SpecialType.Horce) {
                    bubble.setColor(this.bubble.Color, SpecialType.Normal);
                    bubble.playAnimation('bubble_change');
                    gEventMgr.emit(GlobalEvent.PLAY_EFFECT, "change_color");
                    //callback = null;
                }

                bubble.onCollision();


                // 碰撞的Q弹
                gEventMgr.emit(GlobalEvent.BUBBLE_FORCE, targetIndex);


                // 碰撞
                this.onCollision(targetIndex, callback);
            
                
                break;
                
            }
        }
    }

    /** 飞行碰到泡泡 */
    onCollision(targetIndex: number, callback?: Function) {

        let factor = Math.abs(this.speed.x / this.speed.y);
        
        let scaleX = factor == 0 || isNaN(factor) ? 1.2 : 1 / factor;
        let scaleY = 1 / scaleX;

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

        this.scaleBubble(scaleX, scaleY);

        this.bubble.setIndex(targetIndex);

        this.node.runAction(cc.sequence(
            cc.moveTo(0.1, targetPos),
            cc.callFunc(()=>{

                callback && callback();
                
                Game.checkOutOfMove();

            }, this)
        ));

    }

    scaleBubble(x: number, y: number) {
        x = CMath.Clamp(x, 1.2, 0.8);
        y = CMath.Clamp(y, 1.2, 0.8);
       
        this.node.runAction(cc.sequence(
            cc.scaleTo(0.1, x, y),
            cc.scaleTo(0.1, 1, 1)
        ));
    }

    initEvent() {
        gEventMgr.targetOff(this);
        gEventMgr.on(GlobalEvent.SHOOT, this.shoot, this);
        gEventMgr.on(GlobalEvent.BUBBLE_FORCE, this.force, this);
        this.Animation.on(cc.Animation.EventType.FINISHED, this.onAnimationComplete, this);
    }

    force(fromeIndex: number) {
        let index = this.bubble.getIndex();
        if (index == fromeIndex) return;

        let matrix = Game.getMatrix();
        let fromPos = matrix.getPosOfIndex(fromeIndex);
        let selfPos = matrix.getPosOfIndex(index);
        let Distance = CMath.Distance(fromPos, selfPos);
       
        let count = Math.ceil(Distance / (this.radis * 2));
        let force = Math.pow(CollsionFactor, Math.max(0, count - 1));
       
        
        this.forceMove(selfPos.sub(fromPos).normalize().mul(force * CollsionOffset));
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
        gEventMgr.emit(GlobalEvent.PLAY_EFFECT, "shoot")
        this.enabled = true;
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
        this.acceleration.y = -this.speed.y * 4.0;
        this.speed.x = this.node.x > 0 ? -200 : 200;
        this.speed.x *= (CMath.getRandom(0, 1.5) + 1);

        this.node.group = "drop";

        Game.addBubbleDrop(this.bubble.Color);

        
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


                 let pos = CMath.ConvertToNodeSpaceAR(this.node, this.node.getParent().getParent());
                 if (this.isDrop && pos.y <= DropBorder) {
                     this.enabled = false;
                     this.scaleBubble(1.1, 0.9);
                     gEventMgr.emit(GlobalEvent.PLAY_EFFECT, "drop")
                     let score = this.bubble.DoubleScore ? BubbleDropScore * 2 : BubbleDropScore;
                     Game.addScore(this.bubble.Color, score, 1, 
                        CMath.ConvertToNodeSpaceAR(this.node, Game.TopNode).add(cc.v2(BubbleSize.width*0.5, BubbleSize.height*0.5)));

                     this.playAnimation('bubble_drop', ()=>{
                        gFactory.putBubble(this.node);

                     });
                     break;
                 }

            
            }

        }

        
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
}
