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

  onLoad() {
    this.EndButton.node.on(cc.Node.EventType.TOUCH_END, this.endNow, this);
    this.ResumeButton.node.on(cc.Node.EventType.TOUCH_END, this.Resume, this);
    this.Help.node.on(cc.Node.EventType.TOUCH_END, this.ShowHelp, this);

    this.Content["_enableBold"](true);
  }

  endNow() {
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
  show(type: number) {
    this.node.active = true;
    gEventMgr.emit(GlobalEvent.PLAY_PAUSE);
    gEventMgr.emit(GlobalEvent.SMALL_BGM);
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
    this.hide();
    this.Guide.show(() => {
      Game.setPause(false);
      //gEventMgr.emit(GlobalEvent.PLAY_START);
    });
  }

  Resume() {
    this.hide();
    Game.setPause(false);
    //gEventMgr.emit(GlobalEvent.PLAY_START);
  }

  start() {}

  // update (dt) {}
}
