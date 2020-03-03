/** 泡泡颜色sprite名字 */
export const BubbleColor = {
    0:   "blank",
    1:   "bg_popblue",
    2:   "bg_popgreen",
    3:   "bg_poporange",
    4:   "bg_poppurple",
    5:   "bg_popred",
    6:   "bg_popyellow"
} 

/** 泡泡颜色sprite light名字 */
export const BubbleLightColor = {
    0:   "blank",
    1:   "bg_popbluelight",
    2:   "bg_popgreenlight",
    3:   "bg_poporangelight",
    4:   "bg_poppurplelight",
    5:   "bg_popredlight",
    6:   "bg_popyellowlight"
} 

/** 泡泡颜色类型 */
export enum BubbleType {
    Blank,
    Blue,
    Green,
    Orange,
    Purple,
    Red,
    Yellow
} 

/** 泡泡颜色随机池 */
export const BubbleColors = [
    BubbleType.Yellow, 
    BubbleType.Red, 
    BubbleType.Purple, 
    BubbleType.Orange, 
    BubbleType.Green, 
    BubbleType.Blue
];

/** 泡泡高度offset */
export const BubbleHeightOffset = -15;

export const BubbleYOffset = 1265;
export const BubbleXOffset = 20;

/**
 * 泡泡尺寸
 */
export const BubbleSize = cc.size(96, 96);

/** 泡泡队列个数范围 */
export const BubbleQueRange = {
    Min: 4,
    Max: 9
}

/** 消除目标次数最少限制 */
export const ClearTargetRange = {
    Min: 2,
    Max: 6
};

/** 游戏时间s */
export const GameTime = 180;

/** 目标生成概率的改变时间点 */
export const TargetRandomLimit = 120;

/** 初始任务的个数 */
export const DefaultTaskCount = 9;

/** 目标生成的概率规则 */
export const TargetRandom = {

}

/** 消除条件满足的最低个数 */
export const ClearCountLimit = 3;


