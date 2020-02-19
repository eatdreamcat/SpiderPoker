export interface KeyValue<K, V> {
  key: K;
  value: V;
}

/**
 * HashMap泛型实现
 */
export class HashMap<K, V> {
  //存储列表
  private _list: KeyValue<K, V>[] = new Array<KeyValue<K, V>>();

  constructor() {
    this.clear();
  }

  //通过key获取索引
  private getIndexByKey(key: K): number {
    var count: number = this._list.length;
    for (let index = 0; index < count; index++) {
      const element: KeyValue<K, V> = this._list[index];
      if (element.key == key) {
        return index;
      }
    }
    return -1;
  }

  /** 获取所有key */
  public get keys(): Array<K> {
    let keys = new Array<K>();
    for (let element of this._list) {
      if (element) {
        keys.push(element.key);
      }
    }
    return keys;
  }
  /**
   * 添加键值
   */
  public add(key: K, value: V): void {
    var data: KeyValue<K, V> = { key: key, value: value };
    var index: number = this.getIndexByKey(key);
    if (index != -1) {
      //已存在：刷新值
      this._list[index] = data;
    } else {
      //不存在：添加值
      this._list.push(data);
    }
  }

  public get values() {
    return this._list;
  }

  /**
   * 删除键值
   */
  public remove(key: K): any {
    var index: number = this.getIndexByKey(key);
    if (index != -1) {
      var data: KeyValue<K, V> = this._list[index];
      this._list.splice(index, 1);
      return data;
    }
    return null;
  }

  /**
   * 是否存在键
   */
  public has(key: K): boolean {
    var index: number = this.getIndexByKey(key);
    return index != -1;
  }

  /**
   * 通过key获取键值value
   * @param key
   */
  public get(key: K): V | null {
    var index: number = this.getIndexByKey(key);
    if (index != -1) {
      var data: KeyValue<K, V> = this._list[index];
      return data.value;
    }
    return null;
  }

  /**
   * 获取数据个数
   */
  public get length(): number {
    return this._list.length;
  }

  /**
   * 排序
   * @param
   */
  public sort(compare: { (a: KeyValue<K, V>, b: KeyValue<K, V>): number }) {
    this._list.sort(compare);
  }

  /**
   * 遍历列表，回调(data:KeyValue<K, V>)
   */
  public forEachKeyValue(f: { (data: KeyValue<K, V>): void }) {
    var count: number = this._list.length;
    for (let index = 0; index < count; index++) {
      const element: KeyValue<K, V> = this._list[index];
      f(element);
    }
  }

  /**
   * 遍历列表，回调(K,V)
   */
  public forEach(f: { (key: K, value: V): void }) {
    var count: number = this._list.length;
    for (let index = 0; index < count; index++) {
      const element: KeyValue<K, V> = this._list[index];
      f(element.key, element.value);
    }
  }

  /**
   * 清空全部
   */
  public clear(): void {
    this._list = [];
  }
}
