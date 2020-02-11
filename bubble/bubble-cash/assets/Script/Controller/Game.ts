import { BubbleMatrix } from "../Data/BubbleMatrix";

class GameCtrl {
    private static ins: GameCtrl;
    public static get inst() {
        return this.ins ? this.ins : this.ins = new GameCtrl()
    }


    /**
     * 有效的泡泡范围  10x10
     * 实际矩阵数据    14x14
     */
    private bubbleMatrix: BubbleMatrix = new BubbleMatrix();

    /** 获取矩阵数据 */
    public getMatrix() {
        return this.bubbleMatrix;
    }

    public prepare() {
        this.bubbleMatrix.initBubbleData();
    }

    public start() {

    }
}

export const Game = GameCtrl.inst;
CC_DEBUG && (window["Game"] = Game);