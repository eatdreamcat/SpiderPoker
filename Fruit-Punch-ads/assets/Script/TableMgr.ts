import { Fruits,Shape,ShapeWeight,} from  './table';

/**
* json数据管理
*/

export class TableMgr {  
    private static ins: TableMgr;
    public static JSON_URL: string = "";
    public static get inst() {
        return this.ins ? this.ins : (this.ins = new TableMgr());
    }

    private constructor() {}

    private load = TableMgr.JSON_URL && TableMgr.JSON_URL != "" ? cc.loader.load.bind(cc.loader) : cc.loader.loadRes.bind(cc.loader);
    private fileFormat = TableMgr.JSON_URL && TableMgr.JSON_URL != "" ? ".json?time=" + Date.now() : "";
    private total: number = 0;
    private complete: number = 0;
    private completeCallback: () => void;
    private progressCallback: (progress: number) => void;
    /** 
    *
    * @param url json 路径
    * @param complete
    * @param progress
    */
    startLoad(url: string, complete: () => void, progress?: (progress: number) => void) {
        this.completeCallback = complete;
        this.progressCallback = progress;

        let self = this;
        console.log("Base URL:", TableMgr.JSON_URL);
        this.load(TableMgr.JSON_URL + url.trim().split('/').join('') + '/file_list' + this.fileFormat, function(err, JsonAsset: cc.JsonAsset) {
            if (err) {
                console.error(err.errorMessage);
            } else {
                let jsonArray = JsonAsset.constructor["name"] == "Array" ? JsonAsset : JsonAsset.json;
                 this.total = jsonArray.length;
                 for (let jsonFile of jsonArray) {
                     self.loadJson(url.trim().split('/').join('')+'/' + jsonFile.replace('.json', ''));
                 }
            }
            }.bind(this)
        );
    }
        
    private loadJson(url) {
        console.log('start load:' + url);
        
        let self = this;
        let tableName = url.split("/")[1];
        tableName = tableName.charAt(0).toUpperCase() + tableName.slice(1, tableName.length);
        this.load(TableMgr.JSON_URL + url + this.fileFormat, function(err, JsonAsset: cc.JsonAsset) {
            if (err) {
                console.error(err.errorMessage);
            } else {
                let jsonArray = JsonAsset.constructor["name"] == "Array" ? JsonAsset : JsonAsset.json;
                for (let json of jsonArray) {
                    self[tableName][json['ID']] = json;
                }
                self.completeLoad();
            }
        }.bind(this));
    }
    private completeLoad() {
        this.complete++;
        if (this.complete >= this.total) {
            if (this.completeCallback) this.completeCallback();
        }
    }
private Fruits: any = {};
private Shape: any = {};
private ShapeWeight: any = {};
 public getFruits (key: string|number) : Fruits{
    if (this.Fruits[key]){
 return this.Fruits[key];
}
 else { console.error('Fruits 不存key：'+key); return null;}
 }
 public getAll_Fruits_Data() : any{
 return this.Fruits;}
 public getShape (key: string|number) : Shape{
    if (this.Shape[key]){
 return this.Shape[key];
}
 else { console.error('Shape 不存key：'+key); return null;}
 }
 public getAll_Shape_Data() : any{
 return this.Shape;}
 public getShapeWeight (key: string|number) : ShapeWeight{
    if (this.ShapeWeight[key]){
 return this.ShapeWeight[key];
}
 else { console.error('ShapeWeight 不存key：'+key); return null;}
 }
 public getAll_ShapeWeight_Data() : any{
 return this.ShapeWeight;}
}