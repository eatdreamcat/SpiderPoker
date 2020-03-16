import { gFactory } from "./Controller/GameFactory";
import { Game } from "./Controller/Game";
import {
  BubbleColor,
  BubbleHeightOffset,
  BubbleYOffset,
  BubbleXOffset,
  BubbleSize,
  BubbleQueRange,
  DefaultTaskCount,
  BubbleType,
  BubbleColors,
  BubbleLightColor,
  GameTime,
  TargetRandomLimit,
  ClearTargetRange,
  ShooterDoubleBubbleRange,
  ShooterDoubleRange,
  ShooterBoomBubbleRange,
  ShooterBoomRange,
  ShooterMagicRange,
  ShooterMagicBubbleRange,
  TaskStreakAward,
  Season,
  Treasure_Top,
  TreasureType,
  OverType
} from "./Const";
import { MatrixSize, UseSize, SpecialType } from "./Data/BubbleMatrix";
import Bubble from "./Bubble";
import { gEventMgr } from "./Controller/EventManager";
import { gStep } from "./Controller/StepController";
import { gAudio } from "./Controller/AudioController";
import { GlobalEvent } from "./Controller/EventName";
import Guide from "./Guide";
import Treasure from "./Treasure";
import ResultLayer from "./ResultLayer";
const celerx = require("./Utils/celerx");

