# 部署和配置

## 环境变量

- DISCORD_TOKEN: 机器人身份验证令牌。
- FIREBASE_CONFIG: 数据库凭据。
- SPE_USER_ID: 特殊开发者用户 ID。
- NODE_ENV: 生产或开发模式。

## 启动脚本

- start.bat: Windows 启动脚本。
- start.sh: Linux 启动脚本。
- 包管理器：使用 pnpm 进行依赖管理。

## 监控

- 健康检查：状态的 HTTP 端点。
- 日志记录：基于文件，带有轮换和归档。
- 统计信息：使用指标在 Firebase 中跟踪。

## 备份系统

- 本地：本地存储的压缩 JSON 文件。
- 远程：通过 webhook 发送到 Discord 频道。
- 计划：每 5 分钟自动运行。

## 扩展

- 内存：针对单实例部署优化。
- 数据库：Firebase 用于共享状态。
