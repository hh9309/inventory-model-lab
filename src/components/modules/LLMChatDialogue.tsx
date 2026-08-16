import React, { useState, useRef, useEffect } from "react";
import {
  ChatMessage,
  LLMConfig,
  MODEL_PRESETS,
  callLLM,
} from "../../utils/llmClient";
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  Key,
  Settings,
  Lightbulb,
  Cpu,
} from "lucide-react";

interface LLMChatDialogueProps {
  config: LLMConfig;
  onOpenSettings: () => void;
}

export const LLMChatDialogue: React.FC<LLMChatDialogueProps> = ({
  config,
  onOpenSettings,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "您好！我是您的运筹学与供应链库存智能学术助手。我已经准备好回答关于经典 EOQ、EPQ 生产批量、(s, S) 随机控制律、报童模型 (Newsvendor) 以及多周期动态安全库存的数学推导、模型选型与业务落地问题。\n\n请在下方输入您的问题，或点击快捷推荐问题开始对话！",
      timestamp: "刚刚",
      modelUsed: MODEL_PRESETS[config.selectedModel]?.name || "Gemini 3 Flash",
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activePreset = MODEL_PRESETS[config.selectedModel] || MODEL_PRESETS["gemini-3-flash"];

  const quickPrompts = [
    "如何根据日常需求波动推导最优安全库存 (SS) 与再订货点 (ROP)？",
    "如果供应商提前期从 3 天延长至 7 天，我的经济订货批量和库存应该如何调整？",
    "请推导允许缺货 (Backorders) EOQ 模型的极小化总成本公式及最优缺货量。",
    "请用边际分析法推导单周期报童模型 (Newsvendor) 的临界比率公式。",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt) return;

    if (!config.apiKey || !config.apiKey.trim()) {
      setErrorMessage("请先配置 API-Key！请点击右上角【⚙️ 设置大模型】手工输入密钥并确认。");
      return;
    }

    setErrorMessage(null);
    const userMsgId = `user-${Date.now()}`;
    const newUserMessage: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInputPrompt("");
    setIsSending(true);

    try {
      const responseText = await callLLM(prompt, updatedMessages, config);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: activePreset.name,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "大模型响应失败，请检查网络或 API-Key 设置");
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: "对话历史已清空。您可以继续提问任何运筹学与供应链库存决策问题！",
        timestamp: "刚刚",
        modelUsed: activePreset.name,
      },
    ]);
    setErrorMessage(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E1E4E8] shadow-xs flex flex-col overflow-hidden">
      {/* Dialogue Header */}
      <div className="bg-[#2C3E50] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#34495E]">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 bg-[#34495E] rounded-lg text-[#3498DB]">
            <MessageSquare className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">大模型智能库存问答与交互对话框</h3>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-[#2980B9] text-white rounded font-semibold flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                {activePreset.name}
              </span>
            </div>
            <p className="text-[11px] text-[#BDC3C7]">实时运筹推演 · 业务疑难解答 · 多轮多约束连续交互</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearHistory}
            className="p-1.5 text-xs text-[#BDC3C7] hover:text-white bg-[#34495E] hover:bg-[#4A6278] rounded-lg border border-white/10 transition-colors flex items-center gap-1 cursor-pointer"
            title="清空对话"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">清空历史</span>
          </button>
        </div>
      </div>

      {/* API-Key Not Configured Warning Banner */}
      {(!config.apiKey || !config.apiKey.trim()) && (
        <div className="bg-amber-50 px-5 py-3 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>尚未配置 API-Key：</strong> 所有大模型调用必须先手工输入对应 API-Key 后方可发起问答。
            </span>
          </div>
          <button
            onClick={onOpenSettings}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-2xs transition-colors flex items-center gap-1 text-xs shrink-0 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>立即配置大模型</span>
          </button>
        </div>
      )}

      {/* Messages Thread Container */}
      <div className="p-4 sm:p-5 flex-1 min-h-[360px] max-h-[500px] overflow-y-auto space-y-4 bg-[#FAFBFC]">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  isUser
                    ? "bg-[#2980B9] text-white"
                    : "bg-[#2C3E50] text-[#3498DB] border border-[#34495E]"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[85%] space-y-1 ${isUser ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-2 text-[10px] text-[#95A5A6] px-1">
                  <span>{isUser ? "提问者" : msg.modelUsed || activePreset.name}</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed break-words relative group ${
                    isUser
                      ? "bg-[#2980B9] text-white rounded-tr-xs shadow-xs"
                      : "bg-white text-[#2C3E50] border border-[#E1E4E8] rounded-tl-xs shadow-2xs whitespace-pre-wrap font-sans"
                  }`}
                >
                  {msg.content}

                  {!isUser && (
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="absolute top-2 right-2 p-1 text-[#95A5A6] hover:text-[#2C3E50] bg-[#F8F9FA] rounded opacity-0 group-hover:opacity-100 transition-opacity border border-[#E1E4E8] cursor-pointer"
                      title="复制回答"
                    >
                      {copiedMsgId === msg.id ? (
                        <Check className="w-3 h-3 text-[#27AE60]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#2C3E50] text-[#3498DB] flex items-center justify-center shrink-0 border border-[#34495E]">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white p-3.5 rounded-2xl rounded-tl-xs border border-[#E1E4E8] shadow-2xs flex items-center gap-2 text-xs text-[#7F8C8D]">
              <Sparkles className="w-3.5 h-3.5 text-[#2980B9] animate-spin" />
              <span>{activePreset.name} 正在深度推演运筹解法中...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Carousel */}
      <div className="px-4 py-2.5 bg-[#F8F9FA] border-t border-[#E1E4E8] overflow-x-auto flex items-center gap-2 text-xs">
        <span className="text-[11px] text-[#7F8C8D] font-bold shrink-0 flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-[#F1C40F]" />
          推荐提问：
        </span>
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            disabled={isSending}
            className="px-2.5 py-1 bg-white hover:bg-[#EBF5FB] text-[#2C3E50] hover:text-[#2980B9] border border-[#E1E4E8] hover:border-[#2980B9] rounded-full text-[11px] whitespace-nowrap transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={onOpenSettings}
            className="text-xs text-rose-800 underline font-bold cursor-pointer"
          >
            去设置
          </button>
        </div>
      )}

      {/* Input Box & Action Bar */}
      <div className="p-3 sm:p-4 bg-white border-t border-[#E1E4E8] flex items-center gap-2">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder={`向 ${activePreset.name} 提问库存运筹学公式、业务调优或代码方案 (按回车发送)...`}
          disabled={isSending}
          className="flex-1 px-4 py-2.5 text-xs text-[#2C3E50] bg-[#F8F9FA] rounded-xl border border-[#E1E4E8] focus:outline-none focus:ring-2 focus:ring-[#2980B9] focus:bg-white transition-all font-sans"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={isSending || !inputPrompt.trim()}
          className="px-4 py-2.5 bg-[#2980B9] hover:bg-[#3498DB] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>发送</span>
        </button>
      </div>
    </div>
  );
};
