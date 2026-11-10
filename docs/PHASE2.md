# 第二阶段开发记录

本文按日期保留历史实现。当前 v0.2.1 已将卡片更新按钮合并为自动检查和更新选择弹窗；现行使用方式见 [v0.2.1 使用说明](V0.2.1.md)。

## 本轮交付（2026-10-06）

工作台增加创意工坊下载区。输入条目编号或 Steam 条目链接，读取官方标题、完整描述、标签和真实发布 / 更新时间；可从详情直接下载。已有模组卡片增加工坊详情、单项检查和更新按钮；顶部增加检查全部、更新全部及更新范围确认。

SteamCMD 可从 Valve 官方地址安装。队列按 Workshop ID 去重，串行下载，有实时日志、取消和失败重试。一个工坊条目内的多个内部 Mod ID 一起下载。首次自更新导致命令未执行时，自动重试一次。

下载先进入独立暂存区。只有 SteamCMD 返回成功、正常退出且 mod.info 校验通过后，才导入 `data/workshop/steamapps/workshop/content/108600/<编号>`。更新保留 `.backup-<UUID>` 旧版目录；暂存、备份目录不参与扫描。失败或导入前取消不替换已有模组。构建和下载互斥。

更新完成后刷新工作台，将已启用的同工坊 / 同 Mod ID 切换到应用缓存，保留加载顺序和设置；找不到原 Mod ID 时保留原选择并提示。新下载的模组不会自动启用全部子模组。更新后应重新检查依赖、构建并进行启动测试，已有服务器包不会自动变化。

在线版本对照 Steam `appworkshop_108600.acf` 的 WorkshopItemsInstalled.timeupdated；应用缓存使用真实下载 manifest 提取的记录。没有可靠记录时显示“版本未知”。单卡片按当前来源显示状态；全量检查在任意来源已有最新副本时不再重复下载该条目，需要时可在来源选择框切换或手动下载。远端“最新”不保证与当前游戏分支兼容。

## 环境与登录

使用 Node.js 24.5 或更高版本，以支持 fetch 使用环境代理。start.cmd 和 npm start 通过 --use-env-proxy 在启动时启用该支持；直接启动也应使用 node --use-env-proxy server.js。应用尊重 HTTPS_PROXY / HTTP_PROXY；未设置时读取 Windows 已启用的 HTTP 代理。不更改系统代理设置。

SteamCMD 不能运行在中文路径。工程目录包含中文时，自动使用 `%TEMP%/pz-server-studio-<工程标识>/steamcmd`；模组缓存仍位于工程 `data/workshop`。临时目录被清理后可重新安装工具，已导入的模组保留。可通过环境变量 PZ_STEAMCMD_HOME 指定已有 SteamCMD 的英文目录，例如 `C:\PZTools\steamcmd`。

默认账号为 anonymous。条目如不允许匿名下载，填写 Steam 登录账号名。密码与 Steam Guard 按 SteamCMD 提示输入，仅接受本机回环访问；应用不把它们写入命令参数、项目、队列状态或应用日志。SteamCMD 自身可能保存会话数据，位于工具目录，由 Valve 客户端管理。真实账号登录及手机确认尚未完成真机验收；当前已验证匿名流程，登录交互有模拟协议测试。

## 验收与待办

- 已通过官方接口查询 Proximity Inventory（2847184718）。
- 已真实匿名下载该条目（702341 字节），安装记录时间为 1788105180，与远端更新时间一致。
- 已通过网页按钮完成再次下载、旧版备份、工作台自动刷新，并保留 ProximityInventory 启用位置。
- 自动测试覆盖官方响应 / 游戏归属、无效链接、未知版本、取消前保留旧版、更新备份、队列去重、首次自更新重试、登录 stdin 与日志保护。
- 待完成：工坊名称搜索、分页、在线封面、真实账号 / Steam Guard / 手机确认验收、更多网络失败场景和多人入服验证。

本轮为第二阶段首个可运行增量，尚未宣布整个第二阶段完成。完整迭代顺序见 PLAN.md。

接口依据：[ISteamRemoteStorage 官方文档](https://partner.steamgames.com/doc/webapi/ISteamRemoteStorage)、[SteamCMD 官方文档](https://developer.valvesoftware.com/wiki/SteamCMD)、[Node.js 环境代理说明](https://nodejs.org/learn/http/enterprise-network-configuration)。

## 合集合并补充（2026-10-07）

已加入公开 Steam 合集链接导入，支持嵌套展开、去重、保留已有配置来源与顺序，以及缺失条目下载后自动启用。真实公开合集 3715219761 展开得到 37 个有效条目、2 个不可用提示；合并 / 下载完成启用 / 重复导入协议已通过自动测试。未把该测试合集批量下载或写入用户配置。
