# 豆包图片/视频生成 MCP 服务器

> 一个支持豆包图片生成和视频生成的 MCP (Model Context Protocol) 服务器

[![npm version](https://badge.fury.io/js/doubao-image-video-mcp.svg)](https://www.npmjs.com/package/doubao-image-video-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 开源仓库

本项目已在 GitHub 开源，欢迎 Star 和 Fork：

**[https://github.com/156554395/doubao-image-video-mcp](https://github.com/156554395/doubao-image-video-mcp)**

### 参与贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 贡献指南

- 遵循现有代码风格
- 添加必要的测试和文档
- 提交前运行 `pnpm build` 确保构建成功

### 发布流程

项目使用 GitHub Actions 自动发布到 npm：

1. 更新 `package.json` 中的版本号
2. 创建并推送 Git 标签：
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. GitHub Actions 自动构建并发布到 npm


## 功能

- 图片生成: 使用豆包 Seedream 模型生成高质量图片
- 视频生成: 使用豆包 Seedance 模型生成视频
- 任务查询: 查询视频生成任务状态

## 获取 API Key

1. 访问 [火山引擎豆包大模型平台](https://console.volcengine.com/ark)
2. 注册/登录账号
3. 在控制台获取 API Key

## 安装

### 本地安装

```bash
cd doubao-image-video-mcp
pnpm install
pnpm build
```

## 配置

### Claude Code 中使用 (推荐)

在 Claude Code 配置文件中添加：

**macOS/Linux:** `~/.claude/config.json`
**Windows:** `%APPDATA%\claude\config.json`

```json
{
  "mcpServers": {
    "doubao-giv": {
      "command": "npx",
      "args": ["-y", "doubao-image-video-mcp"],
      "env": {
        "DOUBAO_API_KEY": "your_api_key_here",
        "DOUBAO_IMAGE_ENDPOINT_ID": "ep-20241227-xxxxxxxxxxxxx",
        "DOUBAO_VIDEO_ENDPOINT_ID": "ep-20241227-xxxxxxxxxxxxx"
      }
    }
  }
}
```

### 通用 MCP 客户端配置

```json
{
  "mcpServers": {
    "doubao-giv": {
      "command": "npx",
      "args": ["-y", "doubao-image-video-mcp"],
      "env": {
        "DOUBAO_API_KEY": "your_api_key_here",
        "DOUBAO_IMAGE_ENDPOINT_ID": "ep-20241227-xxxxxxxxxxxxx",
        "DOUBAO_VIDEO_ENDPOINT_ID": "ep-20241227-xxxxxxxxxxxxx"
      }
    }
  }
}
```

> 使用 `npx -y` 可以自动安装最新版本，无需手动管理本地文件。

### 本地开发配置

如果从源码运行：

```json
{
  "mcpServers": {
    "doubao-giv": {
      "command": "node",
      "args": ["/absolute/path/to/doubao-image-video-mcp/dist/index.js"],
      "env": {
        "DOUBAO_API_KEY": "your_api_key_here",
        "DOUBAO_IMAGE_ENDPOINT_ID": "ep-20241227-xxxxxxxxxxxxx",
        "DOUBAO_VIDEO_ENDPOINT_ID": "ep-20241227-xxxxxxxxxxxxx"
      }
    }
  }
}
```

### 环境变量

| 环境变量                     | 必需 | 默认值                         | 说明                  |
| ---------------------------- | ---- | ------------------------------ | --------------------- |
| `DOUBAO_API_KEY`             | ✅   | -                              | API 密钥              |
| `DOUBAO_IMAGE_ENDPOINT_ID`   | ✅   | -                              | 图片生成推理接入点 ID |
| `DOUBAO_VIDEO_ENDPOINT_ID`   | ✅   | -                              | 视频生成推理接入点 ID |
| `DOUBAO_DEFAULT_IMAGE_MODEL` | ❌   | `doubao-seedream-4-5`          | 默认图片生成模型      |
| `DOUBAO_DEFAULT_VIDEO_MODEL` | ❌   | `doubao-seedance-1.0-lite-t2v` | 默认视频生成模型      |

> **重要**：必须在火山引擎控制台创建推理接入点并配置接入点 ID，直接使用模型名称可能因权限问题导致调用失败。

### 创建推理接入点

1. 访问 [火山引擎控制台](https://console.volcengine.com/ark)
2. 进入「推理接入点」页面
3. 创建图片生成接入点（选择 Seedream 模型）
4. 创建视频生成接入点（选择 Seedance 模型）
5. 复制接入点 ID 到配置文件

### 完整配置示例

```json
{
  "mcpServers": {
    "doubao-giv": {
      "command": "npx",
      "args": ["-y", "doubao-image-video-mcp"],
      "env": {
        "DOUBAO_API_KEY": "your_api_key_here",
        "DOUBAO_IMAGE_ENDPOINT_ID": "ep-20241227-xxxxxxxxxxxxx",
        "DOUBAO_VIDEO_ENDPOINT_ID": "ep-20241227-xxxxxxxxxxxxx"
      }
    }
  }
}
```

## 支持的工具

### 1. generate_image

生成单张图片。

**参数：**

- `prompt` (必需): 图片描述文本
- `model` (可选): 模型选择，默认 `doubao-seedream-4-5`
- `size` (可选): 图片尺寸，默认 `1024x1024`
- `image_url` (可选): 参考图片 URL (图生图)
- `ref_image_urls` (可选): 多张参考图片 URL 数组 (多图融合)
- `req_key` (可选): 请求标识

### 2. generate_video

生成视频（异步任务）。

**参数：**

- `prompt` (必需): 视频描述文本 (最大 500 字符)
- `model` (可选): 模型选择，默认 `doubao-seedance-1.0-lite-t2v`
- `video_duration` (可选): 视频时长 (秒)，默认 5
- `fps` (可选): 帧率，默认 24
- `resolution` (可选): 分辨率，默认 `1080p`
- `first_frame_image_url` (可选): 首帧图片 URL (图生视频)
- `ref_image_urls` (可选): 参考图片 URL 数组
- `req_key` (可选): 请求标识

**返回：** 任务 ID，需要使用 `query_video_task` 查询结果

### 3. query_video_task

查询视频生成任务状态。

**参数：**

- `task_id` (必需): 视频生成任务 ID

**返回：** 任务状态和结果

## 支持的模型

### 图片生成模型

| 模型                      | 说明                          |
| ------------------------- | ----------------------------- |
| `doubao-seedream-4-5`     | 最新 4.0 模型，支持 4K 分辨率 |
| `doubao-seedream-3-0-t2i` | 3.0 文生图模型                |

### 视频生成模型

| 模型                           | 说明                   |
| ------------------------------ | ---------------------- |
| `doubao-seedance-1.0-pro`      | 专业版，高质量视频生成 |
| `doubao-seedance-1.0-pro-fast` | 专业版快速生成         |
| `doubao-seedance-1.0-lite-t2v` | 轻量版，快速生成       |

## API 文档

- [创建视频生成任务 API](https://www.volcengine.com/docs/82379/1520757)
- [查询视频生成任务 API](https://www.volcengine.com/docs/82379/1521309)
- [图片生成 API](https://www.volcengine.com/docs/82379/1541523)

## 常见问题

### Q: 视频生成需要多长时间？

A: 视频生成是异步任务，通常需要几秒到几分钟，具体取决于视频时长和模型选择。

### Q: 如何获取推理接入点 Endpoint ID？

A: 在火山引擎控制台创建推理接入点后获取，使用 `endpoint_id` 参数比直接使用 `model` 名称更稳定。

### Q: 支持哪些图片尺寸？

A: 图片生成支持多种尺寸，推荐使用 `1920x2160`、`1920x2560`、`2160x3840` 等高分辨率尺寸（豆包 API 要求图片至少 3686400 像素）。

## Star 历史

[![Star History Chart](https://api.star-history.com/svg?repos=156554395/doubao-image-video-mcp&type=Date)](https://star-history.com/#156554395/doubao-image-video-mcp&Date)

## License

[MIT](LICENSE)

---

**如果这个项目对你有帮助，请给一个 Star ⭐️**
