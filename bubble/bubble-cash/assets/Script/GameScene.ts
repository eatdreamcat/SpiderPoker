import { gFactory } from "./Controller/GameFactory";
import { Game } from "./Controller/Game";
import { BubbleColor, BubbleHeightOffset, BubbleYOffset, BubbleXOffset, BubbleSize, BubbleQueRange, DefaultTaskCount, BubbleType, BubbleColors } from "./Const";
import { MatrixSize, UseSize } from "./Data/BubbleMatrix";
import Bubble from "./Bubble";
import { gEventMgr } from "./Controller/EventManager";
import { gStep } from "./Controller/StepController";
import { gAudio } from "./Controller/AudioController";
import { GlobalEvent } from "./Controller/EventName";
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
        
        Game.BubbleLayer = this.BubbleLayer;

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
        if (CC_DEBUG || true) {
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

        /** 泡泡队列减少 */
        this.BulletArray.on(cc.Node.EventType.CHILD_REMOVED, this.onBubbleQueRemoveChild, this);
        /*** 泡泡发射完毕 */
        this.Shooter.on(cc.Node.EventType.CHILD_REMOVED, this.onShooterRemoveChild, this);

        if (CC_DEBUG) {
            cc.director.on("space-press", this.nextBubble, this);
        }
    }
    
    show() {
        
        let iStart = 0, iEnd = 13;
        let jStart = 2, jEnd = 11;

        this.addBubble(iStart, iEnd, jStart, jEnd);

        this.getNewTask(DefaultTaskCount);

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
                let bubble = Game.getBubble(frame, index, bubbleMatrix.data[index].color);

                let pos = bubbleMatrix.getPosOfij(i, j);
                bubble.x = pos.x;
                bubble.y = pos.y;

                this.BubbleLayer.addChild(bubble);
                bubbleMatrix.data[index].bubble = bubble.getComponent(Bubble);
                bubble.getComponent(Bubble).updateActive();
            }
        }


        Game.updateCollisionIndexes();

    }


    onShooterRemoveChild() {
        this.getShooterBubble();
    }

    /** 生成待发射的泡泡 */
    getShooterBubble(count?: number) {


        if (this.BulletArray.childrenCount <= 0) {
            this.getNewTask(count);
            return;
        }

        let bubble = this.BulletArray.children[0];
        bubble.setParent(this.Shooter);
        bubble.scale = 0.5;
        bubble.setPosition(CMath.ConvertToNodeSpaceAR(bubble, this.Shooter));

        bubble.runAction(cc.spawn(
            cc.scaleTo(0.2, 1),
            cc.fadeTo(0.2, 255),
            cc.moveTo(0.3, 0, 0)
        ));

    }

    /** 生成新的任务 */
    getNewTask(count: number) {
        if(!count) {
            count = Math.ceil(CMath.getRandom(BubbleQueRange.Min, BubbleQueRange.Max));
            
        }

        console.log('泡泡队列：', count);

        /**
         * 生成新的泡泡队列
         */
        let bubbleArray: BubbleType[] = [];
        for (let i = 0; i < count; i++) {

            bubbleArray.push(BubbleColors[Math.floor(CMath.getRandom() * BubbleColors.length)])
        }

        for (let i = 0; i < bubbleArray.length; i++) {
            let frame = this.BubbleAtlas.getSpriteFrame(BubbleColor[bubbleArray[i]]);
            let bubble = Game.getBubble(frame, -1, bubbleArray[i]);
            bubble.getComponent(Bubble).setActive(true);
            bubble.scale = 0;
            bubble.opacity = 0;
            bubble.y = 0;
            if (i == 0) {
                bubble.x = -200;
                this.Shooter.addChild(bubble);
                bubble.runAction(cc.spawn(
                    cc.scaleTo(0.2, 1),
                    cc.fadeTo(0.2, 255),
                    cc.moveTo(0.3, 0, 0)
                ));
            } else {
                bubble.x = -200 * i;
                this.BulletArray.addChild(bubble);

                bubble.runAction(cc.spawn(
                    cc.scaleTo(0.2, 0.5),
                    cc.fadeTo(0.2, 255),
                    cc.moveTo(0.4, 40 - this.BulletArray.childrenCount * BubbleSize.width, 0)
                ));
                
            }
        }
    }

    onBubbleQueRemoveChild() {
        for (let child of this.BulletArray.children) {
            child.runAction(cc.moveBy(0.2, BubbleSize.width, 0))
        }
    }


    update (dt: number) {}
}
