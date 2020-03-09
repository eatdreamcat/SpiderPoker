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

/** 炸弹球的light名字 */
export const BoomBubbleLightColor = {
    0:   "blank",
    1:   "bomb_bluelight",
    2:   "bomb_greenlight",
    3:   "bomb_orangelight",
    4:   "bomb_purplelight",
    5:   "bomb_redlight",
    6:   "bomb_yellowlight"
}

/** 炸弹球的名字 */
export const BoomBubbleColor = {
    0:   "blank",
    1:   "bomb_blue",
    2:   "bomb_green",
    3:   "bomb_orange",
    4:   "bomb_purple",
    5:   "bomb_red",
    6:   "bomb_yellow"
}

/** 小马球 */
export const HorseBubble = 'horse';
export const HorseBubbleLight = 'horselight';
/** 魔法球 */
export const MagicBubble = 'rainbow';
export const MagicBubbleLight = 'rainbowlight'

/** 泡泡颜色类型 */
export enum BubbleType {
    Blank,
    Blue,
    Green,
    Orange,
    Purple,
    Red,
    Yellow,
    Horce,
    Treasure_200 = 200,
    Treasure_400 = 400,
    Treasure_600 = 600,
    Treasure_800 = 800,
    Treasure_1000 = 1000,
    Streak
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
export const BubbleSize = cc.size(94, 94);

/** 泡泡队列个数范围 */
export const BubbleQueRange = {
    Min: 4, // 4
    Max: 9   // 9
}

/** 消除目标次数最少限制 */
export const ClearTargetRange = {
    Min: 2, // 2
    Max: 6  // 6
};

/** 游戏时间s */
export const GameTime = 180;

/** 目标生成概率的改变时间点 */
export const TargetRandomLimit = 120;

/** 初始任务的个数 */
export const DefaultTaskCount = 9;

/** 两倍泡泡初始生成的个数范围 */
export const DoubleBubbleInitRange = {
    Min: 3, // 3
    Max: 5  // 5
} 

/** 新生成的双倍泡泡的概率 */
export const DoubleBubbleRange = {
    Min: 1, // 1
    Max: 2  // 2
}

/** 新生成的炸弹泡泡的概率 */
export const BoomBubbleRange = {
    Min: 1, // 1
    Max: 2  // 2
}

/** 新生成的炸弹泡泡的概率 */
export const MagicBubbleRange = {
    Min: 0, // 0
    Max: 1  // 1
}

/** 炸弹泡泡初始生成的个数范围 */
export const BoomBubbleInitRange = {
    Min: 3, // 3
    Max: 5  // 5
}

/** 魔法泡泡初始生成的个数范围 */
export const MagicBubbleInitRange = {
    Min: 0, // 0
    Max: 3 // 3
}

/** 消除条件满足的最低个数 */
export const ClearCountLimit = 3;

/** 发射器随机生成双倍泡泡的轮数 */
export const ShooterDoubleRange = {
    Min: 6, // 6
    Max:  10//10
}

/** 发射器随机生成双倍泡泡的个数 */
export const ShooterDoubleBubbleRange = {
    Min: 0, // 0
    Max: 1  // 1
}

/** 发射器随机生成炸弹泡泡的轮数 */
export const ShooterBoomRange = {
    Min: 6, // 6
    Max: 10 //10
}

/** 发射器随机生成炸弹泡泡的个数 */
export const ShooterBoomBubbleRange = {
    Min: 0, //0
    Max: 1 //1
}

/** 发射器随机生成魔法泡泡的轮数 */
export const ShooterMagicRange = {
    Min: 4, // 4
    Max: 6 // 6
}

/** 发射器随机生成魔法泡泡的个数 */
export const ShooterMagicBubbleRange = {
    Min: 0, // 0
    Max: 1 // 1
}

/** task连续完成的奖励 */
export const TaskStreakAward = 3; 

/** 季节 */
export enum Season {
    Spring,
    Summer,
    Autumn,
    Winter
}

/** 季节随机池 */
export const SeasonPool = [Season.Autumn, Season.Spring, Season.Summer, Season.Winter]

/** 宝藏 */
export enum TreasureType {
    Level_200  = 200,
    Level_400  = 400,
    Level_600  = 600,
    Level_800  = 800,
    Level_1000 = 1000
}

export const TreasurePool = [TreasureType.Level_1000, TreasureType.Level_800, TreasureType.Level_600, TreasureType.Level_400, TreasureType.Level_200]


/** 宝藏获得图标 */
export const Treasure_Top = {
    
    0: {
        200: "bg_sfinish200",
        400: "bg_sfinish400",
        600: "bg_sfinish600",
        800: "bg_sfinish800",
        1000: "bg_sfinish1000"
    },
    1: {
        200: "bg_smfinish200",
        400: "bg_smfinish400",
        600: "bg_smfinish600",
        800: "bg_smfinish800",
        1000: "bg_smfinish1000"
    },
    2: {
        200: "bg_afinish200",
        400: "bg_afinish400",
        600: "bg_afinish600",
        800: "bg_afinish800",
        1000: "bg_afinish1000"
    },
    3: {
        200: "bg_wfinish200",
        400: "bg_wfinish400",
        600: "bg_wfinish600",
        800: "bg_wfinish800",
        1000: "bg_wfinish1000"
    },
}

export enum OverType {
    OUT_OF_MOVE,
    TIME_UP
}