var fs = require("fs");
Editor.Panel.extend({
  style: `
      :host { margin: 5px; }
       h2 { color: #f90; }
    `,

  template: `
      <div>JSON导出路径：<ui-input id="jsonPath" placeholder="" readonly = "true"></ui-input><ui-button id="scanJsonPath"  >浏览</ui-button></div>
      <br>
      <div>excel路径：<ui-input id="tablePath" placeholder="" readonly = "true"></ui-input><ui-button id="scanTablePath"  >浏览</ui-button></div>
      <br>
      <ui-progress id="progress" class="small" value="0"></ui-progress>
      <br>
      <ui-checkbox id="check" checked="true" >无前缀模式(数据类型通过第二行定义)</ui-checkbox>
      <br>
      <br>
      <br>

      <ui-checkbox id="check2" checked="true" >生成TableManager.ts</ui-checkbox>
      <br>
      <br>
      <br>
      <ui-button id="btn" class="green" >开始转表</ui-button>
      <br>
      <hr />
      <div>状态: <span id="label">--</span></div>
    `,

  $: {
    btn: "#btn",
    check: "#check",
    check2: "#check2",
    progress: "#progress",
    label: "#label",
    jsonPath: "#jsonPath",
    scanJsonPath: "#scanJsonPath",
    tablePath: "#tablePath",
    scanTablePath: "#scanTablePath"
  },

  messages: {
    progress(event, progress) {
      this.$progress.value = progress;
      event.reply && event.reply(null, "OK");
    },

    error(event, errMsg) {
      event.reply && event.reply(null, "OK");
      if (!errMsg) {
        errMsg = "转表结束";
      }
      this.$label.innerText += "\n" + errMsg;
    }
  },

  config: {},

  ready() {
    this.$jsonPath.value = Editor.url("db://assets/resources/json/");
    this.$tablePath.value = Editor.Project.path + "\\table\\";
    try {
      this.config =
        JSON.parse(
          fs.readFileSync(
            Editor.Project.path + "\\packages\\tabletool\\config.json"
          )
        ) || {};
    } catch (error) {
      this.$label.innerText = "读取配置文件失败,使用默认配置";
      this.config = {};
    }
    if (this.config["table"] && this.config["table"]["jsonPath"])
      this.$jsonPath.value = Editor.url(this.config["table"]["jsonPath"]);
    if (this.config["table"] && this.config["table"]["tablePath"])
      this.$tablePath.value = this.config["table"]["tablePath"];

    this.$scanJsonPath.addEventListener(
      "confirm",
      function() {
        let path = Editor.Dialog.openFile({
          defaultPath: Editor.Project.path,
          properties: ["openDirectory"]
        });
        if (path != -1 && path[0]) {
          if (!this.config["table"]) this.config["table"] = {};
          if (
            !new RegExp("(" + Editor.Project.name + "\\\\assets)").test(path)
          ) {
            Editor.Dialog.messageBox({
              type: "error",
              title: "路径选择错误QAQ",
              message: "JSON路径必须在项目的assets下！"
            });
            return;
          }
          if (new RegExp("(assets\\\\{0,}[a-zA-z0-9]{0,})").test(path)) {
            path = RegExp.$1;
            while (/\\/.test(path)) {
              path = path.replace(/\\/, "/");
            }

            path = "db://" + path + "/";
          } else {
            Editor.Dialog.messageBox({
              type: "error",
              title: "路径解析错误",
              message: "可能是我代码出bug了啧啧啧！"
            });
            return;
          }
          this.config["table"]["jsonPath"] = path;
          fs.writeFile(
            Editor.Project.path + "\\packages\\tabletool\\config.json",
            JSON.stringify(this.config),
            function(err) {
              if (err) this.$label.innerText = "目录选择失败";
              else this.$jsonPath.value = Editor.url(path);
            }.bind(this)
          );
        }
      }.bind(this)
    );

    this.$scanTablePath.addEventListener(
      "confirm",
      function() {
        let path = Editor.Dialog.openFile({
          defaultPath: Editor.Project.path,
          properties: ["openDirectory"]
        });
        if (path != -1 && path[0]) {
          if (!this.config["table"]) this.config["table"] = {};
          this.config["table"]["tablePath"] = path[0];
          fs.writeFile(
            Editor.Project.path + "\\packages\\tabletool\\config.json",
            JSON.stringify(this.config),
            function(err) {
              if (err) this.$label.innerText = "目录选择失败";
              else this.$tablePath.value = path;
            }.bind(this)
          );
        }
      }.bind(this)
    );

    this.$btn.addEventListener("confirm", () => {
      this.$progress.value = 0;
      this.$label.innerText = "\n开始转表";
      Editor.Ipc.sendToPackage("tabletool", "startTranTable", [
        this.$check.checked,
        this.$check2.checked
      ]);
    });

    this.$check.addEventListener("change", () => {
      if (this.$check.checked) {
        Editor.info("启用无前缀模式导表");
      } else {
        Editor.info("使用前缀模式导表");
      }
    });
  }
});
