import { HashMap } from "../utils/HashMap";
import { gEventMgr } from "./EventManager";
import { GlobalEvent } from "./EventName";

interface AudioItem {
  loop: boolean;
  volume: number;
  clipName: string;
  supTime: number;
  skip: boolean;
  isBgm: boolean;
}
class AudioController {
  private static ins: AudioController;
  private static PlayedList: AudioItem[] = [];
  private static canPlay: boolean =
    cc.sys.os.toLowerCase() != cc.sys.OS_IOS.toLowerCase();
  private static hasBindTouch: boolean = false;

  private audioID = {};
  private constructor() {}
  public static get inst() {
    return this.ins ? this.ins : (this.ins = new AudioController());
  }

  private clips: HashMap<string, cc.AudioClip> = new HashMap();
  init(callback: Function) {
    console.warn(" start load AudioClip ");
    let self = this;
    cc.loader.loadResDir("preLoadSounds", cc.AudioClip, function(
      err,
      clips: cc.AudioClip[],
      urls
    ) {
      if (err) {
        console.error(err);
      } else {
        for (let clip of clips) {
          self.clips.add(clip.name, clip);
        }
        self.initEvent();
        callback && callback();
      }
    });
  }

  /** 所有播放音效的事件注册 */
  initEvent() {
    gEventMgr.targetOff(this);

    this.audioID["bgm"] = this.play("normal_bgm", true, 1.5, true);
    console.log("this.audioID bgm = ", this.audioID["bgm"] === null);
    gEventMgr.on(
      GlobalEvent.PLAY_KILL_EFFECT,
      () => {
        this.audioID["fruit_break"] = this.play("fruit_break", false, 2.5);
        cc.audioEngine.setFinishCallback(
          this.audioID["fruit_break"],
          function() {
            this.audioID["fruit_break"] = null;
          }.bind(this)
        );
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.PLAY_30_BGM,
      () => {
        if (this.audioID["bgm"] != null) {
          this.stop(this.audioID["bgm"]);
        }
        this.audioID["time_counting"] = this.play("time_counting", true, 3);
        this.audioID["bgm"] = this.play("bgm_30secs", true, 1.5, true);
        if (
          this.audioID["specialA_bgm"] != null ||
          this.audioID["specialB_bgm"] != null
        ) {
          cc.audioEngine.pause(this.audioID["bgm"]);
        }
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.GAME_RESTART,
      () => {
        if (this.audioID["bgm"] != null) {
          this.stop(this.audioID["bgm"]);
        }
        if (this.audioID["time_counting"] != null) {
          this.stop(this.audioID["time_counting"]);
        }
        this.audioID["bgm"] = this.play("normal_bgm", true, 1.5, true);
      },
      this
    );

    // gEventMgr.on(
    //   GlobalEvent.PLAY_LETSGO,
    //   () => {
    //     this.audioID["letsgo"] = this.play("letsgo");
    //     cc.audioEngine.setFinishCallback(
    //       this.audioID["letsgo"],
    //       function() {
    //         this.audioID["letsgo"] = null;
    //       }.bind(this)
    //     );
    //   },
    //   this
    // );

    gEventMgr.on(
      GlobalEvent.PLAY_BIU,
      () => {
        this.audioID["biu"] = this.play("biu", false, 0.5);
        cc.audioEngine.setFinishCallback(
          this.audioID["biu"],
          function() {
            this.audioID["biu"] = null;
          }.bind(this)
        );
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.PLAY_TOUCH,
      () => {
        this.audioID["touch"] = this.play("touch");
        cc.audioEngine.setFinishCallback(
          this.audioID["touch"],
          function() {
            this.audioID["touch"] = null;
          }.bind(this)
        );
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.PLAY_PLACE,
      () => {
        this.audioID["lay"] = this.play("lay");
        cc.audioEngine.setFinishCallback(
          this.audioID["lay"],
          function() {
            this.audioID["lay"] = null;
          }.bind(this)
        );
      },
      this
    );

    // gEventMgr.on(
    //   GlobalEvent.PLAY_TEXT,
    //   (name: string) => {
    //     this.audioID[name] = this.play(name);
    //     cc.audioEngine.setFinishCallback(
    //       this.audioID[name],
    //       function() {
    //         this.audioID[name] = null;
    //       }.bind(this)
    //     );
    //   },
    //   this
    // );

    gEventMgr.on(
      GlobalEvent.PLAY_SPECIAL_A_BGM,
      (play: boolean) => {
        console.log(" SpecialA_bgm:", play);
        if (play) {
          if (this.audioID["bgm"] != null) {
            cc.audioEngine.pause(this.audioID["bgm"]);
          }
          this.audioID["SpecialA_bgm"] = this.play("SpecialA_bgm", true);
        } else {
          if (this.audioID["bgm"] != null) {
            cc.audioEngine.resume(this.audioID["bgm"]);
          }
          if (this.audioID["SpecialA_bgm"] != null) {
            cc.audioEngine.stop(this.audioID["SpecialA_bgm"]);
            this.audioID["SpecialA_bgm"] = null;
          }
        }
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.PLAY_SPECIAL_B_BGM,
      (play: boolean) => {
        console.log(" SpecialB_bgm:", play);
        if (play) {
          if (this.audioID["bgm"] != null) {
            cc.audioEngine.pause(this.audioID["bgm"]);
          }
          this.audioID["SpecialB_bgm"] = this.play("SpecialB_bgm", true);
        } else {
          if (this.audioID["bgm"] != null) {
            cc.audioEngine.resume(this.audioID["bgm"]);
          }
          if (this.audioID["SpecialB_bgm"] != null) {
            cc.audioEngine.stop(this.audioID["SpecialB_bgm"]);
            this.audioID["SpecialB_bgm"] = null;
          }
        }
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.PLAY_OVER,
      () => {
        if (this.audioID["time_counting"] != null) {
          this.stop(this.audioID["time_counting"]);
        }
        this.audioID["over"] = this.play("over");
        cc.audioEngine.setFinishCallback(
          this.audioID["over"],
          function() {
            this.audioID["over"] = null;
          }.bind(this)
        );
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.PLAY_OVER_NO_PLACE,
      () => {
        if (this.audioID["bgm"] != null) {
          this.stop(this.audioID["bgm"]);
        }
        this.audioID["over_no_place"] = this.play("over_no_place");
        cc.audioEngine.setFinishCallback(
          this.audioID["over_no_place"],
          function() {
            this.audioID["over_no_place"] = null;
          }.bind(this)
        );
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.PLAY_LAY_FAIL,
      () => {
        this.audioID["lay_fail"] = this.play("lay_fail");
        cc.audioEngine.setFinishCallback(
          this.audioID["lay_fail"],
          function() {
            this.audioID["lay_fail"] = null;
          }.bind(this)
        );
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.PLAY_OVER_TIME_UP,
      () => {
        if (this.audioID["bgm"] != null) {
          this.stop(this.audioID["bgm"]);
        }
        this.audioID["frezon"] = this.play("frezon");
        cc.audioEngine.setFinishCallback(
          this.audioID["frezon"],
          function() {
            this.audioID["frezon"] = null;
          }.bind(this)
        );
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.PLAY_OVER_TAB,
      () => {
        this.audioID["over_biu"] = this.play("over_biu");
        cc.audioEngine.setFinishCallback(
          this.audioID["over_biu"],
          function() {
            this.audioID["over_biu"] = null;
          }.bind(this)
        );
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.PLAY_SCORE,
      (isPlay: boolean) => {
        if (isPlay) {
          this.audioID["score"] = this.play("score", true, 1);
        } else if (this.audioID["score"] != null) {
          this.stop(this.audioID["score"]);
          this.audioID["score"] = null;
        }
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.PLAY_SPECIAL_A,
      () => {
        console.log(
          " specialA -----------------------------",
          this.audioID["specialA"]
        );

        this.audioID["specialA"] = this.play("specialA", false, 1.5);
        cc.audioEngine.setFinishCallback(
          this.audioID["specialA"],
          function() {
            this.audioID["specialA"] = null;
          }.bind(this)
        );
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.PLAY_SPECIAL_B,
      () => {
        console.log(
          " specialB -----------------------------",
          this.audioID["specialB"]
        );

        this.audioID["specialB"] = this.play("specialB", false, 1.5);
        cc.audioEngine.setFinishCallback(
          this.audioID["specialB"],
          function() {
            this.audioID["specialB"] = null;
          }.bind(this)
        );
      },
      this
    );
  }

  stop(audioID: number, clipName?: string) {
    if (AudioController.canPlay) {
      cc.audioEngine.stop(audioID);
    } else {
      for (let clipItem of AudioController.PlayedList) {
        clipItem.skip = clipItem.clipName == clipName;
      }
    }
  }

  play(
    clipName: string,
    loop: boolean = false,
    volume: number = 1.0,
    isBgm: boolean = false,
    timePass: number = 0
  ): number {
    if (!AudioController.canPlay && !AudioController.hasBindTouch) {
      AudioController.hasBindTouch = true;
      let self = this;
      let playFunc = function() {
        cc.game.canvas.removeEventListener("touchstart", playFunc);
        AudioController.canPlay = true;
        let item: AudioItem;
        while (
          (item = AudioController.PlayedList.pop()) &&
          self.clips.get(item.clipName) &&
          !item.skip
        ) {
          let audioID = cc.audioEngine.play(
            self.clips.get(item.clipName),
            item.loop,
            item.volume
          );
          if (item.isBgm) {
            self.audioID["bgm"] = audioID;
            cc.audioEngine.setCurrentTime(
              audioID,
              ((Date.now() - item.supTime) / 1000) %
                cc.audioEngine.getDuration(audioID)
            );
          } else {
            cc.audioEngine.setCurrentTime(
              audioID,
              (Date.now() - item.supTime) / 1000
            );
          }
        }
      };

      cc.game.canvas.addEventListener("touchstart", playFunc);
    }

    if (!this.clips.get(clipName)) {
      let now = Date.now();
      cc.loader.loadRes("sounds/" + clipName, cc.AudioClip, (err, clip) => {
        if (err) {
          console.error(err);
        } else {
          this.clips.add(clip.name, clip);
          let pass = (Date.now() - now) / 1000;
          this.audioID[clipName] = this.play(
            clipName,
            loop,
            volume,
            isBgm,
            pass
          );
        }
      });
      return -1;
    }

    if (AudioController.canPlay) {
      let audioID = cc.audioEngine.play(this.clips.get(clipName), loop, volume);
      cc.audioEngine.setCurrentTime(
        audioID,
        timePass % cc.audioEngine.getDuration(audioID)
      );
      return audioID;
    } else {
      AudioController.PlayedList.push({
        clipName: clipName,
        loop: loop,
        volume: volume,
        supTime: Date.now() - timePass / 1000,
        skip: false,
        isBgm: isBgm
      });
      return -2;
    }
  }
}
/**
 * 只管理游戏内音频，UI的全部交给FairyUI
 */
export const gAudio = AudioController.inst;