enum Step {
  Prefab = "Prefab",
  Audio = "Audio"
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameScene extends cc.Component {
  /** 泡泡 */
  @property(cc.Prefab)
  BubblePrefab: cc.Prefab = null;

  @property(cc.Prefab)
  PointPrefab: cc.Prefab = null;

  @property(cc.Prefab)
  TaskPrefab: cc.Prefab = null;

  @property(cc.Prefab)
  AddScorePrefab: cc.Prefab = null;

  @property(cc.SpriteAtlas)
  BubbleAtlas: cc.SpriteAtlas = null;

  @property(cc.SpriteFrame)
  SpringBack: cc.SpriteFrame = null;

  @property(cc.SpriteFrame)
  SummerBack: cc.SpriteFrame = null;

  @property(cc.SpriteFrame)
  AutumnBack: cc.SpriteFrame = null;

  @property(cc.SpriteFrame)
  WinterBack: cc.SpriteFrame = null;

  @property(cc.SpriteAtlas)
  TreasureAtlas: cc.SpriteAtlas = null;

  @property(cc.SpriteAtlas)
  TreasureIconAtlas: cc.SpriteAtlas = null;

  @property(Guide)
  Guide: Guide = null;

  @property(cc.Sprite)
  Background: cc.Sprite = null;

  @property(cc.Animation)
  Effect: cc.Animation = null;

  @property(cc.SpriteAtlas)
  FontAtlas: cc.SpriteAtlas = null;

  @property(cc.SpriteAtlas)
  TimeFont: cc.SpriteAtlas = null;

  @property(cc.Prefab)
  FontPrefab: cc.Prefab = null;

  @property(cc.Node)
  FontRoot: cc.Node = null;

  @property(cc.Node)
  TreasureRoot: cc.Node = null;

  @property(cc.Node)
  BigTreasure: cc.Node = null;

  @property(cc.Node)
  SmallTreasure: cc.Node = null;

  @property(cc.SpriteAtlas)
  ResultTitle: cc.SpriteAtlas = null;

  @property(cc.Sprite)
  ResultFont: cc.Sprite = null;

  /** 节点 */
  @property(cc.Node)
  BubbleLayer: cc.Node = null;

  @property(cc.Node)
  Shooter: cc.Node = null;

  @property(cc.Node)
  TopNode: cc.Node = null;

  @property(cc.Node)
  BulletArray: cc.Node = null;

  @property(cc.Node)
  TaskArray: cc.Node = null;

  @property(cc.Node)
  ShooterLayer: cc.Node = null;

  @property(cc.Label)
  TimeLabel: cc.Label = null;

  @property(cc.Label)
  ScoreLabel: cc.Label = null;

  @property(cc.Node)
  Help: cc.Node = null;

  /** 显示的分数 */
  private showScore: number = 0;
  /** 真实的分数 */
  private score: number = 0;
  /** 同步分数的步长 */
  private addScoreStep: number = 0;

  onLoad() {
    this.ResultFont.node.scale = 0;
    Game.FontRoot = this.FontRoot;
    Game.BubbleLayer = this.BubbleLayer;
    Game.TopNode = this.TopNode;

    let self = this;
    celerx.onStart(
      function() {
        self.celerOnStart();
      }.bind(this)
    );

    celerx.provideScore(() => {
      return parseInt(Game.getScore().toString());
    });

    gStep.register(this.celerReady.bind(this), [Step.Audio, Step.Prefab]);

    Game.prepare();

    gFactory.init(
      () => {
        gStep.nextStep(Step.Prefab);
      },
      this.BubblePrefab,
      this.PointPrefab,
      this.TaskPrefab,
      this.AddScorePrefab,
      this.FontPrefab
    );

    gAudio.init(() => {
      gStep.nextStep(Step.Audio);
    });

    this.initEvent();

    this.TimeLabel.node.getChildByName("noTime").opacity = 0;
  }

  celerReady() {
    celerx.ready();
    if (CC_DEBUG || window.location.host == "") {
      this.celerOnStart();
    }
  }

  /**
   * 正式进入游戏
   */
  celerOnStart() {
    let match = celerx.getMatch();
    if (match && match.sharedRandomSeed) {
      CMath.randomSeed = match.sharedRandomSeed;
      CMath.sharedSeed = match.sharedRandomSeed;
    } else {
      CMath.randomSeed = Math.random();
    }

    if ((match && match.shouldLaunchTutorial) || CC_DEBUG) {
      this.Guide.show();
    } else {
      this.Guide.hide();
    }

    let takeImage = false;
    const canvas = document.getElementsByTagName("canvas")[0];
    cc.director.on(cc.Director.EVENT_AFTER_DRAW, function() {
      if (takeImage) {
        takeImage = false;
        celerx.didTakeSnapshot(canvas.toDataURL("image/jpeg", 0.1));
      }
    });
    celerx.provideCurrentFrameData(function() {
      takeImage = true;
    });

    Game.start();
    this.updateSeason();
    this.updateTreasure();
    this.show();

    cc.loader.loadRes("prefabs/" + Season[Game.Season] + "/ResultLayer");
  }

  /** 初始化宝藏 */
  updateTreasure() {
    for (let child of this.TreasureRoot.children) {
      child
        .getChildByName("icon")
        .getComponent(
          cc.Sprite
        ).spriteFrame = this.TreasureAtlas.getSpriteFrame(
        Treasure_Top[Game.Season][child.name]
      );
    }

    let big = [TreasureType.Level_1000, TreasureType.Level_800];
    for (let child of this.BigTreasure.children) {
      let i = Math.floor(CMath.getRandom(0, big.length));
      let level = big[i];
      cc.loader.loadRes(
        "prefabs/" + Season[Game.Season] + "/" + level,
        cc.Prefab,
        (err, prefab) => {
          if (err) {
            console.error(" load treasure err:", err);
          } else {
            let treasure = cc.instantiate(prefab);
            child.addChild(treasure);
          }
        }
      );
      big.splice(i, 1);
    }

    let small = [
      TreasureType.Level_200,
      TreasureType.Level_400,
      TreasureType.Level_600
    ];
    for (let child of this.SmallTreasure.children) {
      let i = Math.floor(CMath.getRandom(0, small.length));
      let level = small[i];
      cc.loader.loadRes(
        "prefabs/" + Season[Game.Season] + "/" + level,
        cc.Prefab,
        (err, prefab) => {
          if (err) {
            console.error(" load treasure err:", err);
          } else {
            let treasure = cc.instantiate(prefab);
            child.addChild(treasure);
          }
        }
      );
      small.splice(i, 1);
    }
  }

  updateSeason() {
    switch (Game.Season) {
      case Season.Spring:
        this.Background.spriteFrame = this.SpringBack;
        break;
      case Season.Autumn:
        this.Background.spriteFrame = this.AutumnBack;
        break;
      case Season.Summer:
        this.Background.spriteFrame = this.SummerBack;
        break;
      case Season.Winter:
        this.Background.spriteFrame = this.WinterBack;
        break;
    }
  }

  initEvent() {
    gEventMgr.targetOff(this);

    /** 泡泡队列减少 */
    this.BulletArray.on(
      cc.Node.EventType.CHILD_REMOVED,
      this.onBubbleQueRemoveChild,
      this
    );
    /*** 泡泡发射完毕 */
    this.Shooter.on(
      cc.Node.EventType.CHILD_REMOVED,
      this.onShooterRemoveChild,
      this
    );

    this.Help.on(
      cc.Node.EventType.TOUCH_END,
      () => {
        this.Guide.show();
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.HORCE_CLEAR,
      () => {
        this.Effect.play("super_clear");
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.GET_TREASURE,
      (name: string) => {
        let treasure = this.TreasureRoot.getChildByName(name);
        if (treasure) {
          treasure.getComponent(cc.Animation).play();
        }
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.SHOW_STREAK,
      (isStreak: boolean, streak: number) => {
        if (!isStreak) return;

        let spriteFrame = null;

        switch (streak) {
          case 2:
            spriteFrame = this.FontAtlas.getSpriteFrame("f_streak");
            break;
          case 3:
            spriteFrame = this.FontAtlas.getSpriteFrame("f_sstreak");
            break;
          case 4:
            spriteFrame = this.FontAtlas.getSpriteFrame("f_great");
            break;
          case 5:
            spriteFrame = this.FontAtlas.getSpriteFrame("f_awesome");
            break;
          default:
            spriteFrame = this.FontAtlas.getSpriteFrame("f_amazing");
            break;
        }

        let fontNode = gFactory.getFont();
        fontNode.getComponent(cc.Sprite).spriteFrame = spriteFrame;
        fontNode.scale = 0;
        fontNode.opacity = 255;
        this.FontRoot.addChild(fontNode);
        fontNode.x = 0;
        let targetScale = 1 + streak * 0.1;
        fontNode.y = this.FontRoot.childrenCount * (150 * targetScale);
        gEventMgr.emit(GlobalEvent.PLAY_EFFECT, "font");
        fontNode.runAction(
          cc.sequence(
            cc.scaleTo(0.1, targetScale),
            cc.delayTime(0.3),
            cc.callFunc(() => {
              if (isStreak) {
                let baseScore = 25;
                let streakScore = 15;
                Game.addScore(
                  BubbleType.Streak,
                  baseScore + (streak - 2) * streakScore,
                  (streak - 2) * 0.3 + 2,
                  CMath.ConvertToNodeSpaceAR(fontNode, this.TopNode).add(
                    cc.v2(fontNode.width / 2, fontNode.height / 2)
                  )
                );
              }
            }, this),
            cc.spawn(cc.scaleTo(0.2, 1), cc.fadeTo(0.2, 0)),
            cc.callFunc(() => {
              gFactory.putFont(fontNode);
            }, this)
          )
        );
      },
      this
    );

    gEventMgr.on(GlobalEvent.ADD_BUBBLE, this.addNextBubble, this);
    gEventMgr.on(GlobalEvent.UPDATE_TASK, this.updateTask, this);
    gEventMgr.on(GlobalEvent.NEXT_BUBBLE, this.getShooterBubble, this);
    gEventMgr.on(GlobalEvent.ADD_SCORE, this.addScore, this);

    gEventMgr.on(
      GlobalEvent.GAME_OVER,
      (type: OverType) => {
        gEventMgr.off(GlobalEvent.GAME_OVER);
        Game.isStart = false;
        if (type == OverType.OUT_OF_MOVE) {
          this.ResultFont.spriteFrame = this.ResultTitle.getSpriteFrame(
            "bg_result_font2"
          );
        } else {
          this.ResultFont.spriteFrame = this.ResultTitle.getSpriteFrame(
            "bg_result_font1"
          );
        }

        this.ResultFont.node.runAction(
          cc.sequence(
            cc.scaleTo(0.1, 1.5),
            cc.delayTime(0.3),
            cc.scaleTo(0.1, 1.2),
            cc.callFunc(() => {
              cc.loader.loadRes(
                "prefabs/" + Season[Game.Season] + "/ResultLayer",
                cc.Prefab,
                (err, prefab) => {
                  if (err) {
                    cc.error("load result :", err);
                    celerx.submitScore(Game.getScore());
                  } else {
                    let title: cc.SpriteFrame;
                    if (type == OverType.OUT_OF_MOVE) {
                      title = this.ResultTitle.getSpriteFrame(
                        "bg_result_font2"
                      );
                    } else {
                      title = this.ResultTitle.getSpriteFrame(
                        "bg_result_font1"
                      );
                    }

                    let resultLayer: cc.Node = cc.instantiate(prefab);
                    resultLayer.getComponent(ResultLayer).setTexture(title);
                    this.node.addChild(resultLayer);
                  }
                }
              );
            }, this)
          )
        );
      },
      this
    );

    if (CC_DEBUG) {
      cc.director.on(
        "space-press",
        () => {
          this.addNextBubble(3);
        },
        this
      );
    }
  }

  updateTask() {
    let task = Game.getCurTarget();
    console.log(task);
    for (let i = 0; i < Math.min(task.now, this.TaskArray.childrenCount); i++) {
      let taskNode = this.TaskArray.children[i];
      let complete = taskNode.getChildByName("Complete");
      if (taskNode.scale == 0 || complete.scale > 0.5) continue;
      complete.runAction(
        cc.sequence(cc.scaleTo(0.1, 0.9), cc.scaleTo(0.1, 0.6))
      );
    }
  }

  /** 增加count行泡泡 */
  addNextBubble(count: number = 1) {
    while (count--) {
      this.nextBubble();
    }
  }

  show() {
    let iStart = 3,
      iEnd = 13;
    let jStart = 2,
      jEnd = 11;

    this.addBubble(iStart, iEnd, jStart, jEnd);

    this.getNewTask(DefaultTaskCount);
  }

  /** 生成新的泡泡 */
  nextBubble() {
    Game.addMoveTimes();
    let bubbleMatrix = Game.getMatrix();
    bubbleMatrix.moveRow(1);

    this.BubbleLayer.height += BubbleSize.height + BubbleHeightOffset;
    this.BubbleLayer.runAction(
      cc.sequence(
        cc.moveBy(0.2, 0, -(BubbleSize.height + BubbleHeightOffset)),
        cc.callFunc(() => {
          Game.checkOutOfMove();
        }, this)
      )
    );

    this.addBubble(
      bubbleMatrix.index2i(Game.startIndex) - 1,
      bubbleMatrix.index2i(Game.startIndex) - 1,
      2,
      11,
      1
    );

    for (let i = Game.startIndex; i <= Game.startIndex + UseSize - 1; i++) {
      if (!bubbleMatrix.data[i] || !bubbleMatrix.data[i].bubble) return;
      bubbleMatrix.data[i].bubble.updateActive(
        i / 700 + (i - Game.startIndex) / 50
      );
    }
  }

  /**
   * 增加泡泡
   */
  addBubble(
    istart: number,
    iend: number,
    jstart: number,
    jend: number,
    factor: number = 0
  ) {
    let bubbleMatrix = Game.getMatrix();
    for (let i = istart; i <= iend; i++) {
      for (let j = jstart; j <= jend; j++) {
        let index = bubbleMatrix.ij2index(i, j);

        let bubble = Game.getBubble(
          bubbleMatrix.data[index].type,
          index,
          bubbleMatrix.data[index].color,
          this.BubbleAtlas
        );

        let pos = bubbleMatrix.getPosOfij(i, j);
        bubble.x = pos.x;
        bubble.y = pos.y;

        this.BubbleLayer.addChild(bubble);
        bubbleMatrix.data[index].bubble = bubble.getComponent(Bubble);
        bubble
          .getComponent(Bubble)
          .updateActive(
            index / 700 + ((index - Game.startIndex) / 50) * factor
          );
      }
    }

    Game.updateCollisionIndexes();
  }

  onShooterRemoveChild() {
    //this.getShooterBubble();
  }

  /** 生成待发射的泡泡 */
  getShooterBubble(count?: number) {
    if (this.BulletArray.childrenCount <= 0) {
      let curTask = Game.getCurTarget();
      if (curTask.now < curTask.target) {
        this.addNextBubble(1);
      }

      this.getNewTask(count);
      return;
    }

    let bubble = this.BulletArray.children[0];
    bubble.setParent(this.Shooter);
    bubble.scale = 0.5;
    bubble.setPosition(CMath.ConvertToNodeSpaceAR(bubble, this.Shooter));

    bubble.runAction(
      cc.spawn(
        cc.scaleTo(0.2, 1),
        cc.fadeTo(0.2, 255),
        cc.moveTo(0.3, 0, 0),
        cc.callFunc(() => {})
      )
    );
  }

  /** 生成新的任务 */
  getNewTask(count: number) {
    if (!count) {
      count = Math.ceil(
        CMath.getRandom(BubbleQueRange.Min, BubbleQueRange.Max)
      );
    }

    console.error("泡泡队列：", count);

    /** 随机双倍泡泡 */
    let allIndex = [];
    for (let i = 0; i < count; i++) allIndex.push(i);

    let doubleRound = Math.ceil(
      CMath.getRandom(ShooterDoubleRange.Min, ShooterDoubleRange.Max)
    );
    let doubleCount = 0;
    let doubleColor = BubbleColors.concat();
    let doubleData = {};
    if (Game.getTaskLength() % doubleRound == 0) {
      doubleCount = Math.ceil(
        CMath.getRandom(
          ShooterDoubleBubbleRange.Min,
          ShooterDoubleBubbleRange.Max
        )
      );
      while (doubleCount-- > 0 && allIndex.length > 0) {
        let i = Math.floor(CMath.getRandom(0, allIndex.length));
        let index = allIndex[i];
        allIndex.splice(i, 1);
        let colorIndex = Math.floor(CMath.getRandom(0, doubleColor.length));
        let color = doubleColor[colorIndex];
        doubleColor.splice(colorIndex, 1);
        if (doubleColor.length <= 0) doubleColor = BubbleColors.concat();

        doubleData[index] = color;
      }
    }

    /** 随机炸弹泡泡 */
    let boomRound = Math.ceil(
      CMath.getRandom(ShooterBoomRange.Min, ShooterBoomRange.Max)
    );
    let boomCount = 0;
    let boomColor = BubbleColors.concat();
    let boomData = {};
    if (Game.getTaskLength() % boomRound == 0) {
      boomCount = Math.ceil(
        CMath.getRandom(ShooterBoomBubbleRange.Min, ShooterBoomBubbleRange.Max)
      );
      while (boomCount-- > 0 && allIndex.length > 0) {
        let i = Math.floor(CMath.getRandom(0, allIndex.length));
        let index = allIndex[i];
        allIndex.splice(i, 1);
        let colorIndex = Math.floor(CMath.getRandom(0, boomColor.length));
        let color = boomColor[colorIndex];
        boomColor.splice(colorIndex, 1);
        if (boomColor.length <= 0) boomColor = BubbleColors.concat();

        boomData[index] = color;
      }
    }

    /** 随机魔法泡泡 */
    let magicRound = Math.ceil(
      CMath.getRandom(ShooterMagicRange.Min, ShooterMagicRange.Max)
    );
    let magicCount = 0;

    let magicData = {};
    if (Game.getTaskLength() % magicRound == 0) {
      magicCount = Math.ceil(
        CMath.getRandom(
          ShooterMagicBubbleRange.Min,
          ShooterMagicBubbleRange.Max
        )
      );
      while (magicCount-- > 0 && allIndex.length > 0) {
        let i = Math.floor(CMath.getRandom(0, allIndex.length));
        let index = allIndex[i];
        allIndex.splice(i, 1);
        magicData[index] = BubbleType.Blank;
      }
    }

    /**
     * 生成新的泡泡队列
     */
    let bubbleArray: BubbleType[] = [];
    for (let i = 0; i < count; i++) {
      bubbleArray.push(
        BubbleColors[Math.floor(CMath.getRandom() * BubbleColors.length)]
      );
    }

    let lastTask = Game.getCurTarget();
    if (lastTask.now >= lastTask.target && lastTask.target > 0) {
      Game.addTaskStreak(1);
      // 完成目标
      gEventMgr.emit(GlobalEvent.PLAY_EFFECT, "task_success");
    } else {
      Game.addTaskStreak(-Game.getTaskStreak());
      // 未完成目标
      if (lastTask.target > 0) {
        gEventMgr.emit(GlobalEvent.PLAY_EFFECT, "task_fail");
      }
    }

    for (let i = 0; i < bubbleArray.length; i++) {
      let color = bubbleArray[i];
      let type = SpecialType.Normal;

      if (doubleData[i]) {
        type = SpecialType.Double;
        color = doubleData[i];
      }

      if (boomData[i]) {
        type = SpecialType.Boom;
        color = boomData[i];
      }

      if (magicData[i] != null) {
        type = SpecialType.Magic;
        color = magicData[i];
      }

      let bubble = Game.getBubble(type, -1, color, this.BubbleAtlas);
      bubble.getComponent(Bubble).setActive(true, true, i / 50);
      bubble.scale = 0;
      bubble.opacity = 0;
      bubble.y = 0;
      if (i == 0) {
        bubble.x = -200;
        this.Shooter.addChild(bubble);
        let horce = false;
        if (Game.getTaskStreak() >= TaskStreakAward) {
          Game.addTaskStreak(-Game.getTaskStreak());
          horce = true;
        }
        bubble.runAction(
          cc.spawn(
            cc.scaleTo(0.2, 1),
            cc.fadeTo(0.2, 255),
            cc.moveTo(0.3, 0, 0),
            cc.callFunc(() => {
              if (horce) {
                gEventMgr.emit(GlobalEvent.PLAY_EFFECT, "change_horce");

                bubble
                  .getComponent(Bubble)
                  .setColor(BubbleType.Horce, SpecialType.Horce);
                bubble.getComponent(Bubble).playAnimation("bubble_horce");
              }
            })
          )
        );
      } else {
        bubble.x = -200 * i;
        this.BulletArray.addChild(bubble);

        bubble.runAction(
          cc.spawn(
            cc.scaleTo(0.2, 0.5),
            cc.fadeTo(0.2, 255),
            cc.moveTo(
              0.4,
              40 - this.BulletArray.childrenCount * BubbleSize.width,
              0
            )
          )
        );
      }
    }

    let random = CMath.getRandom();
    let targetCount = 0;
    /** 生成任务要求 */
    if (Game.getGameTime() >= 120) {
      if (random <= 0.6) {
        targetCount = CMath.Clamp(
          count - Math.ceil(CMath.getRandom(2, 10)),
          ClearTargetRange.Max,
          ClearTargetRange.Min
        );
      } else if (random <= 0.3) {
        targetCount = CMath.Clamp(
          count - Math.ceil(CMath.getRandom(1, 2)),
          ClearTargetRange.Max,
          ClearTargetRange.Min
        );
      } else {
        targetCount = CMath.Clamp(
          count,
          ClearTargetRange.Max,
          ClearTargetRange.Min
        );
      }
    } else {
      if (random <= 0.6) {
        targetCount = CMath.Clamp(
          count - Math.ceil(CMath.getRandom(1, 2)),
          ClearTargetRange.Max,
          ClearTargetRange.Min
        );
      } else if (random <= 0.2) {
        targetCount = CMath.Clamp(
          count - Math.ceil(CMath.getRandom(2, 10)),
          ClearTargetRange.Max,
          ClearTargetRange.Min
        );
      } else {
        targetCount = CMath.Clamp(
          count,
          ClearTargetRange.Max,
          ClearTargetRange.Min
        );
      }
    }

    targetCount = Math.min(count - 1, targetCount);

    console.error("任务数：", targetCount);

    if (this.TaskArray.childrenCount > 0) {
      for (let i = 0; i < this.TaskArray.childrenCount; i++) {
        let taskNode = this.TaskArray.children[i];
        let complete = taskNode.getChildByName("Complete");
        let fail = taskNode.getChildByName("Fail");

        if (lastTask.now >= lastTask.target) {
          // 完成目标
          taskNode.runAction(
            cc.sequence(
              cc.delayTime(i / 10),
              cc.scaleTo(0.1, 0),
              cc.callFunc(() => {
                if (i == this.TaskArray.childrenCount - 1) {
                  gEventMgr.emit(GlobalEvent.PLAY_EFFECT, "new_task");
                }
                complete.scale = 0;
                fail.scale = 0;
                if (i <= targetCount - 1) {
                  taskNode.runAction(
                    cc.sequence(
                      cc.delayTime(0),
                      cc.scaleTo(0.1, 1.2),
                      cc.delayTime(0.05),
                      cc.scaleTo(0.1, 1)
                    )
                  );
                }
              })
            )
          );
        } else {
          complete.stopAllActions();
          complete.scale = 0;
          fail.runAction(
            cc.sequence(
              cc.delayTime(i / 10),
              cc.scaleTo(0.1, 1),
              cc.delayTime(0.2),
              cc.callFunc(() => {
                if (i == this.TaskArray.childrenCount - 1) {
                  gEventMgr.emit(GlobalEvent.PLAY_EFFECT, "new_task");
                }
                taskNode.runAction(
                  cc.sequence(
                    cc.delayTime(i / 10),
                    cc.scaleTo(0.1, 0),
                    cc.callFunc(() => {
                      fail.scale = 0;
                      if (i <= targetCount - 1) {
                        taskNode.runAction(
                          cc.sequence(
                            cc.delayTime(0),
                            cc.scaleTo(0.1, 1.2),
                            cc.delayTime(0.05),
                            cc.scaleTo(0.1, 1)
                          )
                        );
                      }
                    })
                  )
                );
              })
            )
          );
        }
      }
    } else {
      gEventMgr.emit(GlobalEvent.PLAY_EFFECT, "new_task");
      while (this.TaskArray.childrenCount < 6) {
        let taskNode = gFactory.getTask();
        taskNode.y = 0;
        taskNode.x = this.TaskArray.childrenCount * taskNode.width * 1.3 + 30;
        taskNode.scale = 0;
        if (this.TaskArray.childrenCount < targetCount) {
          taskNode.runAction(
            cc.sequence(
              cc.delayTime(this.TaskArray.childrenCount / 10),
              cc.scaleTo(0.1, 1.2),
              cc.delayTime(0.05),
              cc.scaleTo(0.1, 1)
            )
          );
        }

        this.TaskArray.addChild(taskNode);

        taskNode.getChildByName("Complete").scale = 0;
        taskNode.getChildByName("Fail").scale = 0;
      }
    }

    Game.pushTarget({
      now: 0,
      target: targetCount
    });
  }

  onBubbleQueRemoveChild() {
    for (let child of this.BulletArray.children) {
      child.runAction(cc.moveBy(0.2, BubbleSize.width, 0));
    }
  }

  addScore(score: number, scale: number, pos: cc.Vec2 = cc.v2(0, 0)) {
    scale *= 1.1;
    let scoreLabel = gFactory.getScore();
    scoreLabel.scale = 0;
    scoreLabel.opacity = 255;
    scoreLabel.getComponent(cc.Label).string = "/" + score.toString();
    this.TopNode.addChild(scoreLabel);
    scoreLabel.setPosition(pos);
    let dis = CMath.Distance(pos, this.ScoreLabel.node.position);

    let moveTime = dis / (1200 * 1.3);
    scoreLabel.runAction(
      cc.sequence(cc.delayTime(0.4), cc.fadeTo(moveTime + 0.3, 0))
    );

    scoreLabel.runAction(
      cc.sequence(
        cc.scaleTo(0.1, 1.2 * scale),
        cc.delayTime(0.2),
        cc.scaleTo(0.1, 1 * scale),
        cc
          .moveTo(moveTime, this.ScoreLabel.node.position)
          .easing(cc.easeInOut(1)),
        cc.scaleTo(0.3, 0),
        cc.callFunc(() => {
          this.score = Game.getScore();

          this.addScoreStep = (this.score - this.showScore) / 20;

          gFactory.putScore(scoreLabel);
        })
      )
    );
  }

  updateTimeCount() {
    let time = Math.floor(Game.getGameTime());
    if (time > 5) return;

    let font = this.TimeLabel.node
      .getChildByName("font")
      .getComponent(cc.Sprite);
    let timeFrame = this.TimeFont.getSpriteFrame("bg_time" + time);
    if (font.spriteFrame == timeFrame) return;

    gEventMgr.emit(GlobalEvent.PLAY_EFFECT, "count");
    font.spriteFrame = timeFrame;
    font.node.runAction(
      cc.sequence(
        cc.fadeTo(0.2, 255),
        cc.scaleTo(0.1, 1.2),
        cc.delayTime(0.5),
        cc.scaleTo(0.1, 1),
        cc.fadeTo(0.1, 0)
      )
    );
  }

  update(dt: number) {
    if (Game.isStart) {
      if (!this.Guide.node.active) {
        Game.addGameTime(-dt);

        this.TimeLabel.string = CMath.TimeFormat(Game.getGameTime());

        if (
          Math.floor(Game.getGameTime()) == 30 &&
          this.TimeLabel.node.getChildByName("noTime").opacity <= 0
        ) {
          this.TimeLabel.getComponent(cc.Animation).play();
          gEventMgr.emit(GlobalEvent.CHANGE_BGM, "bgm_30");
        }

        this.updateTimeCount();
      }

      if (this.showScore < this.score) {
        this.showScore += this.addScoreStep;
        this.showScore = Math.min(this.score, this.showScore);
        this.ScoreLabel.string = Math.floor(this.showScore).toString();
      }
    }
  }
}
