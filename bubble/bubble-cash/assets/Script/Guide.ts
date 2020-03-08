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

const { ccclass, property } = cc._decorator;

@ccclass
export default class Guide extends cc.Component {
  @property(cc.SpriteAtlas)
  ButtonAtlas: cc.SpriteAtlas = null;

  @property(cc.Button)
  Next: cc.Button = null;

  @property(cc.Button)
  Forward: cc.Button = null;

  @property(cc.Node)
  Content: cc.Node = null;

  @property(cc.PageView)
  GuideView: cc.PageView = null;

  private callback: Function = null;
  onLoad() {
    this.Next.node.on(cc.Node.EventType.TOUCH_END, this.nextPage, this);
    this.Forward.node.on(cc.Node.EventType.TOUCH_END, this.forwardPage, this);
    for (let child of this.Content.children) {
      child.getChildByName('Close').on(cc.Node.EventType.TOUCH_END, this.hide, this)
    }
  }

  start() {}

  hide() {
    this.node.active = false;
    if (this.callback) this.callback();
  }

  show(closeCallback?: Function) {
    this.node.active = true;
    this.callback = closeCallback;
    this.GuideView.scrollToPage(0, 0);
    this.Forward.node.active = false;
    this.Next.node
      .getComponent(cc.Sprite).spriteFrame = this.ButtonAtlas.getSpriteFrame(
      "btn_new"
    );
  }

  nextPage() {
    if (
      this.GuideView.getCurrentPageIndex() >=
      this.GuideView.content.childrenCount - 1
    ) {
      this.hide();
    } else {
      let nextPageIndex =
        (this.GuideView.getCurrentPageIndex() + 1) %
        this.GuideView.content.childrenCount;
      this.GuideView.setCurrentPageIndex(nextPageIndex);
      if (nextPageIndex >= this.GuideView.content.childrenCount - 1) {
        this.Next.node
          .getComponent(
            cc.Sprite
          ).spriteFrame = this.ButtonAtlas.getSpriteFrame("new_close");
      }
      this.Forward.node.active = nextPageIndex != 0;
    }
  }

  forwardPage() {
    if (this.GuideView.getCurrentPageIndex() <= 0) {
    } else {
      let nextPageIndex =
        (this.GuideView.getCurrentPageIndex() - 1) %
        this.GuideView.content.childrenCount;
      this.GuideView.setCurrentPageIndex(nextPageIndex);
      this.Forward.node.active = nextPageIndex != 0;
      this.Next.node
        .getComponent(cc.Sprite).spriteFrame = this.ButtonAtlas.getSpriteFrame(
        "btn_new"
      );
    }
  }
}
