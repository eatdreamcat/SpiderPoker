import { HashMap } from "../utils/HashMap";
import { gEventMgr } from "./EventManager";
import { GlobalEvent } from "./EventName";
import { Game } from "./Game";

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
    // cc.loader.loadResDir("preLoadSounds", cc.AudioClip, function(
    //   err,
    //   clips: cc.AudioClip[],
    //   urls
    // ) {

    //   if (err) {
    //     console.error(err);
    //   } else {
    //     for (let clip of clips) {
    //       self.clips.add(clip.name, clip);
    //     }
    //     self.initEvent();
    //     callback && callback();
    //   }
    // });
    self.initEvent();
    callback && callback();
  }

  /** 所有播放音效的事件注册 */
  initEvent() {
    gEventMgr.targetOff(this);

    this.audioID["bgm"] = this.play("bgm", true, 2, true);

    gEventMgr.on(
      GlobalEvent.SMALL_BGM,
      () => {
        if (this.audioID["bgm"] != null) {
          cc.audioEngine.setVolume(this.audioID["bgm"], 0.9);
        }
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.NORMAL_BGM,
      () => {
        if (this.audioID["bgm"] != null) {
          cc.audioEngine.setVolume(this.audioID["bgm"], 2);
        }
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.PLAY_RECYCLE_POKERS,
      () => {
        this.play("recyclePoker");
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.DEV_POKERS,
      () => {
        this.play("devPoker");
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.PLAY_POKER_PLACE,
      () => {
        this.play("pokerPlace");
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.PLAY_RECYCLE,
      () => {
        this.play("recycle" + Game.getCombo(), false, 4);
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.PLAY_POKER_FLY,
      () => {
        this.play("pokerFly");
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.PLAY_OVER_1,
      () => {
        this.play("result_flip");
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.PLAY_OVER_2,
      () => {
        this.play("result_dev", false, 2);
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.PLAY_PAUSE,
      () => {
        this.play("pause");
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.PLAY_SHAKE,
      () => {
        this.play("shake", false, 0.7);
      },
      this
    );

    gEventMgr.on(
      GlobalEvent.PLAY_START,
      () => {
        this.play("start_count");
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
    //return
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
          console.error(' ------------ while sounds --------------')
          console.error(self.clips.get(item.clipName))
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
      cc.loader.loadRes("sounds/" + clipName, cc.AudioClip, (err, clip: cc.AudioClip) => {
        if (err) {
          console.error(err);
        } else {
          console.error(' ------------ load sounds --------------')
          if (typeof clip["_audio"] == 'string') {
            
            clip["_audio"] = cc.loader["_cache"][clip["_audio"]]["buffer"]
          }
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
