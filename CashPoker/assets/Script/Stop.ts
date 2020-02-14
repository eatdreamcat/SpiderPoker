import { Game } from "./controller/Game";
import { gEventMgr } from "./controller/EventManager";
import { GlobalEvent } from "./controller/EventName";
import Guide from "./Guide";

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

@ccclass
export default class Stop extends cc.Component {
  @property(cc.Button)
  EndButton: cc.Button = null;

  @property(cc.Button)
  ResumeButton: cc.Button = null;

  @property(cc.Button)
  Help: cc.Button = null;

  @property(cc.Label)
  Content: cc.Label = null;

  @property(cc.SpriteAtlas)
  TitleAtlas: cc.SpriteAtlas = null;

  @property(cc.Sprite)
  Title: cc.Sprite = null;

  @property(Guide)
  Guide: Guide = null;

  @property(cc.Node)
  Block: cc.Node = null;

  @property(cc.Animation)
  DrawCardAni: cc.Animation = null;

  onLoad() {
    this.EndButton.node.on(cc.Node.EventType.TOUCH_END, this.endNow, this);
    this.ResumeButton.node.on(cc.Node.EventType.TOUCH_END, this.Resume, this);
    this.Help.node.on(cc.Node.EventType.TOUCH_END, this.ShowHelp, this);

    this.Content["_enableBold"](true);
  }

  endNow(e: cc.Event.EventCustom) {

    if (!this.node.active) return;
    if (e.getUserData && typeof e.getUserData() == "function") {
      e.getUserData()();
      this.hide();
      return;
    }

    Game.calTimeBonus();
    gEventMgr.emit(GlobalEvent.OPEN_RESULT);
  }

  hide() {
    this.node.active = false;
    gEventMgr.emit(GlobalEvent.NORMAL_BGM);
  }

  /**
   *
   * @param type > 0 暂停，< 0 是提前结算
   */
  show(type: number, guide?: boolean) {
    this.node.active = true;
    gEventMgr.emit(GlobalEvent.PLAY_PAUSE);
    gEventMgr.emit(GlobalEvent.SMALL_BGM);
    

    this.Block.active = !guide;
    this.Guide.Corn.node.active = false;
    this.DrawCardAni.node.active = guide;
    this.DrawCardAni.play();
    if (type > 0) {
      this.EndButton.node.active = false;
      this.ResumeButton.node.x = 0;
      this.Content.string = "The game has been paused, please resume.";
      this.Title.spriteFrame = this.TitleAtlas.getSpriteFrame("bg_font06");
    } else {
      this.EndButton.node.active = true;
      this.ResumeButton.node.x = -215;
      this.Content.string = "Do you want to stop now with the current score?";
      this.Title.spriteFrame = this.TitleAtlas.getSpriteFrame("bg_font01");
    }
  }

  ShowHelp() {
    if (!this.node.active) return;
    this.hide();
    this.Guide.show(() => {
      Game.setPause(false);
      
    });
  }

  Resume() {
    if (!this.node.active) return;
    this.hide();
    Game.setPause(false);
   
  }

  start() {}

  // update (dt) {}
}
