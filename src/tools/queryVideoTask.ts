/**
 * 豆包视频任务查询工具
 * API 文档: https://www.volcengine.com/docs/82379/1521309
 */

interface QueryVideoTaskResponse {
  code: number;
  msg: string;
  data?: {
    task_id: string;
    status: "pending" | "processing" | "success" | "failed";
    video_url?: string;
    cover_url?: string;
    error_msg?: string;
    created_at?: string;
    finished_at?: string;
  };
}

const BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";

export async function queryVideoTask(
  apiKey: string,
  taskId: string
): Promise<QueryVideoTaskResponse> {
  if (!taskId) {
    throw new Error("task_id 不能为空");
  }

  try {
    const response = await fetch(
      `${BASE_URL}/contents/generations/tasks/${taskId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const result: QueryVideoTaskResponse = await response.json();

    // 只在 HTTP 响应不成功时抛出错误
    // 如果 code 不是 0，但响应是 200，仍然返回结果（可能是任务处理中）
    if (!response.ok) {
      throw new Error(
        `查询视频任务失败: ${result.msg || response.statusText}`
      );
    }

    return result;
  } catch (error) {
    throw new Error(
      `查询视频任务请求失败: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
