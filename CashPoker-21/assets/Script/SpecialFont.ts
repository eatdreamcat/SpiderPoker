import { gFactory } from "./controller/GameFactory";

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
export default class SpecialFont extends cc.Component {
  @property(cc.Sprite)
  Font: cc.Sprite = null;

  callback: Function = null;
  reuse() {
    this.node.position = arguments[0][1];
    this.Font.spriteFrame = arguments[0][0];
    this.callback = arguments[0][2];
    this.node.scale = 0;
    this.node.opacity = 0;
    if (this.callback) this.callback();

    if (arguments[0][3]) {
      console.log("  bust animation !!!!!!!!!!!!!!!!!!!!!")
      this.node.getComponent(cc.Animation).on(cc.Animation.EventType.FINISHED, ()=>{
        gFactory.putSpecialFont(this.node);
        console.log(" bust animation done!!!!!!")
      }, this);
      console.log(" bust animation play !!!!!!!!!!!!!!!!!!")
      this.node.opacity = 255;
      this.node.scale = 1;
      this.node.getComponent(cc.Animation).play();
    } else {
      this.node.runAction(
        cc.sequence(
          cc.fadeIn(0),
          cc.scaleTo(0.2, 1.2),
          cc.scaleTo(0.1, 0.9),
          cc.scaleTo(0.1, 1.1),
          cc.scaleTo(0.1, 1),
          cc.delayTime(0.1),
          cc.fadeOut(0.1),
          cc.callFunc(() => {
            gFactory.putSpecialFont(this.node);
          })
        )
      );
    }
    
  }

  unuse() {}

  onLoad() {
    
  }
}
