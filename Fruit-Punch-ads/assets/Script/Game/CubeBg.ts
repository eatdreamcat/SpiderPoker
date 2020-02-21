import { gEventMgr } from "../Controller/EventManager";
import { GlobalEvent } from "../Controller/EventName";
import { Game, OverType } from "./GameMgr";
import { Config } from "../Config/Config";
import { Fruits, Shape_Type, Fruits_Type } from "../table";
import { TableMgr } from "../TableMgr";

const { ccclass, property } = cc._decorator;

enum ActionTag {
  Shake,
  Idle
}
@ccclass
export default class CubeBg extends cc.Component {
  @property(cc.Sprite)
  cube: cc.Sprite = null;

  @property({
    type: cc.SpriteFrame,
    displayName: "樱桃"
  })
  yingtao: cc.SpriteFrame = null;
  @property({
    type: cc.SpriteFrame,
    displayName: "苹果"
  })
  pingguo: cc.SpriteFrame = null;
  @property({
    type: cc.SpriteFrame,
    displayName: "番茄"
  })
  fanqie: cc.SpriteFrame = null;
  @property({
    type: cc.SpriteFrame,
    displayName: "猕猴桃"
  })
  mihoutao: cc.SpriteFrame = null;
  @property({
    type: cc.SpriteFrame,
    displayName: "菠萝"
  })
  boluo: cc.SpriteFrame = null;
  @property({
    type: cc.SpriteFrame,
    displayName: "橙子"
  })
  chengzi: cc.SpriteFrame = null;

  @property({
    type: cc.SpriteFrame,
    displayName: "九宫格"
  })
  icon_daoju_B: cc.SpriteFrame = null;

  @property({
    type: cc.SpriteFrame,
    displayName: "横竖"
  })
  icon_daoju_A: cc.SpriteFrame = null;

  private index: number = 0;
  private fruitData: Fruits;
  private OldFruitID: number = 20000;
  /** 是否可以放置 */
  private available: boolean = false;

  private preRowFlag: boolean = false;
  private preColFlag: boolean = false;
  private isPlaying: boolean = false;

  /** 是否可以直接消除 */
  private isDirectlyKill: boolean = false;
  /** 是否播放特殊特效 */
  private isPlaySpecial: boolean = false;

  onLoad() {
    this.cube.node.active = false;
    this.initEvent();
  }

  update(dt: number) {}

  reuse() {
    console.log(" reuse ---------------");
    this.OldFruitID = 20000;
    this.fruitData = TableMgr.inst.getFruits(this.OldFruitID);
    this.isPlaying = false;
    this.index = parseInt(this.node.name);
    // this.index = arguments[0][0];

    this.setCubeActive(false);
    this.cube.node.opacity = 255;
    this.node.scale = 0;
    this.node.runAction(
      cc.sequence(
        cc.delayTime(this.index / 60),
        cc.scaleTo(0, 0.9),
        cc.scaleTo(0.1, 1.1),
        cc.scaleTo(0.2, 1),
        cc.callFunc(this.ready.bind(this), this)
      )
    );

    this.initEvent();
  }

  ready() {
    gEventMgr.emit(GlobalEvent.PLAY_BIU);
    console.log(Game.getCubeIndex()[this.index]);
    if (Game.getCubeIndex()[this.index] > 0) {
      this.available = true;
      this.setAvailable(false, true);
    } else {
      this.available = false;
      this.setAvailable(true);
    }
  }

  unuse() {
    this.available = false;
    gEventMgr.targetOff(this);
  }

  initEvent() {
    gEventMgr.targetOff(this);
    gEventMgr.on(GlobalEvent.PREPARE_CUBE_BG, this.reuse, this);
    gEventMgr.on(GlobalEvent.CUBE_BOX_DRAG_CANCEL, this.onDragCancel, this);
    gEventMgr.on(GlobalEvent.CUBE_BOX_DRAG_INDEX, this.onDragIndex, this);
    gEventMgr.on(GlobalEvent.CUBE_BOX_PLACE_DONE, this.placeDone, this);
    gEventMgr.on(GlobalEvent.EAT_COL, this.eatCol, this);
    gEventMgr.on(GlobalEvent.EAT_ROW, this.eatRow, this);
    gEventMgr.on(GlobalEvent.KILL_DIRECTLY, this.killDirectly, this);
    gEventMgr.on(GlobalEvent.GAME_OVER, this.onGameOver, this);
    gEventMgr.on(GlobalEvent.CLEAR_CUBE_ROOT, this.clear, this);

    this.cube
      .getComponent(cc.Animation)
      .on(cc.Animation.EventType.FINISHED, this.onKillFinished, this);

    this.cube.getComponent(cc.Animation).on(
      cc.Animation.EventType.STOP,
      () => {
        this.cube.node.scale = 1;
      },
      this
    );

    this.cube.getComponent(cc.Animation).on(
      cc.Animation.EventType.PLAY,
      () => {
        this.cube.node.stopAllActions();
        if (this.cube.node.group != "Effect") this.cube.node.group = "Effect";
        this.cube.node.scale = this.fruitData ? this.fruitData.Scale : 2;
      },
      this
    );

    this.cube.getComponent(cc.Animation).on(
      cc.Animation.EventType.RESUME,
      () => {
        this.cube.node.scale = this.fruitData ? this.fruitData.Scale : 2;
      },
      this
    );

    this.cube.getComponent(cc.Animation).on(
      cc.Animation.EventType.PAUSE,
      () => {
        this.cube.node.scale = 1;
      },
      this
    );
  }

