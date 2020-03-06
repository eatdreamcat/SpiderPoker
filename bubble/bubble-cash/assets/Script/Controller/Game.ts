import { BubbleMatrix, SpecialType, MatrixSize, UseSize } from "../Data/BubbleMatrix";
import { BubbleType, ClearCountLimit, GameTime, BubbleColors } from "../Const";
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

    /** 连消的次数 */
    private streak: number = 0;

    /** 最大连消次数 */
    private maxStreak: number = 0;

    /** 每种颜色的泡泡得分 */
    private bubbleScore = {};
    
    /** 每种颜色泡泡的消除个数 */
    private bubbleClear = {}

    /** 每种颜色泡泡的掉落个数 */
    private bubbleDrop = {}


    /** 需要检测碰撞的泡泡 */
    private collisionIndexes: number[] = [];

    /** 每一轮的消灭目标次数 */
    private targets: Target[] = [];

    /** 每一次暂存需要消除的泡泡index */
    private clearIndex: number[] = [];

    /** 每一次暂存需要掉落的泡泡index */
    private dropIndex: number[] = [];

    //** 固定的球，不会掉落 */
    private fixedIndex: number[] = [];

    /** 每一次受力暂存的index */
    private forceIndex: number[] = [];

    private gameTime: number = 0;

    public isStart: boolean = false;

    private lastIndex: number = 58;

    /** 最上面一排的开始index */
    private _startIndex: number = 58;

    public get startIndex() {
        return this._startIndex;
    }

    public set startIndex(index: number) {
        this._startIndex = index;
        console.log(' startIndex:', this.startIndex);
    }

    public start() {
        this.moveTimes = 0;
        this.score = 0;
        this.collisionIndexes.length = 0;
        this.targets.length = 0;
        this.clearIndex.length = 0;
        this.dropIndex.length = 0;
        this.forceIndex.length = 0;
        this.gameTime = GameTime;
        this.streak = 0;
        this.maxStreak = 0;
        
        for (let color of BubbleColors) {
            this.bubbleClear[color] = 0;
            this.bubbleDrop[color] = 0;
            this.bubbleScore[color] = 0;
        }
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

       
        for (let i = this.startIndex - MatrixSize; i < this.startIndex - MatrixSize + UseSize; i ++) {

        }

        console.log(this.collisionIndexes)
    }

    public getScore() {
        return this.score;
    }

    addScore(color: BubbleType, score: number, scale: number, pos: cc.Vec2 = cc.v2(0, 0)) {
        this.score += score;
        this.score = Math.max(0, this.score);
        this.addBubbleScore(color, score);
        gEventMgr.emit(GlobalEvent.ADD_SCORE, score, scale, pos);
    }

    /** 获取矩阵数据 */
    public getMatrix() {
        return this.bubbleMatrix;
    }

    public prepare() {
        this.bubbleMatrix.initBubbleData();
    }

    /** 获取最后一个index对应的i */
    public getLastI() {
        
        return this.bubbleMatrix.index2i(this.lastIndex);
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
    public getBubble(type: SpecialType, index: number, color: BubbleType, atlas: cc.SpriteAtlas) {
        return gFactory.getBubble(type, index, color, atlas);
    }

    /**
     * 
     * @param index 检测的中心index
     * @param checkBubble 源泡泡
     */
    private checkRecurily(index: number, checkBubble: Bubble) {
        if (this.clearIndex.indexOf(index) >= 0) return;
        if (index < this.startIndex) return;

        this.clearIndex.push(index);


        let neibers = this.bubbleMatrix.getNeiborMatrix(index, 1);

        for (let otherIndex of neibers) {
            if (otherIndex < this.startIndex) continue;
            let bubble = this.bubbleMatrix.data[otherIndex].bubble;
            if (bubble && bubble.node.active && checkBubble.Color == bubble.Color) {
                
                this.checkRecurily(otherIndex, checkBubble);

                
            }
        }

    }

    /** 增加某颜色泡泡的得分 */
    addBubbleScore(color: BubbleType, score: number) {
        this.bubbleScore[color] += score;
    }

    /** 增加某颜色泡泡的掉落个数 */
    addBubbleDrop(color: BubbleType) {
        this.bubbleDrop[color] ++;
    }

    /** 增加某颜色泡泡的消除个数 */
    addBubbleClear(color: BubbleType) {
        this.bubbleClear[color] ++;
    }


    /**
     * 检测炸弹的消除
     */
    checkBoomBubble(indexs: number[]) {
        /** 检测炸弹 */
        for( let index of indexs) {
            if (this.bubbleMatrix.data[index].type == SpecialType.Boom) {
                let neibers =  this.bubbleMatrix.getNeiborMatrix(index, 1, false);
                let nextCheck = [];
                for (let nei of neibers) {
                    if (this.clearIndex.indexOf(nei) < 0 && nei >= this.startIndex) {
                        this.clearIndex.push(nei);
                        if (this.bubbleMatrix.data[nei].type == SpecialType.Boom)
                            nextCheck.push(nei);
                    }
                }

                this.checkBoomBubble(nextCheck);
            }
        }
    }


    /** 检测消除泡泡 */
    public checkClear(index: number, checkBubble: Bubble) {


        this.clearIndex.length = 0;
        
        this.checkRecurily(index, checkBubble);
        console.log(' --------------- 检测消除 start---------------:', this.startIndex)
        console.log(this.clearIndex);
        console.log(' --------------- 检测消除 end---------------')

        if (this.clearIndex.length < ClearCountLimit) {
            this.clearIndex.length = 0;
            this.streak = 0;
            return;
        }

        this.checkBoomBubble(this.clearIndex);

        this.streak ++;
        this.maxStreak = Math.max(this.streak, this.maxStreak);

        let length = this.bubbleMatrix.data.length;
        let i = 0;
        for (i = length - 1; i >= this.startIndex; i--) {
            let data = this.bubbleMatrix.data[i];
            if (data && data.color && data.bubble && data.bubble.node.active) {
                
                break;
            }
        }

        this.lastIndex = i;


        for(let i = 0; i < this.clearIndex.length; i++) {
            let clear = this.clearIndex[i];
            let bubble = this.bubbleMatrix.data[clear].bubble;
            if (!bubble) continue;
            bubble.onClear(i * 0.1, index);
            this.bubbleMatrix.data[clear].bubble = null;
            this.bubbleMatrix.data[clear].color = BubbleType.Blank;
            this.bubbleMatrix.data[clear].type = SpecialType.Normal;
        }

        this.clearIndex.length = 0;
        

        this.checkBubbleDrop();

        this.checkAddBubble();

        this.addTarget(1);
    }

    /** 检测是都需要下移泡泡 */
    private checkAddBubble() {
        let count = 0;
        for (let i = this.startIndex; i <= this.startIndex + 9; i++) {
            if (this.bubbleMatrix.data[i] && this.bubbleMatrix.data[i].bubble && this.bubbleMatrix.data[i].bubble.node.active) {
                count ++;
            }
        }

        if (count <= 5) {
            gEventMgr.emit(GlobalEvent.ADD_BUBBLE, 3);
        }
    }


    /** 检测需要剔除的固定泡泡 */
    private checkDrop(index: number) {
        let neibers = this.bubbleMatrix.getNeiborMatrix(index, 1, false);
        for (let nei of neibers) {
            if (this.fixedIndex.indexOf(nei) >= 0) {
                this.fixedIndex = this.fixedIndex.concat(neibers);
                this.fixedIndex.push(index)
                break;
            }
        }
    }

    /** 检测一下是否有泡泡掉落 */
    public checkBubbleDrop() {

        
        this.dropIndex.length = 0;
        this.fixedIndex.length = 0;

        for(let i = this.startIndex; i < this.startIndex + UseSize; i++) {
            if (this.bubbleMatrix.data[i] && this.bubbleMatrix.data[i].bubble)
                 this.fixedIndex.push(i);
        }

        for (let i = this.startIndex; i < this.bubbleMatrix.data.length; i ++) {
            if (i >= this.startIndex + UseSize && this.bubbleMatrix.data[i] && this.bubbleMatrix.data[i].bubble)
                 this.dropIndex.push(i);
        }

        if (this.dropIndex.length <= 0) return;

        
        for (let index of this.dropIndex) {
            this.checkDrop(index);
        }

        for (let index of this.fixedIndex) {
            let i = this.dropIndex.indexOf(index);
            if (i >= 0) {
                this.dropIndex.splice(i, 1)
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
                this.bubbleMatrix.data[index].type = SpecialType.Normal;
            }
        }

        this.dropIndex.length = 0;

    }

    
    
}

export const Game = GameCtrl.inst;
CC_DEBUG && (window["Game"] = Game);