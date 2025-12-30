/**
 * 豆包视频生成工具
 * API 文档: https://www.volcengine.com/docs/82379/1520757
 */

interface GenerateVideoOptions {
  prompt: string;
  model?: string;
  endpoint_id?: string;
  video_duration?: number;
  fps?: number;
  resolution?: string;
  first_frame_image_url?: string;
  ref_image_urls?: string[];
  req_key?: string;
}

interface ContentItem {
  type: string;
  text?: string;
  image_url?: {
    url: string;
  };
  role?: string;
}

interface VideoGenerationResponse {
  id?: string;
  status?: string;
  error?: {
    code: string;
    message: string;
    param?: string;
    type?: string;
  };
}

const BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";

export async function generateVideo(
  apiKey: string,
  options: GenerateVideoOptions
): Promise<VideoGenerationResponse> {
  const {
    prompt,
    model,
    endpoint_id,
    video_duration = 12,
    fps = 24,
    resolution = "720p",
    first_frame_image_url,
    ref_image_urls,
    req_key,
  } = options;

  // 验证 prompt 长度
  if (prompt.length > 500) {
    throw new Error("prompt 长度不能超过 500 字符");
  }

  // 优先使用 endpoint_id，如果没有则使用 model
  const modelOrEndpoint = endpoint_id || model || "doubao-seedance-1.0-lite-t2v";

  // 计算宽高比
  const ratio = resolution === "720p" ? "16:9" : "adaptive";

  // 构建带参数的文本
  let textWithParams = prompt;
  // 如果 prompt 中没有 --dur 参数，添加默认时长
  if (!prompt.includes("--dur")) {
    textWithParams += ` --dur ${video_duration}`;
  }
  // 如果 prompt 中没有 --fps 参数，添加默认帧率
  if (!prompt.includes("--fps")) {
    textWithParams += ` --fps ${fps}`;
  }
  // 如果 prompt 中没有 --rs 参数，添加默认分辨率
  if (!prompt.includes("--rs")) {
    textWithParams += ` --rs ${resolution}`;
  }
  // 如果 prompt 中没有 --ratio 参数，添加默认宽高比
  if (!prompt.includes("--ratio")) {
    textWithParams += ` --ratio ${ratio}`;
  }

  // 构建 content 数组
  const content: ContentItem[] = [
    {
      type: "text",
      text: textWithParams,
    },
  ];

  // 添加首帧图片（图生视频）
  if (first_frame_image_url) {
    content.push({
      type: "image_url",
      image_url: {
        url: first_frame_image_url,
      },
    });
  }

  // 添加参考图片（多图融合）
  if (ref_image_urls && ref_image_urls.length > 0) {
    for (const imageUrl of ref_image_urls) {
      content.push({
        type: "image_url",
        image_url: {
          url: imageUrl,
        },
        role: "reference_image",
      });
    }
  }

  // 构建请求体
  const requestBody: Record<string, any> = {
    model: modelOrEndpoint,
    content,
  };

  try {
    const response = await fetch(`${BASE_URL}/contents/generations/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const result: VideoGenerationResponse = await response.json();

    // 检查是否有错误
    if (result.error) {
      throw new Error(
        `视频生成失败: ${result.error.message || "未知错误"}`
      );
    }

    // 检查 HTTP 状态码
    if (!response.ok) {
      throw new Error(`HTTP 错误: ${response.statusText}`);
    }

    return result;
  } catch (error) {
    throw new Error(
      `视频生成请求失败: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
