import { Config } from "../Config/Config";
import { gEventMgr } from "../Controller/EventManager";
import { GlobalEvent } from "../Controller/EventName";
import { HashMap } from "../exts/HashMap";
import { TableMgr } from "../TableMgr";
import { ShapeWeight, Fruits_Type, Shape_Type } from "../table";

/** 结算数据 */
export interface ResultData {
  /** 总的得分 */
  totalScore: number;
  /** 消除的行数 */
  killRow: number;
  /** 消除的列数 */
  killCol: number;
  /** 最大连消次数 */
  maxCombo: number;
  /** 特殊道具得分 */
  wildScore: number;
  /** combo得分 */
  comboScore: number;
  /** 各种水果的得分 */
  fruitScore: any;
  /** 各种水果消除的数量 */
  fruitKill: any;
  /** 得分最高的水果ID */
  mostFruitID: number;
  /** 消除个数最多的 */
  bestFruitID: number;
  /** 是否有道具A银色 */
  Wild_A: boolean;
  /** 是否有道具B金色 */
  Wild_B: boolean;
}

export interface ShapeData {
  shape: number[];
  shapeID: number;
}

/** 游戏结束类型 */
export enum OverType {
  /** 时间到 */
  TIME_OUT,
  /** 没地方可以放 */
  NO_PLACE
}

class GameMgr {
  private static ins: GameMgr;
  public static get inst() {
    return this.ins ? this.ins : (this.ins = new GameMgr());
  }
  private constructor() {}

  public gamePanel: cc.Node = null;
  public dragPanel: cc.Node = null;
  public isEmitRainbowEvent: boolean = false;

  /** 游戏统计数据 */
  private data: ResultData = {
    totalScore: 0,
    killCol: 0,
    killRow: 0,
    maxCombo: 0,
    wildScore: 0,
    fruitKill: {},
    fruitScore: {},
    comboScore: 0,
    mostFruitID: 0,
    bestFruitID: 0,
    Wild_A: false,
    Wild_B: false
  };
  private combo: number = 0;
  private time: number = Config.GameTime;

  /** 是否可以放置 */
  public canPlace: boolean = false;
  public placePos: cc.Vec2 = cc.v2(0, 0);
  public canDrag: boolean = true;
  public isStart: boolean = false;
  /** 当前拖拽的方块组合包含的方块个数 */
  public dragCount: number = 0;
  /** 当前已放置的方块数 */
  public curPlaceCount: number = 0;
  /** 放置区可放置的方块数 */
  private availableCount: number = 0;
  private initAvailableCountInit: number = 64;
  private cubeCount: number = 64;

  /** 测试 */
  private testCubeIndex: number[] = [
    100, 100,   0, 100, 100, 100, 100, 100,
    100, 100,   0,   0, 100, 100, 100, 100,
    100, 100, 100,   0, 100, 100, 100, 100,
      0,   0, 100, 100, 100, 100,   0,   0,
      0, 100, 100, 100, 100, 100, 100, 100,
      0, 100, 100, 100, 100, 100, 100, 100,
    100, 100, 100, 100,   0, 100, 100, 100,
    100, 100, 100, 100,   0,   0, 100, 100
  ];
  /** 放置区的方块数据 */
  private cubeIndex: number[] = [];
  /** 预放置区的方块数据 */
  private preCubeIndex: number[] = [];
  /** 当前选择的水果 */
  public curSelectFruitID: number = 20000;
  /** 可直接消除的水果数 */
  public killDirectlyCount: number = 0;

  /** 形状随机的权重 */
  private shapeWeight: HashMap<number, number> = new HashMap();
  private shapeTotalWeight: number = 0;

  /** 拖拽时显示的分数 */
  private preScore: number = 0;

  /** 生成形状组合的次数 */
  private callShapeCount: number = 0;

