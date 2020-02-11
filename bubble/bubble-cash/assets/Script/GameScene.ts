import { gFactory } from "./Controller/GameFactory";
import { Game } from "./Controller/Game";
import { BubbleColor, BubbleHeightOffset, BubbleYOffset, BubbleXOffset, BubbleSize } from "./Const";
import { MatrixSize, UseSize } from "./Data/BubbleMatrix";
import Bubble from "./Bubble";
import { gEventMgr } from "./Controller/EventManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GameScene extends cc.Component {


    /** 泡泡 */
    @property(cc.Prefab)
    BubblePrefab: cc.Prefab = null;

    @property(cc.SpriteAtlas)
    BubbleAtlas: cc.SpriteAtlas = null;

    /** 节点 */
    @property(cc.Node)
    BubbleLayer: cc.Node = null;

    onLoad () {
        
        Game.prepare();

        gFactory.init(()=>{
            this.show();
        }, this.BubblePrefab);

        this.initEvent();
    }

    initEvent() {
        gEventMgr.targetOff(this);


        if (CC_DEBUG) {
            cc.director.on("space-press", this.nextBubble, this);
        }
    }

    show() {
        
        let iStart = 0, iEnd = 13;
        let jStart = 2, jEnd = 11;

        this.addBubble(iStart, iEnd, jStart, jEnd);

    }

    /** 生成新的泡泡 */
    nextBubble() {
      
        Game.addMoveTimes();
        let bubbleMatrix = Game.getMatrix();
        bubbleMatrix.moveRow(1);
        
        this.BubbleLayer.height += (BubbleSize.height + BubbleHeightOffset);
        this.BubbleLayer.runAction(cc.moveBy(0.2, 0, -(BubbleSize.height + BubbleHeightOffset)));
        this.addBubble(0, 0, 2, 11);
        
        let startIndex = (MatrixSize - UseSize) * MatrixSize + 1;
        for (let i = startIndex; i <= startIndex + UseSize; i++) {
            if (bubbleMatrix.data[i].bubble) {
                bubbleMatrix.data[i].bubble.updateActive();
            }
        }
    }

    /**
     * 增加泡泡
     */
    addBubble(istart: number, iend: number, jstart: number, jend: number) {

        let bubbleMatrix = Game.getMatrix();
        for (let i = istart; i <= iend; i++) {
            for (let j = jstart; j <= jend; j++) {

                let index = bubbleMatrix.ij2index(i, j);

                let frame = this.BubbleAtlas.getSpriteFrame(BubbleColor[bubbleMatrix.data[index].color]);
                let bubble = gFactory.getBubble(frame, index);

                bubble.x = (j - MatrixSize / 2) * BubbleSize.width + ((i + Game.getMoveTimes()) % 2) * BubbleSize.width / 2  + BubbleXOffset;
                bubble.y = (MatrixSize / 2 - i + Game.getMoveTimes()) * (BubbleSize.height + BubbleHeightOffset) + BubbleYOffset;

                this.BubbleLayer.addChild(bubble);
                bubbleMatrix.data[index].bubble = bubble.getComponent(Bubble);
                bubble.getComponent(Bubble).updateActive();
            }
        }

    }

    

    start () {

    }

    update (dt: number) {}
}
