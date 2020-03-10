import { Game } from "./Controller/Game";
import { TreasurePool } from "./Const";
import { gEventMgr } from "./Controller/EventManager";
import { GlobalEvent } from "./Controller/EventName";

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

const celerx = require("./Utils/celerx");
@ccclass
export default class ResultLayer extends cc.Component {



    @property(cc.Node)
    Result: cc.Node = null;

    @property(cc.Node)
    Submit: cc.Node = null;

    @property(cc.Node)
    TreasureRoot: cc.Node = null;

    @property(cc.Sprite)
    Title: cc.Sprite = null;

    @property(cc.Label)
    FinalScore: cc.Label = null;

    @property(cc.Label)
    GameScore: cc.Label = null;

    @property(cc.Label)
    Bonus: cc.Label = null;

    @property(cc.Label)
    BonusScore: cc.Label = null;



    


    private gameScore: number = 0;
    private showGameScore: number = 0;

    private bonus: number = 0;
    private showBonus: number = 0;

    private bonusScore: number = 0;
    private showBonusScore: number = 0;

    private totalScore: number = 0;
    private showTotalScore: number = 0;

    private scoreStep  = 0;

    private submit: boolean = false;

    onLoad() {


        for(let child of this.TreasureRoot.children) {
            child.getChildByName('icon').opacity = 0;
        }
        
       let bubbleScore = Game.getBubbleScore();
        
        console.log(bubbleScore)
        for (let treasure of TreasurePool) {
            if (bubbleScore[treasure]) {
                this.bonusScore += bubbleScore[treasure];
                this.bonus += 1;
            }
        }

        this.totalScore = Game.getScore();

        this.gameScore = this.totalScore - this.bonusScore;

        this.scoreStep = Math.max(Math.floor(Math.min(this.totalScore / 100, this.gameScore / 100)), 10);

        this.Submit.scale = 0;
        this.Result.scale = 0;
        this.Result.runAction(cc.sequence(
            cc.scaleTo(0.1, 1.2),
            cc.scaleTo(0.1, 1),
            cc.callFunc(this.showScore, this)
        ));

        this.Submit.on(cc.Node.EventType.TOUCH_END, ()=>{
            if (!this.canSubmit) return;

            if (CC_DEBUG) {
                window.location.reload();
            } else {
                if (!this.submit) {
                    celerx.submitScore(Game.getScore());
                    this.submit = true;
                }
            }
        }, this);

    }

    setTexture(title: cc.SpriteFrame) {
        this.Title.spriteFrame = title;
       
    }

    private show: boolean = false;

    showScore() {

        gEventMgr.emit(GlobalEvent.PLAY_EFFECT, "over")
        this.show = true;
        let count = 0;
        let bubbleScore = Game.getBubbleScore();
        for (let treasure of TreasurePool) {
            if (bubbleScore[treasure]) {
                count ++;
                setTimeout(()=>{
                    this.TreasureRoot.getChildByName(treasure.toString()).getComponent(cc.Animation).play();
                }, count * 300)
            }
        }
    }

    private canSubmit = false;

    update() {
        if (this.show) {
            if (this.showGameScore < this.gameScore) {
                this.showGameScore += this.scoreStep;
                this.showGameScore = Math.min(this.showGameScore, this.gameScore);
                this.GameScore.string = this.showGameScore.toString();
            }

            if (this.showBonus < this.bonus) {
                this.showBonus += 0.1;
                this.showBonus = Math.min(this.showBonus, this.bonus);
                this.Bonus.string = Math.floor(this.showBonus).toString();
            }

            if (this.showBonusScore < this.bonusScore) {
                this.showBonusScore += this.scoreStep;
                this.showBonusScore = Math.min(this.showBonusScore, this.bonusScore);
                this.BonusScore.string = this.showBonusScore.toString();
            }

            if (this.showGameScore == this.gameScore) {
                if (this.showTotalScore < this.totalScore) {
                    this.showTotalScore += this.scoreStep;
                    this.showTotalScore = Math.min(this.totalScore, this.showTotalScore);
                    this.FinalScore.string = this.showTotalScore.toString();
                }
            }

            if (this.showTotalScore == this.totalScore) {
                this.show = false;
                this.Submit.runAction(cc.sequence(
                    cc.scaleTo(0.1, 1.2),
                    cc.scaleTo(0.1, 1),
                    cc.callFunc(()=>{
                        this.canSubmit = true;
                        setTimeout(()=>{
                            if (!this.submit) {
                                celerx.submitScore(Game.getScore());
                                this.submit = true;
                            }
                        }, 3000)
                    }, this)
                ))
            }
        }
    }
}
