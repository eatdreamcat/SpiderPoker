import { gEventMgr } from "./Controller/EventManager";
import { GlobalEvent } from "./Controller/EventName";
import Bubble from "./Bubble";
import { BorderX } from "./BubbleMove";
import { gFactory } from "./Controller/GameFactory";
import { Game } from "./Controller/Game";

const {ccclass, property} = cc._decorator;

/** 准星和点击点的位移差 */
const STAR_OFFSET = 150;
/** 发射的高度限制 */
const SHOOTER_LIMIT_HEIGHT = -700;

/** 每个点的距离 */
const POINT_OFFSET = 60;

const POINT_OPCIATY = 200;

const POINT_COUNT = 200;

/** 点点颜色sprite名字 */
const PointColor = {
    1:   "bg_pointblue",
    2:   "bg_pointgreen",
    3:   "bg_pointorange",
    4:   "bg_pointpurple",
    5:   "bg_pointred",
    6:   "bg_pointyellow"
} 

/** 点点颜色sprite名字 */
const SignColor = {
    1:   "bg_signblue",
    2:   "bg_signgreen",
    3:   "bg_signorange",
    4:   "bg_signpurple",
    5:   "bg_signred",
    6:   "bg_signyellow"
} 



@ccclass
export default class ShooterLayer extends cc.Component {

    /** 准星 */
    @property(cc.Node)
    ShooterStar: cc.Node = null;

    @property(cc.Node)
    Shooter: cc.Node = null;

    @property(cc.SpriteAtlas)
    PointAtlas: cc.SpriteAtlas = null;

    @property(cc.Node)
    Point: cc.Node = null;

    private pointCount: number = POINT_COUNT;

    private isStart: boolean = false;
    
    onLoad () {
        this.ShooterStar.active = false;
        this.Point.active = false;
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);


    }

    start () {

    }

    /** 更新准星的位置 */
    updateStarPosition(touchP: cc.Vec2): cc.Vec2 {
        /** 计算点击点和发射点的斜率 */
       
        let shooterP = CMath.GetWorldPosition(this.Shooter);
        let touchPNode = this.node.getParent().convertToNodeSpaceAR(touchP);
        let k = CMath.getK(touchP, shooterP);
        if (k === null) {
            let dir = shooterP.y <= touchP.y ? 1 : -1;
            this.ShooterStar.x = 0;
            this.ShooterStar.y = touchPNode.y + dir * STAR_OFFSET;
            this.updatePoint(k, dir);
        } else {
            let dgree = Math.atan(k);
            let dir = shooterP.x <= touchP.x ? 1 : -1;
            this.ShooterStar.x = touchPNode.x + Math.cos(dgree) * STAR_OFFSET * dir;
            this.ShooterStar.y = touchPNode.y + Math.sin(dgree) * STAR_OFFSET * dir;
            this.updatePoint(k, dir);
        }

        
        return touchP.sub(shooterP);
    }

    /** 更新瞄准点 */
    updatePoint(k: number, direction: number) {

        
        
       

        while(this.Point.childrenCount > this.pointCount) {
            gFactory.putPoint(this.Point.children[0]);
        }

        while(this.Point.childrenCount < this.pointCount) {
            this.Point.addChild(gFactory.getPoint());
        }


        let childrenCount = this.Point.childrenCount;
        if (k === null) {
            for (let i = 0; i < childrenCount; i++) {
                let child = this.Point.children[i];
                child.x = 0;
                child.y = i * POINT_OFFSET * direction    ;
                child.opacity = 255 - i / childrenCount * POINT_OPCIATY;
                child.getComponent(cc.Sprite).spriteFrame = this.PointAtlas.getSpriteFrame(PointColor[this.Shooter.children[0].getComponent(Bubble).Color])
            }
        } else {
            let dgree = Math.atan(k);
            for (let i = 0; i < childrenCount; i++) {
                let child = this.Point.children[i];
                child.opacity = 255 - i / childrenCount * POINT_OPCIATY;
                child.x = i * POINT_OFFSET * Math.cos(dgree) * direction;
                let count = direction == -1 ? 1 : 2;
                while(Math.abs(child.x) > BorderX) {
                    
                    child.x -= (Math.abs(child.x) - BorderX) * Math.pow(-1, count++) * 2;
                }
                child.y = i * POINT_OFFSET * Math.sin(dgree) * direction;
                child.getComponent(cc.Sprite).spriteFrame = this.PointAtlas.getSpriteFrame(PointColor[this.Shooter.children[0].getComponent(Bubble).Color])
            }
        }

    }


    onTouchStart(e: cc.Event.EventTouch) {
        
        if (this.Shooter.childrenCount <= 0) return;

        if (!Game.isStart && !this.isStart) {
            Game.isStart = true;
            this.isStart = true;
        }

        if (!Game.isStart) return;

        this.updateStarPosition(e.getLocation());
        this.ShooterStar.active = true;
        this.Point.active = true;
        this.ShooterStar.getComponent(cc.Sprite).spriteFrame = 
        this.PointAtlas.getSpriteFrame(SignColor[this.Shooter.children[0].getComponent(Bubble).Color]);

    }

    onTouchMove(e: cc.Event.EventTouch) {

        if (this.Shooter.childrenCount <= 0) return;

        if (!Game.isStart) return;


        this.updateStarPosition(e.getLocation());
    }

    onTouchEnd(e: cc.Event.EventTouch) {

        if (this.Shooter.childrenCount <= 0) return;

        if (!Game.isStart) return;

        let dP = this.updateStarPosition(e.getLocation());
        this.ShooterStar.active = false;
        this.Point.active = false;
        if (this.ShooterStar.y >= SHOOTER_LIMIT_HEIGHT) {
            gEventMgr.emit(GlobalEvent.SHOOT, dP);
        } else {
            // console.log(this.ShooterStar.y)
        }
    }

    // update (dt) {}
}