  clear() {
    //gFactory.putCubeBg(this.node);
    this.setCubeActive(false);

    this.node.scale = 0;
  }

  onGameOver(type: OverType) {
    let icon =
      type == OverType.NO_PLACE
        ? this.fruitData.FailedIcon
        : this.fruitData.FrozenIcon;
    cc.loader.loadRes(
      "Textures/Fruits/" + icon,
      cc.SpriteFrame,
      (err, spriteFrame) => {
        if (err) {
          console.error(" load fail icon failed:", err);
        } else {
          setTimeout(() => {
            this.cube.node.stopAllActions();
            this.cube.node.scale = 1;
            this.cube.spriteFrame = spriteFrame;
            Game.addOverCount();
          }, (this.index / 60) * 1000);
        }
      }
    );
  }

  /** 消除列 */
  eatCol(colIndex: number[]) {
    if (this.isAvailable()) return;
    for (let index of colIndex) {
      if (this.index % Config.Grid.x == index) {
        this.onKill(Math.floor(this.index / 8) * this.fruitData.Delay);
        break;
      } else {
      }
    }
  }

  killDirectly() {
    if (this.isAvailable()) return;
    if (this.isDirectlyKill) {
      this.isDirectlyKill = false;
      this.onKill((this.index % 8) * this.fruitData.Delay);
    }
  }
  /** 消除行 */
  eatRow(rowIndex: number[]) {
    if (this.isAvailable()) return;
    for (let index of rowIndex) {
      if (
        this.index >= index * Config.Grid.x &&
        this.index < (index + 1) * Config.Grid.x
      ) {
        this.onKill((this.index % 8) * this.fruitData.Delay);
        break;
      }
    }
  }

  onKill(delay: number = 0) {
    this.isPlaying = true;
    Game.addScore(this.fruitData.Score);
    Game.addFruitKill(this.fruitData.ID);
    Game.addFruitScore(this.fruitData.ID, this.fruitData.Score);
    let ani = this.fruitData.KillAni;
    gEventMgr.emit(GlobalEvent.ON_KILL);
    this.fruitData.Type == Fruits_Type.DaoJu &&
      console.log(
        " this.fruitData :",
        this.fruitData.Name,
        Game.isEmitRainbowEvent
      );
    if (this.fruitData.Type == Fruits_Type.DaoJu && !Game.isEmitRainbowEvent) {
      Game.isEmitRainbowEvent = true;
      gEventMgr.emit(
        GlobalEvent.PLAY_RAINBOW_EFFECT,
        this.fruitData.ID == 20006 ? "rainbow" : "hourse"
      );
    }
    if (this.isPlaySpecial) {
      this.isPlaySpecial = false;

      if (this.fruitData.ID == 10032) {
        gEventMgr.emit(GlobalEvent.PLAY_SPECIAL_A);
      } else {
        gEventMgr.emit(GlobalEvent.PLAY_SPECIAL_B);
      }
    }

    let speed = this.fruitData ? this.fruitData.Speed : 1;
    let scale = this.fruitData ? this.fruitData.Scale : 2;
    setTimeout(
      function() {
        if (this.isPlaying) {
          this.cube.node.stopAllActions();
          this.cube.node.scale = scale;

          this.cube.getComponent(cc.Animation).play(ani, 0).speed = speed;
        }
      }.bind(this),
      delay
    );
    this.setAvailable(true);
  }

  onKillFinished() {
    this.cube.node.scale = 1;
    if (this.cube.node.group != "default") this.cube.node.group = "default";
    this.isPlaying = false;
    if (this.isAvailable()) {
      if (this.cube.node.active && this.cube.node.opacity < 255) {
      } else {
        this.setCubeActive(false);

        this.cube.node.opacity = 255;
      }
    }
  }

  /** 消除列 */
  preCol(colIndex: number[]) {
    for (let index of colIndex) {
      // 可消除
      if (this.index % Config.Grid.x == index) {
        this.preColFlag = true;
        break;
      } else {
        this.preColFlag = false;
      }
    }
  }

