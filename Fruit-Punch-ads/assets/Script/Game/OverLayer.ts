import { ResultData, Game } from "./GameMgr";
import { TableMgr } from "../TableMgr";
import { Fruits } from "../table";
import { gEventMgr } from "../Controller/EventManager";
import { GlobalEvent } from "../Controller/EventName";
const celerx = require("../exts/celerx");
// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

enum Step {
  ready = 0,
  total = 2 << 0,
  line = 2 << 1,
  combo = 2 << 2,
  best = 2 << 3,
  wild = 2 << 4,
  most = 2 << 5,
  done = Step.line | Step.combo | Step.best | Step.wild | Step.most,
  submit = Step.line |
    Step.combo |
    Step.best |
    Step.wild |
    Step.most |
    Step.total
}
@ccclass
export default class OverLayer extends cc.Component {
  @property(cc.Label)
  TotalScoreLabel: cc.Label = null;
  private totalScore: number = 0;
  private showTotal: boolean = false;

  @property(cc.Label)
  LineScoreLabel: cc.Label = null;
  private lineScore: number = 0;
  private showLine: boolean = false;

  @property(cc.Label)
  ComboScoreLabel: cc.Label = null;
  private comboScore: number = 0;
  private showCombo: boolean = false;

  @property(cc.Label)
  BestScoreLabel: cc.Label = null;
  private bestScore: number = 0;
  private showBest: boolean = false;

  @property(cc.Label)
  WildScoreLabel: cc.Label = null;
  private wildScore: number = 0;
  private showWild: boolean = false;

  @property(cc.Label)
  MostScoreLabel: cc.Label = null;
  private mostScore: number = 0;
  private showMost: boolean = false;

  @property(cc.Sprite)
  BestIcon: cc.Sprite = null;

  @property(cc.Sprite)
  Wild_A: cc.Sprite = null;

  @property(cc.Sprite)
  Wild_B: cc.Sprite = null;

  @property(cc.Sprite)
  MostIcon: cc.Sprite = null;

  @property(cc.Button)
  Submit: cc.Button = null;

  private step: Step = Step.ready;
  private resultData: ResultData;
  private scoreAdd: number = 10;
  onLoad() {
    this.totalScore = 0;
    this.TotalScoreLabel.string = "0";
    this.lineScore = 0;
    this.LineScoreLabel.string = "0";
    this.comboScore = 0;
    this.ComboScoreLabel.string = "0";
    this.wildScore = 0;
    this.WildScoreLabel.string = "0";
    this.bestScore = 0;
    this.BestScoreLabel.string = "0";
    this.mostScore = 0;
    this.MostScoreLabel.string = "0";
    this.BestIcon.node.active = false;
    this.Wild_A.node.active = false;
    this.Wild_B.node.active = false;
    this.MostIcon.node.active = false;
    this.showBest = false;
    this.showCombo = false;
    this.showLine = false;
    this.showMost = false;
    this.showWild = false;
    this.showTotal = false;
    this.resultData = Game.getResultData();
    this.scoreAdd = Math.max(10, Math.floor(this.resultData.totalScore / 100));
    this.Submit.node.scale = 0;
    this.step = Step.ready;
    this.Submit.node.on(
      cc.Node.EventType.TOUCH_END,
      () => {
        if (CC_DEBUG) {
          // Game.restart();
          // this.node.removeFromParent();
          window.location.reload();
        } else {
          celerx.submitScore(this.resultData.totalScore);
        }
      },
      this
    );

    gEventMgr.emit(GlobalEvent.CLEAR_CUBE_ROOT);
    gEventMgr.emit(GlobalEvent.PLAY_OVER);
  }

  start() {}

