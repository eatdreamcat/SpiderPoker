import { BubbleType } from "../Const";

/**
 * 泡泡矩阵数据
 * 实际用到的10x10
 * 原始大小  14x14
 */
/** 原始数据大小 */
 const MatrixSize = 14;
 /** 实际数据大小 */
 const UseSize = 10;
 /** 第一圈六边形 同色的概率 */
 const StartRandomPercent = 0.6;
 /** 每一圈六边形同色概率步进 */
 const RandomPercentOffset = 0.15;

 export class BubbleMatrix {

    
    private matrixData: number[] = [];
    constructor() {
        for (let i = 0;i < MatrixSize * MatrixSize;i ++ ) {
            this.matrixData[i] = BubbleType.Blank;
        }
    }

    ij2index(i: number, j: number) {
        return j*MatrixSize + i;
    }

    index2i(index: number) {
        return index % MatrixSize;
    }

    index2j(index: number) {
        return Math.floor(index / MatrixSize);
    }

    getUseIndexStart() {
        return (MatrixSize - UseSize) * (MatrixSize + 1);
    }

    getUseIndexEnd() {
        return (MatrixSize - UseSize) * (MatrixSize + 1) + UseSize * UseSize;
    }

    /**
     * 获取所在邻域
     * 以中心点所在的六边形
     */
    getNeiborMatrix(index: number, range: number): number[] {
        let neibers: number[] = [];
        let index2i = this.index2i(index);

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

                if(neibers.indexOf(neiberIndex1) < 0) {
                    if (isSame || newi % 2 == 0 || j < rangej) {
                        neibers.push(neiberIndex1);
                    } 
                    
                }

                if(neibers.indexOf(neiberIndex2) < 0) {
                    if (isSame || newi % 2 == 0 || j < rangej) {
                        neibers.push(neiberIndex2);
                    } 
                    
                }

                if(neibers.indexOf(neiberIndex3) < 0 ) {
                    if (isSame || newi % 2 || j < rangej) {
                        neibers.push(neiberIndex3);
                    } 
                    
                }

                if(neibers.indexOf(neiberIndex4) < 0) {
                    if (isSame || newi % 2 || j < rangej) {
                        neibers.push(neiberIndex4);
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

    }
 }
