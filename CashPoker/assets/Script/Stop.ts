import { Game } from "./controller/Game";
import { gEventMgr } from "./controller/EventManager";
import { GlobalEvent } from "./controller/EventName";

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

  ShowHelp() {}

  Resume() {
    this.node.active = false;
    Game.setPause(false);
  }

  start() {}

  // update (dt) {}
}