  /** 消除行 */
  preRow(rowIndex: number[]) {
    for (let index of rowIndex) {
      // 可消除
      if (
        this.index >= index * Config.Grid.x &&
        this.index < (index + 1) * Config.Grid.x
      ) {
        this.preRowFlag = true;
        break;
      } else {
        this.preRowFlag = false;
      }
    }
  }

  setCubeActive(active: boolean) {
    this.cube.node.active = active;
    if (this.cube.node.active) {
    } else {
      this.cube.node.stopAllActions();
      this.cube.node.scale = 1;
    }
  }

  onDragIndex(
    indexArr: number[],
    shapeID: number,
    killDirectly: number[],
    centerPoint: number[]
  ) {
    if (!Game.isStart) return;
    Game.killDirectlyCount = 0;
    if (killDirectly && killDirectly.length > 0) {
      this.isDirectlyKill = killDirectly.indexOf(this.index) >= 0;
      Game.killDirectlyCount++;
    } else {
      this.isDirectlyKill = false;
      Game.killDirectlyCount--;
    }

    if (centerPoint && centerPoint.length > 0) {
      this.isPlaySpecial = centerPoint.indexOf(this.index) >= 0;
    } else {
      this.isPlaySpecial = false;
    }

    if (this.available) {
      /** 可用状态 */
      let isReady = indexArr.indexOf(this.index) >= 0;
      // 空格子
      this.setCubeActive(isReady || this.isPlaying);

      if (isReady) this.cube.node.opacity = 150;

      if (this.cube.node.active && this.cube.node.opacity < 255) {
        // 预选
        Game.setPreCubeIndex(this.index, this.fruitData.Score);
        if (this.isPlaying) {
          this.cube.getComponent(cc.Animation).stop();
          this.isPlaying = false;
        }
        this.OldFruitID = Game.curSelectFruitID;
        this.updateFruitData(Game.curSelectFruitID);
      } else {
        Game.resetPreCubeIndex(this.index);
      }
    } else {
      // 不可用状态
      if (indexArr.indexOf(this.index) >= 0) Game.dragCount--;
      Game.setPreCubeIndex(this.index, this.fruitData.Score);
    }

    this.preCheck();
  }

  updateFruitData(fruitID: number, setOld: boolean = false) {
    this.fruitData = null;
    this.fruitData = TableMgr.inst.getFruits(fruitID);
    if (this.isPlaying) return;
    if (setOld) this.OldFruitID = fruitID;
    
    this.cube.spriteFrame = this[this.fruitData.Icon];
    // cc.loader.loadRes(
    //   "Textures/Fruits/" + this.fruitData.Icon,
    //   cc.SpriteFrame,
    //   (err, spriteFrame) => {
    //     if (err) {
    //       console.error("load fruit icon failed:" + err);
    //     } else {
    //       this.cube.spriteFrame = spriteFrame;
    //     }
    //   }
    // );
  }

  preCheck() {
    // 检测最后一个放置的水果

    let eatIndex = Game.checkRowCol(Game.getPreCubeIndex());
    let rowIndex = eatIndex[0];
    let colIndex = eatIndex[1];
    this.preRowFlag = false;
    this.preColFlag = false;

    //console.error("colIndex:", colIndex, ", rowIndex:", rowIndex);
    if (colIndex.length > 0) {
      this.preCol(colIndex);
    } else {
      this.preColFlag = false;
    }

    if (rowIndex.length > 0) {
      this.preRow(rowIndex);
    } else {
      this.preRowFlag = false;
    }

    let data = TableMgr.inst.getFruits(Game.curSelectFruitID);
    if (data && this.cube.node.active && this.cube.node.opacity < 255) {
      Game.addPreScore(data.BaseScore);
    }

    if (this.preRowFlag || this.preColFlag || this.isDirectlyKill) {
      Game.addPreScore(data.Score);
    }

    if (Game.curSelectFruitID == 20006 || Game.curSelectFruitID == 20007) {
      Game.isEmitRainbowEvent = false;
      gEventMgr.emit(
        GlobalEvent.UPDATE_RAINBOW_SCORE,
        Game.getPreScore().toString()
      );
    }

    if (!this.preRowFlag && !this.preColFlag && !this.isDirectlyKill) {
      this.shake(false);
    } else {
      this.shake(true);
    }
  }

  shake(isShake: boolean) {
    if (isShake) {
      this.updateFruitData(Game.curSelectFruitID);
      let shakeAction = this.cube.node.getActionByTag(ActionTag.Shake);
      if (shakeAction && !shakeAction.isDone()) return;
      let shake = cc.repeatForever(
        cc.sequence(
          cc.rotateTo(0.03, -4),
          cc.rotateTo(0.03, 0),
          cc.rotateBy(0.03, 4),
          cc.rotateTo(0.03, 0)
        )
      );
      this.cube.node.stopActionByTag(ActionTag.Idle);
      this.cube.node.scale = 1;
      shake.setTag(ActionTag.Shake);
      this.cube.node.runAction(shake);
    } else {
      this.cube.node.stopActionByTag(ActionTag.Shake);
      this.updateFruitData(this.OldFruitID);
      this.cube.node.rotation = 0;
    }
  }

