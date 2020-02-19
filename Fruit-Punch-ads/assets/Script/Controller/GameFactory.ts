import { HashMap } from "../exts/HashMap";

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
  CUBE = 1 << 2,
  CUBE_ROOT = 1 << 3,
  CUBE_BG = 1 << 4,
  DONE = Step.CUBE_BG | Step.CUBE | Step.CUBE_ROOT
}

class GameFactory {
  private static ins: GameFactory;
  public static get inst() {
    return this.ins ? this.ins : (this.ins = new GameFactory());
  }
  private constructor() {}

  private step: Step = Step.INIT;
  private doneCallback: Function;
  init(callback: Function, cube?: cc.Prefab, cubeRoot?: cc.Prefab) {
    this.doneCallback = callback;
    //this.doneCallback();
    //this.initCubeBg(1, cubeBg);
    this.nextStep(Step.CUBE_BG);
    this.initCube(1, cube);
    this.initCubeRoot(1, cubeRoot);
  }

  private nextStep(step: Step) {
    this.step |= step;
    console.log("Factory Step:" + Step[step]);
    if (this.step >= Step.DONE) {
      this.doneCallback && this.doneCallback();
    }
  }

  private CubeBgPool: HashMap<string, ObjPool> = new HashMap();
  initCubeBg(initCount: number, prefab?: cc.Prefab) {
    let self = this;
    if (prefab) {
      //let cubeBg = cc.instantiate(prefab);
      self.CubeBgPool.add("CubeBg", new ObjPool(prefab, initCount));
      self.nextStep(Step.CUBE_BG);
    } else {
      cc.loader.loadRes("prefabs/CubeBg", cc.Prefab, (err, prefabRes) => {
        if (err) {
          console.error(err);
        } else {
          //let cubeBg = cc.instantiate(prefab);
          self.CubeBgPool.add("CubeBg", new ObjPool(prefabRes, initCount));
          self.nextStep(Step.CUBE_BG);
        }
      });
    }
  }

  getCubeBg(...args): cc.Node {
    return this.CubeBgPool.get("CubeBg").get(args);
  }

  putCubeBg(cubeBg: cc.Node) {
    this.CubeBgPool.get("CubeBg").put(cubeBg);
  }

  private CubePool: HashMap<string, ObjPool> = new HashMap();
  initCube(initCount: number, prefab?: cc.Prefab) {
    let self = this;
    if (prefab) {
      self.CubePool.add("Cube", new ObjPool(prefab, initCount));
      self.nextStep(Step.CUBE);
    } else {
      cc.loader.loadRes("prefabs/Cube", cc.Prefab, (err, prefabRes) => {
        if (err) {
          console.error(err);
        } else {
          //let cube = cc.instantiate(prefab);
          self.CubePool.add("Cube", new ObjPool(prefabRes, initCount));
          self.nextStep(Step.CUBE);
        }
      });
    }
  }

  getCube(...args): cc.Node {
    return this.CubePool.get("Cube").get(args);
  }

  putCube(cube: cc.Node) {
    this.CubePool.get("Cube").put(cube);
  }

  private CubeRootPool: HashMap<string, ObjPool> = new HashMap();
  initCubeRoot(initCount: number, prefab?: cc.Prefab) {
    let self = this;
    if (prefab) {
      self.CubeRootPool.add("CubeRoot", new ObjPool(prefab, initCount));
      self.nextStep(Step.CUBE_ROOT);
    } else {
      cc.loader.loadRes("prefabs/CubeRoot", cc.Prefab, (err, prefabRes) => {
        if (err) {
          console.error(err);
        } else {
          //let cubeRoot = cc.instantiate(prefab);
          self.CubeRootPool.add("CubeRoot", new ObjPool(prefabRes, initCount));
          self.nextStep(Step.CUBE_ROOT);
        }
      });
    }
  }

  getCubeRoot(...args): cc.Node {
    return this.CubeRootPool.get("CubeRoot").get(args);
  }

  putCubeRoot(cubeRoot: cc.Node) {
    this.CubeRootPool.get("CubeRoot").put(cubeRoot);
  }
}

export const gFactory = GameFactory.inst;
