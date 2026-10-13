# PZ Server Studio

Windows 本地可视化服务器制作工具。第一阶段已归档，第二阶段接入创意工坊详情、下载与更新。使用 Node.js 24.5+，不需要 npm install；在线功能需要连接 Steam。

## 启动

域名白名单在 `lib/network.js` 顶部的 `ALLOWED_DOMAINS` 数组中配置，目前包含 `aoc-applepie.work`。访问地址为 `http://aoc-applepie.work:8080`，域名 DNS 需指向本机可达的 IP 地址；修改白名单后重启应用生效。

双击 `start.cmd`，或在项目目录执行 `npm start`，打开 http://127.0.0.1:8080 。关闭终端停止应用。默认端口在 `server.js` 的 `server.listen(Number(process.env.PORT||8080), ...)` 中修改。也可临时覆盖：PowerShell 执行 `$env:PORT=8081` 后 `npm start`。

应用监听 IPv6 通配地址 `::`，设置 `ipv6Only: false`，同时支持 IPv4 和 IPv6。启动终端打印本机各网卡地址。IPv4 使用 `http://本机IP:8080`；IPv6 使用 `http://[本机IPv6]:8080`，例如本机回环 `http://[::1]:8080`。Host 校验允许本机 IPv4/IPv6 地址、计算机名和 localhost，仍拒绝无关域名。地址变化后自动按当前网卡地址校验。

IPv6 局域网测试优先使用 ULA 或全球单播地址；`fe80::` 链路本地地址需要客户端接口作用域，浏览器兼容性有限，且不能用于公网。公网测试需要这台电脑有全球单播 IPv6，客户端也有 IPv6 连通性，并且 Windows 与路由器 IPv6 防火墙放行 TCP 8080；仅修改应用监听无法验证公网可达性。公网访问者能使用当前应用的文件配置和构建功能，当前版本没有独立账号登录或 HTTPS；仅用于受控测试，结束后收回对应公网放行规则。

1. 文件与环境：自动扫描注册表、默认 Steam 安装、`libraryfolders.vdf` 多库、108600 游戏与 380870 专用服务器。自定义路径一行一个，可填 Steam 库根或游戏目录。读取用户目录 `Zomboid/Server` 和 `Zomboid/mods`。
2. 导入现有服务器配置，核对本机缺失模组及多版本选择。工作台按 Mod ID 合并为一张卡片，来源与版本下拉框保留 Steam 工坊、游戏工坊缓存和本地副本。切换已启用模组的来源会替换原选择并保留加载位置，同名但不同 ID 的模组仍分别显示。支持搜索、启停、排序、依赖校验、地图列表加入。B41 / B42 目录都会扫描，但不能仅凭目录判断兼容性，需按模组说明选择与服务器分支一致的版本。
3. 编辑常用及全部 INI 字段，沙盒标量字段和 Lua 原文。修改原文后点击“应用编辑内容”，否则该原文修改不进入构建。Lua 不执行；复杂表达式使用原文编辑器。地图出生区域可用原文编辑器配置。
4. 保存项目或一键构建并测试。构建复制 Dedicated Server/JRE/模组，输出独立目录 `output/<配置名>-<时间戳>`（运行环境仅使用 Steam 工具里的 Project Zomboid Dedicated Server，AppID 380870）。打开目录双击 `启动服务器.cmd`，按提示创建管理员密码。构建期间不修改源文件，不携带现有存档。构建后自动运行隔离启动测试，界面显示阶段、实时日志和最终报告；可停止测试，包会保留。完整结果在包的 `diagnostics/smoke.log` 和 `diagnostics/smoke-report.json`。

包是可移动文件夹，整体复制即可；当前不生成压缩 ZIP 或单文件 EXE。模组启动时使用包内文件，Steam 身份验证仍可能联网。实际运行还受版本一致性、模组脚本、Steam 服务以及网络影响。应用不会自动修改防火墙或路由器。配置密码明文保存于本地项目及服务器 INI，请妥善保管。

## 工作台与沙盒补充功能

