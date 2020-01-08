import { Game } from "./controller/Game";
import { gEventMgr } from "./controller/EventManager";
import { GlobalEvent } from "./controller/EventName";

const celerx = require("./utils/celerx");
const { ccclass, property } = cc._decorator;

@ccclass
export default class Result extends cc.Component {
  @property(cc.Label)
  Score: cc.Label = null;

  @property(cc.Label)
  TimeBonus: cc.Label = null;

  @property(cc.Label)
  FinalScore: cc.Label = null;

  @property(cc.Button)
  ConfirmButton: cc.Button = null;

  @property(cc.Sprite)
  Title: cc.Sprite = null;

  @property(cc.SpriteAtlas)
  TitleAtlas: cc.SpriteAtlas = null;

  @property(sp.Skeleton)
  Result: sp.Skeleton = null;

  @property(cc.Node)
  Light: cc.Node = null;

  @property(cc.Node)
  Stars: cc.Node = null;
  // LIFE-CYCLE CALLBACKS:

  private score: number = 0;
  private timeBonus: number = 0;
  private finalScore: number = 0;

  private scoreStep: number = 0;
  private timeBonusStep: number = 0;
  private finalScoreStep: number = 0;

  private showScore: number = 0;

  onLoad() {
    gEventMgr.emit(GlobalEvent.SMALL_BGM);
    for (let child of this.Stars.children) {
      let action = cc.repeatForever(
        cc.sequence(
          cc
            .fadeIn(CMath.getRandom(0.5, 1.5))
            .easing(cc.easeQuadraticActionInOut()),
          cc
            .fadeOut(CMath.getRandom(0.4, 0.8))
            .easing(cc.easeQuadraticActionInOut())
        )
      );
      child.opacity = 0;
      setTimeout(() => {
        child.runAction(action);
      }, CMath.getRandom(0, 0.5) * 1000);
    }
    this.Light.active = false;
    this.Score.string = "0";
    this.TimeBonus.string = "0";
    this.FinalScore.string = "0";
    if (Game.getGameTime() > 0) {
      if (Game.isComplete()) {
        this.Title.spriteFrame = this.TitleAtlas.getSpriteFrame("bg_complete");
      } else {
        this.Title.spriteFrame = this.TitleAtlas.getSpriteFrame("bg_font02");
      }
    } else {
      if (Game.isComplete()) {
        this.Title.spriteFrame = this.TitleAtlas.getSpriteFrame("bg_complete");
      } else {
        this.Title.spriteFrame = this.TitleAtlas.getSpriteFrame("bg_font03");
      }
    }

    this.Result.setEventListener(this.eventListener.bind(this));

    this.showScore = Math.max(0, Game.getScore() - Game.getTimeBonus());

    console.log(
      " result:",
      Game.getScore(),
      ", timeBonus:",
      Game.getTimeBonus(),
      ",showScore:",
      this.showScore
    );

    this.scoreStep = Math.ceil(this.showScore / 30);
    this.timeBonusStep = Math.ceil(Game.getTimeBonus() / 30);
    this.finalScoreStep = Math.ceil(Game.getScore() / 30);

    this.ConfirmButton.node.on(
      cc.Node.EventType.TOUCH_END,
      () => {
        if (CC_DEBUG) {
          //Game.restart();

          window.location.reload();
        } else {
          celerx.submitScore(Game.getScore());
        }
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.RESTART,
      () => {
        this.node.removeFromParent();
      },
      this
    );
  }

  eventListener(trackEntry: any, event: any) {
    switch (event.stringValue) {
      case "light":
        this.Light.active = true;
        this.Light.runAction(cc.repeatForever(cc.rotateBy(5, 360)));
        break;
      case "music1":
        console.log(" music1111111111111111111111111111111");
        gEventMgr.emit(GlobalEvent.PLAY_OVER_1);
        break;
      case "music2":
        gEventMgr.emit(GlobalEvent.PLAY_OVER_2);
        break;
    }
  }

  start() {}

  private scoreComplete: boolean = false;
  private timeBonusComplete: boolean = false;
  private finalScoreComplete: boolean = false;

  private sumbit: boolean = false;

  check() {
    if (this.sumbit) return;
    if (
      !CC_DEBUG &&
      this.scoreComplete &&
      this.timeBonusComplete &&
      this.finalScoreComplete
    ) {
      this.sumbit = true;
      console.log("submit");
      this.scheduleOnce(() => {
        celerx.submitScore(Game.getScore());
      }, 2);
    }
  }

  update(dt: number) {
    if (this.score < this.showScore) {
      this.score += this.scoreStep;
      this.score = Math.min(this.score, this.showScore);
      this.Score.string = this.score.toString();
    } else {
      this.scoreComplete = true;
      this.check();
    }

    if (this.timeBonus < Game.getTimeBonus()) {
      this.timeBonus += this.timeBonusStep;
      this.timeBonus = Math.min(this.timeBonus, Game.getTimeBonus());
      this.TimeBonus.string = this.timeBonus.toString();
    } else {
      this.timeBonusComplete = true;
      this.check();
    }

    if (this.finalScore < Game.getScore()) {
      this.finalScore += this.finalScoreStep;
      this.finalScore = Math.min(this.finalScore, Game.getScore());
      this.FinalScore.string = this.finalScore.toString();
    } else {
      this.finalScoreComplete = true;
      this.check();
    }
  }
}
