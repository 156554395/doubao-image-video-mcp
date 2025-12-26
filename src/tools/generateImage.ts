/**
 * 豆包图片生成工具
 * API 文档: https://www.volcengine.com/docs/82379/1541523
 */

interface GenerateImageOptions {
  prompt: string;
  model?: string;
  size?: string;
  image_url?: string;
  ref_image_urls?: string[];
  req_key?: string;
  endpoint_id?: string; // 推理接入点 ID
  watermark?: boolean; // 是否添加水印，默认 false
}

interface ImageData {
  url: string;
  size?: string;
}

interface ImageGenerationResponse {
  model?: string;
  created?: number;
  data?: ImageData[];
  usage?: {
    generated_images?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    code: string;
    message: string;
    param?: string;
    type?: string;
  };
}

const BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";

export async function generateImage(
  apiKey: string,
  options: GenerateImageOptions
): Promise<ImageGenerationResponse> {
  const {
    prompt,
    model,
    endpoint_id,
    size = "1920x2160",
    image_url,
    ref_image_urls,
    req_key,
    watermark = false, // 默认不加水印
  } = options;

  // 优先使用 endpoint_id，如果没有则使用 model
  const modelOrEndpoint = endpoint_id || model || "doubao-seedream-4-5";

  // 构建请求体
  const requestBody: Record<string, any> = {
    model: modelOrEndpoint,
    prompt,
    size,
    watermark, // 添加水印参数
  };

  // 添加可选参数
  if (image_url) {
    requestBody.image_url = image_url;
  }

  if (ref_image_urls && ref_image_urls.length > 0) {
    requestBody.ref_image_urls = ref_image_urls;
  }

  if (req_key) {
    requestBody.req_key = req_key;
  }

  try {
    const response = await fetch(`${BASE_URL}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const result: ImageGenerationResponse = await response.json();

    // 检查是否有错误
    if (result.error) {
      throw new Error(
        `图片生成失败: ${result.error.message || "未知错误"}`
      );
    }

    // 检查 HTTP 状态码
    if (!response.ok) {
      throw new Error(`HTTP 错误: ${response.statusText}`);
    }

    return result;
  } catch (error) {
    throw new Error(
      `图片生成请求失败: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
