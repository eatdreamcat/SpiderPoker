import { GlobalEvent } from "./EventName";

class EventManager {
  private static ins: EventManager;
  public static get inst() {
    return this.ins ? this.ins : (this.ins = new EventManager());
  }

  private eventTarget: cc.EventTarget;
  private constructor() {
    this.eventTarget = new cc.EventTarget();
  }

  emit(
    type: GlobalEvent,
    arg1?: any,
    arg2?: any,
    arg3?: any,
    arg4?: any,
    arg5?: any
  ) {
    this.eventTarget.emit(type.toString(), arg1, arg2, arg3, arg4, arg5);
  }

  on<T extends Function>(
    type: GlobalEvent,
    callback: T,
    target?: any,
    useCapture?: boolean
  ): T {
    return this.eventTarget.on(type.toString(), callback, target, useCapture);
  }

  once(
    type: GlobalEvent,
    callback: (
      arg1?: any,
      arg2?: any,
      arg3?: any,
      arg4?: any,
      arg5?: any
    ) => void,
    target?: any
  ) {
    this.eventTarget.once(type.toString(), callback, target);
  }

  dispatchEvent(event: cc.Event) {
    this.eventTarget.dispatchEvent(event);
  }

  off(type: GlobalEvent, callback?: Function, target?: any) {
    this.eventTarget.off(type.toString(), callback, target);
  }

  hasEventListener(type: GlobalEvent): boolean {
    return this.eventTarget.hasEventListener(type.toString());
  }

  targetOff(target: any): void {
    this.eventTarget.targetOff(target);
  }
}
export const gEventMgr = EventManager.inst;
