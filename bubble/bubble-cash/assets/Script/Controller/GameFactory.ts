import { HashMap } from "../Utils/HashMap";

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
  Bubble = 1 << 2,
  Point = 1 << 3,
  Task = 1 << 4,
  Score = 1 << 5,
  Font = 1 << 6,
  DONE = Bubble | Point | Task | Score | Font
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
    bubble?: cc.Prefab,
    point?: cc.Prefab,
    task?: cc.Prefab,
    score?: cc.Prefab,
    font?: cc.Prefab
  ) {
    this.doneCallback = callback;
    this.initBubble(200, bubble);
    this.initPoint(20, point);
    this.initTask(8, task);
    this.initScore(30, score);
    this.initFont(5, font);
  }

  private nextStep(step: Step) {
    this.step |= step;

    if (this.step >= Step.DONE) {
      this.doneCallback && this.doneCallback();
    }
  }

  
  private BubblePool: HashMap<string, ObjPool> = new HashMap();
  initBubble(initCount: number, prefab?: cc.Prefab) {
    let self = this;
    if (prefab) {
      self.BubblePool.add("Bubble", new ObjPool(prefab, initCount));
      self.nextStep(Step.Bubble);
    } else {
      cc.loader.loadRes("prefabs/Bubble", cc.Prefab, (err, prefabRes) => {
        if (err) {
          console.error(err);
        } else {
          self.BubblePool.add("Bubble", new ObjPool(prefabRes, initCount));
          self.nextStep(Step.Bubble);
        }
      });
    }
  }

  getBubble(...args): cc.Node {
    return this.BubblePool.get("Bubble").get(args);
  }

  putBubble(bubble: cc.Node) {
    this.BubblePool.get("Bubble").put(bubble);
  }

  private PointPool: HashMap<string, ObjPool> = new HashMap();
  initPoint(initCount: number, prefab?: cc.Prefab) {
    let self = this;
    if (prefab) {
      self.PointPool.add("Point", new ObjPool(prefab, initCount));
      self.nextStep(Step.Point);
    } else {
      cc.loader.loadRes("prefabs/Point", cc.Prefab, (err, prefabRes) => {
        if (err) {
          console.error(err);
        } else {
          self.PointPool.add("Point", new ObjPool(prefabRes, initCount));
          self.nextStep(Step.Point);
        }
      });
    }
  }

  getPoint(...args): cc.Node {
    return this.PointPool.get("Point").get(args);
  }

  putPoint(Point: cc.Node) {
    this.PointPool.get("Point").put(Point);
  }

  private TaskPool: HashMap<string, ObjPool> = new HashMap();
  initTask(initCount: number, prefab?: cc.Prefab) {
    let self = this;
    if (prefab) {
      self.TaskPool.add("Task", new ObjPool(prefab, initCount));
      self.nextStep(Step.Task);
    } else {
      cc.loader.loadRes("prefabs/Mission", cc.Prefab, (err, prefabRes) => {
        if (err) {
          console.error(err);
        } else {
          self.TaskPool.add("Task", new ObjPool(prefabRes, initCount));
          self.nextStep(Step.Task);
        }
      });
    }
  }

  getTask(...args): cc.Node {
    return this.TaskPool.get("Task").get(args);
  }

  putTask(Task: cc.Node) {
    this.TaskPool.get("Task").put(Task);
  }

  private ScorePool: HashMap<string, ObjPool> = new HashMap();
  initScore(initCount: number, prefab?: cc.Prefab) {
    let self = this;
    if (prefab) {
      self.ScorePool.add("Score", new ObjPool(prefab, initCount));
      self.nextStep(Step.Score);
    } else {
      cc.loader.loadRes("prefabs/ScoreFloat", cc.Prefab, (err, prefabRes) => {
        if (err) {
          console.error(err);
        } else {
          self.ScorePool.add("Score", new ObjPool(prefabRes, initCount));
          self.nextStep(Step.Score);
        }
      });
    }
  }

  getScore(...args): cc.Node {
    return this.ScorePool.get("Score").get(args);
  }

  putScore(Score: cc.Node) {
    this.ScorePool.get("Score").put(Score);
  }

  private FontPool: HashMap<string, ObjPool> = new HashMap();
  initFont(initCount: number, prefab?: cc.Prefab) {
    let self = this;
    if (prefab) {
      self.FontPool.add("Font", new ObjPool(prefab, initCount));
      self.nextStep(Step.Font);
    } else {
      cc.loader.loadRes("prefabs/Font", cc.Prefab, (err, prefabRes) => {
        if (err) {
          console.error(err);
        } else {
          self.FontPool.add("Font", new ObjPool(prefabRes, initCount));
          self.nextStep(Step.Font);
        }
      });
    }
  }

  getFont(...args): cc.Node {
    return this.FontPool.get("Font").get(args);
  }

  putFont(Font: cc.Node) {
    this.FontPool.get("Font").put(Font);
  }
  
}

export const gFactory = GameFactory.inst;
