import { gFactory } from "../Controller/GameFactory";
import { gEventMgr } from "../Controller/EventManager";
import { GlobalEvent } from "../Controller/EventName";
import { gAudio } from "../Controller/AudioController";
import { Game, ShapeData, OverType } from "./GameMgr";
import CubeBg from "./CubeBg";
import { Config } from "../Config/Config";
import CubeRoot from "./CubeRoot";
import { TableMgr } from "../TableMgr";
import { Shape_Type } from "../table";
const celerx = require("../exts/celerx");
const { ccclass, property } = cc._decorator;
/** 加载的步骤 */
export enum LOAD_STEP {
  /** 初始化 */
  READY,
  /** 加载表 */
  PREFABS = 2 << 0,

  /** 场景加载完成 */
  AUDIO = 2 << 3,
  CELER = 2 << 4,
  GUIDE = 2 << 5,
  /** 完成 */
  DONE = LOAD_STEP.READY | LOAD_STEP.PREFABS | LOAD_STEP.CELER | LOAD_STEP.GUIDE
}

@ccclass
export default class GameScene extends cc.Component {
  @property(cc.Node)
  GamePanel: cc.Node = null;

  @property(cc.Node)
  DragPanel: cc.Node = null;

  @property(cc.Label)
  Score: cc.Label = null;

  @property(cc.Label)
  TimeLabel: cc.Label = null;
  @property(cc.ProgressBar)
  TimeProgress: cc.ProgressBar = null;

  @property(cc.Animation)
  ShowText: cc.Animation = null;
  @property(cc.Label)
  FloatScore: cc.Label = null;

  @property(cc.Prefab)
  Cube: cc.Prefab = null;
  @property(cc.Prefab)
  CubeRoot: cc.Prefab = null;

  @property(cc.Animation)
  RainbowEffect: cc.Animation = null;
  @property(cc.Label)
  RainbowScore: cc.Label = null;
  @property(cc.Label)
  RainbowScoreBg: cc.Label = null;

  @property(cc.Button)
  Forward: cc.Button = null;
  @property(cc.Button)
  Next: cc.Button = null;

  @property(cc.Node)
  ButtonNode: cc.Node = null;
  @property(cc.SpriteFrame)
  Close: cc.SpriteFrame = null;
  @property(cc.SpriteFrame)
  NextSprite: cc.SpriteFrame = null;
  private _step: LOAD_STEP = LOAD_STEP.READY;

  @property(cc.Label)
  Tip: cc.Label = null;

  @property(cc.Animation)
  Lodinging: cc.Animation = null;
  @property(cc.PageView)
  GuidePage: cc.PageView = null;

  private adjustCount: number = 0;

  private floatScorePos: cc.Vec2;
  private floatScoreMoveSpeed: number = 600;
  private readonly scorePos: cc.Vec2 = cc.v2(350, 95);
  private score: number = 0;
  private canUpdateScore: boolean = false;
  private rainbowEffectArray: string[] = [];
  private rainbowScoreArray: string[] = [];
  onLoad() {
    this.RainbowEffect.node.opacity = 0;
    this.RainbowScore.string = "";
    this.RainbowScoreBg.string = "";
    this.GuidePage.node.active = false;
    this.ButtonNode.active = false;

    this.Next.node.on(cc.Node.EventType.TOUCH_START, this.nextPage, this);
    this.Forward.node.on(cc.Node.EventType.TOUCH_START, this.forwardPage, this);
    celerx.ready();
    CMath.randomSeed = Math.random();
    let self = this;
    celerx.onStart(
      function() {
        self.celerStart();
      }.bind(this)
    );

    celerx.provideScore(() => {
      return Game.getScore();
    });

    CC_DEBUG && this.celerStart();

    cc.game.setFrameRate(Config.FPS);

    cc.loader.loadResDir("Textures/Fruits/");
    cc.loader.loadResDir("sounds");
    cc.loader.loadRes("prefabs/OverLayer");
    this.Score.string = "0";
    this.FloatScore.string = "";
    this.Tip.node.active = false;

    gAudio.init(
      function() {
        //this.nextStep(LOAD_STEP.AUDIO);
      }.bind(this)
    );

    //CC_DEBUG && (TableMgr.JSON_URL = "http://192.168.50.169:7070/KeepFit/");
    TableMgr.inst.startLoad("json/", () => {
      gFactory.init(
        function() {
          this.nextStep(LOAD_STEP.PREFABS);
        }.bind(this),
        this.Cube,
        this.CubeRoot
      );
    });

    this.initEvent();
    Game.bindGamePanel(this.GamePanel);
    this.Score.string = "0";
    this.TimeLabel.string = "3/00";

    //this.GamePanel.removeAllChildren();
    //this.initGamePanel();

    this.DragPanel.removeAllChildren();
  }

