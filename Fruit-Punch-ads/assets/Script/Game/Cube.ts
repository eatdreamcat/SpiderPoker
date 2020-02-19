import { Config } from "../Config/Config";
import { TableMgr } from "../TableMgr";

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
export default class Cube extends cc.Component {
  private posIndex: number = 0;
  private fruitID: number = 0;
  reuse() {
    this.posIndex = arguments[0][0];
    this.fruitID = arguments[0][1];
    this.node.active = false;
    let icon = TableMgr.inst.getFruits(this.fruitID).Icon;
    cc.loader.loadRes(
      "Textures/Fruits/" + icon,
      cc.SpriteFrame,
      (err, spriteFrame) => {
        if (err) {
          console.error("load fruit icon err:", err);
        } else {
          this.getComponent(cc.Sprite).spriteFrame = spriteFrame;
          this.node.active = true;
        }
      }
    );
    let pos = cc.v2(
      (this.posIndex % Config.Grid.x) * this.node.width,
      -Math.floor(this.posIndex / Config.Grid.y) * this.node.height
    );

    this.node.setPosition(pos);
  }

  getIndex(): number {
    return this.posIndex;
  }

  unuse() {
    this.posIndex = 0;
    this.node.x = 0;
    this.node.y = 0;
    this.node.scale = 1;
  }

  onLoad() {}

  start() {}

  update(dt) {}
}
