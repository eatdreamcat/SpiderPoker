import { gFactory } from "./controller/GameFactory";
import { Game, StepFunc } from "./controller/Game";
import Poker from "./Poker";
import { Pokers, ACTION_TAG, OFFSET_Y, PokerIndex } from "./Pokers";
import { gEventMgr } from "./controller/EventManager";
import { GlobalEvent } from "./controller/EventName";

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
  DONE = LOAD_STEP.READY | LOAD_STEP.PREFABS | LOAD_STEP.CELER | LOAD_STEP.GUIDE
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

  @property(cc.Node)
  CycleRoot: cc.Node = null;

  @property(cc.Node)
  PokerFlipRoot: cc.Node = null;

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

  @property(cc.Animation)
  LightAnimation: cc.Animation = null;

  @property(cc.Node)
  Stop: cc.Node = null;

  @property(cc.Animation)
  FlipAnimation: cc.Animation = null;

  private step: LOAD_STEP = LOAD_STEP.READY;
  private canDispatchPoker: boolean = false;
  private readonly dispatchCardCount = 28;

  private devTime: number = 10;
  private backTime: number = 10;

  private score: number = 0;
  private showScore: number = 0;
  private scoreStep: number = 0;

  init() {
    this.Stop.active = false;
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

  restart() {
    this.init();
    this.startGame();
  }

  onLoad() {
    Game.removeNode = this.RemoveNode;
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

    this.nextStep(LOAD_STEP.GUIDE);

    this.PokerClip.on(cc.Node.EventType.TOUCH_START, this.dispatchPoker, this);

    this.PauseButton.node.on(
      cc.Node.EventType.TOUCH_START,
      () => {
        this.Stop.active = true;
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
        if (Game.isTimeOver()) return;
        if (this.devTime >= 0.3) {
          this.devPoker();
          this.devTime = 0;
        }
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
        if (Game.isTimeOver() || this.backTime < 0.5) return;
        this.backTime = 0;
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
        console.log(" score change: ", score, ",pos:", pos);

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
          let scoreLabel = gFactory.getSubScore("/" + score.toString());
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

    gEventMgr.on(GlobalEvent.RESTART, this.restart, this);
    cc.loader.loadRes("prefabs/Result");
  }

  openResult() {
    this.Stop.active = false;
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
    this.nextStep(LOAD_STEP.CELER);

    if ((match && match.shouldLaunchTutorial) || CC_DEBUG) {
    } else {
      this.nextStep(LOAD_STEP.GUIDE);
    }
  }

  /**
   * 下一步
   */
  private nextStep(loadStep: LOAD_STEP) {
    this.step |= loadStep;

    console.log("CUR STEP:" + LOAD_STEP[loadStep] + ", total: " + this.step);

    if (this.step >= LOAD_STEP.DONE) {
      this.startGame();
    } else {
    }
  }

  startGame() {
    console.log(
      " this.PokerDevl ------------------------- :",
      this.PokerDevl.childrenCount
    );
    let pokers = Pokers.concat();
    let pokerIndex = PokerIndex.concat();
    let weightDiv = pokerIndex.length;
    while (pokers.length > 0) {
      let curIndex = pokers.length - 1;
      let pokerWeight =
        1 - (weightDiv - pokerIndex.indexOf(curIndex)) / pokerIndex.length;

      let totalWeight = pokers.length;

      let random = CMath.getRandom(0, 1);
      //CMath.getRandom(0, 1) / 2 + CMath.getRandom(0, pokerWeight) / 2;
      let randomIndex = Math.floor(random * totalWeight);

      let i = pokers.splice(randomIndex, 1);
      console.warn(
        "randomIndex:",
        randomIndex,
        ", poker:",
        i,
        ",pokerWeight:",
        pokerWeight,
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
        console.log(this.PokerDevl.children);
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

    let pokerFlips = [0, 7, 13, 18, 22, 25, 27];
    /** 上面发牌 */
    let func1 = () => {
      if (count++ >= this.dispatchCardCount) {
        //func2();
        this.canDispatchPoker = true;
        this.LightAnimation.node.active = true;
        this.LightAnimation.play();
        return;
      }

      let pokerNode = this.PokerDevl.getChildByName(
        (totalCount - count).toString()
      );

      if (!pokerNode) {
        console.error(" poker node invaild!");
        console.log(this.PokerDevl);
        return;
      }

      let targetNode = Game.getPlacePokerRoot().get(pokerPos[count - 1]);
      if (targetNode) {
        let selfPos = CMath.ConvertToNodeSpaceAR(pokerNode, targetNode);

        let offset = OFFSET_Y / 3;
        if (!targetNode.getComponent(Poker)) {
          Game.addPlacePokerRoot(pokerPos[count - 1], pokerNode);
          offset = 0;
        }
        pokerNode.setParent(targetNode);
        let poker = pokerNode.getComponent(Poker);
        pokerNode.setPosition(selfPos);

        pokerNode.group = "top";
        if (pokerFlips.indexOf(count - 1) >= 0) {
          poker.flipCard(0.1);
          poker.setNormal();
        }
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

    if (this.PokerFlipRoot.childrenCount >= 3) {
      this.FlipAnimation.play();
    }

    let children = this.PokerFlipRoot.children.concat().reverse();
    let i = 0;
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
      }, 0);
      i++;
    }
    Game.addStep(
      nodes,
      parents,
      poses,
      [
        {
          callback: () => {
            Game.addFreeDrawTimes(drawTimesCost);
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
    console.log(" devPoker ");
    if (!this.canDispatchPoker) {
      return;
    }
    if (this.PokerDevl.childrenCount <= 0) {
      this.recyclePoker();
      return;
    }

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
    console.log(" onPokerFlipAddChild:", this.PokerFlipRoot.childrenCount);
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
      poker.setRecycle(false);
    }
    if (childIndex >= 1) {
      this.PokerFlipRoot.children[childIndex - 1]
        .getComponent(Poker)
        .setCanMove(false);
    }

    this.updateFlipPokerPosOnAdd();
  }

  onPokerFlipRemoveChild(child: cc.Node) {
    child.opacity = 255;
    if (this.PokerFlipRoot.childrenCount > 0) {
      this.PokerFlipRoot.children[this.PokerFlipRoot.childrenCount - 1]
        .getComponent(Poker)
        .setNormal();
    }

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

      child1.opacity = 255;
      child2.opacity = 255;
      child3.opacity = 255;
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
      child3.runAction(action3);
      child3.getComponent(Poker).setFlipPos(cc.v2(0, 0));
      child3.getComponent(Poker).setDefaultPosition(cc.v2(0, 0));

      child1.opacity = 255;
      child2.opacity = 255;
      child3.opacity = 255;
    }
  }

  dispatchPoker() {
    if (Game.isTimeOver()) return;
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
      let gameTime = Game.getGameTime();
      this.TimeLabel.string = CMath.TimeFormat(gameTime);
      if (gameTime <= 60) {
        this.TimeLabel.font = this.SmallOrg;
        if (!this.TimeAnimation.node.active) {
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
