# 第一阶段验证记录

## 2026-10-04 补充验收

- `npm test`：24/24 通过，新增元数据/分类来源、数字版本比较、作者声明冲突、隔离缓存、启动成功、超时/取消、分块凭据脱敏、原版错误排除、B42 实际 Lua 日志格式、多个模组候选归因测试。既有 IPv4/IPv6 与域名白名单检查继续通过。
- 本机扫描：150 个独立 Mod ID、272 个来源/版本。浏览器验证 Common Sense 的作者、模组版本、分类信息、工坊链接与目标版本提示；启用后手动刷新保留选择和目标版本。
- 无模组真实测试：已有 `studio-demo-1790933556289` 包使用隔离缓存达到 SERVER STARTED，约 86 秒，1590 条警告、53 条错误日志；没有模组候选。报告保留这些原版异常，不宣称无错误。
- 带模组完整 API 构建：`studio-smoke-mod-1791096197889`，复制 47858 个运行文件并自动启动测试，选用 Common Sense 的 42.0 来源。本次失败暴露了 B42 日志以显示名称而非内部 ID 标注 Lua 模组的格式；据此补充解析与回归测试。
- 改进后真实复测：约 71 秒报告 failed / 未就绪，正确识别内部 ID `BB_CommonSense`。证据包括 `BB_CS_RecipeCode.lua` 的 `require("recipecode") failed` 和第 13 行 `attempted index of non-table`，随后 WorldDictionary 因脚本加载错误终止世界加载。日志另有模组目录下缺失资源目录提示。只给出当前本机模组内容和 42.21.0 运行时的错误证据，未自动修改模组或断言所有版本不兼容。
- 两次真实测试均清理临时 `.smoke-*` 缓存，保留包原始配置和 diagnostics 报告；管理员测试凭据不保存在报告。启动测试需要本机 Java 正常读取运行环境，开发沙箱拒绝访问时报告环境异常，获准在沙箱外验证。

仍未验证：全部本机模组组合、Steam 在线更新、多人入服与长期游玩。单个模组错误测试不能证明其他模组都兼容。

## 初始交付记录

验证日期：2026-10-02，Windows，本机 Node.js v24.11.1。

- `npm test`：5/5 通过。覆盖 VDF 解析、INI 保留、依赖/端口验证、B42 common 资源及完整工坊复制、启动参数传递、源文件保护、失败回滚。
- 本机发现：1 个 Steam 库，游戏 AppID 108600，buildid 25485521 / public，261 个模组元数据版本，1 个现有服务器配置。
- 浏览器：导入 servertest 配置后 73 个模组启用；搜索 CommonSense 能显示本地、工坊及版本目录；发现 4 处依赖顺序问题，按依赖排序后问题列表为空。
- 真实构建：`output/studio-demo-1790933556289`，无模组，4 GB 堆内存，完整复制本机运行环境约 4.7 万个文件，生成独立 Zomboid 缓存和启动脚本。
- 真实启动：运行 `scripts/smoke-start.js`，使用 `-nosteam` 检查；成功加载 Java、RakNet64、ZNetNoSteam64 和 GameServer，出现 `Enter new administrator password:` 后停止自身 Java 子进程。没有输入密码或创建账号。
- 首次启动检查因运行沙盒限制无法读取 Java 安全配置；获准在沙盒外重试后通过。

未验证：Steam 联网工坊更新、真实多人入服、所有 73 个现有模组的脚本兼容性、长时间服务器运行。示例构建无模组，不能用来证明任意模组组合兼容。

## 2026-10-04 紧凑工作台、Dedicated Server 与完整沙盒验收

- 30 项自动化检查通过；Dedicated Server 夹具使用 java/projectzomboid.jar 和 StartServer64.bat 的 %1/%2 实际布局，验证完整参数转发、B42 common 资源及源文件保护。增加 Lua 嵌套表、缺失选项插入、字符串/注释保留、动态表达式不执行、数值约束、Dedicated 项目迁移和禁止客户端运行环境打包的测试。Windows Steam 路径大小写不同不会产生重复库或模组来源。
- 本机 Steam 专用服务器安装完成后，真实构建 studio-dedicated-1791102781110：AppID 380870 / buildid 25485538，复制 39242 个运行文件，使用 java/projectzomboid.jar，启动脚本内存按项目改为 Xms2g/Xmx4g，移除仅转发两个参数的占位符并使用 %*。
- 包的自动隔离启动测试约 88 秒到达 SERVER STARTED，实际版本 42.21.0，结果 passed_with_warnings，1594 条警告、53 条错误日志，无模组归因。未带入原有存档，临时测试缓存已清理。仍不代表原版日志无异常或已验证多人连接。
- 浏览器验证紧凑卡片、说明折叠、版本来源选择；启用 Common Sense 42.0 后显示 15 个中文自定义沙盒选项。切换 PryingMechanic 为 false 后，SandboxVars 写入该项，并保留 VERSION=6 与 Zombies=4。原版默认数据识别 269 项。

## 2026-10-04 Proximity Inventory 替换验证

按用户要求，带模组验证脚本改用工坊 2847184718 的 ProximityInventory / 42 来源，替代 Common Sense。通过应用构建 studio-proximity-1791103264670，Dedicated Server 42.21.0；确认 loading ProximityInventory 和 SERVER STARTED，约 90 秒就绪。1594 条警告、57 条错误日志，其中模组归因仅为 AnimSets/actiongroups 目录不存在，没有发现对应 Lua 脚本失败。修正诊断规则：这类目录缺失保留 warning 证据，服务器就绪时不单独判作模组不兼容；实际 Lua 错误仍判失败。新增回归测试通过。测试没有覆盖客户端背包交互和多人入服。