构建服务器包现在先通过 SteamCMD 下载、校验所有已启用的工坊条目，并用真实安装记录比对远端更新时间；新增前置也会纳入核验。无法联网、下载失败、无法确认最新版或新版移除已启用 Mod ID 时停止构建。模组最终只复制到包内 `Zomboid/mods`，不再重复复制工坊缓存。导出 INI 的 `WorkshopItems` 留空、`Mods` 保留，启动脚本继续指定包内缓存和 `-modfolders mods`，因此启动不再下载工坊模组。工坊编号与版本核验时间保存在 `manifest.json`。客户端需要自行订阅这些条目并保持相同版本；Steam 身份验证仍可能联网。本地模组没有可核验的工坊版本，按当前文件复制。旧包需重新构建才能包含新行为。

“创意工坊 · 下载与任务”内可粘贴 Steam 合集链接，点击“一键合并合集”。自动展开嵌套合集并去重，保留当前启用模组与相对顺序，补入合集条目中的所有内部 Mod ID 及已安装前置。缺失条目自动安装 SteamCMD（如有需要）、下载并启用；失败 / 取消的条目保留待合并状态，可重试。未完成状态随保存项目一起保留。不可见、已删除或其他游戏条目会明确提示跳过；新增模组仍需核对游戏分支、可选补丁和兼容性后构建测试。合集最多 500 个模组条目、8 层嵌套。编辑服务器包时，缺少包内文件的合集需先在本机配置合并，再重新构建。

“文件与环境”新增已有服务器包列表，自动扫描 output，也可填写本应用生成的服务器包根目录。选择“加载编辑”后，在工作台与设置页修改，顶部按钮变为“保存服务器包配置”，写回该包的 INI / Lua 和内存启动参数，并保留备份。只允许启用包内已经存在的模组；加入新模组需重新构建。存档不参与配置保存，更改下次启动生效。

配置列表的“加载配置”现在同时恢复游戏配置和已保存工作台进度。实际 INI / Lua 优先于快照，路径变化后按 Mod ID / 工坊身份重新匹配；未找到的模组保留提示。工作台草稿仍需“应用编辑内容”才进入实际游戏配置。保存清空已有模组清单或覆盖未加载的同名配置时会提示确认，旧文件自动备份。

工作台采用紧凑卡片：图标、名称和兼容提示一行，简要元数据一行，来源路径仅在选择框显示，说明/版本范围/依赖折叠。“手动刷新”保留启用列表、加载顺序和当前设置。卡片显示分类、作者、模组版本、游戏版本范围与兼容提示；分类标明作者声明或目录推断。可手填目标游戏版本，未声明信息不会被推断为兼容。工坊模组支持打开条目页面、在线详情、版本检查以及单项 / 全部更新。下载队列、独立缓存、登录方式和当前验收范围见 [第二阶段说明](docs/PHASE2.md)。

服务器配置新增全部沙盒面板：读取所选 Dedicated Server 的 Apocalypse 默认数据，以及已启用模组的 `media/sandbox-options.txt` 和 common 共享定义；保留导入配置的附加字段。按组展开、搜索，支持布尔、枚举、字符串、整数和小数。修改立即写入 SandboxVars，未写入的模组选项显示默认值。复杂动态 Lua 保留在原文编辑器。读取数据不执行 Lua。

应用构建使用 Dedicated Server 来源；完整项目恢复保留所选环境路径，未找到时明确标记，须重新选择已安装的 Dedicated Server 后构建。旧版进度文件可恢复，保存时迁入现有配置目录。专用服务器安装未完成时阻止打包。已导出的旧包仍是其原来的运行环境，需要重新构建才能使用 Dedicated Server。

启动冒烟测试默认最多 180 秒，使用临时缓存、随机管理员凭据、无 Steam 和本机临时端口，结束清理测试缓存。原版警告也会展示，日志有明确模组证据时列出候选及原文；环境异常、超时或无法归因单独说明。启动成功不等于所有游玩交互或多人连接都正常。

## 验证

`npm test`：VDF、多库结构、INI 无损编辑、依赖和端口验证、B42 共享资源、服务器构建、启动参数传递、源文件保护、失败回滚。真实安装扫描可用 `node -e "require('./lib/core').discover().then(s=>console.log(s.installs,s.mods.length))"`。

## 技术结构

模组卡片显示本地图标，优先使用 mod.info 声明的 icon/poster，支持版本目录及 common 共享资源。没有图片或加载失败时显示占位图；图片按需加载，不请求外部网站。

- `lib/mod-info.js` / `lib/smoke.js`：模组元数据、隔离启动测试与日志报告。
- `lib/core.js`：发现、解析、校验与构建，未来 SteamCMD 适配器可复用。
- `server.js`：监听 IPv4 / IPv6，随机会话令牌与 Host 校验，项目保存和后台构建任务。
- `public/`：中文可视化界面，无前端构建与外部依赖。
- `docs/PLAN.md`：完整阶段计划和验收标准。

