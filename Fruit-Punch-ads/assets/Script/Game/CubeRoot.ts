import { gFactory } from "../Controller/GameFactory";
import { gEventMgr } from "../Controller/EventManager";
import { GlobalEvent } from "../Controller/EventName";
import { Config } from "../Config/Config";
import { Game, ShapeData } from "./GameMgr";
import { TableMgr } from "../TableMgr";
import { Shape } from "../table";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CubeRoot extends cc.Component {
  /** 方块组合的最大显示尺寸 */
  private readonly maxSize: cc.Size = cc.size(450, 450);
  /** 方块准备动作的时间 */
  private readonly moveDetalTime: number = 0.1;
  /** 方块放置的动作时间 */
  private readonly layDetalTime: number = 0.02;
  /** 拖拽的灵敏度 */
  private readonly dragSense: cc.Vec2 = cc.v2(2.8, 2.5);

  /** 往上弹的调整范围 */
  private readonly popOffset: cc.Vec2 = cc.v2(100, 50);
  /** 向上的基础高度 */
  private readonly popBaseY: number = 500;
  private scale: number = 1;
  private posRestored: cc.Vec2 = cc.v2(0, 0);

  /** 方块是否可以开始拖拽 */
  private isReady: boolean = false;

  private shapeData: ShapeData = null;
  private shapeStaticData: Shape;
  private fruitID: number = 0;
  private maxHorIndex: number = 0;
  private maxRow: number = 0;
  private endIndex: number = 0;

  private boxSize: cc.Size;
  private cellSize: cc.Size;

  @property(cc.Node)
  DragNode: cc.Node = null;
  @property(cc.Node)
  PlaceNode: cc.Node = null;
  reuse() {
    this.node.opacity = 255;
    this.shapeData = arguments[0][0];
    this.node.width = 0;
    this.node.height = 0;
    this.node.zIndex = 0;
    this.PlaceNode.width = 0;
    this.PlaceNode.height = 0;
    this.node.active = false;
    this.shapeData.shape.sort((a, b) => {
      return a - b;
    });

    /** 确保第一个方块开始的index都从0开始*/
    let offset = Config.Grid.x;
    let baseOffset = Math.floor(this.shapeData.shape[0] / offset);

    for (let i = 0; i < this.shapeData.shape.length; i++) {
      this.shapeData.shape[i] =
        (this.shapeData.shape[i] % offset) +
        Math.max(Math.floor(this.shapeData.shape[i] / offset - baseOffset), 0) *
          offset;

      this.maxHorIndex = Math.max(
        this.maxHorIndex,
        this.shapeData.shape[i] % Config.Grid.x
      );
    }

    let maxIndex = this.shapeData.shape[this.shapeData.shape.length - 1];
    this.maxRow = Math.max(1, Math.ceil(maxIndex / Config.Grid.x));

    this.endIndex =
      (maxIndex - (this.maxRow - 1) * Config.Grid.x) % Config.Grid.x;

    console.log(" endindex:", this.endIndex);
    this.endIndex = this.maxHorIndex - this.endIndex;

    console.log(
      " maxRow:",
      this.maxRow,
      ", maxHorIndex:",
      this.maxHorIndex,
      " ,endIndex:",
      this.endIndex
    );

    console.log(this.shapeData.shape);
    this.setFruit();

    this.PlaceNode.removeAllChildren();
    for (let posIndex of this.shapeData.shape) {
      this.PlaceNode.addChild(gFactory.getCube(posIndex, this.fruitID));
    }

    this.initEvent();
    this.scheduleOnce(this.adjustPos.bind(this), 0);
  }

  setFruit() {
    this.shapeStaticData = TableMgr.inst.getShape(this.shapeData.shapeID);
    let totalWeight = 0;
    let weightInfo = [];
    for (let fruit of this.shapeStaticData.Fruit) {
      let weight = parseInt(fruit.split("|")[0]);
      let fruitID = parseInt(fruit.split("|")[1]);
      totalWeight += weight;
      weightInfo.push({
        id: fruitID,
        weight: totalWeight
      });
    }

    console.log("------------------------set Fruit --------------------------");

    let weight = CMath.getRandom() * totalWeight;
    console.log(weightInfo);
    console.log("totalWeight:", totalWeight, "weight:", weight);
    for (let fruit of weightInfo) {
      if (fruit.weight >= weight) {
        this.fruitID = fruit.id;
        break;
      }
    }

    console.log(" fruitID: ", this.fruitID);
  }

  unuse() {
    this.node.opacity = 0;
    this.node.scale = 1;
    gEventMgr.targetOff(this);
    this.node.targetOff(this);
    this.posRestored = cc.v2(0, 0);
    this.node.x = 0;
    this.node.y = 0;
    this.scale = 1;
    this.isReady = false;
    this.maxHorIndex = 0;
  }

  initEvent() {
    gEventMgr.targetOff(this);
    gEventMgr.on(GlobalEvent.DRAG_ADJUST_DONE, this.restorePos, this);
    gEventMgr.on(GlobalEvent.GAME_OVER, this.gameOver, this);
    gEventMgr.on(GlobalEvent.CLEAR_CUBE_ROOT, this.clear, this);
  }

  clear() {
    if (!Game.isStart) {
      this.node.opacity = 0;
      while (this.PlaceNode.children.length > 0) {
        gFactory.putCube(this.PlaceNode.children[0]);
      }

      gFactory.putCubeRoot(this.node);
    }
  }

  gameOver() {
    Game.canPlace = false;
    this.back();
  }

  restorePos() {
    this.posRestored.addSelf(this.node.position);
    console.log(this.posRestored);
  }

  /** 根据实际组合大小，调整组合块的y坐标，保证align vertical center */
  adjustPos() {
    /** setBoxSize,and adjust children's pos */

    for (let child of this.PlaceNode.children) {
      this.PlaceNode.width = Math.max(this.PlaceNode.width, child.x);
      this.PlaceNode.height = Math.max(
        this.PlaceNode.height,
        Math.abs(child.y)
      );
    }

    this.PlaceNode.width += this.PlaceNode.children[0].width;
    this.PlaceNode.height += this.PlaceNode.children[0].height;
    this.node.width = this.PlaceNode.width;
    this.node.height = this.PlaceNode.height;

    this.scale = Math.min(
      1,
      this.maxSize.width / this.node.width,
      this.maxSize.height / this.node.height
    );
    this.node.scale = this.scale;
    this.DragNode.scale = 1 / this.scale;

    for (let child of this.PlaceNode.children) {
      child.x -= this.PlaceNode.width / 2 - child.width / 2;
      child.y += this.PlaceNode.height / 2 - child.height / 2;
    }
    this.node.y = 0;

    this.boxSize = cc.size(this.node.width, this.node.height);
    this.cellSize = cc.size(
      this.PlaceNode.children[0].width,
      this.PlaceNode.children[0].height
    );
    this.node.active = true;
    this.DragNode.targetOff(this);
    this.DragNode.on(cc.Node.EventType.TOUCH_MOVE, this.onDrag, this);
    this.DragNode.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.DragNode.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.DragNode.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    gEventMgr.emit(GlobalEvent.Cube_ADJUST_DONE);
  }

  onTouchStart(eventTouch: cc.Event.EventTouch) {
    if (this.isReady || !Game.canDrag || !Game.isStart) return;
    if (parseInt(this.node.name) < this.node.parent.childrenCount - 1) return;
    gEventMgr.emit(GlobalEvent.PLAY_TOUCH);
    if (this.shapeData.shapeID == 10033) {
      gEventMgr.emit(GlobalEvent.PLAY_SPECIAL_B_BGM, true);
    } else if (this.shapeData.shapeID == 10032) {
      gEventMgr.emit(GlobalEvent.PLAY_SPECIAL_A_BGM, true);
    }
    Game.resetPreScore();
    let localTouch = this.DragNode.convertToNodeSpaceAR(
      eventTouch.getLocation()
    );
    let touchPercent = cc.v2(
      (localTouch.x / this.DragNode.width) * 2,
      (localTouch.y / this.DragNode.height) * 2
    );

    let newPos = cc.v2(
      this.node.x + this.popOffset.x * touchPercent.x,
      this.node.y + this.popBaseY + touchPercent.y * this.popOffset.y
    );
    let newScale = 1 / this.node.parent.scale;
    let readyAction = cc.sequence(
      cc.spawn(
        cc.moveTo(this.moveDetalTime, newPos),
        cc.scaleTo(this.moveDetalTime, newScale)
      ),
      cc.callFunc(this.ready.bind(this), this)
    );
    this.node.stopAllActions();
    this.node.zIndex = 3;
    this.node.runAction(readyAction);
    Game.curSelectFruitID = this.fruitID;
  }

  ready() {
    this.isReady = true;
  }

  reset() {
    this.isReady = false;
    this.node.zIndex = 1;
    Game.canDrag = true;
  }

  /** 拖拽结束，判断是否可以放置到放置区，不行就回到原位 */
  onTouchEnd() {
    if (!Game.isStart) return;
    if (parseInt(this.node.name) < this.node.parent.childrenCount - 1) return;
    console.log(" end :", Game.canPlace);

    if (Game.canPlace) {
      if (this.shapeData.shapeID == 10033) {
        gEventMgr.emit(GlobalEvent.PLAY_SPECIAL_B_BGM, false);
      } else if (this.shapeData.shapeID == 10032) {
        gEventMgr.emit(GlobalEvent.PLAY_SPECIAL_A_BGM, false);
      }
      this.node.stopAllActions();

      let placePos = this.node.parent.convertToNodeSpaceAR(Game.placePos);
      this.node.runAction(
        cc.sequence(
          cc.moveTo(this.layDetalTime, placePos),
          cc.callFunc(this.placeDoneRoot.bind(this), this)
        )
      );
    } else {
      this.back();
      gEventMgr.emit(GlobalEvent.PLAY_LAY_FAIL);
    }
  }

  back() {
    // back
    console.warn("posRestored:", this.posRestored);
    if (this.shapeData.shapeID == 10033) {
      gEventMgr.emit(GlobalEvent.PLAY_SPECIAL_B_BGM, false);
    } else if (this.shapeData.shapeID == 10032) {
      gEventMgr.emit(GlobalEvent.PLAY_SPECIAL_A_BGM, false);
    }
    let unReadyAction = cc.sequence(
      cc.spawn(
        cc.moveTo(this.moveDetalTime, this.posRestored),
        cc.scaleTo(this.moveDetalTime, this.scale)
      ),
      cc.callFunc(this.reset.bind(this), this)
    );
    this.node.stopAllActions();
    this.node.runAction(unReadyAction);
    gEventMgr.emit(GlobalEvent.CUBE_BOX_DRAG_CANCEL);
  }

  /** 放置完成 */
  placeDoneRoot() {
    Game.canDrag = true;
    this.node.opacity = 0;
    while (this.PlaceNode.children.length > 0) {
      gFactory.putCube(this.PlaceNode.children[0]);
    }

    gFactory.putCubeRoot(this.node);
    console.log(" Cube Root Place done !!!!!!");
    gEventMgr.emit(GlobalEvent.CUBE_BOX_PLACE_DONE);
  }

  onDrag(eventTouch: cc.Event.EventTouch) {
    /** 等待准备action执行完后再拖拽，可能会引起一开始拖拽感觉上有延迟，如果体验不好，就去掉这个限制 */
    if (!Game.canDrag || !Game.isStart) return;

    if (!this.isReady) {
      return;
    }

    if (parseInt(this.node.name) < this.node.parent.childrenCount - 1) return;

    Game.resetPreScore();
    this.node.x += eventTouch.getDeltaX() * this.dragSense.x;
    this.node.y += eventTouch.getDeltaY() * this.dragSense.y;

    let gamePanelPos = Game.gamePanel.convertToNodeSpaceAR(
      this.node.parent.convertToWorldSpaceAR(this.node.position)
    );

    gEventMgr.emit(
      GlobalEvent.CUBE_BOX_DRAGING,
      gamePanelPos,
      [this.boxSize, this.cellSize],
      this.shapeData.shape,
      [this.endIndex, this.maxRow, this.maxHorIndex],
      this.shapeStaticData.ID
    );
  }

  getInfo(): number[] {
    return [this.endIndex, this.maxRow, this.maxHorIndex];
  }

  getShape(): number[] {
    return this.shapeData.shape;
  }

  getBoxSize(): cc.Size {
    return this.boxSize;
  }

  getCellSize(): cc.Size {
    return this.cellSize;
  }

  getShapeID(): number {
    return this.shapeStaticData.ID;
  }

  onLoad() {}

  start() {}
}
