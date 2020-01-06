import { HashMap } from "../utils/HashMap";

class ObjPool {
  private _pool = [];
  private poolHandlerComps = [];
  private template: cc.Prefab;
  constructor(template: cc.Prefab, initSize: number, poolHandlerComps?: any[]) {
    this.poolHandlerComps = poolHandlerComps;
    this.template = template;
    this.initPool(initSize);
  }

  initPool(size: number) {
    for (let i = 0; i < size; ++i) {
      let newNode = cc.instantiate(this.template);
      this.put(newNode);
    }
  }

  size() {
    return this._pool.length;
  }

  clear() {
    var count = this._pool.length;
    for (var i = 0; i < count; ++i) {
      this._pool[i].destroy && this._pool[i].destroy();
    }
    this._pool.length = 0;
  }

  put(obj: any) {
    if (obj && this._pool.indexOf(obj) === -1) {
      // Remove from parent, but don't cleanup
      obj.removeFromParent(false);
      //obj.setParent(null);
      // Invoke pool handler
      if (this.poolHandlerComps) {
        let handlers = this.poolHandlerComps;
        for (let handler of handlers) {
          let comp = obj.getComponent(handler);
          if (comp && comp.unuse) {
            comp.unuse.apply(comp);
          }
        }
      } else {
        let handlers = obj.getComponents(cc.Component);
        for (let handler of handlers) {
          if (handler && handler.unuse) {
            handler.unuse.apply(handler);
          }
        }
      }

      this._pool.push(obj);
    }
  }

  get(..._) {
    var last = this._pool.length - 1;
    if (last < 0) {
      console.warn(" last < 0 ");
      this.initPool(1);
    }
    last = this._pool.length - 1;
    // Pop the last object in pool
    var obj = this._pool[last];
    this._pool.length = last;

    // Invoke pool handler
    if (this.poolHandlerComps) {
      let handlers = this.poolHandlerComps;
      for (let handler of handlers) {
        let comp = obj.getComponent(handler);
        if (comp && comp.reuse) {
          comp.reuse.apply(comp, arguments);
        }
      }
    } else {
      let handlers = obj.getComponents(cc.Component);
      for (let handler of handlers) {
        if (handler && handler.reuse) {
          handler.reuse.apply(handler, arguments);
        }
      }
    }
    return obj;
  }
}

enum Step {
  INIT = 0,
  POKER = 1 << 2,
  AddScore = 1 << 3,
  SubScore = 1 << 4,
  DONE = POKER | AddScore | SubScore
}

class GameFactory {
  private static ins: GameFactory;
  public static get inst() {
    return this.ins ? this.ins : (this.ins = new GameFactory());
  }
  private constructor() {}

  private step: Step = Step.INIT;
  private doneCallback: Function;
  init(
    callback: Function,
    poker?: cc.Prefab,
    addScoreLabel?: cc.Prefab,
    subScoreLabel?: cc.Prefab
  ) {
    this.doneCallback = callback;
    this.initPoker(52, poker);
    this.initAddScore(10, addScoreLabel);
    this.initSubScore(10, subScoreLabel);
  }

  private nextStep(step: Step) {
    this.step |= step;

    if (this.step >= Step.DONE) {
      this.doneCallback && this.doneCallback();
    }
  }

  private PokerPool: HashMap<string, ObjPool> = new HashMap();
  initPoker(initCount: number, prefab?: cc.Prefab) {
    let self = this;
    if (prefab) {
      self.PokerPool.add("Poker", new ObjPool(prefab, initCount));
      self.nextStep(Step.POKER);
    } else {
      cc.loader.loadRes("prefabs/poker", cc.Prefab, (err, prefabRes) => {
        if (err) {
          console.error(err);
        } else {
          //let cube = cc.instantiate(prefab);
          self.PokerPool.add("Poker", new ObjPool(prefabRes, initCount));
          self.nextStep(Step.POKER);
        }
      });
    }
  }

  getPoker(...args): cc.Node {
    return this.PokerPool.get("Poker").get(args);
  }

  putPoker(poker: cc.Node) {
    this.PokerPool.get("Poker").put(poker);
  }

  private addScorePool: HashMap<string, ObjPool> = new HashMap();
  initAddScore(initCount: number, prefab?: cc.Prefab) {
    let self = this;
    if (prefab) {
      self.addScorePool.add("AddScore", new ObjPool(prefab, initCount));
      self.nextStep(Step.AddScore);
    } else {
      cc.loader.loadRes(
        "prefabs/AddScoreLabel",
        cc.Prefab,
        (err, prefabRes) => {
          if (err) {
            console.error(err);
          } else {
            //let cube = cc.instantiate(prefab);
            self.addScorePool.add(
              "AddScore",
              new ObjPool(prefabRes, initCount)
            );
            self.nextStep(Step.AddScore);
          }
        }
      );
    }
  }

  getAddScore(...args): cc.Node {
    return this.addScorePool.get("AddScore").get(args);
  }

  putAddScore(poker: cc.Node) {
    this.addScorePool.get("AddScore").put(poker);
  }

  private subScorePool: HashMap<string, ObjPool> = new HashMap();
  initSubScore(initCount: number, prefab?: cc.Prefab) {
    let self = this;
    if (prefab) {
      self.subScorePool.add("SubScore", new ObjPool(prefab, initCount));
      self.nextStep(Step.SubScore);
    } else {
      cc.loader.loadRes(
        "prefabs/SubScoreLabel",
        cc.Prefab,
        (err, prefabRes) => {
          if (err) {
            console.error(err);
          } else {
            //let cube = cc.instantiate(prefab);
            self.subScorePool.add(
              "SubScore",
              new ObjPool(prefabRes, initCount)
            );
            self.nextStep(Step.SubScore);
          }
        }
      );
    }
  }

  getSubScore(...args): cc.Node {
    return this.subScorePool.get("SubScore").get(args);
  }

  putSubScore(poker: cc.Node) {
    this.subScorePool.get("SubScore").put(poker);
  }
}

export const gFactory = GameFactory.inst;