  nextPage() {
    if (
      this.GuidePage.getCurrentPageIndex() >=
      this.GuidePage.content.childrenCount - 1
    ) {
      this.GuidePage.node.runAction(
        cc.sequence(
          cc.scaleTo(0.2, 0),
          cc.callFunc(() => {
            this.GuidePage.node.active = false;
            this.ButtonNode.active = false;
          }, this)
        )
      );

      this.nextStep(LOAD_STEP.GUIDE);
    } else {
      this.GuidePage.setCurrentPageIndex(
        (this.GuidePage.getCurrentPageIndex() + 1) %
          this.GuidePage.content.childrenCount
      );
    }
  }

  forwardPage() {
    if (this.GuidePage.getCurrentPageIndex() <= 0) {
    } else {
      this.GuidePage.setCurrentPageIndex(
        (this.GuidePage.getCurrentPageIndex() - 1) %
          this.GuidePage.content.childrenCount
      );
    }
  }

  celerStart() {
    let match = celerx.getMatch();
    if (match && match.sharedRandomSeed) {
      CMath.randomSeed = match.sharedRandomSeed;
      CMath.sharedSeed = match.sharedRandomSeed;
    } else {
      CMath.randomSeed = Math.random();
    }
    this.nextStep(LOAD_STEP.CELER);

    if ((match && match.shouldLaunchTutorial) || CC_DEBUG) {
      this.GuidePage.node.active = true;
      this.ButtonNode.active = true;
    } else {
      this.GuidePage.node.active = false;
      this.ButtonNode.active = false;
      this.nextStep(LOAD_STEP.GUIDE);
    }
  }

  /**
   * 下一步
   */
  private nextStep(loadStep: LOAD_STEP) {
    this._step |= loadStep;

    console.log("CUR STEP:" + LOAD_STEP[loadStep] + ", total: " + this._step);

    if (this._step >= LOAD_STEP.DONE) {
      this.Lodinging.node.active = false;
      this.GamePanel.scale = 1;
      Game.start();
      gEventMgr.emit(GlobalEvent.PREPARE_CUBE_BG);
    } else {
    }
  }

  initGamePanel() {
    console.log("   gEventMgr.emit(GlobalEvent.PREPARE_CUBE_BG)  ");
    gEventMgr.emit(GlobalEvent.PREPARE_CUBE_BG);
    // for (let i = 0; i <= 63; i++) {
    //   this.GamePanel.runAction(
    //     cc.sequence(
    //       cc.delayTime(i / 60),
    //       cc.callFunc(() => {
    //         this.GamePanel.addChild(gFactory.getCubeBg(i));
    //       }, this)
    //     )
    //   );
    // }
  }