  getIndex(): number {
    return this.index;
  }

  /** 是否可以放置 */
  isAvailable(): boolean {
    return this.available;
  }

  /** 设置是否可以放置 */
  setAvailable(available: boolean, isTest: boolean = false) {
    if (this.available == available) return;

    this.available = available;

    /** 可以放置 */
    if (this.available) {
      // 重置当前格子的值
      Game.resetCubeIndex(this.index);
      Game.resetPreCubeIndex(this.index);
      // 可用格子数量+1
      Game.addAvailableCount(1);
      this.setCubeActive(this.isPlaying);
    } else {
      // 被占用，记录当前格子的分值
      Game.setCubeIndex(this.index, this.fruitData.Score);
      Game.setPreCubeIndex(this.index, this.fruitData.Score);
      // 可用格子数量-1
      if (!isTest) Game.addAvailableCount(-1);
      this.cube.node.opacity = 255;
      this.setCubeActive(true);
      this.cube.getComponent(cc.Animation).stop();
      this.isPlaying = false;
      this.updateFruitData(Game.curSelectFruitID, isTest);
    }

    this.shake(false);
  }

  placeDone() {
    Game.canPlace = false;

    Game.resetPreScore();
    if (!this.available) return;

    if (this.cube.node.active && this.cube.node.opacity < 255) {
      /** 更新属性 */
      this.setAvailable(false);
      let idle = cc.sequence(
        cc.scaleTo(0.1, 1.2, 0.8),
        cc.scaleTo(0.1, 0.8, 1.2),
        cc.scaleTo(0.1, 1.1, 0.9),
        cc.scaleTo(0.1, 1, 1)
      );
      idle.setTag(ActionTag.Idle);
      this.cube.node.runAction(idle);
      Game.curPlaceCount++;
      Game.addScore(this.fruitData.BaseScore);
      Game.addFruitScore(this.fruitData.ID, this.fruitData.BaseScore);
    } else {
      this.setAvailable(true);
    }

    console.log(Game.curPlaceCount, Game.dragCount);
    if (Game.curPlaceCount >= Game.dragCount && Game.curPlaceCount > 0) {
      console.warn("place:", Game.curPlaceCount, Game.dragCount);
      Game.curPlaceCount = 0;
      Game.dragCount = 0;
      gEventMgr.emit(GlobalEvent.PLAY_PLACE);
      gEventMgr.emit(GlobalEvent.CUBE_BOX_SET_STATE_DONE);

      // for (let i = 0; i < 8; i++) {
      //   console.log(
      //     Game.getCubeIndex()[i * 8 + 0],
      //     "    |    ",
      //     Game.getCubeIndex()[i * 8 + 1],
      //     "    |    ",
      //     Game.getCubeIndex()[i * 8 + 2],
      //     "    |    ",
      //     Game.getCubeIndex()[i * 8 + 3],
      //     "    |    ",
      //     Game.getCubeIndex()[i * 8 + 4],
      //     "    |    ",
      //     Game.getCubeIndex()[i * 8 + 5],
      //     "    |    ",
      //     Game.getCubeIndex()[i * 8 + 6],
      //     "    |    ",
      //     Game.getCubeIndex()[i * 8 + 7]
      //   );
      // }
      // console.log("-------------------------------------------");
      // for (let i = 0; i < 8; i++) {
      //   console.log(
      //     Game.getPreCubeIndex()[i * 8 + 0],
      //     "    |    ",
      //     Game.getPreCubeIndex()[i * 8 + 1],
      //     "    |    ",
      //     Game.getPreCubeIndex()[i * 8 + 2],
      //     "    |    ",
      //     Game.getPreCubeIndex()[i * 8 + 3],
      //     "    |    ",
      //     Game.getPreCubeIndex()[i * 8 + 4],
      //     "    |    ",
      //     Game.getPreCubeIndex()[i * 8 + 5],
      //     "    |    ",
      //     Game.getPreCubeIndex()[i * 8 + 6],
      //     "    |    ",
      //     Game.getPreCubeIndex()[i * 8 + 7]
      //   );
      // }
    }
  }

  /** 方块取消放置 */
  onDragCancel() {
    Game.resetPreScore();
    if (!this.available) {
      this.shake(false);
      return;
    }
    if (!this.isPlaying) {
      this.setCubeActive(false);
      this.cube.node.opacity = 255;
    }
    Game.dragCount = 0;
  }

  start() {}

  // update (dt) {}
}
