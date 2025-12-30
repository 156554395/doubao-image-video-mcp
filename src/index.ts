#!/usr/bin/env node
/**
 * 豆包 MCP 服务器
 * 支持豆包图片生成和视频生成功能
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { generateImage } from "./tools/generateImage.js";
import { generateVideo } from "./tools/generateVideo.js";
import { queryVideoTask } from "./tools/queryVideoTask.js";

// 从环境变量获取 API Key
const API_KEY = process.env.DOUBAO_API_KEY || "";
const DEFAULT_IMAGE_ENDPOINT_ID = process.env.DOUBAO_IMAGE_ENDPOINT_ID || "";
const DEFAULT_VIDEO_ENDPOINT_ID = process.env.DOUBAO_VIDEO_ENDPOINT_ID || "";
const DEFAULT_IMAGE_MODEL = process.env.DOUBAO_DEFAULT_IMAGE_MODEL || "doubao-seedream-4-5";
const DEFAULT_VIDEO_MODEL = process.env.DOUBAO_DEFAULT_VIDEO_MODEL || "doubao-seedance-1.0-lite-t2v";

// 调试输出
console.error("DEBUG: DOUBAO_IMAGE_ENDPOINT_ID =", DEFAULT_IMAGE_ENDPOINT_ID);
console.error("DEBUG: DOUBAO_VIDEO_ENDPOINT_ID =", DEFAULT_VIDEO_ENDPOINT_ID);

// 验证 API Key
if (!API_KEY) {
  console.error("错误: 请设置 DOUBAO_API_KEY 环境变量");
  process.exit(1);
}

// 创建 MCP 服务器
const server = new Server(
  {
    name: "doubao-image-video-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 注册工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // 图片生成工具
      {
        name: "generate_image",
        description: `使用豆包 Seedream 模型生成图片

支持功能:
- 文生图: 使用文本提示词生成图片
- 图生图: 使用输入图片和提示词生成新图片
- 多图融合: 使用多张参考图片融合生成新图片

参数说明:
- prompt: 图片描述文本 (必需)
- endpoint_id: 推理接入点 ID (推荐)
  在火山引擎控制台创建推理接入点后获取的 Endpoint ID
- model: 模型名称 (可选，默认: ${DEFAULT_IMAGE_MODEL})
  * doubao-seedream-4-5: 最新 4.0 模型，支持 4K 分辨率
  * doubao-seedream-3-0-t2i: 3.0 文生图模型
  注意: 直接使用模型名称可能需要账户权限，推荐使用 endpoint_id
- size: 图片尺寸 (可选，默认: 2560x1440)
  支持的尺寸: 2560x1440, 2048x2048, 2304x1728, 1728x2304, 1440x2560, 2496x1664, 1664x2496, 3024x1296
- image_url: 参考图片 URL (可选，用于图生图)
- ref_image_urls: 多张参考图片 URL 数组 (可选，用于多图融合)
- req_key: 请求标识 (可选，用于追踪)

重要提示:
如果遇到 InvalidEndpointOrModel.NotFound 错误，请在火山引擎控制台创建推理接入点，并使用 endpoint_id 参数`,
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "图片描述文本",
            },
            endpoint_id: {
              type: "string",
              description: "推理接入点 ID (在火山引擎控制台创建)",
            },
            model: {
              type: "string",
              description: `模型选择，默认: ${DEFAULT_IMAGE_MODEL}`,
              enum: ["doubao-seedream-4-5", "doubao-seedream-3-0-t2i"],
            },
            size: {
              type: "string",
              description: "图片尺寸，默认: 2560x1440 (注意: 豆包 API 要求图片至少 3686400 像素)",
              enum: [
                "2560x1440",
                "1920x2160",
                "1920x2560",
                "2160x3840",
              ],
            },
            image_url: {
              type: "string",
              description: "参考图片 URL (图生图)",
            },
            ref_image_urls: {
              type: "array",
              items: { type: "string" },
              description: "多张参考图片 URL 数组 (多图融合)",
            },
            req_key: {
              type: "string",
              description: "请求标识",
            },
            watermark: {
              type: "boolean",
              description: "是否添加水印，默认: false",
            },
          },
          required: ["prompt"],
        },
      },
      // 视频生成工具
      {
        name: "generate_video",
        description: `使用豆包 Seedance 模型生成视频

支持功能:
- 文生视频: 使用文本提示词生成视频
- 图生视频: 使用首帧图片和提示词生成视频
- 参考图生视频: 使用参考图片增强视频风格一致性

参数说明:
- prompt: 视频描述文本 (必需，最大 500 字符)
- model: 模型选择 (可选，默认: ${DEFAULT_VIDEO_MODEL})
  * doubao-seedance-1.0-pro: 专业版，高质量视频生成
  * doubao-seedance-1.0-pro-fast: 专业版快速生成
  * doubao-seedance-1.0-lite-t2v: 轻量版，快速生成
- video_duration: 视频时长 (可选，默认 5)
  支持的时长: 3, 4, 5, 6
- fps: 冔率 (可选，默认 24)
  支持的帧率: 24, 30
- resolution: 分辨率 (可选，默认 1080p)
  支持的分辨率: 480p, 720p, 1080p
- first_frame_image_url: 首帧图片 URL (可选，用于图生视频)
- ref_image_urls: 参考图片 URL 数组 (可选)
- req_key: 请求标识 (可选)

返回: 任务 ID，需要使用 query_video_task 查询结果`,
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "视频描述文本 (最大 500 字符)",
              maxLength: 500,
            },
            model: {
              type: "string",
              description: `模型选择，默认: ${DEFAULT_VIDEO_MODEL}`,
              enum: [
                "doubao-seedance-1.0-pro",
                "doubao-seedance-1.0-pro-fast",
                "doubao-seedance-1.0-lite-t2v",
              ],
            },
            video_duration: {
              type: "number",
              description: "视频时长 (秒)，默认: 5",
              enum: [3, 4, 5, 6],
            },
            fps: {
              type: "number",
              description: "帧率，默认: 24",
              enum: [24, 30],
            },
            resolution: {
              type: "string",
              description: "分辨率，默认: 1080p",
              enum: ["480p", "720p", "1080p"],
            },
            first_frame_image_url: {
              type: "string",
              description: "首帧图片 URL (图生视频)",
            },
            ref_image_urls: {
              type: "array",
              items: { type: "string" },
              description: "参考图片 URL 数组",
            },
            req_key: {
              type: "string",
              description: "请求标识",
            },
          },
          required: ["prompt"],
        },
      },
      // 查询视频任务工具
      {
        name: "query_video_task",
        description: `查询豆包视频生成任务的状态和结果

视频生成是异步任务，需要使用此工具查询任务状态:
- pending: 任务等待中
- processing: 任务处理中
- success: 任务成功完成
- failed: 任务失败

参数说明:
- task_id: 任务 ID (必需，由 generate_video 返回)

返回: 任务状态和结果 (成功时包含视频下载 URL)`,
        inputSchema: {
          type: "object",
          properties: {
            task_id: {
              type: "string",
              description: "视频生成任务 ID",
            },
          },
          required: ["task_id"],
        },
      },
    ],
  };
});

// 注册工具调用处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error("缺少必需参数");
  }

  try {
    switch (name) {
      case "generate_image": {
        // 如果没有提供 endpoint_id 且环境变量中有，则使用环境变量的值
        const imageArgs = { ...args };
        if (!imageArgs.endpoint_id && DEFAULT_IMAGE_ENDPOINT_ID) {
          imageArgs.endpoint_id = DEFAULT_IMAGE_ENDPOINT_ID;
        }
        const result = await generateImage(API_KEY, imageArgs as any);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "generate_video": {
        // 如果没有提供 endpoint_id 且环境变量中有，则使用环境变量的值
        const videoArgs = { ...args };
        if (!videoArgs.endpoint_id && DEFAULT_VIDEO_ENDPOINT_ID) {
          videoArgs.endpoint_id = DEFAULT_VIDEO_ENDPOINT_ID;
        }
        const result = await generateVideo(API_KEY, videoArgs as any);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "query_video_task": {
        const taskId = typeof args.task_id === "string" ? args.task_id : String(args.task_id);
        const result = await queryVideoTask(API_KEY, taskId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`未知工具: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: errorMessage,
              tool: name,
              arguments: args,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("豆包 MCP 服务器已启动");
}

main().catch((error) => {
  console.error("服务器启动失败:", error);
  process.exit(1);
});