  /** 初始化游戏 */
  start() {
    this.time = Config.GameTime;
    this.cubeCount = 64;
    this.callShapeCount = 0;
    this.availableCount = 0;
    this.addPreScore(-this.preScore);
    this.initData();
    for (let testIndex of this.testCubeIndex) {
      if (testIndex > 0) this.initAvailableCountInit--;
    }
    console.warn("initAvailableCountInit:", this.initAvailableCountInit);
    for (let i = 0; i < 64; i++) {
      if (this.testCubeIndex[i] > 0) {
        this.cubeIndex[i] = 100;
      } else {
        this.cubeIndex[i] = -10000;
      }
    }

    this.preCubeIndex = this.cubeIndex.concat();

    let shapeWeights = TableMgr.inst.getAll_ShapeWeight_Data();
    for (let id in shapeWeights) {
      let weightData: ShapeWeight = shapeWeights[id];
      this.shapeWeight.add(parseInt(id), weightData.Weight);
    }

    this.shapeWeight.sort((a, b) => {
      return b.value - a.value;
    });

    this.shapeTotalWeight = 0;
    this.shapeWeight.forEach((key: number, val: number) => {
      this.shapeTotalWeight += val;
      this.shapeWeight.add(key, this.shapeTotalWeight);
    });
    console.log(
      "-------------------------- start --------------------------:",
      this.shapeTotalWeight
    );
    console.log(this.shapeWeight);
  }

  restart() {
    CMath.randomSeed = Math.random();
    this.start();
    gEventMgr.emit(GlobalEvent.GAME_RESTART);
  }

  getResultData(): ResultData {
    return this.data;
  }

  /** 初始化统计数据 */
  initData() {
    this.data.fruitKill = {};
    this.data.fruitScore = {};
    this.data.killCol = 0;
    this.data.killRow = 0;
    this.data.maxCombo = 0;
    this.data.wildScore = 0;
    this.data.comboScore = 0;
    this.data.bestFruitID = 0;
    this.data.mostFruitID = 0;
    this.addScore(-this.data.totalScore);
  }

  /** 添加水果消除次数 */
  addFruitKill(fruitID: number) {
    if (this.data.fruitKill[fruitID]) {
      this.data.fruitKill[fruitID]++;
    } else {
      this.data.fruitKill[fruitID] = 1;
    }
  }

  /** 添加水果的得分 */
  addFruitScore(fruitID: number, score: number) {
    let data = TableMgr.inst.getFruits(fruitID);
    if (!data) {
      console.error(" error fruitID: " + fruitID);
      return;
    }

    if (this.data.fruitScore[fruitID]) {
      this.data.fruitScore[fruitID] += score;
    } else {
      this.data.fruitScore[fruitID] = score;
    }

    if (data.Type != Fruits_Type.ShuiGuo) {
      this.data.wildScore += score;
    }
  }

  addOverCount() {
    this.cubeCount--;
    if (this.cubeCount <= 0) {
      gEventMgr.emit(GlobalEvent.SHOW_OVER_LAYER);
    }
  }

  addScore(score: number) {
    this.data.totalScore += score;
    if (this.combo >= 2) {
      this.data.comboScore += score;
    }
    gEventMgr.emit(GlobalEvent.UPDATE_SCORE);
  }

  getScore() {
    return parseInt(this.data.totalScore.toString());
  }

  addKillCol(colNumber: number) {
    this.data.killCol += colNumber;
  }

  addKillRow(rowNumber: number) {
    this.data.killRow += rowNumber;
  }

  addCombo(combo: number) {
    this.combo += combo;
    if (this.combo > this.data.maxCombo) {
      this.data.maxCombo = this.combo;
    }
    if (this.combo > 0) {
      gEventMgr.emit(GlobalEvent.UPDATE_COMBO);
    }
    console.log(" --------------combo:", this.combo);
  }

  getCombo() {
    return this.combo;
  }

