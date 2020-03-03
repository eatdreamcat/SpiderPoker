import { gFactory } from "./Controller/GameFactory";
import { Game } from "./Controller/Game";
import { BubbleColor, BubbleHeightOffset, BubbleYOffset, BubbleXOffset, BubbleSize, BubbleQueRange, DefaultTaskCount, BubbleType, BubbleColors, BubbleLightColor, GameTime, TargetRandomLimit, ClearTargetRange } from "./Const";
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

    @property(cc.Prefab)
    PointPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    TaskPrefab: cc.Prefab = null;

    @property(cc.SpriteAtlas)
    BubbleAtlas: cc.SpriteAtlas = null;

   

    /** 节点 */
    @property(cc.Node)
    BubbleLayer: cc.Node = null;

    @property(cc.Node)
    Shooter: cc.Node = null;

    @property(cc.Node)
    TopNode: cc.Node = null;

    @property(cc.Node)
    BulletArray: cc.Node = null;

    @property(cc.Node)
    TaskArray: cc.Node = null;

    @property(cc.Node)
    ShooterLayer: cc.Node = null;

    @property(cc.Label)
    TimeLabel: cc.Label = null;

    @property(cc.Label)
    ScoreLabel: cc.Label = null;


    /** 显示的分数 */
    private showScore: number = 0;
    /** 真实的分数 */
    private score: number = 0;
    /** 同步分数的步长 */
    private addScoreStep: number = 0;

    onLoad () {
        
        Game.BubbleLayer = this.BubbleLayer;
        Game.TopNode = this.TopNode;

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
        }, this.BubblePrefab, this.PointPrefab, this.TaskPrefab);
        
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

        Game.start();
        this.show();
    }

    initEvent() {
        gEventMgr.targetOff(this);

        /** 泡泡队列减少 */
        this.BulletArray.on(cc.Node.EventType.CHILD_REMOVED, this.onBubbleQueRemoveChild, this);
        /*** 泡泡发射完毕 */
        this.Shooter.on(cc.Node.EventType.CHILD_REMOVED, this.onShooterRemoveChild, this);


        gEventMgr.on(GlobalEvent.ADD_BUBBLE, this.addNextBubble, this);
        gEventMgr.on(GlobalEvent.UPDATE_TASK, this.updateTask, this);
        gEventMgr.on(GlobalEvent.NEXT_BUBBLE, this.getShooterBubble, this);

        if (CC_DEBUG) {
            cc.director.on("space-press", ()=>{
                this.addNextBubble(3);
            }, this);
        }
    }


    updateTask() {
        let task = Game.getCurTarget();
        for( let i = 0; i < task.now; i ++) {
            let taskNode = this.TaskArray.children[i];
            let complete = taskNode.getChildByName('Complete');
            if (taskNode.scale == 0 || complete.scale == 1) continue;
            complete.runAction(cc.sequence(cc.scaleTo(0.1, 1.2), cc.scaleTo(0.1, 1)));
        }
    }

    /** 增加count行泡泡 */
    addNextBubble(count: number = 1) {
        while(count--) {
            this.nextBubble();
        }
    }
    
    show() {
        
        let iStart = 0, iEnd = 12;
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
                bubbleMatrix.data[i].bubble.updateActive(i / 400);
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
                let lightFrame = this.BubbleAtlas.getSpriteFrame(BubbleLightColor[bubbleMatrix.data[index].color]);
                let bubble = Game.getBubble(frame, index, bubbleMatrix.data[index].color, lightFrame);

                let pos = bubbleMatrix.getPosOfij(i, j);
                bubble.x = pos.x;
                bubble.y = pos.y;

                this.BubbleLayer.addChild(bubble);
                bubbleMatrix.data[index].bubble = bubble.getComponent(Bubble);
                bubble.getComponent(Bubble).updateActive(index / 200);
            }
        }


        Game.updateCollisionIndexes();

    }


    onShooterRemoveChild() {
        //this.getShooterBubble();
    }

    /** 生成待发射的泡泡 */
    getShooterBubble(count?: number) {


        if (this.BulletArray.childrenCount <= 0) {
           
            let curTask = Game.getCurTarget();
            if (curTask.now < curTask.target) {
                this.addNextBubble(1);
            }

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
            let frameLight = this.BubbleAtlas.getSpriteFrame(BubbleLightColor[bubbleArray[i]]);
            let bubble = Game.getBubble(frame, -1, bubbleArray[i], frameLight);
            bubble.getComponent(Bubble).setActive(true, true, i / 50);
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
        
        
        let random  = CMath.getRandom();
        let targetCount = 0;
        /** 生成任务要求 */
        if (Game.getGameTime() >= 120) {
            if (random <= 0.6) {
                targetCount = CMath.Clamp(count - Math.ceil(CMath.getRandom(2, 10)), ClearTargetRange.Max, ClearTargetRange.Min);
            } else if (random <= 0.3) {
                targetCount = CMath.Clamp(count - Math.ceil(CMath.getRandom(1, 2)), ClearTargetRange.Max, ClearTargetRange.Min);
            } else {
                targetCount = CMath.Clamp(count, ClearTargetRange.Max, ClearTargetRange.Min);
            }
        } else {
            if (random <= 0.6) {
                targetCount = CMath.Clamp(count - Math.ceil(CMath.getRandom(1, 2)), ClearTargetRange.Max, ClearTargetRange.Min);
            } else if (random <= 0.2) {
                targetCount = CMath.Clamp(count - Math.ceil(CMath.getRandom(2, 10)), ClearTargetRange.Max, ClearTargetRange.Min);
            } else {
                targetCount = CMath.Clamp(count, ClearTargetRange.Max, ClearTargetRange.Min);
            }
        }

        targetCount = Math.min(count, targetCount);

        let lastTask = Game.getCurTarget();

        if (this.TaskArray.childrenCount > 0) {
            
            for (let i = 0; i < this.TaskArray.childrenCount; i ++) {

                let taskNode = this.TaskArray.children[i];
                let complete = taskNode.getChildByName('Complete');
                let fail = taskNode.getChildByName('Fail');
            
                if (lastTask.now >= lastTask.target) {
                    // 完成目标
                    taskNode.runAction(cc.sequence(
                        cc.delayTime(i / 10),
                        cc.scaleTo(0.1, 0),
                        cc.callFunc(()=>{
                            complete.scale = 0;
                            fail.scale = 0;
                            if (i <= targetCount) {
                                taskNode.runAction(cc.sequence(
                                    cc.delayTime(0),
                                    cc.scaleTo(0.1, 1.2),
                                    cc.delayTime(0.05),
                                    cc.scaleTo(0.1, 1)
                                ));
                            }
                        })
                    ));
                } else {
                    // 未完成目标
                    complete.stopAllActions();
                    complete.scale = 0;
                    fail.runAction(cc.sequence(
                        cc.delayTime(i / 10),
                        cc.scaleTo(0.1, 1),
                        cc.delayTime(0.2),
                        cc.callFunc(()=>{
                            taskNode.runAction(cc.sequence(
                                cc.delayTime(i / 10),
                                cc.scaleTo(0.1, 0),
                                cc.callFunc(()=>{
                                    fail.scale = 0;
                                    if (i <= targetCount) {
                                        taskNode.runAction(cc.sequence(
                                            cc.delayTime(0),
                                            cc.scaleTo(0.1, 1.2),
                                            cc.delayTime(0.05),
                                            cc.scaleTo(0.1, 1)
                                        ));
                                    }
                                })
                            ));
                        })
                    ));
                    
                }
            }

        } else {

            while(this.TaskArray.childrenCount < 6) {
                let taskNode = gFactory.getTask();
                taskNode.y = 0;
                taskNode.x = this.TaskArray.childrenCount * taskNode.width * 1.6 + 30;
                taskNode.scale = 0;
                if (this.TaskArray.childrenCount < targetCount) {
                    taskNode.runAction(cc.sequence(
                        cc.delayTime(this.TaskArray.childrenCount / 10), 
                        cc.scaleTo(0.1, 1.2),
                        cc.delayTime(0.05),
                        cc.scaleTo(0.1, 1)
                    ));
                } 

                this.TaskArray.addChild(taskNode);

                taskNode.getChildByName('Complete').scale = 0;
                taskNode.getChildByName('Fail').scale = 0;
            }

        }

        Game.pushTarget({
            now: 0,
            target: targetCount
        });
        

    }

    onBubbleQueRemoveChild() {
        for (let child of this.BulletArray.children) {
            child.runAction(cc.moveBy(0.2, BubbleSize.width, 0))
        }
    }

    addScore(score: number, pos: cc.Vec2 = cc.v2(0, 0)) {
        this.score += score;
        
    }




    update (dt: number) {

        if (Game.isStart) {
            Game.addGameTime(-dt);

            this.TimeLabel.string = CMath.TimeFormat(Game.getGameTime());

            if (this.showScore < this.score) {
                this.showScore += this.addScoreStep;
                this.showScore = Math.min(this.score, this.showScore);
                this.ScoreLabel.string = this.showScore.toString();
            }
        }
    }
}
