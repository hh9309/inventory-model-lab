import React, { useState, useEffect } from "react";
import {
  BrainCircuit,
  Sparkles,
  Send,
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  Settings,
  Key,
  Cpu,
  CheckCircle2,
  Lock,
  MessageSquare,
  ShieldCheck,
  Globe,
  Sliders,
  Copy,
  Check,
} from "lucide-react";
import {
  LLMConfig,
  MODEL_PRESETS,
  loadLLMConfig,
  callLLM,
} from "../../utils/llmClient";
import { LLMSettingsModal } from "./LLMSettingsModal";
import { LLMChatDialogue } from "./LLMChatDialogue";

export const AiDiagnosisEngineModule: React.FC = () => {
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(loadLLMConfig());
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"diagnosis" | "chat">("chat");

  const [problemDescription, setProblemDescription] = useState<string>(
    "我司经营电子元器件仓储，年总需求约为 20,000 件。目前单次订货固定费为 250 元，单件年持有费 3.5 元。供应商提前期通常为 5 天但存在 ±1.5 天波动。近期发现爆款 SKU 经常突发缺货，而非核心 SKU 却造成数月资金积压，仓储租金与缺货赔付大幅上升。请根据运筹学库存理论进行根因诊断并给出参数调优方案。"
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  useEffect(() => {
    setLlmConfig(loadLLMConfig());
  }, []);

  const activePreset = MODEL_PRESETS[llmConfig.selectedModel] || MODEL_PRESETS["gemini-3-flash"];

  const presetScenarios = [
    {
      title: "电商大促爆款缺货与长尾积压",
      desc: "年需求 20,000 件，订货费 250 元，持有费 3.5 元/件/年，提前期 5±1.5 天，偶发爆款脱销与长尾呆滞。",
    },
    {
      title: "制造业频繁换产与停线待料",
      desc: "生产线年产能 50,000 件，年需求 18,000 件，单次换产调机费 1,200 元，零部件在制品库容告急。",
    },
    {
      title: "生鲜冷链期末残值大幅折价",
      desc: "日均销量 150 盒，标准差 40 盒，进价 35 元，售价 70 元，期末未售出残值仅 10 元，滞销损耗严重。",
    },
    {
      title: "医药急救品高服务水平安全库存",
      desc: "关键药品年需求 3,000 支，提前期 10 天且波动大，要求周期服务水平必须达到 99.5% 且避免过期废弃。",
    },
  ];

  const handleRunDiagnosis = async (customPrompt?: string) => {
    const promptToSend = customPrompt || problemDescription;
    if (!promptToSend.trim()) return;

    if (!llmConfig.apiKey || !llmConfig.apiKey.trim()) {
      setErrorMsg("请先点击右上角【⚙️ 设置大模型】手工输入 API-Key 并确认保存后再发起诊断！");
      setIsSettingsOpen(true);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setAiReport(null);

    const diagnosticSystemPrompt = `你是一位世界顶级的运筹学 (Operations Research) 与供应链库存控制系统科学家。
请针对用户提供的企业库存痛点与参数，严格按照以下四部分结构输出专业的运筹学诊断报告：
1. 【库存痛点与根因定量剖析】：识别业务矛盾点（批量过小导致订货频次过高、还是安全库存不足导致缺货等）。
2. 【匹配运筹学经典模型推荐】：明确说明适用经典 EOQ、EPQ 生产批量、允许缺货 Backorder、(s, S) 随机控制律还是 Newsvendor 报童模型，并给出理论依据。
3. 【关键参数代入与量化调优计算】：列出公式（如最优批量 Q*、安全库存 SS、再订货点 ROP 或临界分位数 CR*），代入数据并给出精确数值解。
4. 【落地执行与敏感度管控建议】：针对提前期波动、供应商协同及安全库存策略提出切实可行的管理动作。`;

    try {
      const response = await callLLM(promptToSend, [], llmConfig, diagnosticSystemPrompt);
      setAiReport(response);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "AI 诊断接口调用失败，请检查网络或 API-Key 设置");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!aiReport) return;
    navigator.clipboard.writeText(aiReport);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Sliced Header with Small Gear LLM Settings Icon */}
      <div className="bg-[#34495E] rounded-lg p-5 sm:p-6 text-white border border-[#2C3E50] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#2980B9]/40 text-blue-200 rounded border border-[#2980B9]/50">
                <BrainCircuit className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>08. AI 智能库存诊断与参数调优引擎</span>
              </h2>
            </div>
            <p className="text-xs text-[#BDC3C7] mt-1.5 leading-relaxed max-w-3xl">
              结合运筹学大模型知识库，支持 <strong>Gemini 3 Flash</strong> 与 <strong>DeepSeek-V4-Pro</strong> 双引擎，对复杂企业仓储场景进行根因剖析、模型匹配推荐、最优参数计算与智能交互问答。
            </p>
          </div>

          {/* Model Status & Settings Trigger Button */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Active Model Indicator Tag */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#2C3E50] border border-white/10 text-xs">
              <Cpu className="w-3.5 h-3.5 text-[#3498DB]" />
              <span className="font-mono text-[#E2E8F0] font-bold">{activePreset.name}</span>
              {llmConfig.apiKey && llmConfig.apiKey.trim() ? (
                <span className="w-2 h-2 rounded-full bg-[#2ECC71]" title="API-Key 已配置" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-[#E74C3C]" title="未配置 API-Key" />
              )}
            </div>

            {/* Gear Button for LLM Settings */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2980B9] hover:bg-[#3498DB] text-white text-xs font-bold rounded shadow-xs transition-colors cursor-pointer"
              title="设置大模型与输入 API-Key"
            >
              <Settings className="w-4 h-4" />
              <span>设置大模型</span>
            </button>
          </div>
        </div>

        {/* Quick Functional Sub-Tab Selector */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-3 py-1.5 rounded font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "chat"
                ? "bg-white text-[#2C3E50] shadow-xs font-bold"
                : "text-[#BDC3C7] hover:text-white"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>大模型交互式问答对话框</span>
          </button>

          <button
            onClick={() => setActiveTab("diagnosis")}
            className={`px-3 py-1.5 rounded font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "diagnosis"
                ? "bg-white text-[#2C3E50] shadow-xs font-bold"
                : "text-[#BDC3C7] hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>企业库存痛点智能诊断报告</span>
          </button>
        </div>
      </div>

      {/* Main View Area: Chat Dialogue Tab or Scenario Diagnosis Tab */}
      {activeTab === "chat" ? (
        <LLMChatDialogue
          config={llmConfig}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      ) : (
        <div className="space-y-6">
          {/* Preset Scenarios Slices */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-[#7F8C8D] uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-[#2980B9]" />
              典型企业仓储痛点案例 (点击一键载入场景并启动推演)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {presetScenarios.map((scenario, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setProblemDescription(scenario.desc);
                    handleRunDiagnosis(scenario.desc);
                  }}
                  className="p-3.5 rounded-lg text-left bg-white border border-[#E1E4E8] hover:border-[#2980B9] hover:bg-[#F8F9FA] transition-all shadow-2xs group cursor-pointer"
                >
                  <div className="text-xs font-bold text-[#2C3E50] group-hover:text-[#2980B9] flex items-center justify-between">
                    <span>{scenario.title}</span>
                    <Sparkles className="w-3 h-3 text-[#2980B9] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[11px] text-[#7F8C8D] mt-1 line-clamp-2 leading-relaxed font-sans">{scenario.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Input Box & Trigger */}
          <div className="bg-white rounded-lg p-5 border border-[#E1E4E8] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#2C3E50] uppercase tracking-wider">
                自定义企业库存痛点与业务参数描述
              </label>
              <span className="text-[11px] text-[#7F8C8D]">
                当前调用引擎：<strong className="text-[#2C3E50]">{activePreset.name}</strong>
              </span>
            </div>

            <textarea
              rows={4}
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="请输入您的行业、需求量、订货固定费、仓储成本、提前期波动及当前面临的库存痛点..."
              className="w-full p-3.5 text-xs text-[#2C3E50] bg-[#FAFBFC] rounded-lg border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#2980B9] focus:bg-white leading-relaxed resize-none font-sans"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-[#95A5A6]">
                支持输入非结构化文本，大模型将自动提炼需求 $D$、订货费 $K$、持有费 $h$ 与提前期 $L$ 并进行公式代入
              </span>

              <button
                onClick={() => handleRunDiagnosis()}
                disabled={isLoading || !problemDescription.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2980B9] hover:bg-[#3498DB] text-white text-xs font-bold rounded-lg shadow-xs transition-all disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isLoading ? `${activePreset.name} 深度诊断推演中...` : "启动 AI 智能诊断"}</span>
              </button>
            </div>
          </div>

          {/* Diagnosis Report Output */}
          {errorMsg && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold cursor-pointer"
              >
                去配置 API-Key
              </button>
            </div>
          )}

          {aiReport && (
            <div className="bg-white rounded-lg p-6 border border-[#E1E4E8] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E1E4E8]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#2980B9]" />
                  <h3 className="text-sm font-bold text-[#2C3E50]">AI 智能运筹诊断与优化建议报告</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#2980B9] bg-[#F8F9FA] px-2 py-0.5 rounded border border-[#E1E4E8]">
                    {activePreset.name} Engine
                  </span>
                  <button
                    onClick={handleCopyReport}
                    className="p-1 px-2 text-[11px] text-[#7F8C8D] hover:text-[#2C3E50] bg-[#F8F9FA] hover:bg-[#E1E4E8] rounded border border-[#E1E4E8] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedReport ? <Check className="w-3 h-3 text-[#27AE60]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedReport ? "已复制" : "复制报告"}</span>
                  </button>
                </div>
              </div>

              <div className="text-xs text-[#2C3E50] leading-relaxed space-y-3 whitespace-pre-wrap font-sans bg-[#FAFBFC] p-4 sm:p-5 rounded-lg border border-[#E1E4E8]">
                {aiReport}
              </div>
            </div>
          )}
        </div>
      )}

      {/* LLM Settings Modal */}
      <LLMSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={llmConfig}
        onSaveConfig={(newCfg) => setLlmConfig(newCfg)}
      />
    </div>
  );
};