## 2026-10-05 APPLE 模组加载修复与配置对应关系

检查对象为包内 Dedicated Server 42.21.0 的 projectzomboid.jar。使用 javap 阅读 ZomboidFileSystem、ChooseGameInfo/Mod、ServerOptions、SandboxOptions、ServerSettings、GameServer 字节码；原始 JAR 不做修改。仅供查看的提取副本降低了 class 版本标记，以便本机 JDK 23 展示指令，副本不参与启动。查看输出在 data/mod-loading-bytecode.txt、data/core-bytecode.txt。

### 实际读取顺序

启动脚本通过 -cachedir 指定包内 Zomboid，通过 -servername 指定 APPLE。ZomboidFileSystem.getCacheDir 只有未设置 cacheDir 时才回退 user.home/Zomboid。getAllModFolders 默认按 workshop,steam,mods 搜索；mods 是 getCacheDirSub("mods")，并非固定的用户目录。setModIdToDir 使用 putIfAbsent，同 ID 先发现的来源优先。

B42 getModVersionDirName 根据实际 Core 游戏版本，从数字目录中挑选不高于游戏版本的最高合适目录。ChooseGameInfo.readModInfoAux 读取该目录的 mod.info，若无该文件才尝试 common/mod.info；根目录 B41 mod.info 不能代替 B42 的有效元数据。Mod.isAvailable 同时检查 versionMin/versionMax 和递归 require。42.21 的 require 解析去除反斜杠。loadModAndRequired 取得不到可用模组时会从 ServerMods 移除它，并记 required mod not found。loadMod 将 common 与版本目录文件写入 activeFileMap，文件只是存在于磁盘而没有加载，不代表会参与服务器脚本校验。

APPLE 的原始日志明确记录 SkillRecoveryJournal、SkillRecoveryJournalCN、MinimalDisplayBars not found，并记未知 SkillRecoveryJournal 沙盒选项。Journal 的 42.20.1/mod.info 要求 ChuckleberryFinnAlertSystem、errorMagnifier，原 Mods 未启用这两项。旧工作台检查了根目录 B41 元数据，遗漏了依赖。朋友截图 F:/steam 路径为朋友客户端检测到的文件位置，不证明服务器读取 C:/Users/cwb/Zomboid/mods。主机客户端没有同样报错不能证明服务器模组加载正常。

补丁使工作台与构建校验检查实际 B42 版本元数据，读取 Core 构造式游戏版本号，导入/恢复时解析实际版本。新包和隔离测试指定 -modfolders mods，固定从包内副本加载；Steam 工坊缓存仍用于获取/更新和向客户端提供 Workshop IDs，但不能抢占加载来源。已为 APPLE 补齐并启用两个前置，添加工坊 ID 3077900375、2896041179，移除未加载的 B41 MinimalDisplayBars，保留 MinimalDisplayBarsB4220。原 ini、启动脚本、manifest 均有 .before-modfix 备份。Steam 自动更新工坊缓存后，固定副本不会自动同步；客户端与固定副本不一致仍可能校验失败，需要同步版本后重新打包或更新包内副本。不能以关闭校验作为修复。

### 每份配置由谁读取

