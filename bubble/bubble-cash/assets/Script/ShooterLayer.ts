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

/** 准星和点击点的位移差 */
const STAR_OFFSET = 150;
/** 发射的高度限制 */
const SHOOTER_LIMIT_HEIGHT = 400;


@ccclass
export default class ShooterLayer extends cc.Component {

    /** 准星 */
    @property(cc.Node)
    ShooterStar: cc.Node = null;

    @property(cc.Node)
    Shooter: cc.Node = null;

    onLoad () {
        this.ShooterStar.active = false;

        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);


    }

    start () {

    }

    updateStarPosition(touchP: cc.Vec2) {
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
    }


    onTouchStart(e: cc.Event.EventTouch) {
        
        this.updateStarPosition(e.getLocation());
        this.ShooterStar.active = true;
    }

    onTouchMove(e: cc.Event.EventTouch) {

        this.updateStarPosition(e.getLocation());
    }

    onTouchEnd(e: cc.Event.EventTouch) {

        this.updateStarPosition(e.getLocation());
        this.ShooterStar.active = false;
    }

    // update (dt) {}
}
