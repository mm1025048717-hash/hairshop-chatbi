type DeepSeekRole = 'system' | 'user' | 'assistant';

export type DeepSeekMessage = {
  role: DeepSeekRole;
  content: string;
};

export type DeepSeekChatOptions = {
  model?: 'deepseek-chat' | 'deepseek-reasoner';
  temperature?: number;
};

// DeepSeek API配置
// 优先使用环境变量，如果没有则使用默认值（仅用于开发测试）
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY || 'sk-067ac9f5b8474183b49639fd74bda259';
const REQUEST_TIMEOUT = 30000; // 30秒超时

// 检测是否在浏览器环境运行，使用代理服务器绕过CORS
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return 'http://localhost:3001/api';
  }
  return 'https://api.deepseek.com';
}

export function isDeepSeekEnabled(): boolean {
  return true;
}

// 带超时的fetch
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function deepseekChat(messages: DeepSeekMessage[], opts: DeepSeekChatOptions = {}): Promise<string> {
  const model = opts.model || 'deepseek-chat';
  const baseUrl = getBaseUrl();
  
  // 默认温度0.8，更自然的对话
  const temperature = typeof opts.temperature === 'number' ? opts.temperature : 0.8;
  
  const body = {
    model,
    messages,
    stream: false,
    temperature,
    max_tokens: 800,
    top_p: 0.9,
  };

  console.log('[DeepSeek] 请求:', { model, msgs: messages.length, temp: temperature });

  try {
    const res = await fetchWithTimeout(
      `${baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify(body),
      },
      REQUEST_TIMEOUT
    );

    const json = await res.json();
    
    if (!res.ok) {
      const errorMsg = json?.error?.message || `API错误: ${res.status}`;
      console.error('[DeepSeek] 错误:', errorMsg);
      throw new Error(errorMsg);
    }

    const content = json?.choices?.[0]?.message?.content;
    
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('AI返回空响应');
    }

    console.log('[DeepSeek] 响应:', content.slice(0, 80));
    return content.trim();
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('[DeepSeek] 请求超时');
      throw new Error('请求超时，请稍后重试');
    }
    console.error('[DeepSeek] 失败:', error.message);
    throw error;
  }
}