  /** 获取下一轮的形状组合 */
  getShapes(): ShapeData[] {
    let shapes: ShapeData[] = [];

    let specialTool = {};

    for (let i = 0; i < 3; i++) {
      let shapeData: ShapeData = {
        shape: [],
        shapeID: 0
      };
      let random = CMath.getRandom(0, 1);
      let weight = random * this.shapeTotalWeight;
      for (let val of this.shapeWeight.values) {
        if (weight <= val.value) {
          let shapeWeightData = TableMgr.inst.getShapeWeight(val.key);

          let shapeList = shapeWeightData.ShapeList.concat();
          // 前三轮不出现道具和前三种方块组合
          if (this.callShapeCount < 3) {
            for (let j = 0; j < shapeList.length; j++) {
              if (
                [10000, 10001, 10002, 10032, 10033].indexOf(shapeList[j]) >= 0
              ) {
                shapeList.splice(j, 1);
                j--;
              }
            }
          }

          if (shapeList.length <= 0) continue;

          let index = CMath.getRandom(0, 1) * (shapeList.length - 1);
          //console.warn(shapeWeightData, index);

          shapeData.shapeID = shapeList[Math.round(index)];
          let shapeJson = TableMgr.inst.getShape(shapeData.shapeID);
          // 避免同一轮出现同种道具
          if (
            shapeJson.Type != Shape_Type.PuTongFangKuai &&
            specialTool[shapeJson.Type]
            //specialTool[shapeJson.ID]
          ) {
            CMath.randomSeed = CMath.sharedSeed;
            continue;
          }

          if (shapeJson.Type != Shape_Type.PuTongFangKuai) {
            specialTool[shapeJson.Type] = true;
            //specialTool[shapeJson.ID] = true;
          }
          shapeData.shape = shapeJson.Shape;

          !this.data.Wild_A && (this.data.Wild_A = shapeJson.ID == 10032);
          !this.data.Wild_B && (this.data.Wild_B = shapeJson.ID == 10033);
          shapes.push(shapeData);
          break;
        }
      }
    }
    //console.log(shapes);
    this.callShapeCount++;
    return shapes;
  }

  /** 获取当前预选的矩阵 */
  getPreCubeIndex() {
    return this.preCubeIndex;
  }

  getCubeIndex() {
    return this.cubeIndex;
  }

  setCubeIndex(index: number, score: number) {
    this.cubeIndex[index] = score;
  }

  resetCubeIndex(index: number) {
    if (this.testCubeIndex[index] > 0) {
      this.cubeIndex[index] = 100;
    } else {
      this.cubeIndex[index] = -10000;
    }
  }

  setPreCubeIndex(index: number, score: number) {
    this.preCubeIndex[index] = score;
  }

  resetPreCubeIndex(index: number) {
    this.preCubeIndex[index] = -10000;
  }

  /** 检测是否可以消除 */
  check() {
    let index = this.checkRowCol(this.cubeIndex);
    let rowIndex = index[0];
    let colIndex = index[1];
    let fruit = TableMgr.inst.getFruits(this.curSelectFruitID) || {
      Name: "辣鸡",
      Type: 100
    };
    console.log(
      "colIndex:",
      colIndex,
      ", rowIndex:",
      rowIndex,
      " curFruit:",
      fruit.Name
    );
    gEventMgr.emit(GlobalEvent.EAT_COL, colIndex);
    gEventMgr.emit(GlobalEvent.EAT_ROW, rowIndex);
    this.addKillRow(rowIndex.length);
    this.addKillCol(colIndex.length);
    if (
      rowIndex.length > 0 ||
      colIndex.length > 0 ||
      this.killDirectlyCount > 0
    ) {
      this.addCombo(1);
    } else {
      this.addCombo(-this.combo);
    }

    if (
      fruit &&
      fruit.Type == Fruits_Type.ShuiGuo &&
      (rowIndex.length > 0 || colIndex.length > 0)
    ) {
      gEventMgr.emit(GlobalEvent.COL_EFFECT, colIndex);
      gEventMgr.emit(GlobalEvent.ROW_EFFECT, rowIndex);
    }

    if (rowIndex.length > 0 || colIndex.length > 0 || this.combo > 0) {
      let textName = "good";
      if (this.combo >= 3) {
        textName = "unbelievable";
      } else {
        if (this.combo > 1) {
          if (rowIndex.length + colIndex.length < 2) {
            textName = "combo";
          } else {
            textName = "unbelievable";
          }
        } else {
          if (rowIndex.length + colIndex.length < 2) {
            textName = "good";
          } else if (rowIndex.length + colIndex.length < 3) {
            textName = "great";
          } else if (rowIndex.length + colIndex.length < 4) {
            textName = "amazing";
          } else {
            textName = "unbelievable";
          }
        }
      }
      gEventMgr.emit(GlobalEvent.SHOW_TEXT, textName);
    }

    /** 特殊道具的直接消除 */
    gEventMgr.emit(GlobalEvent.KILL_DIRECTLY);
  }

