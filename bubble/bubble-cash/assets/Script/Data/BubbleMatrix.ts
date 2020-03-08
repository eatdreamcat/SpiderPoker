import { BubbleType, BubbleColors, BubbleSize, BubbleHeightOffset, BubbleYOffset, BubbleXOffset, DoubleBubbleInitRange, BoomBubbleInitRange, MagicBubbleInitRange, DoubleBubbleRange, BoomBubbleRange, MagicBubbleRange } from "../Const";
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

 /** 每次新增数据的行数 */
 const AddNewBubbleRowCount = 6;

 /** 特殊泡泡的类型 */
 export  enum SpecialType {
     /** 正常球 */
     Normal,
     /** 双倍球 */
     Double,
     /** 炸弹球 */
     Boom,
     /** 魔法球 */
     Magic,
     /** 小马球 */
     Horce
 }

 /** 泡泡矩阵 */
 export interface Matrix {
     bubble: Bubble,
     color: BubbleType,
     type: SpecialType
 }

 export class BubbleMatrix {

    
    private matrixData: Matrix[] = [];
    /**  累计增加了几行 */
    private addRowTotalCount: number = 0;

    /** 显示的第一行的行数 */
    private firstRow: number = 0;

    constructor() {
        for (let i = 0;i < MatrixSize * MatrixSize;i ++ ) {
            this.matrixData[i] = {
                color: BubbleType.Blank,
                bubble: null,
                type: SpecialType.Normal
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
                bubble: null,
                type: SpecialType.Normal
            }
        }
    }

    getRestRowCount() {
        return this.addRowTotalCount;
    }

    getFirstRow() {
        return this.firstRow;
    }

    /** 下移行 */
    moveRow(row: number) {

        if (this.addRowTotalCount <= row) {
            
            this.addRow(AddNewBubbleRowCount);

            this.firstRow += AddNewBubbleRowCount - 1;

            Game.startIndex += MatrixSize * (AddNewBubbleRowCount - 1)

            this.addRowTotalCount += AddNewBubbleRowCount;
           
    
            
            let addCount = AddNewBubbleRowCount * MatrixSize;

            console.log(' 新增6行： ', addCount);

           
            /** 下移 */
            for(let i = this.matrixData.length - 1; i >= addCount; i--) {
                if (!this.matrixData[i - addCount]) {
                    this.matrixData[i - addCount] = {color: BubbleType.Blank, bubble: null, type: SpecialType.Normal}
                }

                this.matrixData[i].color = this.matrixData[i - addCount].color;
                this.matrixData[i].type = this.matrixData[i - addCount].type;
                this.matrixData[i].bubble = this.matrixData[i - addCount].bubble;

                this.matrixData[i - addCount] = {color: BubbleType.Blank, bubble: null, type: SpecialType.Normal}

                if (this.matrixData[i].bubble) {
                    this.matrixData[i].bubble.setIndex(i);
                }
            }


            

            

             /** 双倍分数泡泡的个数 */
        let doubleCount = Math.ceil(CMath.getRandom(DoubleBubbleRange.Min, DoubleBubbleRange.Max));
        /** 炸弹泡泡的个数 */
        let boomCount = Math.ceil(CMath.getRandom(BoomBubbleRange.Min, BoomBubbleRange.Max));
        /** 魔法球泡的个数 */
        let magicCount = Math.ceil(CMath.getRandom(MagicBubbleRange.Min, MagicBubbleRange.Max));

        
        console.log(' double:', doubleCount, ', boom:', boomCount, ', magic:', magicCount);
        let allIndex = [];
        for (let i = 0; i <= addCount - 1; i++) {
            if (this.index2j(i) >= 2 && this.index2j(i) <= 11)
                allIndex.push(i);
        }


        /** 随机双倍泡泡 */
        let doubleColors = BubbleColors.concat();
        let doubleData = {};
       
        while(doubleCount > 0 && doubleColors.length > 0 && allIndex.length >= 0) {

            let randomI = Math.floor(CMath.getRandom(0, allIndex.length));
            let Index = allIndex[randomI];
            allIndex.splice(randomI, 1);

            let colorIndex =  Math.floor(CMath.getRandom(0, doubleColors.length));
            let color = doubleColors[colorIndex];
            doubleColors.splice(colorIndex, 1);
            doubleData[Index] = color;
            doubleCount--;
        }
        console.log(' ---------- 双倍球 --------------')
        console.log(doubleData);

        /** 随机炸弹泡泡 */
        let boomColors = BubbleColors.concat();
        let boomData = {};
       
        while(boomCount > 0 && boomColors.length > 0 && allIndex.length >= 0) {

            let randomI = Math.floor(CMath.getRandom(0, allIndex.length));
            let Index = allIndex[randomI];
            allIndex.splice(randomI, 1);

            let colorIndex =  Math.floor(CMath.getRandom(0, boomColors.length));
            let color = boomColors[colorIndex];
            boomColors.splice(colorIndex, 1);
            boomData[Index] = color;

            boomCount--;
        }
        console.log(' ---------- 炸弹球 --------------')
        console.log(boomData);

        /** 随机魔法泡泡 */
        // let magicColors = BubbleColors.concat();
        let magicData = {};
       
        while(magicCount > 0 /*&& magicColors.length > 0*/ && allIndex.length >= 0) {

            let randomI = Math.floor(CMath.getRandom(0, allIndex.length));
            let Index = allIndex[randomI];
            allIndex.splice(randomI, 1);

            // let colorIndex =  Math.floor(CMath.getRandom(0, magicColors.length));
            // let color = magicColors[colorIndex];
            // magicColors.splice(colorIndex, 1);
            magicData[Index] = BubbleType.Blank;

            magicCount--;
        }
        console.log(' ---------- 魔法球 --------------')
        console.log(magicData);


            /** 新增数据 */
            for (let i = 0; i < addCount - 1; i ++) {

            
                this.matrixData[i].color = BubbleColors[Math.floor(CMath.getRandom() * BubbleColors.length)];
                this.matrixData[i].bubble = null;
                this.matrixData[i].type = SpecialType.Normal;

                
               

                if (doubleData[i] != null) {
                    this.matrixData[i].type = SpecialType.Double;
                    this.matrixData[i].color = doubleData[i];
                }

                if (magicData[i] != null) {
                    this.matrixData[i].type = SpecialType.Magic;
                    this.matrixData[i].color = magicData[i];
                }

                if (boomData[i] != null) {
                    this.matrixData[i].type = SpecialType.Boom;
                    this.matrixData[i].color = boomData[i];
                }
            }

           
        } else {
            this.firstRow -= 1;
            Game.startIndex -= MatrixSize;
        }

        this.addRowTotalCount -= row;
        console.log(' 剩余 ', this.addRowTotalCount, ' 行数据', ', 第一行：', this.firstRow, this.index2i(Game.startIndex));


        

       
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

    getPosOfIndex(index: number): cc.Vec2 {
        let i = this.index2i(index);
        let j = this.index2j(index);
        return this.getPosOfij(i, j);
    }

    /** 获取ij对应的坐标 */
    getPosOfij(i: number, j: number): cc.Vec2 {
        
        let pos = cc.v2(0, 0);
        pos.x = (j - MatrixSize / 2) * BubbleSize.width + ((i + this.firstRow + Game.getMoveTimes()) % 2) * BubbleSize.width / 2  + BubbleXOffset;
        pos.y = (MatrixSize / 2 - i + Game.getMoveTimes() + this.firstRow - this.index2i(58)) * (BubbleSize.height + BubbleHeightOffset) + BubbleYOffset;

        return pos;
    }

    /**
     * 获取所在邻域
     * 以中心点所在的六边形
     */
    getNeiborMatrix(index: number, range: number, isBlank: boolean = false): number[] {

        
        let neibers: number[] = [];
        let index2i = this.index2i(index);
        let moveTimes = Game.getMoveTimes() + this.firstRow;

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
 
                        let indexJ = this.index2j(neiberIndex1);
                        if (indexJ >= 2 && indexJ <= 11 && neiberIndex1 >= Game.startIndex) {
                            if (this.data[neiberIndex1] && this.data[neiberIndex1].bubble && !isBlank) {
                                neibers.push(neiberIndex1);
                            } else if (isBlank && (!this.data[neiberIndex1] || !this.data[neiberIndex1].bubble)) {
                                neibers.push(neiberIndex1);
                            }
                        }
                        
                        
                    } 
                    
                }

                if(index!= neiberIndex2 && neibers.indexOf(neiberIndex2) < 0 && neiberIndex2 >= 0 && (neiberIndex2 < this.matrixData.length || isBlank)
                ) {
                    let indexJ = this.index2j(neiberIndex2);
                    if (indexJ >= 2 && indexJ <= 11 && neiberIndex2 >= Game.startIndex) {
                        if (isSame || (newi + moveTimes) % 2 == 0 || j < rangej) {
                            if (this.data[neiberIndex2] && this.data[neiberIndex2].bubble && !isBlank) {
                                neibers.push(neiberIndex2);
                            } else if (isBlank && (!this.data[neiberIndex2] || !this.data[neiberIndex2].bubble)) {
                                neibers.push(neiberIndex2);
                            }
                        } 
                    }
                    
                    
                }

                if(index!= neiberIndex3 && neibers.indexOf(neiberIndex3) < 0 && neiberIndex3 >= 0 && (neiberIndex3 < this.matrixData.length || isBlank)
                ) {

                    let indexJ = this.index2j(neiberIndex3);
                    if (indexJ >= 2 && indexJ <= 11 && neiberIndex3 >= Game.startIndex) {
                        if (isSame || (newi + moveTimes) % 2 || j < rangej) {
                            if (this.data[neiberIndex3] && this.data[neiberIndex3].bubble && !isBlank) {
                                neibers.push(neiberIndex3);
                            } else if (isBlank && (!this.data[neiberIndex3] || !this.data[neiberIndex3].bubble)) {
                                neibers.push(neiberIndex3);
                            }
                        } 
                    }
                    
                    
                }

                if(index!= neiberIndex4 && neibers.indexOf(neiberIndex4) < 0 && neiberIndex4 >= 0 && (neiberIndex4 < this.matrixData.length || isBlank)
                ) {

                    let indexJ = this.index2j(neiberIndex4);
                    if (indexJ >= 2 && indexJ <= 11 && neiberIndex4 >= Game.startIndex) {
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

        this.firstRow = this.index2i(Game.startIndex);

        this.addRowTotalCount = 0;

        /** 双倍分数泡泡的个数 */
        let doubleCount = Math.ceil(CMath.getRandom(DoubleBubbleInitRange.Min, DoubleBubbleInitRange.Max));
        /** 炸弹泡泡的个数 */
        let boomCount = Math.ceil(CMath.getRandom(BoomBubbleInitRange.Min, BoomBubbleInitRange.Max));
        /** 魔法球泡的个数 */
        let magicCount = Math.ceil(CMath.getRandom(MagicBubbleInitRange.Min, MagicBubbleInitRange.Max));

        console.log('start:', startIndex, ', end:', endIndex, ', firstRow:', this.firstRow)
        console.log(' double:', doubleCount, ', boom:', boomCount, ', magic:', magicCount);
        let allIndex = [];
        for (let i = Game.startIndex; i <= endIndex; i++) {
            if (this.index2j(i) >= 2 && this.index2j(i) <= 11)
                allIndex.push(i);
        }


        /** 随机双倍泡泡 */
        let doubleColors = BubbleColors.concat();
        let doubleData = {};
       
        while(doubleCount > 0 && allIndex.length >= 0) {

            let randomI = Math.floor(CMath.getRandom(0, allIndex.length));
            let Index = allIndex[randomI];
            allIndex.splice(randomI, 1);

            let colorIndex =  Math.floor(CMath.getRandom(0, doubleColors.length));
            let color = doubleColors[colorIndex];
            doubleColors.splice(colorIndex, 1);
            doubleData[Index] = color;
            doubleCount--;
            if (doubleColors.length <= 0) doubleColors = BubbleColors.concat();
        }
        console.log(' ---------- 双倍球 --------------')
        console.log(doubleData);

        /** 随机炸弹泡泡 */
        let boomColors = BubbleColors.concat();
        let boomData = {};
       
        while(boomCount > 0 && allIndex.length >= 0) {

            let randomI = Math.floor(CMath.getRandom(0, allIndex.length));
            let Index = allIndex[randomI];
            allIndex.splice(randomI, 1);

            let colorIndex =  Math.floor(CMath.getRandom(0, boomColors.length));
            let color = boomColors[colorIndex];
            boomColors.splice(colorIndex, 1);
            boomData[Index] = color;

            boomCount--;

            if (boomColors.length <= 0) boomColors = BubbleColors.concat();
        }
        console.log(' ---------- 炸弹球 --------------')
        console.log(boomData);

        /** 随机魔法泡泡 */
        // let magicColors = BubbleColors.concat();
        let magicData = {};
       
        while(magicCount > 0 /*&& magicColors.length > 0*/ && allIndex.length >= 0) {

            let randomI = Math.floor(CMath.getRandom(0, allIndex.length));
            let Index = allIndex[randomI];
            allIndex.splice(randomI, 1);

            // let colorIndex =  Math.floor(CMath.getRandom(0, magicColors.length));
            // let color = magicColors[colorIndex];
            // magicColors.splice(colorIndex, 1);
            magicData[Index] = BubbleType.Blank;

            magicCount--;
        }
        console.log(' ---------- 魔法球 --------------')
        console.log(magicData);


        
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

            this.matrixData[i].type = SpecialType.Normal;

            if (doubleData[i] != null) {
                this.matrixData[i].type = SpecialType.Double;
                this.matrixData[i].color = doubleData[i];
            }

            if (magicData[i] != null) {
                this.matrixData[i].type = SpecialType.Magic;
                this.matrixData[i].color = magicData[i];
            }

            if (boomData[i] != null) {
                this.matrixData[i].type = SpecialType.Boom;
                this.matrixData[i].color = boomData[i];
            }
        }
        console.log(this.matrixData.length)
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
