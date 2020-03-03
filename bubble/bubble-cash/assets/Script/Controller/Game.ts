import { BubbleMatrix } from "../Data/BubbleMatrix";
import { BubbleType, ClearCountLimit, GameTime } from "../Const";
import { gFactory } from "./GameFactory";
import Bubble from "../Bubble";
import { CollsionOffset, CollsionFactor, CollsionMinFactor } from "../BubbleMove";
import { gEventMgr } from "./EventManager";
import { GlobalEvent } from "./EventName";


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

    public TopNode: cc.Node = null;

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

    /** 每一次暂存需要消除的泡泡index */
    private clearIndex: number[] = [];

    /** 每一次暂存需要掉落的泡泡index */
    private dropIndex: number[] = [];

    /** 每一次受力暂存的index */
    private forceIndex: number[] = [];

    private gameTime: number = 0;

    public isStart: boolean = false;

    public start() {
        this.moveTimes = 0;
        this.score = 0;
        this.collisionIndexes.length = 0;
        this.targets.length = 0;
        this.clearIndex.length = 0;
        this.dropIndex.length = 0;
        this.forceIndex.length = 0;
        this.gameTime = GameTime;
    }

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
        gEventMgr.emit(GlobalEvent.UPDATE_TASK);
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

        for (let i = 0; i < data.length; i++) {
            if (!data[i] || !data[i].bubble) {
                continue;
            }

            if (this.collisionIndexes.indexOf(i) >= 0) continue;

            let neiber = this.bubbleMatrix.getNeiborMatrix(i, 1);
            let isCollsionIndex = true;
            for (let nei of neiber) {
                if (this.collisionIndexes.indexOf(nei) < 0) {
                    isCollsionIndex = false;
                    break;
                }
            }

            if (isCollsionIndex) {
                this.collisionIndexes.push(i);
            }
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

    addGameTime(time: number) {
        this.gameTime += time;
        if (this.gameTime <= 0) {
            this.gameTime = 0;
            this.isStart = false;
            gEventMgr.emit(GlobalEvent.GAME_OVER);
        }
    }

    getGameTime() {
        return this.gameTime;
    }

    public addMoveTimes(count: number = 1) {
        this.moveTimes += count;
    }

    /** 下移的次数 */
    public getMoveTimes() {
        return this.moveTimes;
    }

    /** 获取泡泡 */
    public getBubble(frame: cc.SpriteFrame, index: number, type: BubbleType, light: cc.SpriteFrame) {
        return gFactory.getBubble(frame, index, type, light);
    }

    private checkRecurily(index: number, checkBubble: Bubble) {
        if (this.clearIndex.indexOf(index) >= 0) return;

        this.clearIndex.push(index);


        let neibers = this.bubbleMatrix.getNeiborMatrix(index, 1);
        for (let otherIndex of neibers) {
            let bubble = this.bubbleMatrix.data[otherIndex].bubble;
            if (bubble && bubble.node.active && checkBubble.Color == bubble.Color) {
                
                this.checkRecurily(otherIndex, checkBubble);
            }
        }

    }

    /** 检测消除泡泡 */
    public checkClear(index: number, checkBubble: Bubble) {


        this.clearIndex.length = 0;
        
        this.checkRecurily(index, checkBubble);
        console.log(' --------------- 检测消除 start---------------')
        console.log(this.clearIndex);
        console.log(' --------------- 检测消除 end---------------')

        if (this.clearIndex.length < ClearCountLimit) {
            this.clearIndex.length = 0;
            return;
        }

        for(let i = 0; i < this.clearIndex.length; i++) {
            let clear = this.clearIndex[i];
            let bubble = this.bubbleMatrix.data[clear].bubble;
            if (!bubble) continue;
            bubble.onClear(i * 0.1);
            this.bubbleMatrix.data[clear].bubble = null;
            this.bubbleMatrix.data[clear].color = BubbleType.Blank;
        }

        this.clearIndex.length = 0;

        this.checkBubbleDrop();

        this.checkAddBubble();

        this.addTarget(1);
    }

    /** 检测是都需要下移泡泡 */
    private checkAddBubble() {
        let count = 0;
        for (let i = 58; i <= 67; i++) {
            if (this.bubbleMatrix.data[i] && this.bubbleMatrix.data[i].bubble && this.bubbleMatrix.data[i].bubble.node.active) {
                count ++;
            }
        }

        if (count <= 5) {
            gEventMgr.emit(GlobalEvent.ADD_BUBBLE, 3);
        }
    }


    /** 检测一下是否有泡泡掉落 */
    public checkBubbleDrop() {

        this.updateCollisionIndexes();
        this.dropIndex.length = 0;
        

        /** 如果边缘的泡泡连接了里面的，就不会掉落 */
        
        for (let index of this.collisionIndexes) {
            let neibers = this.bubbleMatrix.getNeiborMatrix(index, 1);
            let hasConnect = false;
            for (let nei of neibers) {
                if (this.collisionIndexes.indexOf(nei) < 0) {
                    hasConnect = true;
                    break;
                }
            }
            if (!hasConnect) this.dropIndex.push(index);
        }


        for (let i = 0; i < this.dropIndex.length; i ++) {
            let index = this.dropIndex[i];
            let neibers = this.bubbleMatrix.getNeiborMatrix(index, 1);
            let hasConnect = false;

            for (let nei of neibers) {
                if (this.dropIndex.indexOf(nei) < 0) {
                    hasConnect = true;
                    break;
                }
            }

            if (hasConnect) {
                this.dropIndex.splice(i, 1);
                i--;
                for (let nei of neibers) {
                    let delIndex = this.dropIndex.indexOf(nei);
                    if (delIndex >= 0) {
                        this.dropIndex.splice(delIndex, 1);
                        if (delIndex <= i) i--;
                    }
                }
            }

        }


        console.log(' 检测掉落---------------');
        console.log(this.dropIndex);

        for (let index of this.dropIndex) {

            if (!this.bubbleMatrix.data[index]) continue;
            let bubble = this.bubbleMatrix.data[index].bubble;
            if (bubble) {
                bubble.move.drop();
                this.bubbleMatrix.data[index].bubble = null;
                this.bubbleMatrix.data[index].color = BubbleType.Blank;
            }
        }

        this.dropIndex.length = 0;

    }

    
    
}

export const Game = GameCtrl.inst;
CC_DEBUG && (window["Game"] = Game);