  /** 检测是否有可消除的行和列 */
  checkRowCol(cubeIndex: number[]): number[][] {
    let colIndex: number[] = [];
    let rowIndex: number[] = [];
    for (let i = 0; i < Config.Grid.x; i++) {
      let sumRow = 0;
      let sumCol = 0;

      for (let j = 0; j < Config.Grid.y; j++) {
        sumRow += cubeIndex[j + i * Config.Grid.x];
        sumCol += cubeIndex[i + j * Config.Grid.y];
      }
      if (sumCol > 0) {
        colIndex.push(i);
      }
      if (sumRow > 0) {
        rowIndex.push(i);
      }
    }
    return [rowIndex, colIndex];
  }

  bindGamePanel(panel: cc.Node) {
    this.gamePanel = panel;
  }

  gameOver(type: OverType) {
    console.error("game over");
    this.isStart = false;
    // 统计一下数据
    let maxScore = 0;
    for (let fruitID in this.data.fruitScore) {
      if (maxScore <= this.data.fruitScore[fruitID]) {
        maxScore = this.data.fruitScore[fruitID];
        this.data.mostFruitID = parseInt(fruitID);
      }
    }

    let maxkill = 0;
    for (let fruitID in this.data.fruitKill) {
      if (maxkill <= this.data.fruitKill[fruitID]) {
        maxkill = this.data.fruitKill[fruitID];
        this.data.bestFruitID = parseInt(fruitID);
      }
    }
    gEventMgr.emit(GlobalEvent.GAME_OVER, type);
  }

  addAvailableCount(count: number) {
    this.availableCount += count;

    if (
      this.isStart == false &&
      this.availableCount >= this.initAvailableCountInit
    ) {
      gEventMgr.emit(GlobalEvent.GAME_START);
    }
  }

  getAvailableCount() {
    return this.availableCount;
  }

  update(dt: number) {
    if (!this.isStart) return;

    if (this.time > 30 && this.time - dt <= 30) {
      gEventMgr.emit(GlobalEvent.PLAY_30_BGM);
    }
    this.time -= dt;
    if (this.time <= 0) {
      this.time = 0;
      this.isStart = false;
      this.gameOver(OverType.TIME_OUT);
      gEventMgr.emit(GlobalEvent.PLAY_OVER_TIME_UP);
    }
  }

  getTime() {
    return this.time;
  }

  addPreScore(preScore: number) {
    this.preScore += preScore;
    gEventMgr.emit(GlobalEvent.UPDATE_PRE_SCORE);
  }

  resetPreScore() {
    this.preScore = 0;
    gEventMgr.emit(GlobalEvent.UPDATE_PRE_SCORE);
  }

  getPreScore() {
    return this.preScore;
  }
}

export const Game = GameMgr.inst;
CC_DEBUG && (window["Game"] = Game);
