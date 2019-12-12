import { gFactory } from "./controller/GameFactory";
import { Game } from "./controller/Game";
import Poker from "./Poker";

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

  private step: LOAD_STEP = LOAD_STEP.READY;
  private canDispatchPoker: boolean = false;
  private readonly dispatchCardCount = 20;
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

    CC_DEBUG && this.celerStart();

    // init prefabs

    gFactory.init(
      function() {
        this.nextStep(LOAD_STEP.PREFABS);
      }.bind(this),
      this.Poker
    );

    for (let child of this.PlaceRoot.children) {
      Game.placePokerRoot.add(parseInt(child.name), child);
    }

    this.nextStep(LOAD_STEP.GUIDE);

    this.PokerClip.on(cc.Node.EventType.TOUCH_START, this.dispatchPoker, this);
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
    for (let j = 0; j < 6; j++) {
      let pokerNum = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
      while (pokerNum.length > 0) {
        let i = pokerNum.splice(
          Math.floor(CMath.getRandom() * pokerNum.length),
          1
        );
        let pokerNode = gFactory.getPoker(i);
        pokerNode.name = this.PokerDevl.childrenCount.toString();
        pokerNode.x = 0;
        pokerNode.y = -this.PokerDevl.childrenCount * 0.3;
        this.PokerDevl.addChild(pokerNode);
      }
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
          targetPos = cc.v2(child.x - 20, child.y);
        }

        let selfPos = this.PokerClip.convertToNodeSpaceAR(
          pokerNode.parent.parent.convertToWorldSpaceAR(pokerNode.position)
        );
        pokerNode.setParent(this.PokerClip);
        pokerNode.setPosition(selfPos);
        pokerNode.group = "top";
        pokerNode.runAction(
          cc.sequence(
            cc.moveTo(0.1, targetPos.x, targetPos.y),
            cc.callFunc(() => {
              pokerNode.group = "default";
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
    /** 上面发牌 */
    let func1 = () => {
      if (count >= this.dispatchCardCount) {
        func2();
        return;
      }
      let pos = count++ % 8;

      let pokerNode = this.PokerDevl.getChildByName(
        (totalCount - count).toString()
      );

      let targetNode = Game.placePokerRoot.get(pos);
      if (targetNode) {
        let selfPos = targetNode.convertToNodeSpaceAR(
          pokerNode.parent.convertToWorldSpaceAR(pokerNode.position)
        );

        if (!targetNode.getComponent(Poker)) {
          Game.placePokerRoot.add(pos, pokerNode);
        }
        pokerNode.setParent(targetNode);
        let poker = pokerNode.getComponent(Poker);
        pokerNode.setPosition(selfPos);
        let offset = -15;
        if (count > this.dispatchCardCount - 8) {
          poker.flipCard(0.1);
          poker.setNormal();
        }

        pokerNode.group = "top";
        pokerNode.runAction(
          cc.sequence(
            cc.moveTo(0.1, 0, offset),
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

  dispatchPoker() {
    if (!this.canDispatchPoker) {
      return;
    }

    Game.placePokerRoot.forEach((index: number, targetNode: cc.Node) => {
      if (this.PokerClip.childrenCount <= 0) return;

      let pokerNode = this.PokerClip.children[this.PokerClip.childrenCount - 1];
      let selfPos = targetNode.convertToNodeSpaceAR(
        pokerNode.parent.convertToWorldSpaceAR(pokerNode.position)
      );

      let poker = pokerNode.getComponent(Poker);
      pokerNode.setParent(targetNode);
      pokerNode.setPosition(selfPos);
      if (!targetNode.getComponent(Poker)) {
        Game.placePokerRoot.add(index, pokerNode);
      }
      let offset = -30;
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

    this.canDispatchPoker = this.PokerClip.childrenCount > 0;
  }

  start() {}
}