- 启动服务器.cmd：调用 runtime/StartServer64.bat，传递 -cachedir、-servername、-modfolders；它选定数据根目录与配置名。双击 runtime/StartServer64.bat 绕过外层参数可能回到默认用户目录，应使用包根目录脚本。
- runtime/StartServer64.bat：启动 JVM 与 zombie.network.GameServer，传递内存、类路径、Steam 模式、外层参数。
- Zomboid/Server/APPLE.ini：由 ServerOptions.loadServerTextFile 读取。Mods 是游戏 Mod ID 启用清单；WorkshopItems 是 Steam 工坊项目数字 ID 下载清单，二者不能互相替代。新版导出包为避免启动下载将其留空，工坊身份记录于 manifest.json。DefaultPort/UDPPort 是游戏 UDP 端口，Map 是地图加载清单；密码等其他服务器选项也在此文件。
- Zomboid/Server/APPLE_SandboxVars.lua：由 SandboxOptions.loadServerLuaFile 执行并读取 SandboxVars 表，包含原版及已加载模组注册的沙盒选项。模组未加载时，该模组字段会报 unknown SandboxOption。已有存档还会保存沙盒数据，改此文件不等于全部已生成世界内容会重新生成。
- Zomboid/Server/APPLE_spawnregions.lua：由 SpawnRegions/ServerSettings 读取，返回 SpawnRegions() 区域清单，区域引用地图内 spawnpoints 或自定义 serverfile。
- Zomboid/Server/APPLE_spawnpoints.lua：由 SpawnRegions/ServerSettings 读取 SpawnPoints()。仅有文件不保证采用，必须被出生区域配置引用；不是玩家当前位置或存档数据。
- Zomboid/mods/<模组>/版本/mod.info 与 common/mod.info：ChooseGameInfo 读取 ID、版本限制、依赖等；对应 common/media 与版本/media 由 ZomboidFileSystem.loadMod 加载。
- runtime/steamapps/workshop/content/108600/<WorkshopID>：SteamWorkshop 安装缓存，108600 是游戏 AppID。默认 steam 搜索会参与模组发现；补丁 -modfolders mods 使该缓存不参与资源来源选择。
- Zomboid/Saves/Multiplayer/APPLE 与 Zomboid/db：游戏存档、世界/玩家数据及服务器账号数据库，不是工作台可直接替换的配置文件。补丁不修改它们。
- manifest.json、diagnostics、data/project.json：工作台记录与测试结果，游戏不会将它们当作服务器配置读取。

更新后的 APPLE 需要正常保存世界并退出，再从包根目录启动脚本重启，运行中的进程不会热更新以上模组清单。远程客户端需使用匹配游戏版本和模组版本。

项目保存与配置管理（2026-10-05）

保存项目写入扫描到的现有配置目录（默认 %USERPROFILE%\Zomboid\Server）：<名称>.ini、<名称>_SandboxVars.lua、<名称>_spawnregions.lua、<名称>_spawnpoints.lua，以及 <名称>.pzstudio.json。JSON 是工作台完整快照，包含模组路径、ID、工坊编号与顺序（路径缺失时保留原清单并提示）、未启用模组的来源选择、运行环境、内存、目标版本、筛选/排序、设置分类、原文件文本和各文件未应用的编辑草稿。游戏只读取 INI / Lua，不读取工作台 JSON。未应用草稿仅保存在进度中，不写入游戏配置；恢复后须点击“应用编辑内容”才影响构建。

“导入配置与启用列表”读取所选配置的 INI 与三份 Lua，保留未知设置、注释和动态表达式。它按 INI 的 Mods 顺序匹配本机 Mod ID，再按所选运行环境解析有效版本；不会安装缺失模组，也不能从 INI 恢复模组具体来源、内存和界面进度。模组缺失时保留当前面板并提示，避免悄悄删掉原列表。“恢复已保存项目”读取同名 .pzstudio.json，重新扫描后恢复完整快照；外部手动修改游戏配置后，应选择导入配置，而非恢复旧快照。

页面支持新建空白项目（保存前只存在面板）、复制、重命名、移入回收区、恢复回收配置。复制/重命名包括配套配置文件与工作台进度，并改写出生区域中引用的同名 _spawnpoints.lua；不重命名或删除世界存档。目标已存在则拒绝覆盖。覆盖保存前的副本放在 .pzstudio/backups/<记录ID>；删除的配置放在 .pzstudio/trash/<记录ID>，可在页面恢复，恢复时目标重名须填写新名称。

旧 data/project.json 不自动覆盖或删除，仍可从下拉框“旧版 data/project.json 进度”恢复，随后点击保存迁入现有配置目录。目录中 __backup__kkdy 是已有的旧备份副本（四份文件时间 2026-10-04 23:39），不是新增的工作台进度；界面标记为“旧备份副本”。新的历史备份放在隐藏子目录，不会再混入游戏配置列表。

配置列表交互（2026-10-05）：主列表仅显示扫描到的配置名称；鼠标悬停或键盘聚焦时显示加载配置、复制、重命名、删除。加载配置导入游戏 INI/Lua；复制自动生成 _copy、_copy_2 等不重名且不超过 64 字符的名称。重命名在行内输入，Enter/保存名称提交，Esc/取消放弃。删除先显示页面内确认弹窗，确认后移入回收区，取消不改动文件。完整进度恢复与回收恢复收纳到“已保存进度与回收区”，不混入主配置列表。
