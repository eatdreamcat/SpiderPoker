import { Game } from "./controller/Game";

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
  // LIFE-CYCLE CALLBACKS:

  private score: number = 0;
  private timeBonus: number = 0;
  private finalScore: number = 0;

  private scoreStep: number = 0;
  private timeBonusStep: number = 0;
  private finalScoreStep: number = 0;

  private showScore: number = 0;

  onLoad() {
    this.Light.active = false;
    this.Score.string = "0";
    this.TimeBonus.string = "0";
    this.FinalScore.string = "0";
    if (Game.getGameTime() > 0) {
      this.Title.spriteFrame = this.TitleAtlas.getSpriteFrame("bg_font03");
    } else {
      this.Title.spriteFrame = this.TitleAtlas.getSpriteFrame("bg_font02");
    }

    this.Result.setEventListener(this.eventListener.bind(this));
    this.showScore = Math.max(0, Game.getScore() - Game.getTimeBonus());

    this.scoreStep = this.showScore / 30;
    this.timeBonusStep = Game.getTimeBonus() / 30;
    this.finalScoreStep = Game.getScore() / 30;

    if (!CC_DEBUG) {
      this.scheduleOnce(() => {
        celerx.submitScore(Game.getScore());
      }, 2000);
    }

    this.ConfirmButton.node.on(
      cc.Node.EventType.TOUCH_END,
      () => {
        if (CC_DEBUG) {
          this.node.removeFromParent();
          Game.restart();
        } else {
          celerx.submitScore(Game.getScore());
        }
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
    }
  }

  start() {}

  update(dt) {
    if (this.score < this.showScore) {
      this.score += this.scoreStep;
      this.score = Math.min(this.score, this.showScore);
      this.Score.string = this.score.toString();
    }

    if (this.timeBonus < Game.getTimeBonus()) {
      this.timeBonus += this.timeBonusStep;
      this.timeBonus = Math.min(this.timeBonus, Game.getTimeBonus());
      this.TimeBonus.string = this.timeBonus.toString();
    }

    if (this.finalScore < Game.getScore()) {
      this.finalScore += this.finalScoreStep;
      this.finalScore = Math.min(this.finalScore, Game.getScore());
      this.FinalScore.string = this.finalScore.toString();
    }
  }
}
