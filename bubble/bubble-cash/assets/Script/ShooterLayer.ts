import { gEventMgr } from "./Controller/EventManager";
import { GlobalEvent } from "./Controller/EventName";

const {ccclass, property} = cc._decorator;

/** 准星和点击点的位移差 */
const STAR_OFFSET = 150;
/** 发射的高度限制 */
const SHOOTER_LIMIT_HEIGHT = -700;

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

    onLoad () {
        this.ShooterStar.active = false;

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
        } else {
            let dgree = Math.atan(k);
            let dir = shooterP.x <= touchP.x ? 1 : -1;
            this.ShooterStar.x = touchPNode.x + Math.cos(dgree) * STAR_OFFSET * dir;
            this.ShooterStar.y = touchPNode.y + Math.sin(dgree) * STAR_OFFSET * dir;
           
        }

        return touchP.sub(shooterP);
    }


    onTouchStart(e: cc.Event.EventTouch) {
        
        this.updateStarPosition(e.getLocation());
        this.ShooterStar.active = true;
    }

    onTouchMove(e: cc.Event.EventTouch) {

        this.updateStarPosition(e.getLocation());
    }

    onTouchEnd(e: cc.Event.EventTouch) {

        let dP = this.updateStarPosition(e.getLocation());
        this.ShooterStar.active = false;

        if (this.ShooterStar.y >= SHOOTER_LIMIT_HEIGHT) {
            gEventMgr.emit(GlobalEvent.SHOOT, dP);
        } else {
            // console.log(this.ShooterStar.y)
        }
    }

    // update (dt) {}
}
