# 示例服务器启动警告排查

检查日期：2026-10-02。对象：`output/studio-demo-1790933556289`，用户首次测试后的现有日志；未重新启动服务器，未修改用户缓存、模组、存档或服务器配置。

## 结论

现有证据不支持“示例服务器加载了 %USERPROFILE%\Zomboid 中的模组”。示例服务器配置的 Mods 与 WorkshopItems 为空，包内 Zomboid/mods 没有模组文件，启动脚本明确传入包内缓存目录。服务器 Lua 警告标注 Lua(Vanilla)，日志中未发现模组脚本加载或覆盖记录。

## 两份不同的日志

- `%USERPROFILE%\Zomboid\console.txt`：2026-10-02 17:35:58 的游戏客户端日志，含显示模式、GPU、FMOD 初始化以及 AmmoLootDropB42、AmmoLootDropBox 等模组覆盖记录。这证明客户端有模组，不证明独立服务器使用了这些模组。
- `output/studio-demo-1790933556289/Zomboid/server-console.txt`：示例服务器日志，版本 42.21.0，配置名 studio-demo，资源路径和 SandboxVars 写入路径指向示例包。用户目录下同名 server-console.txt 的文件时间为 2025-06-06，不是此次示例服务器日志。

## 服务器证据位置

- 第 4 行：游戏版本 42.21.0。
- 第 84 行：server name is studio-demo。
- 第 104、114 行：Large Bucket / Fuel Pump 的基础容器名称清理报错；名称在原版 media/scripts/generated 下可定位。
- 第 105–113 行：基础车辆脚本碰撞尺寸告警，含 RaceCar58。
- 第 1188–1193 行：Lua(Vanilla) 引用客户端界面/动作模块失败。相关共享脚本来自游戏安装；例如 ISVehicleMenu.lua 在源安装与包内对应客户端路径都不存在，不能据此判断是打包遗漏。
- 第 1237–1241 行：Lua(Vanilla) WorldGen 递归 require，路径在包内 runtime/media/lua/server。
- 第 1245 行：写入包内 Zomboid/Server/studio-demo_SandboxVars.lua。
- 第 1263–1312 行附近：基础 WorldGen 地图属性查找异常，如 ladderW、WindowShape。
- 第 1844、1846 行：基础地图的人偶区域属性及房间 metaID 告警。
- 第 1868–1870 行：SERVER STARTED，Steam is not enabled，监听 16261 端口。
- 第 1875 行：客户端连接附近出现 No packet handler 警告；它属于协议处理问题，不能据此判断加载了模组，也不能凭本次静态排查保证连接兼容。
- 日志末尾：保存世界和正常关闭记录。

## 文件完整性核对

将包内 runtime/media/lua 与 runtime/media/scripts 的全部 3,684 个文件和当前 Steam 原安装逐文件比较：缺失 0、内容差异 0。另抽查 Large Bucket、RaceCar58、PotteryBench、WorldGen 的对应基础文件，内容一致。这排除了这些脚本目录的复制遗漏；不代表 Steam 源安装已通过官方完整性校验。

## 处理建议

本次无需删除、移动或禁用 %USERPROFILE%\Zomboid 中的任何文件，也无需修改缓存路径。查看示例包内 server-console.txt 判断服务器运行情况。基础资源告警保留原样，不能通过隐藏日志证明它们已修复。如果后续出现不能入服、世界生成异常或特定交互损坏，应针对相应报错单独验证；必要时先通过 Steam 验证源安装并使用相同版本的专用服务器工具作对照。

参考：官方论坛用户报告也存在基础车辆 extents/physicsChassisShape 告警，但仅作为背景资料，本次结论主要依据本机文件和日志。

https://theindiestone.com/forums/topic/82515-4260-rev27701-game-crash-while-driving/
