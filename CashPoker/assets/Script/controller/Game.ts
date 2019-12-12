import { HashMap } from "../utils/HashMap";

class GameMgr {
  private static _inst: GameMgr;
  private GameMgr() {}
  public static get inst() {
    return this._inst ? this._inst : (this._inst = new GameMgr());
  }

  public placePokerRoot: HashMap<number, cc.Node> = new HashMap();
  public removeNode: cc.Node;
}

export const Game = GameMgr.inst;
CC_DEBUG && (window["Game"] = Game);
