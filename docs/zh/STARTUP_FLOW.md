# 启动和初始化流程

## 序列

1. 环境加载：core/config/envSwitcher.js 加载环境变量。
2. 客户端初始化：core/startup/botSetup.js 初始化 Discord 客户端和全局变量。
3. 数据加载：core/data/data-manager.js 获取古兰经和诵读者数据。
4. 登录：机器人登录到 Discord。
5. 就绪事件：core/startup/readyHandler.js 触发。
   - 初始化 Firebase。
   - 恢复运行时状态。
   - 恢复语音连接。
   - 注册命令。
   - 启动计时器（赞念、备份、统计）。

## 重复任务

- 状态保存：每 60 秒。
- 备份：每 5 分钟。
- 广播健康：每 30 分钟。
- 内存清理：每 3 分钟。
- 统计更新：每 10 秒。
