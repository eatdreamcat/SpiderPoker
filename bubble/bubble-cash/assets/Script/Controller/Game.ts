import { BubbleMatrix } from "../Data/BubbleMatrix";
import { BubbleType } from "../Const";
import { gFactory } from "./GameFactory";


export interface Target {
    target: number;
    now: number;
}
class GameCtrl {
    private static ins: GameCtrl;
    public static get inst() {
        return this.ins ? this.ins : this.ins = new GameCtrl()
    }

    public BubbleLayer: cc.Node = null;

    /** 下移的次数 */
    private moveTimes: number = 0;
    /**
     * 有效的泡泡范围  10x10
     * 实际矩阵数据    14x14
     */
    private bubbleMatrix: BubbleMatrix = new BubbleMatrix();

    /** 总得分 */
    private score: number = 0;

    /** 需要检测碰撞的泡泡 */
    private collisionIndexes: number[] = [];

    /** 每一轮的消灭目标次数 */
    private targets: Target[] = [];

    /** 获取当前这一轮的目标 */
    public getCurTarget(): Target {
        return this.targets.length == 0 ? {target: 0, now: 0} : this.targets[this.targets.length - 1];
    }

    /** 增加当前目标已完成次数 */
    public addTarget(now: number) {
        if (this.targets.length == 0) {
            return;
        }

        this.targets[this.targets.length - 1].now += now;
    }

    /** 刷新最新一轮的目标信息 */
    public pushTarget(target: Target) {
        this.targets.push(target);
    }

    public getCollisionIndexes() {
        return this.collisionIndexes;
    }

    /** 重新计算需要碰撞的泡泡index */
    public updateCollisionIndexes() {

        this.collisionIndexes.length = 0;
        let data = this.bubbleMatrix.data;

        for (let i = 0; i < data.length; i++) {
            if (!data[i] || !data[i].bubble) {
                continue;
            }

            let neiber = this.bubbleMatrix.getNeiborMatrix(i, 1);
            if (neiber.length < 6) this.collisionIndexes.push(i);
        }

        console.log(this.collisionIndexes)
    }

    public getScore() {
        return this.score;
    }

    /** 获取矩阵数据 */
    public getMatrix() {
        return this.bubbleMatrix;
    }

    public prepare() {
        this.bubbleMatrix.initBubbleData();
    }

    public start() {

    }

    public addMoveTimes() {
        this.moveTimes ++;
    }

    /** 下移的次数 */
    public getMoveTimes() {
        return this.moveTimes;
    }

    /** 获取泡泡 */
    public getBubble(frame: cc.SpriteFrame, index: number, type: BubbleType) {
        return gFactory.getBubble(frame, index, type);
    }
    
}

export const Game = GameCtrl.inst;
CC_DEBUG && (window["Game"] = Game);