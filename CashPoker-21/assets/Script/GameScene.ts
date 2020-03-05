import { gFactory } from "./controller/GameFactory";
import { Game, StepFunc } from "./controller/Game";
import Poker from "./Poker";
import {
  Pokers,
  ACTION_TAG,
  OFFSET_Y,
  PokerIndex,
  BACK_STEP_SCORE,
  BOOOOM_LIMIT,
  SPECIAL_TYPE_NAME,
  SPECIAL_TYPE,
  ADD_SCORE_SPECILA_OFFSET_Y,
  NORMAL_SCORE_MOVE_TIME,
  NO_BUST_EXTRA_SCORE
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
  CELER_READY  = AUDIO | PREFABS | READY,
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

  @property(cc.Node)
  Bust01: cc.Node = null;

  @property(cc.Node)
  Bust02: cc.Node = null;

  @property(cc.Node)
  Bust03: cc.Node = null;

  @property(cc.Button)
  PauseButton: cc.Button = null;

  @property(cc.SpriteAtlas)
  BackButtonAtlas: cc.SpriteAtlas = null;

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

  @property(cc.Prefab)
  SpecialFont: cc.Prefab = null;

  @property(cc.Animation)
  TimeAnimation: cc.Animation = null;

  @property(Stop)
  Stop: Stop = null;

  @property(Guide)
  Guide: Guide = null;

  @property(cc.Animation)
  Complete: cc.Animation = null;

  @property(cc.Button)
  SubmitButton: cc.Button = null;

  @property(cc.Toggle)
  CheatToggle: cc.Toggle = null;

  @property(cc.Label)
  PokerRestLabel: cc.Label = null;

  @property(cc.Node)
  SelectPokerNode: cc.Node = null;

  @property(cc.Node)
  SpecialWild: cc.Node = null;

  @property(cc.Node)
  SpecialBust: cc.Node = null;

  @property(cc.SpriteAtlas)
  SpecialAtlas: cc.SpriteAtlas = null;

  @property(cc.Node)
  SpecialScore: cc.Node = null;

  @property(cc.Node)
  RemoveCardNode: cc.Node = null;

  @property(cc.Node)
  RemoveBustNode: cc.Node = null;

  @property(cc.SpriteAtlas)
  WildBtn: cc.SpriteAtlas = null;

  @property(cc.Label)
  WildCount: cc.Label = null;

  @property(cc.SpriteAtlas)
  CompleteAtlas: cc.SpriteAtlas = null;

  @property(cc.Sprite)
  CompleteSprite: cc.Sprite = null;

  @property(cc.Sprite)
  combo1: cc.Sprite = null;

  @property(cc.Sprite)
  combo2: cc.Sprite = null;

  @property(cc.Animation)
  AddWildEffect: cc.Animation = null;

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
    Game.removeCardNode = this.RemoveCardNode;
    Game.removeBustedNode = this.RemoveBustNode;
    Game.curSelectNode = this.SelectPokerNode;
    this.combo1.node.active = false;
    this.combo2.node.active = false;
    this.CompleteSprite.node.active = false;
    this.Bust01.getChildByName("Cover").active = false;
    this.Bust02.getChildByName("Cover").active = false;
    this.Bust03.getChildByName("Cover").active = false;

    this.WildCount.string = Game.getWildCount().toString();
    
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

    for (let child of this.SpecialBust.children) {
      child.scaleY = 0;
    }

    for (let child of this.SpecialWild.children) {
      child.scaleY = 0;
    }

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
      this.SubScoreLabel,
      this.SpecialFont
    );

    gAudio.init(() => {
      this.nextStep(LOAD_STEP.AUDIO);
    });

    // this.PokerClip.on(
    //   cc.Node.EventType.TOUCH_END,
    //   () => {
    //     if (Game.isTimeOver() || Game.isComplete()) return;
    //     if (this.devTime >= 0.3) {
    //       this.dispatchPoker();
    //       this.devTime = 0;
    //     }
    //   },
    //   this
    // );

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

    if (CC_DEBUG) {
      cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, event => {
        switch (event.keyCode) {
          case cc.macro.KEY.space:
            if (Game.getCurSelectPoker()) {
              Game.getCurSelectPoker().setWild();
            }
            break;
        }
      });
    }

    this.PauseButton.node.on(
      cc.Node.EventType.TOUCH_END,
      () => {
        if (Game.isComplete()) return;
        this.Stop.show(-1);
        Game.setPause(true);
      },
      this
    );

    this.SubmitButton.interactable = Game.getWildCount() > 0;
    this.WildCount.node.getParent().active = this.SubmitButton.interactable;
    if (this.SubmitButton.interactable) {
      this.SubmitButton.node
        .getChildByName("Background")
        .getComponent(cc.Sprite).spriteFrame = this.WildBtn.getSpriteFrame(
        "btn_wild"
      );
    } else {
      this.SubmitButton.node
        .getChildByName("Background")
        .getComponent(cc.Sprite).spriteFrame = this.WildBtn.getSpriteFrame(
        "btn_wildnone"
      );
    }

    this.SubmitButton.node.on(
      cc.Node.EventType.TOUCH_END,
      () => {
        if (Game.isComplete()) return;
        if (Game.getWildCount() <= 0 || !Game.getCurSelectPoker()) return;
        Game.getCurSelectPoker().setWild();
        Game.addWildCount(-1);
        Game.clearStreak();
      },
      this
    );

    gEventMgr.on(GlobalEvent.UPDATE_STREAK_COUNT, ()=>{
      this.combo1.node.active = Game.getStreak() >= 2 && Game.getWildCount() == 0;
      //this.combo2.node.active = Game.getStreak() >= 3 && Game.getWildCount() == 0;
    }, this);

    gEventMgr.on(
      GlobalEvent.UPDATE_WILD_COUNT,
      (wild: number) => {
        if (wild > 0) {
          gEventMgr.emit(GlobalEvent.PLAY_WILD_ANI)
          this.AddWildEffect.play();
        }
        
        this.WildCount.string = Game.getWildCount().toString();
        this.SubmitButton.interactable = Game.getWildCount() > 0;
        this.WildCount.node.getParent().active = this.SubmitButton.interactable;

        if (this.SubmitButton.interactable) {
          if (Game.getWildCount() == 1) {
            this.combo2.node.active = true;
            setTimeout(()=>{
              if (Game.getWildCount() > 0) {
                this.SubmitButton.node
            .getChildByName("Background")
            .getComponent(cc.Sprite).spriteFrame = this.WildBtn.getSpriteFrame(
            "btn_wild"
          );
              }
          this.combo2.node.active = false;
            }, 300);
          } else {
            this.combo2.node.active = false;
            this.SubmitButton.node
            .getChildByName("Background")
            .getComponent(cc.Sprite).spriteFrame = this.WildBtn.getSpriteFrame(
            "btn_wild"
          );
          }
        } else {
          this.SubmitButton.node
            .getChildByName("Background")
            .getComponent(cc.Sprite).spriteFrame = this.WildBtn.getSpriteFrame(
            "btn_wildnone"
          );
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
        console.log(" BOOM count: ", count);
        this.Bust01.getChildByName("Cover").active = count >= 1;
        this.Bust02.getChildByName("Cover").active = count >= 2;
        this.Bust03.getChildByName("Cover").active = count >= 3;
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
              cc.delayTime(0.3),
              cc.scaleTo(0.1, 1.0),
              cc.moveTo(0.3, targetPos.x, targetPos.y),
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
              cc.delayTime(0.3),
              cc.scaleTo(0.1, 1.0),
              cc.moveTo(0.3, targetPos.x, targetPos.y),
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

    gEventMgr.on(
      GlobalEvent.UPDATE_CUR_SELECT_POKER,
      this.updateCurSelectPoker,
      this
    );

    gEventMgr.on(GlobalEvent.OPEN_RESULT, this.openResult, this);

    this.PokerClip.on(
      cc.Node.EventType.CHILD_REMOVED,
      this.onPokerClipRemoveChild,
      this
    );
    this.PokerClip.on(
      cc.Node.EventType.CHILD_ADDED,
      this.onPokerClipAddChild,
      this
    );

    this.SelectPokerNode.on(
      cc.Node.EventType.CHILD_ADDED,
      this.onSelectPokerAddChild,
      this
    );
    this.SelectPokerNode.on(
      cc.Node.EventType.CHILD_REMOVED,
      this.onSelectPokerRemoveChild,
      this
    );

    gEventMgr.on(
      GlobalEvent.CHECK_COMPLETE,
      (delay: number) => {
        if (
          this.PokerClip.childrenCount == 0 &&
          this.SelectPokerNode.childrenCount == 0
        ) {
          console.error(" openResultTimeDelay:", delay);
          if (Game.getRecyclePoker() <= 0) {
            setTimeout(() => {
              gEventMgr.emit(GlobalEvent.NO_BUST);
              Game.addScore(
                NO_BUST_EXTRA_SCORE,
                CMath.ConvertToNodeSpaceAR(this.Bust02, Game.removeNode)
              );
            }, delay);
          }

          gEventMgr.emit(GlobalEvent.OPEN_RESULT, delay + 1500);
        }
      },
      this
    );

    /** 爆掉 */
    gEventMgr.on(
      GlobalEvent.BUST,
      (index: number) => {
        let bgNode = this.SpecialBust.getChildByName("bust" + index);
        let pos = CMath.ConvertToNodeSpaceAR(bgNode, this.RemoveNode);
        let spriteFrame = this.SpecialAtlas.getSpriteFrame(
          SPECIAL_TYPE_NAME[SPECIAL_TYPE.BUSTED]
        );

        let node = gFactory.getSpecialFont(
          spriteFrame,
          cc.v2(pos.x, pos.y + 120),
          () => {
            bgNode.stopAllActions();
            bgNode.scaleY = 0;
            bgNode.runAction(
              cc.sequence(cc.fadeIn(0), cc.scaleTo(0.1, 1, 1), cc.fadeOut(0.2), cc.scaleTo(0, 1, 0))
            );
          },true
        );

        this.RemoveNode.addChild(node);
      },
      this
    );

    /** 超过5张 */
    gEventMgr.on(
      GlobalEvent.OVER_FIVE_CARDS,
      (index: number) => {
        let bgNode = this.SpecialWild.getChildByName("wild" + index);
        let pos = CMath.ConvertToNodeSpaceAR(bgNode, this.RemoveNode);
        let spriteFrame = this.SpecialAtlas.getSpriteFrame(
          SPECIAL_TYPE_NAME[SPECIAL_TYPE.FIVE_CARDS]
        );

        let scoreBg = this.SpecialScore.getChildByName(
          "rect" + index
        ).getChildByName("score");
        let node = gFactory.getSpecialFont(
          spriteFrame,
          cc.v2(pos.x, pos.y + ADD_SCORE_SPECILA_OFFSET_Y),
          () => {
            scoreBg.stopAllActions();
            scoreBg.runAction(
              cc.sequence(
                cc.moveTo(0, 0, -836),
                cc.moveTo(NORMAL_SCORE_MOVE_TIME, 0, 175)
              )
            );
          }
        );

        this.RemoveNode.addChild(node);
      },
      this
    );

    /** combo */
    gEventMgr.on(
      GlobalEvent.COMBO,
      (index: number) => {
        let bgNode = this.SpecialWild.getChildByName("wild" + index);
        let pos = CMath.ConvertToNodeSpaceAR(bgNode, this.RemoveNode);
        let spriteFrame = this.SpecialAtlas.getSpriteFrame(
          SPECIAL_TYPE_NAME[SPECIAL_TYPE.COMBO]
        );

        let scoreBg = this.SpecialScore.getChildByName(
          "rect" + index
        ).getChildByName("score");
        let node = gFactory.getSpecialFont(
          spriteFrame,
          cc.v2(pos.x, pos.y + ADD_SCORE_SPECILA_OFFSET_Y),
          () => {
            scoreBg.stopAllActions();
            scoreBg.runAction(
              cc.sequence(
                cc.moveTo(0, 0, -836),
                cc.moveTo(NORMAL_SCORE_MOVE_TIME, 0, 175)
              )
            );
          }
        );

        this.RemoveNode.addChild(node);
      },
      this
    );

    /** 超级combo */
    gEventMgr.on(
      GlobalEvent.SUPER_COMBO,
      (index: number) => {
        let bgNode = this.SpecialWild.getChildByName("wild" + index);
        let pos = CMath.ConvertToNodeSpaceAR(bgNode, this.RemoveNode);
        let spriteFrame = this.SpecialAtlas.getSpriteFrame(
          SPECIAL_TYPE_NAME[SPECIAL_TYPE.SUPER_COMBO]
        );
        let scoreBg = this.SpecialScore.getChildByName(
          "rect" + index
        ).getChildByName("score");
        let node = gFactory.getSpecialFont(
          spriteFrame,
          cc.v2(pos.x, pos.y + ADD_SCORE_SPECILA_OFFSET_Y),
          () => {
            scoreBg.stopAllActions();
            scoreBg.runAction(
              cc.sequence(
                cc.moveTo(0, 0, -836),
                cc.moveTo(NORMAL_SCORE_MOVE_TIME, 0, 175)
              )
            );
          }
        );

        this.RemoveNode.addChild(node);
      },
      this
    );

    /** 完成21点 */
    gEventMgr.on(
      GlobalEvent.COMPLETE_21,
      (index: number) => {
        let bgNode = this.SpecialWild.getChildByName("wild" + index);
        let pos = CMath.ConvertToNodeSpaceAR(bgNode, this.RemoveNode);
        let spriteFrame = this.SpecialAtlas.getSpriteFrame(
          SPECIAL_TYPE_NAME[SPECIAL_TYPE.COMPLETE_21]
        );
        let scoreBg = this.SpecialScore.getChildByName(
          "rect" + index
        ).getChildByName("score");
        let node = gFactory.getSpecialFont(
          spriteFrame,
          cc.v2(pos.x, pos.y + ADD_SCORE_SPECILA_OFFSET_Y),
          () => {
            scoreBg.stopAllActions();
            scoreBg.runAction(
              cc.sequence(
                cc.moveTo(0, 0, -836),
                cc.moveTo(NORMAL_SCORE_MOVE_TIME, 0, 175)
              )
            );
          }
        );

        this.RemoveNode.addChild(node);
      },
      this
    );

    /** 没有爆过 */
    gEventMgr.on(
      GlobalEvent.NO_BUST,
      () => {
        let pos = CMath.ConvertToNodeSpaceAR(this.Bust02, this.RemoveNode);
        let spriteFrame = this.SpecialAtlas.getSpriteFrame(
          SPECIAL_TYPE_NAME[SPECIAL_TYPE.NO_BUST]
        );

        let node = gFactory.getSpecialFont(
          spriteFrame,
          cc.v2(pos.x, pos.y - 200)
        );

        this.RemoveNode.addChild(node);
      },
      this
    );

    /** 野牌 */
    gEventMgr.on(
      GlobalEvent.WILD,
      (index: number) => {
        let bgNode = this.SpecialWild.getChildByName("wild" + index);
        let pos = CMath.ConvertToNodeSpaceAR(bgNode, this.RemoveNode);
        let spriteFrame = this.SpecialAtlas.getSpriteFrame(
          SPECIAL_TYPE_NAME[SPECIAL_TYPE.WILD]
        );

        let node = gFactory.getSpecialFont(
          spriteFrame,
          cc.v2(pos.x, pos.y + ADD_SCORE_SPECILA_OFFSET_Y),
          () => {
            bgNode.stopAllActions();
            bgNode.scaleY = 0;
            bgNode.runAction(
              cc.sequence(cc.fadeIn(0), cc.scaleTo(0.1, 1, 1), cc.fadeOut(0.2), cc.scaleTo(0, 1,0))
            );
          }
        );

        this.RemoveNode.addChild(node);
      },
      this
    );

    //gEventMgr.on(GlobalEvent.RESTART, this.restart, this);
    cc.loader.loadRes("prefabs/Result");
    cc.loader.loadResDir("sounds");
  }

  onPokerClipRemoveChild() {
    this.PokerRestLabel.string = this.PokerClip.childrenCount.toString();
  }

  onPokerClipAddChild() {
    this.PokerRestLabel.string = this.PokerClip.childrenCount.toString();
  }

  onSelectPokerAddChild(child: cc.Node) {
    if (this.SelectPokerNode.childrenCount > 1) {
      let oldChild = this.SelectPokerNode.children[0];
      let targetPos = cc.v2(0, 0);
      if (this.PokerClip.childrenCount > 0) {
        let child = this.PokerClip.children[this.PokerClip.childrenCount - 1];
        targetPos = cc.v2(child.x + 2, child.y);
      }
      let pos = CMath.ConvertToNodeSpaceAR(oldChild, this.PokerClip);
      oldChild.setParent(this.PokerClip);
      oldChild.setPosition(pos);
      oldChild.getComponent(Poker).flipCard(0.1);
      oldChild.runAction(cc.moveTo(0.1, targetPos));
    }
  }

  onSelectPokerRemoveChild(child: cc.Node) {
    console.log(" on Select poker remove child !");
    if (this.SelectPokerNode.childrenCount <= 0) {
      this.updateCurSelectPoker();
    }
  }

  updateCurSelectPoker() {
    console.log(" poker clip childcount:", this.PokerClip.childrenCount);
    if (this.PokerClip.childrenCount <= 0) return;
    let child = this.PokerClip.children[this.PokerClip.childrenCount - 1];
    let poker = child.getComponent(Poker);
    let pos = CMath.ConvertToNodeSpaceAR(child, this.SelectPokerNode);
    child.setParent(this.SelectPokerNode);
    child.setPosition(pos);

    poker.flipCard(0.1);
    gEventMgr.emit(GlobalEvent.DEV_POKERS);
    let action = cc.sequence(
      cc.moveTo(0.3, 0, 0),
      cc.callFunc(() => {
        poker.setDefaultPosition();
        child.group = "default";
      }, this)
    );
    action.setTag(ACTION_TAG.SELECT_POKER);
    child.stopAllActions();
    child.runAction(action);
  }

  openResult(delay: number) {
    this.Stop.hide();
    if (this.node.getChildByName("Result")) return;

    if (Game.getGameTime() > 0) {
      if (Game.isBoom()) {
        // out of move
        this.CompleteSprite.spriteFrame = this.CompleteAtlas.getSpriteFrame(
          "bg_font3"
        );
      } else {
        this.CompleteSprite.spriteFrame = this.CompleteAtlas.getSpriteFrame(
          "bg_font1"
        );
      }
    } else {
      if (Game.isBoom()) {
        // out of move
        this.CompleteSprite.spriteFrame = this.CompleteAtlas.getSpriteFrame(
          "bg_font3"
        );
      } else {
        // time up
        this.CompleteSprite.spriteFrame = this.CompleteAtlas.getSpriteFrame(
          "bg_font2"
        );
      }
    }

    this.CompleteSprite.node.scaleX = 0;
    this.CompleteSprite.node.active = true;

    cc.loader.loadRes("prefabs/Result", cc.Prefab, (err, result) => {
      if (err) {
        celerx.submitScore(Game.getScore());
      } else {
        this.CompleteSprite.node.runAction(
          cc.sequence(
            cc.scaleTo(0.2, 1.2, 1),
            cc.scaleTo(0.1, 0.9, 1),
            cc.scaleTo(0.1, 1.1, 1),
            cc.scaleTo(0.1, 1, 1),
            cc.delayTime(0.5 + delay / 1000),
            cc.callFunc(() => {
              this.CompleteSprite.node.active = false;
              let resultLayer = cc.instantiate(result);
              resultLayer.name = "Result";
              this.node.addChild(resultLayer);
            })
          )
        );
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
      // this.Guide.hide();
      // this.nextStep(LOAD_STEP.GUIDE);
    } else {
      this.Guide.hide();
      this.nextStep(LOAD_STEP.GUIDE);
    }

    let takeImage = false;
    const canvas = document.getElementsByTagName("canvas")[0];
    cc.director.on(cc.Director.EVENT_AFTER_DRAW, function () {
      if (takeImage) {
        takeImage = false;
        celerx.didTakeSnapshot(canvas.toDataURL());
      }
    });
    celerx.provideCurrentFrameData(function () {
      takeImage = true;
    });

    
  }

  /**
   * 下一步
   */
  private isCeler: boolean = false;
  private nextStep(loadStep: LOAD_STEP) {
    this.step |= loadStep;
    console.log("loadStep Step:" + LOAD_STEP[loadStep]);
    if (this.step >= LOAD_STEP.DONE && !this.isStart) {
      console.log("  startGame ---------------------- ");
      this.isStart = true;
      this.startGame();
    } else if (this.step >= LOAD_STEP.CELER_READY && !this.isCeler){
      celerx.ready();
      this.isCeler = true;
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

    let count = 1;
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
          targetPos = cc.v2(child.x + 2, child.y);
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
        this.updateCurSelectPoker();
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

    func2();
  }

  recyclePoker() {}

  devPoker() {}

  dispatchPoker() {
    return;
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
