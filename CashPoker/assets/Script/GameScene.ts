import { gFactory } from "./controller/GameFactory";
import { Game, StepFunc } from "./controller/Game";
import Poker from "./Poker";
import {
  Pokers,
  ACTION_TAG,
  OFFSET_Y,
  PokerIndex,
  Empty_Offset,
  GuidePokers
} from "./Pokers";
import { gEventMgr } from "./controller/EventManager";
import { GlobalEvent } from "./controller/EventName";
import Stop from "./Stop";
import { gAudio } from "./controller/AudioController";
import Guide from "./Guide";

const { ccclass, property } = cc._decorator;
const celerx = require("./utils/celerx");

/** 加载的步骤 */
export enum LOAD_STEP {
  /** 初始化 */
  READY,
  /** 加载表 */
  PREFABS = 2 << 0,

  /** 场景加载完成 */
  AUDIO = 2 << 3,
  CELER = 2 << 4,
  GUIDE = 2 << 1,

  CELER_READY = AUDIO | PREFABS | READY,

  GUIDE_READY = LOAD_STEP.READY |
    LOAD_STEP.PREFABS |
    LOAD_STEP.CELER |
    LOAD_STEP.AUDIO,

  /** 完成 */
  DONE = LOAD_STEP.READY |
    LOAD_STEP.PREFABS |
    LOAD_STEP.CELER |
    LOAD_STEP.GUIDE |
    LOAD_STEP.AUDIO
}

@ccclass
export default class GameScene extends cc.Component {
  @property(cc.Prefab)
  Poker: cc.Prefab = null;

  @property(cc.Node)
  PokerClip: cc.Node = null;

  @property(cc.Node)
  PlaceRoot: cc.Node = null;

  @property(cc.Node)
  PokerDevl: cc.Node = null;

  @property(cc.Node)
  GuideEmpty: cc.Node = null;

  @property(cc.Node)
  RemoveNode: cc.Node = null;

  @property(cc.Button)
  BackButton: cc.Button = null;

  @property(cc.Button)
  PauseButton: cc.Button = null;

  @property(cc.Node)
  CycleRoot: cc.Node = null;

  @property(cc.Node)
  PokerFlipRoot: cc.Node = null;

  @property(cc.Node)
  GuideEmpty2: cc.Node = null;

  @property(cc.SpriteAtlas)
  BackButtonAtlas: cc.SpriteAtlas = null;
  @property(cc.SpriteAtlas)
  DrawButtonAtlas: cc.SpriteAtlas = null;

  @property(cc.Label)
  TimeLabel: cc.Label = null;

  @property(cc.Node)
  Top: cc.Node = null;

  @property(cc.Sprite)
  TimeIcon: cc.Sprite = null;

  @property(cc.SpriteAtlas)
  TimeIconAtlas: cc.SpriteAtlas = null;

  @property(cc.Label)
  ScoreLabel: cc.Label = null;

  @property(cc.Font)
  SmallOrg: cc.Font = null;

  @property(cc.Font)
  SmallGreen: cc.Font = null;

  @property(cc.Prefab)
  SubScoreLabel: cc.Prefab = null;

  @property(cc.Prefab)
  AddScoreLabel: cc.Prefab = null;

  @property(cc.Animation)
  TimeAnimation: cc.Animation = null;

  @property(cc.Animation)
  LightAnimation: cc.Animation = null;

  @property(Stop)
  Stop: Stop = null;

  @property(cc.Animation)
  DrawCardAni: cc.Animation = null;

  @property(Guide)
  Guide: Guide = null;

  @property(cc.Animation)
  FlipAnimation: cc.Animation = null;

  @property(cc.Animation)
  Complete: cc.Animation = null;

  @property(cc.Button)
  SubmitButton: cc.Button = null;

  @property(cc.Toggle)
  CheatToggle: cc.Toggle = null;

  @property(cc.Node)
  Tip: cc.Node = null;

  @property(cc.SpriteAtlas)
  TipAtlas: cc.SpriteAtlas = null;

  @property(cc.Animation)
  SubmitTip: cc.Animation = null;

  private step: LOAD_STEP = LOAD_STEP.READY;
  private canDispatchPoker: boolean = false;
  private readonly dispatchCardCount = 28;

  private devTime: number = 10;
  private backTime: number = 10;

  private score: number = 0;
  private showScore: number = 0;
  private scoreStep: number = 0;

  private isStart: boolean = false;

  private tipIndex: number = 1;

  private isNewPlayer: boolean = false;

  private tipTimeout: number = -1;

  private hasShowSubmitTip: boolean = false;
  init() {
    this.SubmitTip.node.active = false;
    this.Stop.hide();
    this.Complete.node.active = false;
    this.TimeLabel.string = CMath.TimeFormat(Game.getGameTime());
    this.ScoreLabel.string = "0";
    this.TimeAnimation.node.active = false;
    this.LightAnimation.node.active = false;

    this.TimeIcon.spriteFrame = this.TimeIconAtlas.getSpriteFrame("icon_time");

    Game.getCycledPokerRoot().clear();
    Game.getPlacePokerRoot().clear();

    for (let child of this.PlaceRoot.children) {
      Game.addPlacePokerRoot(parseInt(child.name), child);
    }

    for (let child of this.CycleRoot.children) {
      Game.addCycledPokerRoot(parseInt(child.name), child);
    }
  }

