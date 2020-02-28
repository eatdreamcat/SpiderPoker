import { BubbleType, BubbleColors, BubbleSize, BubbleHeightOffset, BubbleYOffset, BubbleXOffset } from "../Const";
import Bubble from "../Bubble";
import { Game } from "../Controller/Game";

/**
 * 泡泡矩阵数据
 * 实际用到的10x10
 * 原始大小  14x14
 */
/** 原始数据大小 */
 export const MatrixSize = 14;
 /** 实际数据大小 */
 export const UseSize = 10;
 /** 第一圈六边形 同色的概率 */
 const StartRandomPercent = 0.8;
 /** 每一圈六边形同色概率步进 */
 const RandomPercentOffset = 0.7;

 /** 泡泡矩阵 */
 export interface Matrix {
     bubble: Bubble,
     color: BubbleType
 }

 export class BubbleMatrix {

    
    private matrixData: Matrix[] = [];
    constructor() {
        for (let i = 0;i < MatrixSize * MatrixSize;i ++ ) {
            this.matrixData[i] = {
                color: BubbleType.Blank,
                bubble: null
            }
        }
    }

    get data() {
        return this.matrixData;
    }

    /** 增加一行 */
    addRow(rowCount: number) {
        let oldLength = this.matrixData.length;
        this.matrixData.length += rowCount * MatrixSize;
        for (let i = oldLength; i < this.matrixData.length; i++) {
            this.matrixData[i] = {
                color: BubbleType.Blank,
                bubble: null
            }
        }
    }

    /** 下移行 */
    moveRow(row: number) {
        this.addRow(row);

        let addCount = row * MatrixSize;
        for(let i = this.matrixData.length - 1; i >= addCount; i--) {
            if (!this.matrixData[i - addCount]) {
                this.matrixData[i - addCount] = {color: BubbleType.Blank, bubble: null}
            }

            this.matrixData[i].color = this.matrixData[i - addCount].color;
            this.matrixData[i].bubble = this.matrixData[i - addCount].bubble;
            if (this.matrixData[i].bubble) {
                this.matrixData[i].bubble.setIndex(i);
            }
        }

        for (let i = 0; i < addCount - 1; i ++) {
            this.matrixData[i].color = BubbleColors[Math.floor(CMath.getRandom() * BubbleColors.length)];
            this.matrixData[i].bubble = null;
        }

       
    }

    ij2index(i: number, j: number) {
        return i*MatrixSize + j;
    }

    index2i(index: number) {
        return Math.floor(index / MatrixSize);
    }

    index2j(index: number) {
        return index % MatrixSize;
    }

    getUseIndexStart() {
        return (MatrixSize - UseSize) / 2 * (MatrixSize + 1) - 1;
    }

    getUseIndexEnd() {
        return  MatrixSize * MatrixSize - this.getUseIndexStart() - 1;
    }

    /** 获取ij对应的坐标 */
    getPosOfij(i: number, j: number): cc.Vec2 {
        
        let pos = cc.v2(0, 0);
        pos.x = (j - MatrixSize / 2) * BubbleSize.width + ((i + Game.getMoveTimes()) % 2) * BubbleSize.width / 2  + BubbleXOffset;
        pos.y = (MatrixSize / 2 - i + Game.getMoveTimes()) * (BubbleSize.height + BubbleHeightOffset) + BubbleYOffset;

        return pos;
    }

    /**
     * 获取所在邻域
     * 以中心点所在的六边形
     */
    getNeiborMatrix(index: number, range: number, isBlank: boolean = false): number[] {

        
        let neibers: number[] = [];
        let index2i = this.index2i(index);
        let moveTimes = Game.getMoveTimes();

        for(let i = 0; i <= range; i++) {
            let newi = index2i + i;
            let isSame = index2i % 2 == newi % 2;
            let rangej = isSame && newi != index2i ? range - Math.floor(i / 2) : range - Math.floor(i / 2);
            rangej = Math.min(rangej, range);
            for (let j = 0; j <= rangej; j++) {

                let neiberIndex1 = index + i * MatrixSize + j;
                let neiberIndex2 = index - i * MatrixSize + j;

                let neiberIndex3 = index + i * MatrixSize - j;
                let neiberIndex4 = index - i * MatrixSize - j;

                if(index!= neiberIndex1 && neibers.indexOf(neiberIndex1) < 0 && neiberIndex1 >= 0 && (neiberIndex1 < this.matrixData.length || isBlank) 
                ) {
                    if (isSame || (newi + moveTimes) % 2 == 0 || j < rangej) {

                        if (this.data[neiberIndex1] && this.data[neiberIndex1].bubble && !isBlank) {
                            neibers.push(neiberIndex1);
                        } else if (isBlank && (!this.data[neiberIndex1] || !this.data[neiberIndex1].bubble)) {
                            neibers.push(neiberIndex1);
                        }
                        
                    } 
                    
                }

                if(index!= neiberIndex2 && neibers.indexOf(neiberIndex2) < 0 && neiberIndex2 >= 0 && (neiberIndex2 < this.matrixData.length || isBlank)
                ) {
                    if (isSame || (newi + moveTimes) % 2 == 0 || j < rangej) {
                        if (this.data[neiberIndex2] && this.data[neiberIndex2].bubble && !isBlank) {
                            neibers.push(neiberIndex2);
                        } else if (isBlank && (!this.data[neiberIndex2] || !this.data[neiberIndex2].bubble)) {
                            neibers.push(neiberIndex2);
                        }
                    } 
                    
                }

                if(index!= neiberIndex3 && neibers.indexOf(neiberIndex3) < 0 && neiberIndex3 >= 0 && (neiberIndex3 < this.matrixData.length || isBlank)
                ) {
                    if (isSame || (newi + moveTimes) % 2 || j < rangej) {
                        if (this.data[neiberIndex3] && this.data[neiberIndex3].bubble && !isBlank) {
                            neibers.push(neiberIndex3);
                        } else if (isBlank && (!this.data[neiberIndex3] || !this.data[neiberIndex3].bubble)) {
                            neibers.push(neiberIndex3);
                        }
                    } 
                    
                }

                if(index!= neiberIndex4 && neibers.indexOf(neiberIndex4) < 0 && neiberIndex4 >= 0 && (neiberIndex4 < this.matrixData.length || isBlank)
                ) {
                    if (isSame || (newi + moveTimes) % 2 || j < rangej) {
                        if (this.data[neiberIndex4] && this.data[neiberIndex4].bubble && !isBlank) {
                            neibers.push(neiberIndex4);
                        } else if (isBlank && (!this.data[neiberIndex4] || !this.data[neiberIndex4].bubble)) {
                            neibers.push(neiberIndex4);
                        }
                    } 
                }
            }
        }
        
        neibers.sort((a,b)=>{return a-b})
        return neibers;
    }

    /**
     * 初始化泡泡矩阵
     * 算法规则：
     */
    initBubbleData() {

        let startIndex = this.getUseIndexStart();
        let endIndex = this.getUseIndexEnd();
        for (let i = startIndex; i <= endIndex; i ++) {

            let neibers = this.getNeiborMatrix(i, 1);
            let neiberColors = [];
            for (let index of neibers) {
                if (this.matrixData[index].color != BubbleType.Blank) {
                    neiberColors.push(this.matrixData[index])
                }
            }

            let otherColors = this.getOtherColors(neiberColors);
            if (CMath.getRandom() <= StartRandomPercent && otherColors.length > 0) {
                this.matrixData[i].color = otherColors[Math.floor(CMath.getRandom() * otherColors.length)];
            } else {
                this.matrixData[i].color = BubbleColors[Math.floor(CMath.getRandom() * BubbleColors.length)];
            }
            

            for (let j = 0; j < neibers.length; j++) {
                let index = neibers[j];

                /** 
                 * 如果是空白的，则按照概率与中心同色或异色
                 */
                if (this.matrixData[index].color == BubbleType.Blank) {
                    if (CMath.getRandom() <= StartRandomPercent) {
                        this.matrixData[index] = this.matrixData[i];
                    } else {
                        let otherColors = this.getOtherColors([this.matrixData[i].color]);
                        this.matrixData[index].color = otherColors[Math.floor(CMath.getRandom() * otherColors.length)];
                    }
                }

                /** 第一层邻域的每个点，分别再遍历其邻域 */
                let neiberNeibers = this.getNeiborMatrix(index, 1);
                for (let k = 0; k < neiberNeibers.length; k++) {
                    let neiberIndex = neiberNeibers[k];
                    if (this.matrixData[neiberIndex].color != BubbleType.Blank) continue;

                    if (CMath.getRandom() <= (StartRandomPercent - RandomPercentOffset) && this.matrixData[index] == this.matrixData[i]) {
                        this.matrixData[neiberIndex] = this.matrixData[index];
                    } else {
                        let otherColors = this.getOtherColors([this.matrixData[i].color, this.matrixData[index].color]);
                        this.matrixData[neiberIndex].color = otherColors[Math.floor(CMath.getRandom() * otherColors.length)];
                    }
                }
            }
        }

        for (let i = 0; i < this.matrixData.length; i ++) {
            if (this.matrixData[i].color == BubbleType.Blank) {
                this.matrixData[i].color = BubbleColors[Math.floor(CMath.getRandom()*BubbleColors.length)];
            }
        }
    }

    /** 获取其他颜色 */
    getOtherColors(exceptColors: BubbleType[]): BubbleType[] {
        let otherColors = BubbleColors.concat();
        for (let except of exceptColors) {
            let index = otherColors.indexOf(except);
            if (index < 0) continue;
            otherColors.splice(index, 1);
        }
        return otherColors;
    }
 }
