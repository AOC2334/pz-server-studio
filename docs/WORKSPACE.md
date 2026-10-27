# 开发目录迁移

2026-10-27 起，桌面版主要开发目录为 `C:\Users\cwb\Desktop\work\ProjectZomboid-Desktop`，对应 GitHub 仓库 `AOC2334/pz-server-studio` 的 main 分支。

`C:\Users\cwb\Desktop\work\ProjectZomboid-Node` 是浏览器版基线 ce4ea69 的独立副本，仅作旧版维护与参考。原 `ProjectZomboid` 目录保留迁移时的工作文件和本地数据；后续桌面开发不再修改该目录。

两份源码各自拥有独立 Git 目录。桌面版保留 lib、server.js 和 public 作为必要的业务后端与界面；desktop 提供 Electron 主进程、隔离 preload 和 utilityProcess 后端入口。

未迁移私人 data、游戏 output、node_modules、工具下载缓存或历史 release。新目录需要安装自己的依赖。开发模式的数据与构建输出保存在新目录，已安装桌面应用继续使用其用户数据目录。游戏用户配置仍自动扫描；旧服务器包请通过“已有服务器包”填写原包完整路径并扫描，无需移动存档。

GitHub 使用正常提交更新 main，保留浏览器版历史，不强制改写提交记录。