  registerGuide() {
    let nodeA = Game.getPlacePokerRoot().get(0);
    let node2 = Game.getPlacePokerRoot().get(3);
    let nodeK = Game.getPlacePokerRoot().get(2);
    let root0 = this.PlaceRoot.children[0];
    let root4 = this.PlaceRoot.children[4];
    let node5 = Game.getPlacePokerRoot().get(4);
    let node6 = node5.parent;
    let root6 = this.PlaceRoot.children[6];
    let node7 = Game.getPlacePokerRoot().get(6);
    let node8 = node7.parent;

    let nodeTop = this.PokerDevl.children[this.PokerDevl.childrenCount - 3];
    let node5_1 = Game.getPlacePokerRoot().get(1);
    let root1 = this.PlaceRoot.children[1];

    this.Guide.register([
      /** 移动A到回收槽 */

      {
        touches: [
          {
            node: this.Top,
            isButton: false,
            callback: () => {},
            start: () => {},
            end: () => {}
          },

          {
            node: this.CycleRoot.children[0],
            isButton: false,
            callback: () => {},
            start: () => {},
            end: () => {
              this.CycleRoot.children[0].group = "default";
            },
            isAction: true
          },

          {
            node: nodeA,
            isButton: false,
            callback: () => {},
            start: () => {
              if (nodeA.getComponent(Poker)) {
                nodeA.getComponent(Poker).setGuide(true);
              }
            },
            end: () => {},
            isAction: true
          }
        ]
      },

      /** 移动2到回收槽 */

      {
        touches: [
          {
            node: nodeA,
            isButton: false,
            callback: () => {},
            start: () => {},
            end: () => {
              if (nodeA.getComponent(Poker)) {
                nodeA.getComponent(Poker).setGuide(false);
              }
              nodeA.group = "default";
            },
            isAction: true
          },

          {
            node: node2,
            isButton: false,
            callback: () => {},
            start: () => {
              if (node2.getComponent(Poker)) {
                node2.getComponent(Poker).setGuide(true);
              }
            },
            end: () => {
              if (node2.getComponent(Poker)) {
                node2.getComponent(Poker).setGuide(false);
              }
              node2.group = "default";
            },
            isAction: true
          }
        ]
      },

      /**
       * 移动6-5 到 8-7列
       */
      {
        touches: [
          // {
          //   node: node5,
          //   callback: () =>{},
          //   start: () => {
          //     if (node5.getComponent(Poker)) {
          //       node5.getComponent(Poker).setGuide(true)
          //     }
          //   },
          //   end: () =>{
          //     if (node5.getComponent(Poker)) {
          //       node5.getComponent(Poker).setGuide(false);
          //     }
          //     node5.group = "default";
          //   },
          //   isButton: false
          // },

          {
            node: node7,
            callback: () => {},
            start: () => {
              if (node7.getComponent(Poker)) {
                node7.getComponent(Poker).setGuide(true);
              }
            },
            end: () => {
              if (node7.getComponent(Poker)) {
                node7.getComponent(Poker).setGuide(false);
              }
              node7.group = "default";
            },
            isButton: false,

            isAction: true
          },

          {
            node: node6,
            callback: () => {},
            start: () => {
              if (node6.getComponent(Poker)) {
                node6.getComponent(Poker).setGuide(true);
              }
            },
            end: () => {
              if (node6.getComponent(Poker)) {
                node6.getComponent(Poker).setGuide(false);
              }
              node6.group = "default";
            },
            isButton: false
            //isAction: true
          },

          {
            node: this.GuideEmpty2,
            callback: () => {},
            start: () => {},
            end: () => {},
            isButton: false,
            isAction: true
          },

          // {
          //   node: node8,
          //   callback: () =>{},
          //   start: () => {
          //     if (node8.getComponent(Poker)) {
          //       node8.getComponent(Poker).setGuide(true)
          //     }
          //   },
          //   end: () =>{
          //     if (node8.getComponent(Poker)) {
          //       node8.getComponent(Poker).setGuide(false);
          //     }
          //     node8.group = "default";
          //   },
          //   isButton: false
          // },

          {
            node: root4,
            callback: () => {},
            start: () => {},
            end: () => {
              root4.group = "default";
            },
            isButton: false
          },

          {
            node: root6,
            callback: () => {},
            start: () => {},
            end: () => {
              root6.group = "default";
            },
            isButton: false
          }
        ]
      },

      /**
       * 移动红色的K
       */
      {
        touches: [
          {
            node: root0,
            callback: () => {},
            start: () => {},
            end: () => {
              root0.group = "default";
            },
            isButton: false,
            isAction: true
          },
          {
            node: nodeK,
            callback: () => {},
            start: () => {
              if (nodeK.getComponent(Poker)) {
                nodeK.getComponent(Poker).setGuide(true);
              }
            },
            end: () => {
              if (nodeK.getComponent(Poker)) {
                nodeK.getComponent(Poker).setGuide(false);
              }
              nodeK.group = "default";
            },
            isButton: false,
            isAction: true
          }
        ]
      },

      /** 翻牌 */
      {
        touches: [
          {
            node: this.PokerDevl,
            callback: () => {},
            start: () => {},
            end: () => {
              this.PokerDevl.group = "default";
            },
            isButton: true
            //isAction: true
          },
          {
            node: this.DrawCardAni.node,
            callback: () => {},
            start: () => {
              this.DrawCardAni.node.active = true;
              this.DrawCardAni.play();
            },
            end: () => {
              this.DrawCardAni.node.active = false;
              this.DrawCardAni.node.group = "default";
            },
            isButton: true
          }
        ]
      },

      /** 把上面的牌放到合适的位置 */
      {
        touches: [
          {
            node: this.PokerFlipRoot,
            callback: () => {},
            start: () => {},
            end: () => {
              this.PokerFlipRoot.group = "default";
            },
            isButton: true
          },

          {
            node: nodeTop,
            callback: () => {},
            start: () => {
              if (nodeTop.getComponent(Poker)) {
                nodeTop.getComponent(Poker).setGuide(true);
              }
            },
            end: () => {
              if (nodeTop.getComponent(Poker)) {
                nodeTop.getComponent(Poker).setGuide(false);
              }
              nodeTop.group = "default";
            },
            isButton: false
          },
          {
            node: node5_1,
            callback: () => {},
            start: () => {
              if (node5_1.getComponent(Poker)) {
                node5_1.getComponent(Poker).setGuide(true);
              }
            },
            end: () => {
              if (node5_1.getComponent(Poker)) {
                node5_1.getComponent(Poker).setGuide(false);
              }
              node5_1.group = "default";
            },
            isButton: false,
            isAction: true
          },
          {
            node: this.GuideEmpty,
            callback: () => {},
            start: () => {},
            end: () => {
              this.GuideEmpty.group = "default";
            },
            isButton: true,

            isAction: true
          },
          {
            node: root1,
            callback: () => {},
            start: () => {},
            end: () => {
              root1.group = "default";
            },
            isButton: true
          }
        ]
      },

      /** 提交分数 */
      {
        touches: [
          {
            node: this.SubmitButton.node,
            callback: () => {
              this.SubmitButton.node.group = "default";
              this.SubmitTip.node.active = false;
            },
            start: () => {
              this.SubmitTip.node.active = true;
            },
            end: () => {},
            isButton: true
          },

          {
            node: this.Stop.EndButton.node,
            callback: () => {
              this.Stop.EndButton.node.group = "default";
              // this.nextStep(LOAD_STEP.GUIDE);
              this.Guide.showEnd();
              //gEventMgr.emit(GlobalEvent.POP_GUIDE_STEP);
            },
            start: () => {},
            end: () => {},
            isButton: true
          }
        ]
      }
    ]);
  }

