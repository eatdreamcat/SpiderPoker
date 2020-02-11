import { gFactory } from "./Controller/GameFactory";
import { Game } from "./Controller/Game";
import { BubbleColor, BubbleHeightOffset, BubbleYOffset, BubbleXOffset } from "./Const";
import { MatrixSize } from "./Data/BubbleMatrix";
import Bubble from "./Bubble";

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
    }

    show() {
        let bubbleMatrix = Game.getMatrix();
        let iStart = 0, iEnd = 13;
        let jStart = 2, jEnd = 11;

        for (let i = iStart; i <= iEnd; i++) {
            for (let j = jStart; j <= jEnd; j++) {

                let index = bubbleMatrix.ij2index(i, j);
                let frame = this.BubbleAtlas.getSpriteFrame(BubbleColor[bubbleMatrix.data[index].color]);
                let bubble = gFactory.getBubble(frame, index);
                bubble.x = (j - MatrixSize / 2) * bubble.width + (i % 2) * bubble.width / 2  + BubbleXOffset;
                bubble.y = (MatrixSize / 2 - i) * (bubble.height + BubbleHeightOffset) + BubbleYOffset;
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