  initEvent() {
    gEventMgr.targetOff(this);
    gEventMgr.on(GlobalEvent.Cube_ADJUST_DONE, this.adjustDragPanel, this);
    gEventMgr.on(GlobalEvent.CUBE_BOX_DRAGING, this.onBoxDrag, this);
    gEventMgr.on(
      GlobalEvent.CUBE_BOX_SET_STATE_DONE,
      this.onCubePlaceDone,
      this
    );
    gEventMgr.on(GlobalEvent.UPDATE_SCORE, this.updateScore, this);
    gEventMgr.once(GlobalEvent.ON_KILL, this.onKill, this);

    gEventMgr.on(GlobalEvent.COL_EFFECT, this.colEffect, this);
    gEventMgr.on(GlobalEvent.ROW_EFFECT, this.rowEffect, this);
    gEventMgr.on(GlobalEvent.SHOW_TEXT, this.showText, this);
    gEventMgr.on(GlobalEvent.GAME_START, this.gameStart, this);
    gEventMgr.on(GlobalEvent.SHOW_OVER_LAYER, this.gameOver, this);
    gEventMgr.on(GlobalEvent.GAME_RESTART, this.initGamePanel, this);
    gEventMgr.on(
      GlobalEvent.PLAY_RAINBOW_EFFECT,
      (name: string) => {
        let state1 = this.RainbowEffect.getAnimationState("rainbow");
        let state2 = this.RainbowEffect.getAnimationState("hourse");
        if (state1.isPlaying || state2.isPlaying) {
          this.rainbowEffectArray.push(name);
          return;
        }

        this.RainbowEffect.play(name);
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.UPDATE_RAINBOW_SCORE,
      (score: string) => {
        let state1 = this.RainbowEffect.getAnimationState("rainbow");
        let state2 = this.RainbowEffect.getAnimationState("hourse");
        if (state1.isPlaying || state2.isPlaying) {
          this.rainbowScoreArray[
            Math.max(this.rainbowEffectArray.length - 1, 0)
          ] = score;
          console.log(" ------------------------------- ");
          console.log(this.rainbowScoreArray);
          return;
        }
        this.RainbowScoreBg.string = score;
        this.RainbowScore.string = this.RainbowScoreBg.string;
      },
      this
    );

    this.RainbowEffect.on(
      cc.Animation.EventType.FINISHED,
      this.onShowTextFinish,
      this
    );

    this.ShowText.on(
      cc.Animation.EventType.FINISHED,
      this.onShowTextFinish,
      this
    );
  }

  onShowTextFinish(event?: string, aniState?: cc.AnimationState) {
    if (!aniState) return;
    if (aniState.name == "letsgo") {
      Game.isStart = true;
    }

    if (aniState.name == "rainbow" || aniState.name == "hourse") {
      this.RainbowScoreBg.string = "";
      this.RainbowScore.string = this.RainbowScoreBg.string;
      if (this.rainbowEffectArray.length > 0) {
        let ani = this.rainbowEffectArray.shift();
        let score = this.rainbowScoreArray.shift();
        this.RainbowScore.string = score ? score : "";
        this.RainbowScoreBg.string = this.RainbowScore.string;
        this.RainbowEffect.play(ani);
      }
    }
  }

  gameOver() {
    this.FloatScore.string = "";
    cc.loader.loadRes("prefabs/OverLayer", cc.Prefab, (err, prefab) => {
      if (err) {
        console.error(" load over layer failed:", err);
        celerx.submitScore(Game.getResultData().totalScore);
      } else {
        this.Tip.node.active = CC_DEBUG;
        this.Tip.node.runAction(
          cc.repeatForever(cc.sequence(cc.fadeTo(0.1, 0), cc.fadeTo(0.2, 255)))
        );
        if (CC_DEBUG) {
          this.node.once(
            cc.Node.EventType.TOUCH_END,
            () => {
              if (!Game.isStart) {
                this.node.addChild(cc.instantiate(prefab));
                this.Tip.node.active = false;
              }
            },
            this
          );
        } else {
          this.node.addChild(cc.instantiate(prefab));
        }
      }
    });
  }

  showText(name: string) {
    console.log(" showText:", name);
    gEventMgr.emit(GlobalEvent.PLAY_TEXT, name);
    this.ShowText.play(name);
  }

  rowEffect(rowIndex: number[]) {
    if (rowIndex.length > 0) {
      gEventMgr.emit(GlobalEvent.PLAY_KILL_EFFECT);
    }
  }

  colEffect(colIndex: number[]) {
    if (colIndex.length > 0) {
      gEventMgr.emit(GlobalEvent.PLAY_KILL_EFFECT);
    }
  }

  onKill() {}

  onAnimationFinish(eventName?: string, ani?: cc.AnimationState) {}

  updateScore() {
    //this.Score.string = Game.getScore().toString();
  }

  /**
   *
   * @param boxPos 方块组合中心点在放置区的坐标
   * @param boxSize 方块组合的尺寸
   * @param cellSize 每个方块的尺寸
   * @param shapeIndex 方块组合的每个方块index
   * @param indexOffset 方块组合首块和末块的横向index差值
   */
  onBoxDrag(
    boxPos: cc.Vec2,
    sizeInfo: cc.Size[],
    shapeIndex: number[],
    boxInfo: number[],
    shapeID: number
  ) {
    let boxSize = sizeInfo[0];
    let cellSize = sizeInfo[1];
    let startPos = boxPos.add(
      cc.v2(
        -boxSize.width / 2 + cellSize.width / 2,
        boxSize.height / 2 - cellSize.height / 2
      )
    );

    this.floatScorePos = cc.v2(boxPos.x, boxPos.y + 80);

    Game.canPlace = this.checkCanPlace(
      boxPos,
      startPos,
      shapeIndex,
      boxInfo,
      shapeID,
      true
    );
    if (Game.canPlace) {
      this.updateFloatScore();
    } else {
      this.FloatScore.string = "";
      gEventMgr.emit(GlobalEvent.CUBE_BOX_DRAG_CANCEL);
    }
  }

  updateFloatScore() {
    if (Game.getPreScore() <= 0) {
      this.FloatScore.string = "";
    } else {
      this.FloatScore.node.scale = 1;
      this.FloatScore.string = Game.getPreScore().toString();
    }
  }

  /** 检查是否可以放置方块 */
  checkCanPlace(
    boxPos: cc.Vec2,
    startPos: cc.Vec2,
    shapeIndex: number[],
    boxInfo: number[],
    shapeID: number,
    isPlace: boolean = false
  ): boolean {
    let indexOffset = boxInfo[0];
    let maxRow = boxInfo[1];
    let maxCol = boxInfo[2];
    /** 获取方块组合的起始和结束方块的节点 */
    let startNode: cc.Node = null;
    let endNode: cc.Node = null;

    for (let child of this.GamePanel.children) {
      if (startNode) {
        if (
          CMath.Distance(startNode.position, startPos) >=
          CMath.Distance(child.position, startPos)
        ) {
          startNode = child;
        }
      } else if (
        CMath.Distance(child.position, startPos) <=
        (child.width / 2) * Math.SQRT2
      ) {
        startNode = child;
      }

      //child.color = cc.Color.WHITE;
    }

    /**
     * 获取结束方块
     */
    if (startNode) {
      //startNode.color = cc.Color.BLACK;
      let startIndex = startNode.getComponent(CubeBg).getIndex();
      let endIndex = startIndex + (maxRow - 1) * Config.Grid.x + maxCol;

      if (endIndex % Config.Grid.x >= startIndex % Config.Grid.x)
        // for (let child of this.GamePanel.children) {
        //   let cubeBg = child.getComponent(CubeBg);
        //   if (cubeBg.getIndex() == endIndex) {
        //     endNode = child;
        //     break;
        //   }
        // }
        endNode = this.GamePanel.children[endIndex];
    } else {
      return false;
    }

    if (endNode) {
      //endNode.color = cc.Color.YELLOW;
      let cubeBgStart: CubeBg = startNode.getComponent(CubeBg);
      if (cubeBgStart) {
        let indexArr: number[] = [];
        for (let index of shapeIndex) {
          let data = cubeBgStart.getIndex() + index;
          if (data < 0 || data > 63) continue;
          indexArr.push(data);
        }
        /**  &&
          indexArr[0] >= 0 &&
          indexArr[indexArr.length - 1] <= 63  */
        if (indexArr.length > 0 && shapeIndex.length == indexArr.length) {
          let realEndNode: cc.Node = null;
          for (let child of this.GamePanel.children) {
            if (
              child.getComponent(CubeBg).getIndex() ==
              indexArr[indexArr.length - 1]
            ) {
              realEndNode = child;
            }
            if (
              !child.getComponent(CubeBg).isAvailable() &&
              indexArr.indexOf(child.getComponent(CubeBg).getIndex()) >= 0
            ) {
              return false;
            }
          }

          /** 判断一下真实的末块和末尾块的index差值是否跟原形状的差值是一致的 */
          if (
            realEndNode &&
            (endNode.getComponent(CubeBg).getIndex() % Config.Grid.x) -
              (realEndNode.getComponent(CubeBg).getIndex() % Config.Grid.x) ==
              indexOffset
          ) {
            if (isPlace) {
              /** 计算特殊道具 */
              /** 所有预制体监听事件的参数是同一个引用 */

              let shapeData = TableMgr.inst.getShape(shapeID);
              // 特殊道具
              /** 九宫直接消除不需要填满 */
              let killDirectly = [];
              let centerPoint = [];
              if (shapeData && shapeData.Type == Shape_Type.TeShuDaoJu) {
                // 消除整行
                let oldLength = indexArr.length;
                if (shapeData.RowKillNumber && shapeData.RowKillNumber > 0) {
                  for (let i = 0; i < oldLength; i++) {
                    let start = indexArr[i] - (indexArr[i] % 8);
                    let end = start + 7;
                    for (let j = start; j <= end; j++) {
                      if (indexArr.indexOf(j) < 0) indexArr.push(j);
                    }
                  }
                }

                // 消除整列
                if (shapeData.ColKillNumber && shapeData.ColKillNumber > 0) {
                  for (let i = 0; i < oldLength; i++) {
                    let add = indexArr[i] + 8;
                    while (add <= 63) {
                      if (indexArr.indexOf(add) < 0) indexArr.push(add);
                      add += 8;
                    }

                    let sub = indexArr[i] - 8;
                    while (sub >= 0) {
                      if (indexArr.indexOf(sub) < 0) indexArr.push(sub);
                      sub -= 8;
                    }
                  }
                }

                //console.log(indexArr);
                // 九宫格
                if (shapeData.GridKill && shapeData.GridKill.length > 0) {
                  for (let pos of shapeData.GridKill) {
                    let split = pos.split(",");
                    let x = parseInt(split[0]);
                    let y = parseInt(split[1]);
                    for (let i = 0; i < oldLength; i++) {
                      if (killDirectly.indexOf(indexArr[i]) < 0)
                        killDirectly.push(indexArr[i]);
                      if (centerPoint.indexOf(indexArr[i]) < 0)
                        centerPoint.push(indexArr[i]);

                      let index = indexArr[i] + 8 * y + x;
                      /** 判断列差是否一致 */
                      if ((index % 8) - (indexArr[i] % 8) != x) continue;
                      if (index > 63 || index < 0) continue;
                      if (indexArr.indexOf(index) < 0) indexArr.push(index);
                      if (killDirectly.indexOf(index) < 0)
                        killDirectly.push(index);
                    }
                  }
                }
              }

              Game.dragCount = indexArr.length;
              /** 可以放置的情况 */

              gEventMgr.emit(
                GlobalEvent.CUBE_BOX_DRAG_INDEX,
                indexArr,
                shapeID,
                killDirectly,
                centerPoint
              );
              Game.canPlace = true;
              Game.placePos = this.GamePanel.convertToWorldSpaceAR(
                startNode.position.sub(startPos).add(boxPos)
              );
            }
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  /** 调整拖拽区域的布局 */
  adjustDragPanel() {
    this.adjustCount++;
    console.log(this.adjustCount);
    if (this.adjustCount >= 3) {
      this.adjustCount = 0;
      // let totalChildWidth = 0;
      // for (let child of this.DragPanel.children) {
      //   totalChildWidth += child.width * child.scale;
      // }

      let centerChild = this.DragPanel.children[1];
      let leftChild = this.DragPanel.children[0];
      let rightChild = this.DragPanel.children[2];

      centerChild.x = 0;
      let width = this.DragPanel.width / 2;
      leftChild.x = width * 0.6;
      rightChild.x = -width * 0.6;
      // let gap =
      //   ((this.DragPanel.width - totalChildWidth) * this.node.scale) / 4;

      // leftChild.x =
      //   centerChild.x -
      //   gap -
      //   (leftChild.width / 2) * leftChild.scale -
      //   (centerChild.width / 2) * centerChild.scale;

      // rightChild.x =
      //   centerChild.x +
      //   (centerChild.width / 2) * centerChild.scale +
      //   gap +
      //   (rightChild.width / 2) * rightChild.scale;

      gEventMgr.emit(GlobalEvent.DRAG_ADJUST_DONE);
      this.checkIsGameOver();
    }
  }

  genNewDragShape(shapeList: ShapeData[]) {
    if (shapeList.length < 3) {
      console.error(" 方块生成个数不足!!!!!!!!!!!!!!!!!!!");
    }
    for (let shape of shapeList) {
      this.DragPanel.addChild(gFactory.getCubeRoot(shape));
    }
  }

  /** 方块放置完成，需要检测需不需要生成新的方块，判断游戏是否结束 */
  onCubePlaceDone() {
    this.FloatScore.node.runAction(
      cc.sequence(
        cc.scaleTo(0.1, 1.5),
        cc.moveTo(0.2, this.scorePos),
        cc.callFunc(this.startUpdateScore.bind(this), this)
      )
    );
    Game.check();
    if (this.DragPanel.childrenCount <= 0) {
      /** 方块用完，需要重新生成方块 */
      this.genNewDragShape(Game.getShapes());
    } else {
      this.checkIsGameOver();
    }
  }

  /** 检测是否还有位置可以放置 */
  checkIsGameOver() {
    /**
     * 检测是否还有位置
     */
    let isGameOver = true;
    for (let box of this.DragPanel.children) {
      let cubeRoot: CubeRoot = box.getComponent(CubeRoot);
      for (let child of this.GamePanel.children) {
        if (!isGameOver) break;
        // let cubeBg: CubeBg = child.getComponent(CubeBg);
        //child.color = cc.Color.WHITE;
        //if (!cubeBg.isAvailable()) continue;
        //console.error(cubeRoot.getShapeID());
        if (
          this.checkCanPlace(
            child.position,
            child.position,
            cubeRoot.getShape(),
            cubeRoot.getInfo(),
            cubeRoot.getShapeID()
          )
        ) {
          //child.color = cc.Color.GREEN;
          isGameOver = false;
          break;
        }
      }
    }

    if (isGameOver) {
      // OVER
      Game.gameOver(OverType.NO_PLACE);
      gEventMgr.emit(GlobalEvent.PLAY_OVER_NO_PLACE);
    }
  }

  gameStart() {
    this.ShowText.play("letsgo");
    gEventMgr.emit(GlobalEvent.PLAY_LETSGO);
    this.onCubePlaceDone();
  }

  /** 可以开始更新分数显示 */
  startUpdateScore() {
    this.canUpdateScore = true;
    this.FloatScore.string = "";
    this.FloatScore.node.scale = 1;
    this.updateFloatScore();
  }

  update(dt: number) {
    if (this.ButtonNode.active) {
      this.Forward.node.active = this.GuidePage.getCurrentPageIndex() > 0;
      this.Next.node.children[0].getComponent(cc.Sprite).spriteFrame =
        this.GuidePage.getCurrentPageIndex() <
        this.GuidePage.content.childrenCount - 1
          ? this.NextSprite
          : this.Close;
    }
    Game.update(dt);
    this.updateTime();
    if (
      this.floatScorePos &&
      this.FloatScore.node.getNumberOfRunningActions() <= 0
    ) {
      let offset = this.floatScoreMoveSpeed * dt;
      if (
        CMath.Distance(this.floatScorePos, this.FloatScore.node.position) > 200
      ) {
        this.FloatScore.node.x = this.floatScorePos.x;
        this.FloatScore.node.y = this.floatScorePos.y;
      }
      if (this.FloatScore.node.x > this.floatScorePos.x) {
        this.FloatScore.node.x -= offset;
      } else if (this.FloatScore.node.x < this.floatScorePos.x) {
        this.FloatScore.node.x += offset;
      }

      if (this.FloatScore.node.y > this.floatScorePos.y) {
        this.FloatScore.node.y -= offset;
      } else if (this.FloatScore.node.y < this.floatScorePos.y) {
        this.FloatScore.node.y += offset;
      }

      if (Math.abs(this.FloatScore.node.x - this.floatScorePos.x) < 10) {
        this.FloatScore.node.x = this.floatScorePos.x;
      }

      if (Math.abs(this.FloatScore.node.y - this.floatScorePos.y) < 10) {
        this.FloatScore.node.y = this.floatScorePos.y;
      }
    }

    // update score
    if (this.canUpdateScore) {
      if (this.score < Game.getScore()) {
        this.score += 3;
      } else {
        this.canUpdateScore = false;
        this.score = Game.getScore();
      }
      this.Score.string = this.score.toString();
    }
  }

  updateTime() {
    this.TimeLabel.string = CMath.TimeFormat(Game.getTime());
    this.TimeProgress.progress = Game.getTime() / Config.GameTime;
  }
}