  update(dt: number) {
    if (this.showLine) {
      if (this.lineScore < this.resultData.killCol + this.resultData.killRow) {
        this.lineScore += this.scoreAdd;
      } else {
        this.lineScore = this.resultData.killCol + this.resultData.killRow;
        this.next(Step.line);
        this.showLine = false;
      }
      this.LineScoreLabel.string = this.lineScore.toString();
    }

    if (this.showCombo) {
      if (this.comboScore < this.resultData.comboScore) {
        this.comboScore += this.scoreAdd;
      } else {
        this.comboScore = this.resultData.comboScore;
        this.next(Step.combo);
        this.showCombo = false;
      }
      this.ComboScoreLabel.string = this.comboScore.toString();
    }

    if (this.showBest) {
      if (
        this.resultData.bestFruitID != 0 &&
        this.resultData.fruitScore[this.resultData.bestFruitID] &&
        this.bestScore < this.resultData.fruitScore[this.resultData.bestFruitID]
      ) {
        this.bestScore += this.scoreAdd;
      } else {
        this.bestScore =
          this.resultData.fruitScore[this.resultData.bestFruitID] || 0;
        this.next(Step.best);
        this.showBest = false;
      }
      this.BestScoreLabel.string = this.bestScore.toString();
    }

    if (this.showWild) {
      if (this.wildScore < this.resultData.wildScore) {
        this.wildScore += this.scoreAdd;
      } else {
        this.wildScore = this.resultData.wildScore;
        this.next(Step.wild);
        this.showWild = false;
      }
      this.WildScoreLabel.string = this.wildScore.toString();
    }

    if (this.showMost) {
      if (
        this.resultData.mostFruitID != 0 &&
        this.resultData.fruitScore[this.resultData.mostFruitID] &&
        this.mostScore < this.resultData.fruitScore[this.resultData.mostFruitID]
      ) {
        this.mostScore += this.scoreAdd;
      } else {
        this.mostScore =
          this.resultData.fruitScore[this.resultData.mostFruitID] || 0;
        this.next(Step.most);
        this.showMost = false;
      }
      this.MostScoreLabel.string = this.mostScore.toString();
    }

    if (this.showTotal) {
      if (this.totalScore < this.resultData.totalScore) {
        this.totalScore += this.scoreAdd;
      } else {
        this.totalScore = this.resultData.totalScore;
        this.next(Step.total);
        this.showTotal = false;
        gEventMgr.emit(GlobalEvent.PLAY_SCORE, false);
      }
      this.TotalScoreLabel.string = this.totalScore.toString();
    }
  }

  private done: boolean = false;

  next(step: Step) {
    this.step |= step;
    console.log("Step :", this.step, " Done:", Step.done);
    if (this.step >= Step.done && this.step < Step.submit) {
      this.showTotal = true;
      if (this.resultData.totalScore > 0) {
        gEventMgr.emit(GlobalEvent.PLAY_SCORE, true);
      }
    }
    if (this.step >= Step.submit && !this.done) {
      this.done = true;
      this.Submit.node.runAction(
        cc.sequence(
          cc.scaleTo(0.1, 1.2),
          cc.scaleTo(0.1, 1.0),
          cc.scaleTo(0.1, 1.1),
          cc.scaleTo(0.1, 1)
        )
      );
      setTimeout(() => {
        celerx.submitScore(this.resultData.totalScore);
      }, 3000);
    }
  }

  showLineScore() {
    this.showLine = true;
  }

  playOverTab() {
    gEventMgr.emit(GlobalEvent.PLAY_OVER_TAB);
  }

  showComboScore() {
    this.showCombo = true;
  }

  showBestScore() {
    this.showBest = true;
    let data: Fruits;
    this.resultData.bestFruitID != 0 &&
      (data = TableMgr.inst.getFruits(this.resultData.bestFruitID));
    if (data) {
      cc.loader.loadRes(
        "Textures/Fruits/" + data.Icon,
        cc.SpriteFrame,
        (err, sp) => {
          if (err) {
            console.error(err);
          } else {
            this.BestIcon.node.active = true;
            this.BestIcon.spriteFrame = sp;
          }
        }
      );
    }
  }

  showWildScore() {
    this.showWild = true;
    this.Wild_A.node.active = this.resultData.Wild_A;
    this.Wild_B.node.active = this.resultData.Wild_B;
    if (this.Wild_A.node.active && !this.Wild_B.node.active) {
      this.Wild_A.node.x = this.Wild_B.node.x;
    }
  }

  showMostScore() {
    this.showMost = true;
    if (this.resultData.mostFruitID != 0) {
      let data = TableMgr.inst.getFruits(this.resultData.mostFruitID);
      if (data) {
        cc.loader.loadRes(
          "Textures/Fruits/" + data.Icon,
          cc.SpriteFrame,
          (err, sp) => {
            if (err) {
              console.error(err);
            } else {
              this.MostIcon.node.active = true;
              this.MostIcon.spriteFrame = sp;
            }
          }
        );
      }
    }
  }
}
