import { gEventMgr } from "./controller/EventManager";
import { GlobalEvent } from "./controller/EventName";
import Poker from "./Poker";

/** 新手指引的步骤 */
export interface GuideStep {
  /**
   * 可以点击的节点
   * 对应的回调
   * */
  touches: {
    node: cc.Node;
    isButton: boolean;
    callback: Function;
    start: Function;
    end: Function;
    touchStarted?: boolean;
    isAction?: boolean;
  }[];
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class Guide extends cc.Component {
  @property(cc.Node)
  GuideBack: cc.Node = null;

  @property(cc.SpriteAtlas)
  GuideAtlas: cc.SpriteAtlas = null;

  @property(cc.SpriteFrame)
  GuideStart: cc.SpriteFrame = null;

  @property(cc.Animation)
  GuideHand: cc.Animation = null;

  @property(cc.SpriteFrame)
  GuideEnd: cc.SpriteFrame = null;

  @property(cc.Sprite)
  Corn: cc.Sprite = null;

  @property(cc.SpriteAtlas)
  ButtonAtlas: cc.SpriteAtlas = null;

  // @property(cc.Button)
  // Next: cc.Button = null;

  @property(cc.Button)
  OK: cc.Button = null;

  // @property(cc.Button)
  // Forward: cc.Button = null;

  // @property(cc.PageView)
  // GuideView: cc.PageView = null;

  // @property(cc.Button)
  // Resume: cc.Button = null;

  // @property(cc.Button)
  // Skip: cc.Button = null;

  @property(cc.Node)
  Block: cc.Node = null;

  // @property(cc.Node)
  // GuideBlock: cc.Node = null;

  @property(cc.Node)
  DownloadNode: cc.Node = null;

  @property(cc.Button)
  DownloadButton: cc.Button = null;

  @property(cc.Button)
  ReplayButton: cc.Button = null;

  private callback: Function = null;

  private guideSteps: GuideStep[] = [];
  private isGuide: boolean = false;
  private index: number = 1;
  private guideDefaultY: number = 0;
  onLoad() {
    this.guideDefaultY = this.Corn.node.y;
    this.GuideHand.node.active = false;
    // this.Next.node.on(cc.Node.EventType.TOUCH_END, this.nextPage, this);

    this.DownloadButton.node.on(
      cc.Node.EventType.TOUCH_END,
      () => {
        FbPlayableAd.onCTAClick();
      },
      this
    );

    this.ReplayButton.node.on(
      cc.Node.EventType.TOUCH_END,
      () => {
        this.clearStep();

        this.node.active = false;
        this.DownloadNode.active = false;
        gEventMgr.emit(GlobalEvent.RESTART_PLAY_AD);
      },
      this
    );

    // this.Forward.node.on(cc.Node.EventType.TOUCH_END, this.forwardPage, this);
    // this.Resume.node.on(
    //   cc.Node.EventType.TOUCH_END,
    //   () => {
    //     this.hide();
    //   },
    //   this
    // );

    // this.Skip.node.on(
    //   cc.Node.EventType.TOUCH_END,
    //   () => {
    //     this.hide();

    //   },
    //   this
    // );

    this.OK.node.on(
      cc.Node.EventType.TOUCH_END,
      () => {
        this.nextGuide();
        this.OK.node.active = false;
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.POP_GUIDE_STEP,
      () => {
        if (this.guideSteps.length <= 0 || !this.node.active) return;

        this.popStep();

        this.nextGuide();
      },
      this
    );

    this.Block.on(cc.Node.EventType.TOUCH_START, this.onBlockTouch, this);
    this.Block.on(
      cc.Node.EventType.TOUCH_CANCEL,
      this.onBlockTouchCancel,
      this
    );
    this.Block.on(cc.Node.EventType.TOUCH_END, this.onBlockTouchEnd, this);
    this.Block.on(cc.Node.EventType.TOUCH_MOVE, this.onBlockTouchMove, this);

    gEventMgr.on(
      GlobalEvent.OPEN_RESULT,
      () => {
        this.clearStep();
        this.GuideBack.active = true;
        this.Corn.node.active = true;
        this.Corn.node.y = this.guideDefaultY;
        this.Corn.spriteFrame = this.GuideEnd;

        this.DownloadNode.active = true;
        this.GuideHand.node.active = false;
        this.DownloadButton.getComponent(cc.Animation).play();
      },
      this
    );

    this.DownloadNode.active = false;
  }

  onBlockTouch(e: cc.Event.EventTouch) {
    if (this.guideSteps.length <= 0) {
      return;
    }

    let curStep = this.guideSteps[0];
    for (let touch of curStep.touches) {
      let exceptChild = null;
      if (
        touch.node.getComponent(Poker) &&
        touch.node.getComponent(Poker).getNext()
      ) {
        exceptChild = touch.node.getComponent(Poker).getNext().node;
      }
      if (
        CMath.GetBoxToWorld(touch.node, exceptChild).contains(e.getLocation())
      ) {
        let event = new cc.Event.EventCustom(e.getType(), false);
        event.setUserData(touch.callback);
        touch.node.dispatchEvent(event);
        touch.touchStarted = true;

        //  if (touch.node.getComponent(Poker)) {
        //   console.log(touch.node.getComponent(Poker).getKey(), touch.node.getComponent(Poker).getValue())
        // }
      }
    }
  }

  onBlockTouchCancel(e: cc.Event.EventTouch) {
    if (this.guideSteps.length <= 0) {
      return;
    }

    let curStep = this.guideSteps[0];
    for (let touch of curStep.touches) {
      let exceptChild = null;
      if (
        touch.node.getComponent(Poker) &&
        touch.node.getComponent(Poker).getNext()
      ) {
        exceptChild = touch.node.getComponent(Poker).getNext().node;
      }
      if (
        CMath.GetBoxToWorld(touch.node, exceptChild).contains(
          e.getLocation()
        ) &&
        touch.touchStarted
      ) {
        let event = new cc.Event.EventCustom(e.getType(), false);
        event.setUserData(touch.callback);
        touch.node.dispatchEvent(event);
        touch.touchStarted = false;
      }
    }
  }

  onBlockTouchEnd(e: cc.Event.EventTouch) {
    if (this.guideSteps.length <= 0) {
      return;
    }

    let curStep = this.guideSteps[0];
    for (let touch of curStep.touches) {
      let exceptChild = null;
      if (
        touch.node.getComponent(Poker) &&
        touch.node.getComponent(Poker).getNext()
      ) {
        exceptChild = touch.node.getComponent(Poker).getNext().node;
      }
      if (
        CMath.GetBoxToWorld(touch.node, exceptChild).contains(
          e.getLocation()
        ) &&
        touch.touchStarted
      ) {
        let event = new cc.Event.EventCustom(e.getType(), false);
        event.setUserData(touch.callback);
        touch.node.dispatchEvent(event);
        touch.touchStarted = false;
      }
    }
  }

  popStep() {
    if (this.guideSteps.length <= 0) return;

    let curStep = this.guideSteps.shift();
    for (let touch of curStep.touches) {
      if (touch.end) {
        touch.end();
      }
    }
  }

  clearStep() {
    if (this.guideSteps.length <= 0) return;

    for (let curStep of this.guideSteps)
      for (let touch of curStep.touches) {
        if (touch.end) {
          touch.end();
        }
      }
  }

  showEnd() {
    console.log(" show end ");
    this.guideSteps.length = 0;
    this.Corn.node.active = true;
    this.Corn.node.y = this.guideDefaultY;
    this.Corn.spriteFrame = this.GuideEnd;
    this.OK.node.active = true;

    this.OK.node.targetOff(this);
    this.OK.node.on(
      cc.Node.EventType.TOUCH_END,
      () => {
        this.popStep();
        this.nextGuide();
      },
      this
    );
  }

  onBlockTouchMove(e: cc.Event.EventTouch) {
    if (this.guideSteps.length <= 0) {
      //this.hide();

      return;
    }

    let curStep = this.guideSteps[0];
    for (let touch of curStep.touches) {
      if (touch.isButton || !touch.touchStarted) continue;

      e.bubbles = false;
      touch.node.dispatchEvent(e);
    }
  }

  /** 注册新手指引步骤 */
  register(steps: GuideStep[]) {
    this.guideSteps = steps;
  }

  startGuide(closeCallback?: Function) {
    console.log(" start guide ");
    this.DownloadButton.node.getChildByName("guide-light1").opacity = 0;
    this.GuideBack.active = false;
    this.OK.node.active = true;
    this.Block.active = true;
    this.Corn.node.active = true;
    this.DownloadNode.active = false;
    this.isGuide = true;
    this.node.active = true;
    // this.Next.node.active = false;
    // this.Forward.node.active = false;
    // this.GuideView.node.active = false;
    // this.Resume.node.active = false;
    // this.GuideBlock.active = false;
    // this.Skip.node.active = false;
    this.callback = closeCallback;
    this.Corn.spriteFrame = this.GuideStart;

    console.log(this.Block.active);

    //this.nextGuide()
  }

  nextGuide() {
    let count = this.guideSteps.length;
    if (count <= 0) {
      //this.hide();
      this.GuideHand.node.active = false;
      return;
    }

    this.Corn.spriteFrame = this.GuideAtlas.getSpriteFrame(
      "guide" + this.index
    );
    this.Corn.node.y = -265;
    this.Corn.node.active = false;
    this.index++;
    let curStep = this.guideSteps[0];
    let actions: cc.FiniteTimeAction[] = [];
    let speed = 550;

    let touchActions = [];
    for (let touch of curStep.touches) {
      if (touch.isAction) touchActions.push(touch.node);
    }

    if (touchActions.length > 0) {
      let pos;
      if (curStep.touches.length > 1) {
        pos = CMath.ConvertToNodeSpaceAR(
          touchActions[1],
          this.GuideHand.node.parent
        );
      } else {
        pos = CMath.ConvertToNodeSpaceAR(
          touchActions[0],
          this.GuideHand.node.parent
        );
      }
      this.GuideHand.node.position = pos;
    }

    for (let touch of curStep.touches) {
      touch.node.group = "guide";
      touch.start();
      if (touch.isAction) {
        let pos = CMath.ConvertToNodeSpaceAR(
          touch.node,
          this.GuideHand.node.parent
        );
        let time = CMath.Distance(pos, this.GuideHand.node.position);
        let action = cc.moveTo(time / speed, pos);

        actions.push(action);
        if (actions.length == 1) {
          actions.push(cc.fadeTo(0.3, 0));
          actions.push(cc.delayTime(0.3));
        }
      }
    }

    if (actions.length == 2) actions.pop();

    this.GuideHand.node.active = actions.length > 0;
    this.GuideHand.node.stopAllActions();
    this.GuideHand.node.opacity = 255;
    if (actions.length > 1) {
      actions.push(cc.fadeTo(0.4, 255));

      this.GuideHand.node.runAction(cc.repeatForever(cc.sequence(actions)));
    }
  }

  hide() {
    console.error(" hide ");
    if (!this.node.active) return;
    this.clearStep();
    this.node.active = false;
    this.callback && this.callback();
    this.callback = null;
  }

  show(closeCallback: Function) {
    this.OK.node.active = false;
    this.Corn.node.active = false;
    this.GuideHand.node.active = false;
    this.isGuide = false;
    // this.Resume.node.active = true;
    // this.Next.node.active = true;
    // this.GuideView.node.active = true;
    // this.Skip.node.active = false;

    // this.Next.node.active = true;
    // this.Forward.node.active = true;
    // this.GuideBlock.active = true;

    // this.node.active = true;
    // this.callback = closeCallback;
    // this.GuideView.scrollToPage(0, 0);
    // this.Forward.node.active = false;
    // this.Next.node
    //   .getChildByName("Background")
    //   .getComponent(cc.Sprite).spriteFrame = this.ButtonAtlas.getSpriteFrame(
    //   "btn_new"
    // );
  }

  // nextPage() {
  //   if (
  //     this.GuideView.getCurrentPageIndex() >=
  //     this.GuideView.content.childrenCount - 1
  //   ) {
  //     this.hide();
  //   } else {
  //     let nextPageIndex =
  //       (this.GuideView.getCurrentPageIndex() + 1) %
  //       this.GuideView.content.childrenCount;
  //     this.GuideView.setCurrentPageIndex(nextPageIndex);
  //     if (nextPageIndex >= this.GuideView.content.childrenCount - 1) {
  //       this.Next.node
  //         .getChildByName("Background")
  //         .getComponent(
  //           cc.Sprite
  //         ).spriteFrame = this.ButtonAtlas.getSpriteFrame("new_close");
  //     }
  //     this.Forward.node.active = nextPageIndex != 0;
  //   }
  // }

  // forwardPage() {
  //   if (this.GuideView.getCurrentPageIndex() <= 0) {
  //   } else {
  //     let nextPageIndex =
  //       (this.GuideView.getCurrentPageIndex() - 1) %
  //       this.GuideView.content.childrenCount;
  //     this.GuideView.setCurrentPageIndex(nextPageIndex);
  //     this.Forward.node.active = nextPageIndex != 0;
  //     this.Next.node
  //       .getChildByName("Background")
  //       .getComponent(cc.Sprite).spriteFrame = this.ButtonAtlas.getSpriteFrame(
  //       "btn_new"
  //     );
  //   }
  // }
}