  onLoad() {
    console.error = celerx.log;

    this.DrawCardAni.node.active = false;
    this.Guide.node.active = false;
    Game.removeNode = this.RemoveNode;
    Game.pokerFlipRoot = this.PokerFlipRoot;
    this.Tip.active = false;
    // celerx.ready();
    CMath.randomSeed = Math.random();
    let self = this;
    celerx.onStart(
      function() {
        self.celerStart();
      }.bind(this)
    );

    celerx.provideScore(() => {
      return parseInt(Game.getScore().toString());
    });

    this.CheatToggle.node.active = CHEAT_OPEN;
    this.CheatToggle.isChecked = false;
    this.CheatToggle.node.on(
      "toggle",
      () => {
        window["cheat"] = this.CheatToggle.isChecked;
      },
      this
    );

    // init prefabs

    this.init();

    gFactory.init(
      function() {
        this.nextStep(LOAD_STEP.PREFABS);
      }.bind(this),
      this.Poker,
      this.AddScoreLabel,
      this.SubScoreLabel
    );

    gAudio.init(() => {
      this.nextStep(LOAD_STEP.AUDIO);
    });

    //this.PokerClip.on(cc.Node.EventType.TOUCH_START, this.dispatchPoker, this);

    this.PauseButton.node.on(
      cc.Node.EventType.TOUCH_START,
      () => {
        if (Game.isComplete()) return;
        Game.resetFreeTime();
        this.Guide.show(() => {
          Game.setPause(false);
        });
        Game.setPause(true);
      },
      this
    );

    gEventMgr.on(GlobalEvent.UPDATE_TIP_ANIMATION, (isActive: boolean) => {
      if (!this.hasShowSubmitTip) {
        if (this.SubmitTip.node.active == isActive) return;
        this.SubmitTip.node.active = isActive;

        if (this.SubmitTip.node.active) {
          if (this.tipTimeout != -1) {
            clearTimeout(this.tipTimeout);
          }
          this.tipTimeout = setTimeout(() => {
            this.SubmitTip.node.active = false;
            this.hasShowSubmitTip = true;
            Game.resetFreeTime();
          }, 3000);
        }

        return;
      }

      this.SubmitTip.node.active = false;
      if (this.Tip.active == isActive) return;
      if (this.tipTimeout != -1) {
        clearTimeout(this.tipTimeout);
      }

      this.Tip.stopAllActions();
      if (isActive) {
        this.Tip.active = isActive;
        this.Tip.opacity = 0;
        this.Tip.runAction(cc.fadeIn(0.1));
        this.Tip.getComponent(
          cc.Sprite
        ).spriteFrame = this.TipAtlas.getSpriteFrame("tips0" + this.tipIndex);

        if (this.isNewPlayer) {
          this.tipIndex = (this.tipIndex++ % 4) + 1;
        } else {
          this.tipIndex = (this.tipIndex++ % 7) + 1;
        }
        this.tipTimeout = setTimeout(() => {
          this.Tip.runAction(
            cc.sequence(
              cc.fadeOut(0.1),
              cc.callFunc(() => {
                this.Tip.active = false;
              })
            )
          );
          Game.resetFreeTime();
        }, 3000);
      } else {
        this.Tip.runAction(
          cc.sequence(
            cc.fadeOut(0.1),
            cc.callFunc(() => {
              this.Tip.active = false;
            })
          )
        );
      }
    });

    this.SubmitButton.node.on(
      cc.Node.EventType.TOUCH_END,
      (e: cc.Event.EventCustom) => {
        if (Game.isComplete()) return;
        Game.resetFreeTime();

        if (e.getUserData) {
          e.getUserData()();
          this.Stop.show(-1, e.getUserData());
        } else {
          this.Stop.show(-1);
        }

        Game.setPause(true);
      },
      this
    );

    this.PokerFlipRoot.on(
      cc.Node.EventType.CHILD_ADDED,
      this.onPokerFlipAddChild,
      this
    );

    this.PokerDevl.on(
      cc.Node.EventType.CHILD_REMOVED,
      () => {
        if (
          !this.LightAnimation.node.active &&
          this.PokerDevl.childrenCount <= 0
        ) {
          this.LightAnimation.node.active = true;
          this.LightAnimation.play();
        }
      },
      this
    );

    this.PokerDevl.on(
      cc.Node.EventType.CHILD_ADDED,
      (child: cc.Node) => {
        let poker = child.getComponent(Poker);
        if (poker) {
          poker.setRecycle(false);
        }
      },
      this
    );

    this.PokerFlipRoot.on(
      cc.Node.EventType.CHILD_REMOVED,
      this.onPokerFlipRemoveChild,
      this
    );

    this.PokerDevl.on(
      cc.Node.EventType.TOUCH_START,
      () => {
        if (Game.isTimeOver() || Game.isComplete() || !this.canFilp) return;
        Game.resetFreeTime();
        if (this.devTime >= 0.3) {
          this.devPoker();
          this.devTime = 0;
        }
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.COMPLETE,
      () => {
        this.Complete.node.active = true;
        this.Complete.play();
      },
      this
    );

    this.BackButton.node
      .getChildByName("Background")
      .getComponent(
        cc.Sprite
      ).spriteFrame = this.BackButtonAtlas.getSpriteFrame("btn_backgray");
    this.BackButton.interactable = false;
    this.BackButton.node.on(
      cc.Node.EventType.TOUCH_START,
      () => {
        if (Game.isTimeOver() || this.backTime < 0.5 || Game.isComplete())
          return;
        this.backTime = 0;
        Game.resetFreeTime();
        Game.backStep();
      },
      Game
    );

    gEventMgr.on(
      GlobalEvent.UPDATE_BACK_BTN_ICON,
      () => {
        this.BackButton.interactable = Game.canBackStep();
        if (this.BackButton.interactable) {
          this.BackButton.node
            .getChildByName("Background")
            .getComponent(
              cc.Sprite
            ).spriteFrame = this.BackButtonAtlas.getSpriteFrame("btn_back");
        } else {
          this.BackButton.node
            .getChildByName("Background")
            .getComponent(
              cc.Sprite
            ).spriteFrame = this.BackButtonAtlas.getSpriteFrame("btn_backgray");
        }
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.UPDATE_DRAW_ICON,
      () => {
        switch (Game.getFreeDrawTimes()) {
          case 1:
            this.PokerDevl.getComponent(
              cc.Sprite
            ).spriteFrame = this.DrawButtonAtlas.getSpriteFrame("free_draw_1");
            break;
          case 2:
            this.PokerDevl.getComponent(
              cc.Sprite
            ).spriteFrame = this.DrawButtonAtlas.getSpriteFrame("free_draw_2");
            break;
          case 3:
            this.PokerDevl.getComponent(
              cc.Sprite
            ).spriteFrame = this.DrawButtonAtlas.getSpriteFrame("free_draw_3");
            break;
          default:
            this.PokerDevl.getComponent(
              cc.Sprite
            ).spriteFrame = this.DrawButtonAtlas.getSpriteFrame("draw_20");
            break;
        }
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.UPDATE_SCORE,
      (score: number, pos: cc.Vec2) => {
        this.scoreStep = Math.ceil(Math.max(score / 20, this.scoreStep));

        let targetPos = CMath.ConvertToNodeSpaceAR(
          this.ScoreLabel.node,
          this.RemoveNode
        );

        if (score > 0) {
          let scoreLabel = gFactory.getAddScore("/" + score.toString());
          scoreLabel.group = this.isStart ? "top" : "guide";
          scoreLabel.setParent(this.RemoveNode);
          scoreLabel.setPosition(pos);

          scoreLabel.runAction(
            cc.sequence(
              cc.scaleTo(0, 0),
              cc.scaleTo(0.15, 1.5),
              cc.delayTime(0.25),
              cc.scaleTo(0.1, 1.0),
              cc.moveTo(0.25, targetPos.x, targetPos.y),
              cc.callFunc(() => {
                this.showScore = Game.getScore();
                gFactory.putAddScore(scoreLabel);
              })
            )
          );
        } else {
          let scoreLabel = gFactory.getSubScore(
            "/" + Math.abs(score).toString()
          );
          scoreLabel.group = this.isStart ? "top" : "guide";
          scoreLabel.setParent(this.RemoveNode);
          scoreLabel.setPosition(pos);
          scoreLabel.runAction(
            cc.sequence(
              cc.scaleTo(0, 0),
              cc.scaleTo(0.15, 1.5),
              cc.delayTime(0.25),
              cc.scaleTo(0.1, 1.0),
              cc.moveTo(0.25, targetPos.x, targetPos.y),
              cc.callFunc(() => {
                this.showScore = Game.getScore();
                gFactory.putSubScore(scoreLabel);
              })
            )
          );
        }
      },
      this
    );

    gEventMgr.on(GlobalEvent.OPEN_RESULT, this.openResult, this);

    //gEventMgr.on(GlobalEvent.RESTART, this.restart, this);
    cc.loader.loadRes("prefabs/Result");
    cc.loader.loadResDir("sounds");
  }

  openResult(isForceOpen?: boolean) {
    if (!this.isStart && !isForceOpen) {
      this.Guide.hide();
      this.nextStep(LOAD_STEP.GUIDE);
      return;
    }

    this.Stop.hide();
    if (this.node.getChildByName("Result")) return;
    cc.loader.loadRes("prefabs/Result", cc.Prefab, (err, result) => {
      if (err) {
        celerx.submitScore(Game.getScore());
      } else {
        let resultLayer = cc.instantiate(result);
        resultLayer.name = "Result";
        this.node.addChild(resultLayer);
      }
    });
  }

  celerStart() {
    let match = celerx.getMatch();
    if (match && match.sharedRandomSeed) {
      CMath.randomSeed = match.sharedRandomSeed;
      CMath.sharedSeed = match.sharedRandomSeed;
    } else {
      CMath.randomSeed = Math.random();
    }

    if ((match && match.shouldLaunchTutorial) || CC_DEBUG) {
      this.isNewPlayer = true;
    } else {
      this.isNewPlayer = false;
      this.Guide.hide();
      this.nextStep(LOAD_STEP.GUIDE);
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

    this.nextStep(LOAD_STEP.CELER);
  }

  /**
   * 下一步
   */
  private nextStep(loadStep: LOAD_STEP) {
    this.step |= loadStep;
    console.error(
      " step:",
      LOAD_STEP[this.step],
      ",",
      this.step,
      ", now:",
      LOAD_STEP[loadStep]
    );
    if (this.step >= LOAD_STEP.DONE && !this.isStart) {
      console.error("  startGame ---------------------- ");
      this.isStart = true;
      this.Guide.hide();
      this.startGame();
    } else if (
      this.step >= LOAD_STEP.GUIDE_READY &&
      this.isNewPlayer &&
      !this.guideDone
    ) {
      console.error("  start guide ------------");
      this.startGuide();
    } else if (this.step >= LOAD_STEP.CELER_READY && !this.isCelerStart) {
      console.error("  celerx.ready ------------");
      celerx.ready();
      CC_DEBUG && this.celerStart();
      this.isCelerStart = true;
    }
  }

  private isCelerStart: boolean = false;
  private guideDone: boolean = false;
  startGuide() {
    this.guideDone = true;
    let pokers = GuidePokers.concat([]).reverse();
    Game.allPokers.length = 0;
    while (pokers.length > 0) {
      let curIndex = pokers.length - 1;
      let pokerNode = gFactory.getPoker([pokers.pop()]);
      pokerNode.name = curIndex.toString();
      pokerNode.x = 0;
      pokerNode.y = 0;
      this.PokerDevl.addChild(pokerNode);
      Game.allPokers.push(pokerNode.getComponent(Poker));
    }

    this.Guide.showBlock();
    this.startDevPoker([0, 7, 13, 18, 19, 22, 25, 26, 27], [22, 27], () => {
      this.registerGuide();

      // 开始新手引导
      this.Guide.startGuide(() => {
        this.nextStep(LOAD_STEP.GUIDE);
      });
    });
  }

  prepareGame() {
    for (let poker of Game.allPokers) {
      gFactory.putPoker(poker.node);
      console.log("put poker ");
    }

    Game.allPokers.length = 0;
    this.Top.group = "default";
    // Game.addScore(-Game.getScore());
    Game.resetscore();
    this.showScore = 0;
    this.TimeAnimation.node.active = false;
    this.TimeLabel.font = this.SmallGreen;
    this.TimeIcon.spriteFrame = this.TimeIconAtlas.getSpriteFrame("icon_time");
    let gameTime = Game.getGameTime();
    this.TimeLabel.string = CMath.TimeFormat(gameTime);
    Game.getCycledPokerRoot().clear();
    Game.getPlacePokerRoot().clear();

    for (let child of this.PlaceRoot.children) {
      Game.addPlacePokerRoot(parseInt(child.name), child);
    }

    for (let child of this.CycleRoot.children) {
      Game.addCycledPokerRoot(parseInt(child.name), child);
    }
  }

  private canFilp = false;
  startGame() {
    this.canFilp = false;
    Game.initAllData();
    this.prepareGame();

    let pokers = Pokers.concat([]);

    while (pokers.length > 0) {
      let curIndex = pokers.length - 1;

      let totalWeight = pokers.length;

      let random = CMath.getRandom(0, 1);
      let randomIndex = Math.floor(random * totalWeight);

      let i = pokers.splice(randomIndex, 1);

      let pokerNode = gFactory.getPoker(i);
      pokerNode.name = curIndex.toString();
      pokerNode.x = 0;
      pokerNode.y = 0;

      this.PokerDevl.addChild(pokerNode);
    }

    this.startDevPoker([0, 7, 13, 18, 22, 25, 27], [], () => {
      this.canFilp = true;
    });
  }

  startDevPoker(pokerFlips: number[], offsets: number[], callback?: Function) {
    let count = 0;
    let totalCount = this.PokerDevl.childrenCount;
    /** 发底牌 */
    let func2 = () => {
      let pokerNode = this.PokerDevl.getChildByName(
        (totalCount - count++ - 1).toString()
      );

      if (pokerNode) {
        let targetPos = cc.v2(0, 0);
        if (this.PokerClip.childrenCount > 0) {
          let child = this.PokerClip.children[this.PokerClip.childrenCount - 1];
          targetPos = cc.v2(child.x, child.y);
        }

        let selfPos = CMath.ConvertToNodeSpaceAR(
          this.PokerClip,
          pokerNode.parent.parent
        );
        let poker = pokerNode.getComponent(Poker);
        pokerNode.setParent(this.PokerClip);
        pokerNode.setPosition(selfPos);
        pokerNode.group = "top";
        pokerNode.runAction(
          cc.sequence(
            cc.moveTo(0.1, targetPos.x, targetPos.y),
            cc.callFunc(() => {
              pokerNode.group = "default";
              poker.setLastPosition();
              func2();
            }, this)
          )
        );
      } else {
        // console.log(this.PokerDevl.children);
        this.canDispatchPoker = true;
        return;
      }
    };

    let pokerPos = [
      0,
      1,
      2,
      3,
      4,
      5,
      6,

      1,
      2,
      3,
      4,
      5,
      6,

      2,
      3,
      4,
      5,
      6,

      3,
      4,
      5,
      6,

      4,
      5,
      6,
      5,
      6,

      6
    ];

    /** 上面发牌 */
    let func1 = () => {
      if (count++ >= this.dispatchCardCount) {
        //func2();
        this.canDispatchPoker = true;
        this.LightAnimation.node.active = true;
        this.LightAnimation.play();
        callback && callback();
        return;
      }

      let pokerNode = this.PokerDevl.getChildByName(
        (totalCount - count).toString()
      );

      if (!pokerNode) {
        // console.error(" poker node invaild!");
        // console.log(this.PokerDevl);
        return;
      }

      let targetNode = Game.getPlacePokerRoot().get(pokerPos[count - 1]);
      if (targetNode) {
        let selfPos = CMath.ConvertToNodeSpaceAR(pokerNode, targetNode);

        let offset = offsets.indexOf(count - 1) >= 0 ? OFFSET_Y : OFFSET_Y / 3;
        if (!targetNode.getComponent(Poker)) {
          Game.addPlacePokerRoot(pokerPos[count - 1], pokerNode);
          offset = Empty_Offset;
        }
        pokerNode.setParent(targetNode);
        let poker = pokerNode.getComponent(Poker);
        pokerNode.setPosition(selfPos);

        pokerNode.group = "top";
        if (pokerFlips.indexOf(count - 1) >= 0) {
          poker.flipCard(0.1);
          poker.setNormal();
        }
        gEventMgr.emit(GlobalEvent.DEV_POKERS);
        pokerNode.runAction(
          cc.sequence(
            cc.moveTo(0.05, 0, offset),
            cc.callFunc(() => {
              pokerNode.group = "default";
              poker.setDefaultPosition();

              func1();
            }, this)
          )
        );
      }
    };

    func1();
  }

  recyclePoker() {
    if (this.PokerDevl.childrenCount > 0) {
      return;
    }

    if (this.PokerFlipRoot.childrenCount <= 0) {
      return;
    }

    if (this.LightAnimation.node.active) {
      this.LightAnimation.node.active = false;
    }

    let scores = [];
    let drawTimesCost = 0;
    let pos = CMath.ConvertToNodeSpaceAR(this.PokerDevl, this.RemoveNode);
    if (Game.getFreeDrawTimes() > 0) {
      Game.addFreeDrawTimes(-1);
      drawTimesCost = 1;
    } else {
      if (Game.getScore() >= 20) {
        scores.push(20);
      } else {
        scores.push(Game.getScore());
      }

      Game.addScore(-20, pos);
    }

    let nodes: cc.Node[] = [];
    let parents: cc.Node[] = [];
    let poses: cc.Vec2[] = [];

    let children = this.PokerFlipRoot.children.concat().reverse();
    let i = 0;

    let isAction = false;
    if (this.PokerFlipRoot.childrenCount >= 3) {
      this.FlipAnimation.play();
      gEventMgr.emit(GlobalEvent.PLAY_RECYCLE_POKERS);
    } else {
      isAction = true;
    }

    for (let child of children) {
      child.opacity = 255;
      let selfPos = CMath.ConvertToNodeSpaceAR(child, this.PokerDevl);

      let poker = child.getComponent(Poker);
      nodes.push(child);
      parents.push(this.PokerFlipRoot);
      poses.push(child.position.clone());

      child.setParent(this.PokerDevl);
      child.setPosition(selfPos);

      poker.setDefaultPosition(cc.v2(0, 0));

      poker.flipCard(0, false);

      if (isAction) {
        child.group = "top";
        this.scheduleOnce(() => {
          let action = cc.sequence(
            /*cc.delayTime(i / 100),*/
            cc.moveTo(0, 0, 0),
            cc.callFunc(() => {
              child.group = "default";
            }, this)
          );
          action.setTag(ACTION_TAG.RE_DEV_POKER);
          child.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_REMOVE);
          child.runAction(action);
        }, 0.1);
      } else {
        child.group = "default";
        child.stopAllActions();
        child.setPosition(0, 0);
      }
      i++;
    }

    let oldChildren = this.PokerFlipRoot.children;
    let count = 3;
    let func = function() {
      let length = Math.max(0, oldChildren.length - count);
      console.log("  opciaty -------------------------------:", length);
      for (let i = 0; i < length; i++) {
        let child = oldChildren[i];
        if (i < length - 1) {
          child.opacity = 0;
        }
      }
    };

    Game.addStep(
      nodes,
      parents,
      poses,
      [
        {
          callback: () => {
            Game.addFreeDrawTimes(drawTimesCost);
            setTimeout(func, 200);
          },
          target: this,
          args: []
        }
      ],
      scores,
      [pos]
    );
  }

  devPoker() {
    if (!this.canDispatchPoker) {
      return;
    }
    if (this.PokerDevl.childrenCount <= 0) {
      this.recyclePoker();
      return;
    }

    gEventMgr.emit(GlobalEvent.POP_GUIDE_STEP);

    let nodes: cc.Node[] = [];
    let parents: cc.Node[] = [];
    let poses: cc.Vec2[] = [];
    let funcs: StepFunc[] = [];

    let oldChildren = this.PokerFlipRoot.children.concat();

    let count = 3;

    for (let i = 0; i < 3; i++) {
      let pokerNode = this.PokerDevl.children[this.PokerDevl.childrenCount - 1];
      if (!pokerNode) {
        break;
      }
      count--;

      let selfPos = CMath.ConvertToNodeSpaceAR(pokerNode, this.PokerFlipRoot);

      let poker = pokerNode.getComponent(Poker);
      nodes.push(pokerNode);
      parents.push(pokerNode.getParent());
      poses.push(pokerNode.position.clone());
      funcs.push({
        callback: poker.flipCard,
        args: [0.1],
        target: poker
      });

      pokerNode.setParent(this.PokerFlipRoot);
      pokerNode.setPosition(selfPos);

      //let offset = i * 30 + this.devOffset;

      pokerNode.group = "top";
      this.scheduleOnce(() => {
        let pos = poker.getFlipPos();
        let action = cc.sequence(
          cc.delayTime(i / 20),
          cc.callFunc(() => {
            gEventMgr.emit(GlobalEvent.DEV_POKERS);
          }),
          cc.moveTo(0.1, pos.x, pos.y),
          cc.callFunc(() => {
            pokerNode.group = "default";
          }, this)
        );
        action.setTag(ACTION_TAG.DEV_POKER);
        pokerNode.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_ADD);
        pokerNode.runAction(action);
      }, 0);
    }

    let length = Math.max(0, oldChildren.length - count);
    for (let i = 0; i < length; i++) {
      let child = oldChildren[i];
      child.x = 0;
      if (i < length - 1) {
        child.opacity = 0;
      }
      if (child.getNumberOfRunningActions() > 0) {
        child.group = "default";
        child.stopAllActions();
      }
    }

    Game.addStep(nodes, parents, poses, funcs);
  }

  onPokerFlipAddChild(child: cc.Node) {
    // console.log(" onPokerFlipAddChild:", this.PokerFlipRoot.childrenCount);
    if (this.LightAnimation.node.active) {
      this.LightAnimation.node.active = false;
    }

    child.opacity = 255;
    let childIndex = this.PokerFlipRoot.children.indexOf(child);
    let poker = child.getComponent(Poker);
    if (poker) {
      if (!poker.isFront()) {
        poker.flipCard(0.1, false, () => {
          poker.setCanMove(childIndex + 1 == this.PokerFlipRoot.childrenCount);
        });
      }
      // console.log(" onPokerFlipAddChild ----recycle count ");
      poker.setRecycle(false);
    }
    if (childIndex >= 1) {
      this.PokerFlipRoot.children[childIndex - 1]
        .getComponent(Poker)
        .setCanMove(false);
    }

    // Game.addFlipCounts(0);
    // if (!Game.isComplete()) {
    //   this.updateFlipPokerPosOnAdd();
    // }

    this.updateFlipPokerPosOnAdd();
  }

  onPokerFlipRemoveChild(child: cc.Node) {
    child.opacity = 255;
    if (this.PokerFlipRoot.childrenCount > 0) {
      this.PokerFlipRoot.children[this.PokerFlipRoot.childrenCount - 1]
        .getComponent(Poker)
        .setNormal();
    }

    // Game.addFlipCounts(0);
    // if (!Game.isComplete()) {
    //   this.updateFlipPokerPos();
    // }

    this.updateFlipPokerPos();
  }

  updateFlipPokerPosOnAdd() {
    console.log(
      "this.PokerFlipRoot.childrenCount :",
      this.PokerFlipRoot.childrenCount
    );
    if (this.PokerFlipRoot.childrenCount >= 3) {
      let child1 = this.PokerFlipRoot.children[
        this.PokerFlipRoot.childrenCount - 1
      ];

      let action1 = cc.moveTo(0.1, 120, 0);
      action1.setTag(ACTION_TAG.FLIP_CARD_REPOS_ON_ADD);
      child1.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_REMOVE);
      child1.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_ADD);
      // child1.stopAllActions();
      child1.runAction(action1);
      child1.getComponent(Poker).setFlipPos(cc.v2(120, 0));
      child1.getComponent(Poker).setDefaultPosition(cc.v2(120, 0));
      child1.group = "default";
      child1.stopActionByTag(ACTION_TAG.BACK_STEP);
      child1.stopActionByTag(ACTION_TAG.SHAKE);

      let child2 = this.PokerFlipRoot.children[
        this.PokerFlipRoot.childrenCount - 2
      ];

      let action2 = cc.moveTo(0.1, 60, 0);
      action2.setTag(ACTION_TAG.FLIP_CARD_REPOS_ON_ADD);
      child2.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_ADD);
      child2.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_REMOVE);
      // child2.stopAllActions();
      child2.runAction(action2);
      child2.getComponent(Poker).setFlipPos(cc.v2(60, 0));
      child2.getComponent(Poker).setDefaultPosition(cc.v2(60, 0));
      child2.group = "default";
      child2.stopActionByTag(ACTION_TAG.BACK_STEP);
      child2.stopActionByTag(ACTION_TAG.SHAKE);

