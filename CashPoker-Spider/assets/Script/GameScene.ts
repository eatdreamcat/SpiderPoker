import { gFactory } from "./controller/GameFactory";
import { Game, StepFunc } from "./controller/Game";
import Poker from "./Poker";
import {
  Pokers,
  ACTION_TAG,
  OFFSET_Y,
  PokerIndex,
  BACK_STEP_SCORE
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
  GUIDE = 2 << 5,
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
  RemoveNode: cc.Node = null;

  @property(cc.Button)
  BackButton: cc.Button = null;

  @property(cc.Button)
  PauseButton: cc.Button = null;

  @property(cc.SpriteAtlas)
  BackButtonAtlas: cc.SpriteAtlas = null;
  @property(cc.SpriteAtlas)
  DrawButtonAtlas: cc.SpriteAtlas = null;

  @property(cc.Label)
  TimeLabel: cc.Label = null;

  @property(cc.Sprite)
  TimeIcon: cc.Sprite = null;

  @property(cc.SpriteAtlas)
  TimeIconAtlas: cc.SpriteAtlas = null;

  @property(cc.Label)
  ScoreLabel: cc.Label = null;

  @property(cc.Font)
  SmallOrg: cc.Font = null;

  @property(cc.Prefab)
  SubScoreLabel: cc.Prefab = null;

  @property(cc.Prefab)
  AddScoreLabel: cc.Prefab = null;

  @property(cc.Animation)
  TimeAnimation: cc.Animation = null;

  @property(Stop)
  Stop: Stop = null;

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

  @property(cc.Label)
  RecyclePokerLabel: cc.Label = null;

  private step: LOAD_STEP = LOAD_STEP.READY;
  private canDispatchPoker: boolean = false;
  private readonly dispatchCardCount = 38;

  private devTime: number = 10;
  private backTime: number = 10;

  private score: number = 0;
  private showScore: number = 0;
  private scoreStep: number = 0;

  private isStart: boolean = false;

  init() {
    this.Stop.hide();
    this.Complete.node.active = false;
    this.TimeLabel.string = CMath.TimeFormat(Game.getGameTime());
    this.ScoreLabel.string = "0";
    this.TimeAnimation.node.active = false;

    this.TimeIcon.spriteFrame = this.TimeIconAtlas.getSpriteFrame("icon_time");

    Game.getCycledPokerRoot().clear();
    Game.getPlacePokerRoot().clear();

    for (let child of this.PlaceRoot.children) {
      if (
        child.getComponent(cc.Sprite) &&
        child.getComponent(cc.Sprite).enabled
      ) {
        child.getComponent(cc.Sprite).enabled = CC_DEBUG;
      }
      Game.addPlacePokerRoot(parseInt(child.name), child);
    }
  }

  // restart() {
  //   this.init();
  //   this.startGame();
  // }

  onLoad() {
    Game.removeNode = this.RemoveNode;
    Game.pokerClip = this.PokerClip;
    celerx.ready();
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

    CC_DEBUG && this.celerStart();

    this.CheatToggle.node.active = CHEAT_OPEN;
    this.CheatToggle.isChecked = false;
    this.CheatToggle.node.on(
      "toggle",
      () => {
        if (this.CheatToggle.isChecked) {
          window["noTime"] = window["CheatOpen"] = true;
        } else {
          window["noTime"] = window["CheatOpen"] = false;
        }
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

    this.PokerClip.on(
      cc.Node.EventType.TOUCH_END,
      () => {
        if (Game.isTimeOver() || Game.isComplete()) return;
        if (this.devTime >= 0.3) {
          this.dispatchPoker();
          this.devTime = 0;
        }
      },
      this
    );

    this.PokerClip.on(
      cc.Node.EventType.TOUCH_CANCEL,
      () => {
        if (Game.isTimeOver() || Game.isComplete()) return;
        if (this.devTime >= 0.3) {
          this.dispatchPoker();
          this.devTime = 0;
        }
      },
      this
    );

    this.PauseButton.node.on(
      cc.Node.EventType.TOUCH_END,
      () => {
        if (Game.isComplete()) return;
        this.Stop.show(1);
        Game.setPause(true);
      },
      this
    );

    this.SubmitButton.node.on(
      cc.Node.EventType.TOUCH_END,
      () => {
        if (Game.isComplete()) return;
        this.Stop.show(-1);
        Game.setPause(true);
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

    // this.PokerDevl.on(
    //   cc.Node.EventType.TOUCH_START,
    //   () => {
    //     if (Game.isTimeOver() || Game.isComplete()) return;
    //     if (this.devTime >= 0.3) {
    //       this.devPoker();
    //       this.devTime = 0;
    //     }
    //   },
    //   this
    // );

    gEventMgr.on(
      GlobalEvent.COMPLETE,
      () => {
        this.Complete.node.active = true;
        this.Complete.play();
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.UPDATE_RECYCLE_POKER,
      (count: number) => {
        this.RecyclePokerLabel.string = count.toString();
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
        if (Game.backStep()) {
          Game.addScore(
            -BACK_STEP_SCORE,
            CMath.ConvertToNodeSpaceAR(this.BackButton.node, Game.removeNode)
          );
        }
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

  openResult() {
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
      this.nextStep(LOAD_STEP.CELER);
    } else {
      CMath.randomSeed = Math.random();
      CC_DEBUG && this.nextStep(LOAD_STEP.CELER);
    }

    if ((match && match.shouldLaunchTutorial) || CC_DEBUG) {
      this.Guide.show(() => {
        this.nextStep(LOAD_STEP.GUIDE);
      });
    } else {
      this.Guide.hide();
      this.nextStep(LOAD_STEP.GUIDE);
    }
  }

  /**
   * 下一步
   */
  private nextStep(loadStep: LOAD_STEP) {
    this.step |= loadStep;
    console.log("loadStep Step:" + LOAD_STEP[loadStep]);
    if (this.step >= LOAD_STEP.DONE && !this.isStart) {
      console.log("  startGame ---------------------- ");
      this.isStart = true;
      this.startGame();
    } else {
    }
  }

  startGame() {
    let pokers = Pokers.concat([]).reverse();
    //let pokers = Pokers.concat([]);
    console.log(pokers);
    console.log(pokers.length);
    /**
     *生成可解牌局
     */
    // let origPokers = Pokers.concat();
    // let solutionPokers = [];
    // let group1 = [];
    /**
     *
     */
    while (pokers.length > 0) {
      let curIndex = pokers.length - 1;

      let totalWeight = pokers.length;

      let random = CMath.getRandom(0, 1);
      let randomIndex = Math.floor(random * totalWeight);

      let i = pokers.splice(randomIndex, 1);
      //let i = pokers.splice(curIndex, 1);
      console.warn(
        "randomIndex:",
        randomIndex,
        ", poker:",
        i,

        ",random:",
        random
      );
      let pokerNode = gFactory.getPoker(i);
      pokerNode.name = curIndex.toString();
      pokerNode.x = 0;
      pokerNode.y = 0;
      this.PokerDevl.addChild(pokerNode);
    }

    let count = 0;
    let totalCount = this.PokerDevl.childrenCount;
    /** 发底牌 */
    //let count2 = 0;
    let func2 = () => {
      let pokerNode = this.PokerDevl.getChildByName(
        (totalCount - count++).toString()
      );

      //let pokerNode = this.PokerDevl.getChildByName((count2++).toString());

      if (pokerNode) {
        let targetPos = cc.v2(0, 0);
        if (this.PokerClip.childrenCount > 0) {
          let child = this.PokerClip.children[this.PokerClip.childrenCount - 1];
          targetPos = cc.v2(child.x - 20, child.y);
        }

        let selfPos = CMath.ConvertToNodeSpaceAR(pokerNode, this.PokerClip);
        let poker = pokerNode.getComponent(Poker);
        poker.setLastPosition(targetPos);
        pokerNode.setParent(this.PokerClip);
        pokerNode.setPosition(selfPos);
        pokerNode.group = "top";
        gEventMgr.emit(GlobalEvent.DEV_POKERS);
        pokerNode.runAction(
          cc.sequence(
            cc.moveTo(0.05, targetPos.x, targetPos.y),
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

    // let pokerPos = [
    //   0,
    //   1,
    //   2,
    //   3,
    //   4,
    //   5,
    //   6,

    //   1,
    //   2,
    //   3,
    //   4,
    //   5,
    //   6,

    //   2,
    //   3,
    //   4,
    //   5,
    //   6,

    //   3,
    //   4,
    //   5,
    //   6,

    //   4,
    //   5,
    //   6,
    //   5,
    //   6,

    //   6
    // ];

    //let pokerFlips = [0, 7, 13, 18, 22, 25, 27];
    /** 上面发牌 */
    let func1 = () => {
      if (count++ >= this.dispatchCardCount) {
        func2();
        // this.canDispatchPoker = true;
        // this.LightAnimation.node.active = true;
        // this.LightAnimation.play();
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

      let rootIndex = (count - 1) % 8;
      let targetNode = Game.getPlacePokerRoot().get(rootIndex);
      if (targetNode) {
        let selfPos = CMath.ConvertToNodeSpaceAR(pokerNode, targetNode);

        let offset = OFFSET_Y / 3;
        if (!targetNode.getComponent(Poker)) {
          Game.addPlacePokerRoot(rootIndex, pokerNode);
          offset = 0;
        }
        pokerNode.setParent(targetNode);
        let poker = pokerNode.getComponent(Poker);
        pokerNode.setPosition(selfPos);

        pokerNode.group = "top";
        if (count > 30) {
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

  recyclePoker() {}

  devPoker() {}

  dispatchPoker() {
    if (Game.isTimeOver() || Game.isComplete()) return;
    if (this.PokerClip.childrenCount <= 0 || !this.canDispatchPoker) {
      return;
    }

    if (!Game.isGameStarted()) Game.start();

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
      gEventMgr.emit(GlobalEvent.DEV_POKERS);
      pokerNode.runAction(
        cc.sequence(
          cc.moveTo(0.3, 0, offset),
          cc.callFunc(() => {
            poker.setDefaultPosition();
            pokerNode.group = "default";
            poker.checkPos();
            poker.check(1);
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
}
