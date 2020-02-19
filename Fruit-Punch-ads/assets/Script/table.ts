/**
* 导出表自动生成的表数据声明
*/
    /** Fruits的类型*/
    export enum Fruits_Type{
        /** 水果 */
        ShuiGuo = 1,
        /** 道具 */
        DaoJu = 2,
    };

    /** Shape的方块类型*/
    export enum Shape_Type{
        /** 普通方块 */
        PuTongFangKuai = 1,
        /** 特殊道具 */
        TeShuDaoJu = 2,
    };




    /** 表 Fruits数据结构 */
    export interface Fruits {
        /** 编号 */
        ID:number;
        /** 类型 */
        Type:number;
        /** 名字 */
        Name:string;
        /** 图标 */
        Icon:string;
        /** 分数 */
        Score:number;
        /** 基础分数 */
        BaseScore:number;
        /** 失败图标 */
        FailedIcon:string;
        /** 冻结图标 */
        FrozenIcon:string;
        /** 消除动画 */
        KillAni:string;
        /** 播放动画延时ms */
        Delay:number;
        /** 播放速度 */
        Speed:number;
        /** 缩放 */
        Scale:number;
    };

    /** 表 Shape数据结构 */
    export interface Shape {
        /** 编号 */
        ID:number;
        /** 方块类型 */
        Type:number;
        /** 组合坐标 */
        Shape:number[];
        /** 水果选择权重 */
        Fruit:string[];
        /** 消除列的个数（需要消除当前列多少个） */
        ColKillNumber:number;
        /** 消除行的个数（需要消除当前行多少个） */
        RowKillNumber:number;
        /** 消除的格子（根据当前格子的位置差（x，y）） */
        GridKill:string[];
    };

    /** 表 ShapeWeight数据结构 */
    export interface ShapeWeight {
        /** 编号 */
        ID:number;
        /** 随机形状ID列表 */
        ShapeList:number[];
        /** 权重 */
        Weight:number;
    };

