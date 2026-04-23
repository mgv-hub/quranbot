# 自定义工具

## Envira 加载器

位于 core/package/Envira/ 中。

- 目的：带有加密支持的 dotenv 的自定义替代方案。
- 功能：解析 .env 文件，支持加密值，处理多个环境。

## 路径别名

- 库：pathlra-aliaser。
- 用法：允许像 @logger 这样的导入，而不是相对路径。
- 配置：在 package.json 中的 path*aliaser* 下定义。

## 音频工具

- 重试逻辑：fetchWithRetry 处理网络不稳定。
- 流验证：播放前检查内容类型和状态。
- 持续时间计算：估算音频持续时间以进行进度跟踪。

## 数据库清理器

位于 core/utils/databaseCleaner.js 中。

- 功能：为机器人不再在的服务器删除旧数据。
- 目标：设置服务器、服务器状态和控制 ID。