      let child3 = this.PokerFlipRoot.children[
        this.PokerFlipRoot.childrenCount - 3
      ];

      let action3 = cc.moveTo(0.1, 0, 0);
      action3.setTag(ACTION_TAG.FLIP_CARD_REPOS_ON_ADD);
      child3.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_ADD);
      child3.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_REMOVE);
      // child3.stopAllActions();
      child3.runAction(action3);
      child3.getComponent(Poker).setFlipPos(cc.v2(0, 0));
      child3.getComponent(Poker).setDefaultPosition(cc.v2(0, 0));
      child3.group = "default";
      child3.stopActionByTag(ACTION_TAG.BACK_STEP);
      child3.stopActionByTag(ACTION_TAG.SHAKE);

      child1.opacity = 255;
      child2.opacity = 255;
      child3.opacity = 255;
    } else if (this.PokerFlipRoot.childrenCount == 2) {
      let child1 = this.PokerFlipRoot.children[
        this.PokerFlipRoot.childrenCount - 1
      ];

      let action1 = cc.moveTo(0.1, 60, 0);
      action1.setTag(ACTION_TAG.FLIP_CARD_REPOS_ON_ADD);
      child1.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_REMOVE);
      child1.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_ADD);
      // child1.stopAllActions();
      child1.runAction(action1);
      child1.getComponent(Poker).setFlipPos(cc.v2(60, 0));
      child1.getComponent(Poker).setDefaultPosition(cc.v2(60, 0));
      child1.group = "default";
      child1.stopActionByTag(ACTION_TAG.BACK_STEP);
      child1.stopActionByTag(ACTION_TAG.SHAKE);

      let child2 = this.PokerFlipRoot.children[
        this.PokerFlipRoot.childrenCount - 2
      ];

      let action2 = cc.moveTo(0.1, 0, 0);
      action2.setTag(ACTION_TAG.FLIP_CARD_REPOS_ON_ADD);
      child2.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_ADD);
      child2.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_REMOVE);
      // child2.stopAllActions();
      child2.runAction(action2);
      child2.getComponent(Poker).setFlipPos(cc.v2(0, 0));
      child2.getComponent(Poker).setDefaultPosition(cc.v2(0, 0));
      child2.group = "default";
      child2.stopActionByTag(ACTION_TAG.BACK_STEP);
      child2.stopActionByTag(ACTION_TAG.SHAKE);

      child1.opacity = 255;
      child2.opacity = 255;
    } else if (this.PokerFlipRoot.childrenCount == 1) {
      let child1 = this.PokerFlipRoot.children[
        this.PokerFlipRoot.childrenCount - 1
      ];

      let action1 = cc.moveTo(0.1, 0, 0);
      action1.setTag(ACTION_TAG.FLIP_CARD_REPOS_ON_ADD);
      child1.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_REMOVE);
      child1.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_ADD);
      // child1.stopAllActions();
      child1.runAction(action1);
      child1.getComponent(Poker).setFlipPos(cc.v2(0, 0));
      child1.getComponent(Poker).setDefaultPosition(cc.v2(0, 0));
      child1.group = "default";
      child1.stopActionByTag(ACTION_TAG.BACK_STEP);
      child1.stopActionByTag(ACTION_TAG.SHAKE);
      child1.opacity = 255;
    }
  }

  updateFlipPokerPos() {
    if (this.PokerFlipRoot.childrenCount >= 3) {
      let child1 = this.PokerFlipRoot.children[
        this.PokerFlipRoot.childrenCount - 1
      ];

      let action1 = cc.moveTo(0.1, 120, 0);
      action1.setTag(ACTION_TAG.FLIP_CARD_REPOS_ON_REMOVE);
      child1.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_REMOVE);
      child1.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_ADD);
      child1.stopActionByTag(ACTION_TAG.SHAKE);
      child1.runAction(action1);
      child1.getComponent(Poker).setFlipPos(cc.v2(120, 0));
      child1.getComponent(Poker).setDefaultPosition(cc.v2(120, 0));

      let child2 = this.PokerFlipRoot.children[
        this.PokerFlipRoot.childrenCount - 2
      ];

      let action2 = cc.moveTo(0.1, 60, 0);
      action2.setTag(ACTION_TAG.FLIP_CARD_REPOS_ON_REMOVE);
      child2.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_REMOVE);
      child2.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_ADD);
      child2.stopActionByTag(ACTION_TAG.SHAKE);
      child2.runAction(action2);
      child2.getComponent(Poker).setFlipPos(cc.v2(60, 0));
      child2.getComponent(Poker).setDefaultPosition(cc.v2(60, 0));

      let child3 = this.PokerFlipRoot.children[
        this.PokerFlipRoot.childrenCount - 3
      ];

      let action3 = cc.moveTo(0.1, 0, 0);
      action3.setTag(ACTION_TAG.FLIP_CARD_REPOS_ON_REMOVE);
      child3.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_REMOVE);
      child3.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_ADD);
      child3.stopActionByTag(ACTION_TAG.SHAKE);
      child3.runAction(action3);
      child3.getComponent(Poker).setFlipPos(cc.v2(0, 0));
      child3.getComponent(Poker).setDefaultPosition(cc.v2(0, 0));

      child1.opacity = 255;
      child2.opacity = 255;
      child3.opacity = 255;
    } else if (this.PokerFlipRoot.childrenCount == 2) {
      let child1 = this.PokerFlipRoot.children[
        this.PokerFlipRoot.childrenCount - 1
      ];

      let action1 = cc.moveTo(0.1, 60, 0);
      action1.setTag(ACTION_TAG.FLIP_CARD_REPOS_ON_REMOVE);
      child1.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_REMOVE);
      child1.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_ADD);
      child1.stopActionByTag(ACTION_TAG.SHAKE);
      child1.runAction(action1);
      child1.getComponent(Poker).setFlipPos(cc.v2(60, 0));
      child1.getComponent(Poker).setDefaultPosition(cc.v2(60, 0));

      let child2 = this.PokerFlipRoot.children[
        this.PokerFlipRoot.childrenCount - 2
      ];

      let action2 = cc.moveTo(0.1, 0, 0);
      action2.setTag(ACTION_TAG.FLIP_CARD_REPOS_ON_REMOVE);
      child2.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_REMOVE);
      child2.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_ADD);
      child2.stopActionByTag(ACTION_TAG.SHAKE);
      child2.runAction(action2);
      child2.getComponent(Poker).setFlipPos(cc.v2(0, 0));
      child2.getComponent(Poker).setDefaultPosition(cc.v2(0, 0));

      child1.opacity = 255;
      child2.opacity = 255;
    } else if (this.PokerFlipRoot.childrenCount == 1) {
      let child1 = this.PokerFlipRoot.children[
        this.PokerFlipRoot.childrenCount - 1
      ];

      let action1 = cc.moveTo(0.1, 0, 0);
      action1.setTag(ACTION_TAG.FLIP_CARD_REPOS_ON_REMOVE);
      child1.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_REMOVE);
      child1.stopActionByTag(ACTION_TAG.FLIP_CARD_REPOS_ON_ADD);
      child1.stopActionByTag(ACTION_TAG.SHAKE);
      child1.runAction(action1);
      child1.getComponent(Poker).setFlipPos(cc.v2(0, 0));
      child1.getComponent(Poker).setDefaultPosition(cc.v2(0, 0));

      child1.opacity = 255;
    }
  }

  dispatchPoker() {
    if (Game.isTimeOver() || Game.isComplete()) return;
    Game.resetFreeTime();
    if (this.PokerClip.childrenCount <= 0 || !this.canDispatchPoker) {
      return;
    }

    let nodes: cc.Node[] = [];
    let parents: cc.Node[] = [];
    let poses: cc.Vec2[] = [];
    let funcs: StepFunc[] = [];
    Game.getPlacePokerRoot().forEach((index: number, targetNode: cc.Node) => {
      if (this.PokerClip.childrenCount <= 0) return;

      let pokerNode = this.PokerClip.children[this.PokerClip.childrenCount - 1];

      let selfPos = CMath.ConvertToNodeSpaceAR(pokerNode, targetNode);

      let poker = pokerNode.getComponent(Poker);
      nodes.push(pokerNode);
      parents.push(pokerNode.getParent());
      poses.push(pokerNode.position.clone());

      funcs.push({
        callback: poker.flipCard,
        args: [0.1],
        target: poker
      });

      pokerNode.setParent(targetNode);
      pokerNode.setPosition(selfPos);

      let offset = OFFSET_Y;
      if (!targetNode.getComponent(Poker)) {
        Game.addPlacePokerRoot(index, pokerNode);
        offset = 0;
      }

      poker.flipCard(0.1);
      poker.setNormal();
      pokerNode.group = "top";
      pokerNode.runAction(
        cc.sequence(
          cc.moveTo(0.3, 0, offset),
          cc.callFunc(() => {
            poker.setDefaultPosition();
            pokerNode.group = "default";
          }, this)
        )
      );
    });

    Game.addStep(nodes, parents, poses, funcs);
  }

  start() {}

  update(dt: number) {
    this.devTime += dt;
    this.backTime += dt;

    if (Game.isGameStarted()) {
      Game.addGameTime(-dt);
      Game.addFreeTime(dt);
      let gameTime = Game.getGameTime();
      this.TimeLabel.string = CMath.TimeFormat(gameTime);
      if (gameTime <= 60) {
        this.TimeLabel.font = this.SmallOrg;
        if (!this.TimeAnimation.node.active) {
          gEventMgr.emit(GlobalEvent.PLAY_SHAKE);
          this.TimeAnimation.node.active = true;
          this.TimeAnimation.play();
          this.TimeIcon.spriteFrame = this.TimeIconAtlas.getSpriteFrame(
            "icon_time_2"
          );
        }
      }
    }

    if (this.score < this.showScore) {
      this.score += this.scoreStep;
      this.score = Math.min(this.score, this.showScore);
      this.ScoreLabel.string = this.score.toString();
    } else if (this.score > this.showScore) {
      this.score -= this.scoreStep;
      this.score = Math.max(this.score, this.showScore);
      this.ScoreLabel.string = this.score.toString();
    }
  }
}
