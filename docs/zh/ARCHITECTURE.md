# 架构和结构

## 设计理念

该项目采用模块化单体架构。逻辑被分离到不同的领域，包括状态、数据、交互和工具，以便于维护。它使用自定义路径别名来管理深层目录结构。

## 文件夹层次结构

- core/bot/: 入口点和主客户端初始化。
- core/startup/: 引导逻辑和命令注册。
- core/state/: 状态管理和持久性。
- core/interactions/: 处理按钮、菜单和命令。
- core/data/: 数据获取和缓存。
- core/utils/: 共享工具，包括日志记录和 Firebase。
- core/ui/: 嵌入构建器和组件创建器。
- core/package/Envira/: 自定义环境变量加载器。

## 主要组件

- 客户端：在 core/bot/core.js 中管理的 Discord.js Client 实例。
- 状态管理器：GuildStateManager 和 PersistentStateManager 处理运行时和数据库状态。
- 交互处理器：将所有 Discord 交互路由到特定处理器。
- 数据加载器：管理外部 API 调用和诵读者和章节的缓存。

## 模块交互

启动序列初始化客户端，加载数据，连接到 Firebase，并恢复先前的状态。交互通过中央处理器路由，该处理器在执行特定处理器之前验证权限和冷却时间。
