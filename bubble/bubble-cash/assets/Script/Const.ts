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
export const BubbleColors = [BubbleType.Yellow, BubbleType.Red, BubbleType.Purple, BubbleType.Orange, BubbleType.Green, BubbleType.Blue];

/** 泡泡高度offset */
export const BubbleHeightOffset = -15;

export const BubbleYOffset = 485;
export const BubbleXOffset = 20;
