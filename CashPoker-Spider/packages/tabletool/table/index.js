"use strict";
/**
 * 吃吃的转表工具
 * 根据sheet名字表示对应的渠道，会建不同的文件夹
 * 生成对应的json数据到文件夹下，
 * 同时会默认在Script/Define的文件夹下生成表数据结构对应的ts代码定义
 * 哈哈哈哈，真好用哟
 * 虽然代码瞎**写的
 *
 * i 开头    代表 number类型
 * k 开头    代表 string类型
 * e 开头    代表 enum类型（需要批注[枚举1:0]定义枚举的值）
 * a[ike]开头 代表array<number|string|enum>类型  以回车代表一个元素的分隔
 */
var fs = require("fs");
var xlsx = require("xlsx");
var pinyin = require("node-pinyin");
var tabMgr = require("../tableMgr");
module.exports = {
  /**是否是无前缀类型 */
  isSimpleMode: true,
  /** 是否生成ts */
  isTypeScript: true,
  /** 完成的个数 */
  complete: 1,
  /** 总个数 */
  totalCount: 1,
  /** 文件名列表 */
  file_list: [],
  /** 所有批注值 */
  enumValue: {},
  /** 所有表的数据结构 */
  tableStruct: {},

  /** json路径 */
  jsonDir: "db://assets/resources/json/",
  /** 数据表的路径 */
  tablePath: Editor.Project.path + "\\table\\",
  /** 开始转表 */
  start(isSimpleMode, isTypeScript) {
    this.isSimpleMode = isSimpleMode;
    this.isTypeScript = isTypeScript;
    this.complete = 1;
    this.totalCount = 1;
    this.file_list = [];
    this.enumValue = {};
    try {
      let config =
        JSON.parse(
          fs.readFileSync(
            Editor.Project.path + "\\packages\\tabletool\\config.json"
          )
        ) || {};
      if (config["table"] && config["table"]["jsonPath"])
        this.jsonDir = config["table"]["jsonPath"];
      if (config["table"] && config["table"]["tablePath"])
        this.tablePath = config["table"]["tablePath"];
    } catch (error) {}

    // 先清除旧的json
    if (fs.existsSync(Editor.url(this.jsonDir))) {
      this.deleteFileRecourly(Editor.url(this.jsonDir));
      Editor.assetdb.refresh(
        this.jsonDir,
        function(err, results) {
          if (err) {
            this.sendMsg("error", "刷新资源失败");
            return;
          }
          this.toJson();
        }.bind(this)
      );
    } else {
      fs.mkdir(
        Editor.url(this.jsonDir),
        function(err) {
          if (err) {
            this.sendMsg("error", "json路径创建失败");
            return;
          }
          Editor.assetdb.refresh(
            this.jsonDir,
            function(err, results) {
              if (err) {
                this.sendMsg("error", "刷新资源失败");
                return;
              }
              this.toJson();
            }.bind(this)
          );
        }.bind(this)
      );
    }
  },

  deleteFileRecourly(rootPath) {
    try {
      let files = fs.readdirSync(rootPath);
      if (files.length == 0) {
        if (Editor.url(this.jsonDir) != rootPath) fs.rmdirSync(rootPath);
        return;
      }
      for (let file of files) {
        if (!file) continue;
        let stat = fs.statSync(rootPath + "\\" + file);
        if (stat.isDirectory()) {
          this.deleteFileRecourly(rootPath + "\\" + file);
        } else {
          fs.unlinkSync(rootPath + "\\" + file);
        }
      }
      if (Editor.url(this.jsonDir) != rootPath) fs.rmdirSync(rootPath);
    } catch (error) {
      this.sendMsg("error", "删除旧json数据失败");
    }
  },

  toJson() {
    try {
      let fileType = "";
      // 扫描文件夹下的所有excel文件
      let files = fs.readdirSync(this.tablePath);
      for (let i = 0; i < files.length; ++i) {
        let file = files[i];
        if (!file) continue;
        if (/~/.test(file)) {
          files.splice(i, 1);
          --i;
          continue;
        }
        let fileArr = file.split(".");

        if (
          fileArr[fileArr.length - 1] != "xls" &&
          fileArr[fileArr.length - 1] != "xlsx"
        ) {
          files.splice(i, 1);
          --i;
          continue;
        }
        fileType = fileArr[fileArr.length - 1];
      }

      for (let i = 0; i < files.length; ++i) {
        let file = files[i];
        if (!file) continue;
        let book = {};
        try {
          book = xlsx.readFile(this.tablePath + "/" + file);
        } catch (error) {
          this.sendMsg("error", "excel读取失败:" + file);
          return;
        }
        let fileName = file
          .replace(fileType, "json")
          .trim()
          .split(" ")
          .join("_");
        if (this.file_list.indexOf(fileName) < 0) {
          this.file_list.push(fileName);
        }

        for (let sheet of book.SheetNames) {
          if (/Sheet/.test(sheet) && !this.isSimpleMode) continue;
          if (!book.Sheets[sheet] || !book.Sheets[sheet]["!ref"]) continue;
          ++this.totalCount;
        }

        for (let sheet of book.SheetNames) {
          if (/Sheet/.test(sheet) && !this.isSimpleMode) continue;
          if (!book.Sheets[sheet] || !book.Sheets[sheet]["!ref"]) continue;
          fileName = fileName
            .trim()
            .split(" ")
            .join("_");
          Editor.info(fileName);
          this.readData(fileName, sheet, book.Sheets[sheet]);
        }
      }

      // 创建file_list.json
      if (Editor.assetdb.exists(this.jsonDir + "file_list.json")) {
        Editor.assetdb.saveExists(
          this.jsonDir + "file_list.json",
          JSON.stringify(this.file_list),
          function(err, meta) {
            if (err) this.sendMsg("error", "保存file_list.json失败");
          }.bind(this)
        );
      } else {
        Editor.assetdb.create(
          this.jsonDir + "file_list.json",
          JSON.stringify(this.file_list),
          function(err, results) {
            if (err) this.sendMsg("error", "创建file_list.json失败");
          }.bind(this)
        );
      }

      if (files.length == 0) {
        this.sendMsg("error", "找不到excel文件");
      }
    } catch (error) {
      this.sendMsg("error", "扫描excel文件失败");
      Editor.error(error);
    }
  },

  /** 开始解析xls生成json */
  readData(tableName, sheetName, sheetData) {
    let jsonData = xlsx.utils.sheet_to_json(sheetData);
    /**
     * 根据批注内容，给枚举赋值
     */
    let json = this.toTypeScript(jsonData, sheetData, tableName, sheetName);
    if (this.isSimpleMode) sheetName = "";
    if (fs.existsSync(Editor.url(this.jsonDir + sheetName))) {
      this.generaJson(json, this.jsonDir + sheetName + "/" + tableName);
    } else {
      fs.mkdir(
        Editor.url(this.jsonDir + sheetName),
        function(err) {
          if (err) {
            this.sendMsg("error", sheetName + "文件夹创建失败");
            return;
          }
          Editor.assetdb.refresh(
            this.jsonDir + sheetName + "/",
            function(err, results) {
              if (err) {
                this.sendMsg("error", sheetName + "文件夹刷新失败");
                return;
              }
              this.generaJson(json, this.jsonDir + sheetName + "/" + tableName);
            }.bind(this)
          );
        }.bind(this)
      );
    }
  },

  /** 生成ts代码并且返回json */
  toTypeScript(arrJson, sheetData, tableName, sheetName) {
    if (!this.enumValue[tableName]) {
      this.enumValue[tableName] = {};
    }

    if (!this.tableStruct[tableName]) {
      this.tableStruct[tableName] = {};
    }

    let tableInterface = this.isSimpleMode ? arrJson[1] : arrJson[0];
    if (arrJson[0]) {
      for (let key in arrJson[0]) {
        let testKey = this.isSimpleMode ? arrJson[0][key] : key;
        let tabStructKey = this.isSimpleMode ? tableInterface[key] : key;

        if (!this.tableStruct[tableName][tabStructKey])
          this.tableStruct[tableName][tabStructKey] = {};
        if (this.isSimpleMode)
          this.tableStruct[tableName][tabStructKey]["tip"] =
            "/** " + key + " */";

        if (
          (new RegExp("(k[a-zA-Z0-9]{0,})").test(testKey) &&
            RegExp.$1 == testKey) ||
          (this.isSimpleMode && testKey.toLowerCase() == "string")
        ) {
          // string 类型
          this.tableStruct[tableName][tabStructKey]["type"] = "string";
        } else if (
          (new RegExp("(i[a-zA-Z0-9]{0,})").test(testKey) &&
            RegExp.$1 == testKey) ||
          (this.isSimpleMode && testKey.toLowerCase() == "number")
        ) {
          // number 类型
          this.tableStruct[tableName][tabStructKey]["type"] = "number";
        } else if (
          (new RegExp("(e[a-zA-Z0-9]{0,})").test(testKey) &&
            RegExp.$1 == testKey) ||
          ((this.isSimpleMode && testKey.toLowerCase() == "type") ||
            testKey.toLowerCase() == "enum")
        ) {
          // enum 类型
          this.tableStruct[tableName][tabStructKey]["type"] = "enum";
        } else if (
          (new RegExp("(ak[a-zA-Z0-9]{0,})").test(testKey) &&
            RegExp.$1 == testKey) ||
          (this.isSimpleMode &&
            (testKey.toLowerCase() == "string<>" ||
              testKey.toLowerCase() == "string[]"))
        ) {
          // string[] 类型
          this.tableStruct[tableName][tabStructKey]["type"] = "string[]";
        } else if (
          (new RegExp("(ai[a-zA-Z0-9]{0,})").test(testKey) &&
            RegExp.$1 == testKey) ||
          (this.isSimpleMode &&
            (testKey.toLowerCase() == "number<>" ||
              testKey.toLowerCase() == "number[]"))
        ) {
          // number[] 类型
          this.tableStruct[tableName][tabStructKey]["type"] = "number[]";
        } else if (
          (new RegExp("(ae[a-zA-Z0-9]{0,})").test(testKey) &&
            RegExp.$1 == testKey) ||
          (this.isSimpleMode &&
            (testKey.toLowerCase() == "type<>" ||
              testKey.toLowerCase() == "enum<>" ||
              testKey.toLowerCase() == "type[]" ||
              testKey.toLowerCase() == "enum[]"))
        ) {
          // enum[] 类型
          this.tableStruct[tableName][tabStructKey]["type"] = "enum[]";
        } else {
          this.sendMsg(
            "error",
            "表" +
              tableName.replace(".json", "") +
              "字段名格式定义错误:" +
              testKey
          );
          return;
        }
      }
    }

    /** 获取行列范围 */
    let range;
    try {
      range = xlsx.utils.decode_range(sheetData["!ref"]);
    } catch (error) {}
    for (let iCol = range.s.c; iCol <= range.e.c; ++iCol) {
      for (let iRow = range.s.r; iRow <= range.e.r; ++iRow) {
        let nextCell = sheetData[xlsx.utils.encode_cell({ r: iRow, c: iCol })];
        let next2Cell = this.isSimpleMode
          ? sheetData[xlsx.utils.encode_cell({ r: iRow + 2, c: iCol })]
          : nextCell;
        // 有批注内容
        if (nextCell && nextCell["c"] && next2Cell && next2Cell["v"]) {
          let hasVal = false;
          for (let val of nextCell["c"]) {
            if (val["t"]) {
              let arrTip = val["t"].split("\n");
              for (let tip of arrTip) {
                if (!tip) continue;
                // 批注定义的值
                tip = tip
                  .trim()
                  .split(" ")
                  .join("");
                switch (this.tableStruct[tableName][next2Cell["v"]]["type"]) {
                  case "enum[]":
                  case "enum":
                    // 赋值
                    if (!this.enumValue[tableName][next2Cell["v"]]) {
                      this.enumValue[tableName][next2Cell["v"]] = {};
                    }
                    let regExpStr1 = "",
                      regExpStr2 = "";
                    if (this.isSimpleMode) {
                      /**
                       * 批注格式 ：
                       * 1.类型1
                       * 2.Boss
                       * 2.类型2
                       */
                      regExpStr1 = "([0-9]{1,}.[\u4e00-\u9fa5a-zA-Z0-9]{0,})";
                      regExpStr2 = "([0-9]{1,}.[\u4e00-\u9fa5a-zA-Z0-9]{0,})";
                    } else {
                      /**
                       * 批注格式：
                       * [类型1：1]
                       * [类型2：2]
                       */
                      regExpStr1 = "([[\u4e00-\u9fa5a-zA-Z0-9]{1,}:[0-9]{1,}])";
                      regExpStr2 = "([\u4e00-\u9fa5a-zA-Z0-9]{1,}:[0-9]{1,})";
                    }
                    if (new RegExp(regExpStr1).test(tip)) {
                      if (new RegExp(regExpStr2).test(RegExp.$1)) {
                        let strVal = this.isSimpleMode
                          ? RegExp.$1.split(".")
                          : RegExp.$1.split(":");

                        let Py = this.isSimpleMode
                          ? this.toPinYin(strVal[1])
                          : this.toPinYin(strVal[0]);

                        let enumVal = this.isSimpleMode
                          ? parseInt(strVal[0])
                          : parseInt(strVal[1]);
                        if (!this.enumValue[tableName][next2Cell["v"]][Py])
                          this.enumValue[tableName][next2Cell["v"]][Py] = {};

                        if (
                          this.enumValue[tableName][next2Cell["v"]][Py][
                            "value"
                          ] != null &&
                          this.enumValue[tableName][next2Cell["v"]][Py][
                            "value"
                          ] != enumVal
                        ) {
                          this.sendMsg(
                            "error",
                            "不同sheet定义的值不一致:" +
                              tableName.replace(".json", "") +
                              "[" +
                              nextCell["v"] +
                              ":" +
                              strVal[0] +
                              "]"
                          );
                          return;
                        }
                        hasVal = true;
                        this.enumValue[tableName][next2Cell["v"]][Py][
                          "value"
                        ] = enumVal;
                        this.enumValue[tableName][next2Cell["v"]][Py][
                          "name"
                        ] = this.isSimpleMode ? strVal[1] : strVal[0];
                      } else {
                        this.sendMsg(
                          "error",
                          "批注格式错误:" +
                            tableName.replace(".json", "") +
                            ":" +
                            sheetName +
                            " 的 " +
                            next2Cell["v"]
                        );
                        return;
                      }
                    } else if (new RegExp("(//[\\S]{0,})").test(tip)) {
                      if (!this.enumValue[tableName][next2Cell["v"]])
                        this.enumValue[tableName][next2Cell["v"]] = {};
                      // 批注注释
                      this.enumValue[tableName][next2Cell["v"]]["tip"] =
                        "/** " +
                        RegExp.$1.replace(
                          "//",
                          tableName.replace(".json", "") + "的"
                        ) +
                        " */";
                    }
                  default:
                    hasVal = true;

                    if (this.isSimpleMode) {
                      if (!this.enumValue[tableName][next2Cell["v"]])
                        this.enumValue[tableName][next2Cell["v"]] = {};
                      this.enumValue[tableName][next2Cell["v"]]["tip"] =
                        "/** " +
                        tableName.replace(".json", "") +
                        "的" +
                        nextCell["v"] +
                        "*/";
                    } else {
                      if (new RegExp("(//[\\S]{0,})").test(tip)) {
                        // 批注注释
                        this.tableStruct[tableName][next2Cell["v"]]["tip"] =
                          "/** " +
                          RegExp.$1.replace(
                            "//",
                            tableName.replace(".json", "") + "的"
                          ) +
                          " */";
                      }
                    }
                    break;
                }
              }
            }
          }

          if (!hasVal) {
            this.sendMsg(
              "error",
              "批注格式错误:" +
                tableName +
                ":" +
                sheetName +
                " 的 " +
                nextCell["v"]
            );
            return;
          }
        }
      }
    }

    for (let val of arrJson) {
      if (this.isSimpleMode && arrJson.indexOf(val) < 2) continue;
      for (let key in val) {
        let tableKey = this.isSimpleMode ? arrJson[1][key] : key;

        switch (this.tableStruct[tableName][tableKey]["type"]) {
          case "number[]":
            let numArr =
              this.isSimpleMode && val[key]
                ? val[key].toString().split("_")
                : val[key].toString().split("\n");
            for (let i = 0; i < numArr.length; i++) {
              numArr[i] =
                numArr[i].split(".").length > 1
                  ? parseFloat(numArr[i])
                  : parseInt(numArr[i]);
            }

            val[key] = numArr;
            break;
          case "string[]":
            val[key] =
              this.isSimpleMode && val[key]
                ? val[key].toString().split("_")
                : val[key].toString().split("\n");
            break;

          case "enum":
            if (this.enumValue[tableName][key]) {
              let py = this.toPinYin(val[key]);
              val[key] = this.isSimpleMode
                ? val[key]
                : this.enumValue[tableName][key][py]["value"];
            }
            break;
          case "enum[]":
            !val[key] && Editor.log(key);
            let arrStr = this.isSimpleMode
              ? val[key].toString().split("_")
              : val[key].toString().split("\n");
            val[key] = [];
            for (let str of arrStr) {
              let py = this.toPinYin(str);
              val[key].push(
                this.isSimpleMode
                  ? str
                  : this.enumValue[tableName][key][py]["value"]
              );
            }
            break;
          case "string":
            val[key] = val[key].toString();
            break;
          default:
            val[key] = val[key];
            break;
        }
      }
    }

    let result = [];
    if (this.isSimpleMode) {
      for (let val of arrJson) {
        if (arrJson.indexOf(val) < 2) continue;
        let newVal = {};
        for (let key in val) {
          newVal[arrJson[1][key]] = val[key];
        }
        result.push(newVal);
      }
    } else {
      result = arrJson.concat();
    }
    return result;
  },

  /** 导出json */
  generaJson(arrJson, path) {
    // 创建json
    path = path.trim();
    if (Editor.assetdb.exists(path)) {
      Editor.assetdb.saveExists(
        path,
        JSON.stringify(arrJson),
        function(err, meta) {
          if (err) this.sendMsg("error", "json保存失败");
          this.addComplete();
        }.bind(this)
      );
    } else {
      Editor.assetdb.create(
        path,
        JSON.stringify(arrJson),
        function(err, results) {
          if (err) this.sendMsg("error", "json创建失败");
          this.addComplete();
        }.bind(this)
      );
    }
  },

  /** 进度 */
  addComplete() {
    ++this.complete;

    if (this.complete >= this.totalCount) {
      let tableManagerTs = tabMgr; //"/**\n* json数据管理\n*/\n";
      let importTs = "";
      let stringTs = "/**\n* 导出表自动生成的表数据声明\n*/\n";
      //stringTs += "namespace table {\n";
      //生成枚举定义
      for (let tabName in this.enumValue) {
        let tab = (
          tabName.charAt(0).toUpperCase() + tabName.slice(1, tabName.length)
        ).replace(".json", "");
        let enumData = this.enumValue[tabName];
        for (let key in enumData) {
          let val = enumData[key];
          //注释
          if (val["tip"]) {
            stringTs += "    " + val["tip"] + "\n";
          }
          stringTs += "    export enum " + tab + "_" + key + "{\n";
          for (let subKey in val) {
            if (subKey == "tip") continue;
            stringTs += "        /** " + val[subKey]["name"] + " */\n";
            stringTs +=
              "        " + subKey + " = " + val[subKey]["value"] + ",\n";
          }
          stringTs += "    };\n\n";
        }
      }

      stringTs += "\n\n\n";
      let getFunc = "";
      let privatePro = "";
      //生成表结构
      for (let tabName in this.tableStruct) {
        let tab = (
          tabName.charAt(0).toUpperCase() + tabName.slice(1, tabName.length)
        ).replace(".json", "");
        let tabStruct = this.tableStruct[tabName];
        stringTs += "    /** 表 " + tab + "数据结构 */\n";
        stringTs += "    export interface " + tab + " {\n";
        for (let key in tabStruct) {
          // 增加注释
          if (tabStruct[key]["tip"]) {
            stringTs += "        " + tabStruct[key]["tip"] + "\n";
          }
          stringTs +=
            "        " +
            key +
            ":" +
            tabStruct[key]["type"].replace("enum", "number") +
            ";\n";
        }
        stringTs += "    };\n\n";
        privatePro += "private " + tab + ": any = {};\n";
        getFunc +=
          " public get" +
          tab +
          " (key: string|number) : " +
          tab +
          "{\n" +
          "    if (this." +
          tab +
          "[key]){\n" +
          " return this." +
          tab +
          "[key];\n" +
          "}\n" +
          " else { console.error('" +
          tab +
          " 不存key：" +
          "'+key); return null;}\n" +
          " }\n";

        getFunc +=
          " public getAll_" +
          tab +
          "_Data() : any" +
          "{\n" +
          " return this." +
          tab +
          ";}\n";

        importTs += tab + ",";
      }
      tableManagerTs =
        "import { " + importTs + "} from  './table';\n" + tableManagerTs;
      tableManagerTs += privatePro;
      tableManagerTs += getFunc;
      //stringTs += "}";
      tableManagerTs += "}";

      // 生成结构体定义代码
      if (Editor.assetdb.exists("db://assets/Script/table.ts")) {
        Editor.assetdb.saveExists(
          "db://assets/Script/table.ts",
          stringTs,
          function(err, meta) {
            if (err) this.sendMsg("error", "table生成失败:" + err);
            this.sendMsg("error", "");
          }.bind(this)
        );
      } else {
        Editor.assetdb.create(
          "db://assets/Script/table.ts",
          stringTs,
          function(err, results) {
            if (err) this.sendMsg("error", "table生成失败:" + err);
            this.sendMsg("error", "");
          }.bind(this)
        );
      }

      // 生成manager代码
      if (this.isTypeScript) {
        // 生成结构体定义代码
        if (Editor.assetdb.exists("db://assets/Script/TableMgr.ts")) {
          Editor.assetdb.saveExists(
            "db://assets/Script/TableMgr.ts",
            tableManagerTs,
            function(err, meta) {
              if (err) this.sendMsg("error", "tableManager生成失败:" + err);
              this.sendMsg("error", "");
            }.bind(this)
          );
        } else {
          Editor.assetdb.create(
            "db://assets/Script/TableMgr.ts",
            tableManagerTs,
            function(err, results) {
              if (err) this.sendMsg("error", "tableManager生成失败:" + err);
              this.sendMsg("error", "");
            }.bind(this)
          );
        }
      }
    }

    this.sendMsg("progress", (this.complete / this.totalCount) * 100);
  },

  /** 把中文转换成首字母大写的拼音 */
  toPinYin(str) {
    let out = "";
    let arrPY = pinyin(str, {
      style: "normal"
    });
    for (let val of arrPY) {
      out += val[0].slice(0, 1).toUpperCase() + val[0].slice(1, val[0].length);
    }
    if (out == "") out = str;
    return out;
  },

  sendMsg(type, msg) {
    if (type == "error" && msg) Editor.error(msg);
    Editor.Ipc.sendToPanel("tabletool-table", type, msg);
  }
};
