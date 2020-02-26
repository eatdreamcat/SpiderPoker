import { gFactory } from "./Controller/GameFactory";
import { Game } from "./Controller/Game";
import { BubbleColor, BubbleHeightOffset, BubbleYOffset, BubbleXOffset, BubbleSize } from "./Const";
import { MatrixSize, UseSize } from "./Data/BubbleMatrix";
import Bubble from "./Bubble";
import { gEventMgr } from "./Controller/EventManager";
import { gStep } from "./Controller/StepController";
import { gAudio } from "./Controller/AudioController";
const celerx = require("./Utils/celerx");

enum Step {
    Prefab = "Prefab",
    Audio = "Audio",
    
}

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

    @property(cc.Node)
    Shooter: cc.Node = null;

    @property(cc.Node)
    BulletArray: cc.Node = null;

    @property(cc.Node)
    ShooterLayer: cc.Node = null;

    onLoad () {
        
        let self = this;
        celerx.onStart(
            function() {
                 self.celerOnStart();
            }.bind(this)
        );

        celerx.provideScore(() => {
             return parseInt(Game.getScore().toString());
        });
        
        gStep.register(this.celerReady.bind(this), [Step.Audio, Step.Prefab]);

        Game.prepare();

        gFactory.init(()=>{
            gStep.nextStep(Step.Prefab);
        }, this.BubblePrefab);
        
        gAudio.init(()=>{
            gStep.nextStep(Step.Audio);
        });


        this.initEvent();
    }

    celerReady() {
        celerx.ready();
        if (CC_DEBUG) {
            this.celerOnStart();
        }
    }


    /**
     * 正式进入游戏
     */
    celerOnStart() {
        this.show();
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
