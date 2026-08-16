export type SupportedModelId = "gemini-3-flash" | "deepseek-v4-pro";

export interface LLMConfig {
  selectedModel: SupportedModelId;
  apiKey: string;
  customEndpoint?: string;
  temperature?: number;
  isConfirmed: boolean;
}

export const MODEL_PRESETS: Record<
  SupportedModelId,
  {
    id: SupportedModelId;
    name: string;
    badge: string;
    provider: "Google" | "DeepSeek";
    defaultEndpoint: string;
    description: string;
    placeholderKey: string;
    apiDocUrl: string;
  }
> = {
  "gemini-3-flash": {
    id: "gemini-3-flash",
    name: "Gemini 3 Flash",
    badge: "Google GenAI",
    provider: "Google",
    defaultEndpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    description: "Google 最新一代极速推理大模型，针对运筹学数学公式推导、复杂仓储多约束建模具有卓越的上下文与多模态解析能力。",
    placeholderKey: "AIzaSy...",
    apiDocUrl: "https://aistudio.google.com/app/apikey",
  },
  "deepseek-v4-pro": {
    id: "deepseek-v4-pro",
    name: "DeepSeek-V4-Pro",
    badge: "DeepSeek R1/V3",
    provider: "DeepSeek",
    defaultEndpoint: "https://api.deepseek.com/chat/completions",
    description: "DeepSeek 深度逻辑推理与运筹优化专业版模型，具备极强的代数推导、数学证明与参数全局敏感度剖析能力。",
    placeholderKey: "sk-...",
    apiDocUrl: "https://platform.deepseek.com/api_keys",
  },
};

const STORAGE_KEY = "or_lab_llm_config_v2";

export function loadLLMConfig(): LLMConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        selectedModel: parsed.selectedModel || "gemini-3-flash",
        apiKey: parsed.apiKey || "",
        customEndpoint: parsed.customEndpoint || "",
        temperature: parsed.temperature ?? 0.3,
        isConfirmed: Boolean(parsed.isConfirmed && parsed.apiKey),
      };
    }
  } catch (e) {
    console.error("Failed to load LLM config from localStorage", e);
  }
  return {
    selectedModel: "gemini-3-flash",
    apiKey: "",
    customEndpoint: "",
    temperature: 0.3,
    isConfirmed: false,
  };
}

export function saveLLMConfig(config: LLMConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save LLM config to localStorage", e);
  }
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  modelUsed?: string;
  isStreaming?: boolean;
}

export const SYSTEM_INSTRUCTION_INVENTORY = `你是一位世界顶级的运筹学 (Operations Research) 与供应链库存控制系统科学家。
你的职责是基于严谨的运筹学数学理论（包括经典 EOQ、EPQ 生产批量、(s, S) 随机控制律、报童单周期临界比率 Critical Fractile、双随机提前期安全库存公式等），为用户提供深度诊断、根因分析、公式推导、量化参数调优以及实操建议。
请保持专业、严谨、逻辑清晰，优先给出精确公式、参数代入计算步骤与清晰的商业落地决策。`;

export async function callLLM(
  prompt: string,
  history: ChatMessage[],
  config: LLMConfig,
  customSystemPrompt?: string
): Promise<string> {
  const apiKey = config.apiKey?.trim();
  if (!apiKey) {
    throw new Error("请先点击右上角【⚙️ 设置大模型】图标，手工输入 API-Key 并确认保存大模型后再发起调用。");
  }

  const systemPrompt = customSystemPrompt || SYSTEM_INSTRUCTION_INVENTORY;
  const modelId = config.selectedModel;

  if (modelId === "gemini-3-flash") {
    return callGeminiAPI(prompt, history, apiKey, systemPrompt, config.temperature);
  } else if (modelId === "deepseek-v4-pro") {
    return callDeepSeekAPI(prompt, history, apiKey, config.customEndpoint, systemPrompt, config.temperature);
  } else {
    throw new Error(`未支持的大模型类型: ${modelId}`);
  }
}

// 1. Google Gemini Browser Direct Fetch
async function callGeminiAPI(
  prompt: string,
  history: ChatMessage[],
  apiKey: string,
  systemPrompt: string,
  temperature: number = 0.3
): Promise<string> {
  // Use gemini-2.5-flash endpoint
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  // Construct Gemini format contents
  const contents: any[] = [];

  // Add relevant history
  const recentHistory = history.filter((m) => m.role === "user" || m.role === "assistant").slice(-8);
  for (const msg of recentHistory) {
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    });
  }

  // Add current prompt
  contents.push({
    role: "user",
    parts: [{ text: prompt }],
  });

  const payload = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: 2048,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.error?.message || `Gemini API 调用异常 (HTTP ${res.status})`;
    if (res.status === 400 && message.includes("API key not valid")) {
      throw new Error("Gemini API-Key 无效或已过期，请在设置中重新核对。");
    }
    throw new Error(`Gemini 接口响应错误: ${message}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const responseText = candidate?.content?.parts?.[0]?.text;

  if (!responseText) {
    throw new Error("Gemini 大模型返回了空响应，请检查输入或稍后重试。");
  }

  return responseText;
}

// 2. DeepSeek OpenAI-compatible Browser Direct Fetch
async function callDeepSeekAPI(
  prompt: string,
  history: ChatMessage[],
  apiKey: string,
  customEndpoint?: string,
  systemPrompt?: string,
  temperature: number = 0.3
): Promise<string> {
  const url = (customEndpoint && customEndpoint.trim()) || "https://api.deepseek.com/chat/completions";

  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  const recentHistory = history.filter((m) => m.role === "user" || m.role === "assistant").slice(-8);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    });
  }

  messages.push({ role: "user", content: prompt });

  const payload = {
    model: "deepseek-chat",
    messages,
    temperature,
    max_tokens: 2048,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.error?.message || `DeepSeek API 调用异常 (HTTP ${res.status})`;
    if (res.status === 401) {
      throw new Error("DeepSeek API-Key 无效或未授权，请检查密钥是否正确。");
    }
    throw new Error(`DeepSeek 接口响应错误: ${message}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  const responseText = choice?.message?.content;

  if (!responseText) {
    throw new Error("DeepSeek 大模型返回了空响应，请检查输入或稍后重试。");
  }

  return responseText;
}
