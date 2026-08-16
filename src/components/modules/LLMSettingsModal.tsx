import React, { useState } from "react";
import {
  LLMConfig,
  MODEL_PRESETS,
  SupportedModelId,
  saveLLMConfig,
} from "../../utils/llmClient";
import {
  Settings,
  Key,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Lock,
  X,
  Sparkles,
  Sliders,
  ShieldCheck,
  Check,
} from "lucide-react";

interface LLMSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LLMConfig;
  onSaveConfig: (newConfig: LLMConfig) => void;
}

export const LLMSettingsModal: React.FC<LLMSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [selectedModel, setSelectedModel] = useState<SupportedModelId>(config.selectedModel);
  const [apiKey, setApiKey] = useState<string>(config.apiKey);
  const [customEndpoint, setCustomEndpoint] = useState<string>(config.customEndpoint || "");
  const [temperature, setTemperature] = useState<number>(config.temperature ?? 0.3);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [savedToast, setSavedToast] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPreset = MODEL_PRESETS[selectedModel];

  const handleConfirmSave = () => {
    if (!apiKey.trim()) {
      setValidationError("请输入有效的 API-Key 后再确认大模型设置！");
      return;
    }

    setValidationError(null);
    const newConfig: LLMConfig = {
      selectedModel,
      apiKey: apiKey.trim(),
      customEndpoint: customEndpoint.trim(),
      temperature,
      isConfirmed: true,
    };

    saveLLMConfig(newConfig);
    onSaveConfig(newConfig);
    setSavedToast(true);

    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-[#E1E4E8] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#2C3E50] text-white px-6 py-4 flex items-center justify-between border-b border-[#34495E]">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-[#34495E] rounded-lg text-[#3498DB]">
              <Settings className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold tracking-tight">大模型配置与 API-Key 凭证管理</h3>
              <p className="text-xs text-[#BDC3C7]">纯浏览器直连调用 · 凭证本地安全持久化存储</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#BDC3C7] hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#FAFBFC]">
          {/* Security & GitHub Deployment Notice */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#2980B9] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>GitHub / Netlify 部署说明：</strong>
              本实验室为纯客户端静态应用，所有 API 请求均在您的浏览器本地发起直连，<strong>API-Key 仅加密保存在本地浏览器 LocalStorage 中</strong>，绝不上传任何中间服务器，确保密钥安全。
            </div>
          </div>

          {/* STEP 1: MODEL SELECTION (选择两个大模型) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#2980B9] text-white flex items-center justify-center text-[10px] font-bold">1</span>
                选择大模型引擎 (LLM Selection)
              </label>
              <span className="text-[11px] text-[#7F8C8D]">支持 Gemini 3 与 DeepSeek V4 双引擎</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Gemini 3 Flash */}
              <button
                type="button"
                onClick={() => setSelectedModel("gemini-3-flash")}
                className={`p-4 rounded-xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  selectedModel === "gemini-3-flash"
                    ? "bg-white border-[#2980B9] shadow-sm ring-2 ring-[#2980B9]/20"
                    : "bg-white border-[#E1E4E8] hover:border-[#BDC3C7] text-[#7F8C8D]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2C3E50] flex items-center gap-1.5">
                      <Cpu className={`w-4 h-4 ${selectedModel === "gemini-3-flash" ? "text-[#2980B9]" : "text-[#7F8C8D]"}`} />
                      gemini 3 flash
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-[#2980B9]">
                      Google
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7F8C8D] mt-2 leading-relaxed">
                    Google 旗舰级极速推理大模型，对多阶段库存数学模型推导、公式代入与多约束运筹诊断极具优势。
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#E1E4E8] flex items-center justify-between text-[11px]">
                  <span className="text-[#95A5A6]">响应速度: &lt; 0.8s</span>
                  {selectedModel === "gemini-3-flash" && (
                    <span className="text-[#2980B9] font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 已选中
                    </span>
                  )}
                </div>
              </button>

              {/* Option 2: DeepSeek-v4-pro */}
              <button
                type="button"
                onClick={() => setSelectedModel("deepseek-v4-pro")}
                className={`p-4 rounded-xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  selectedModel === "deepseek-v4-pro"
                    ? "bg-white border-[#2980B9] shadow-sm ring-2 ring-[#2980B9]/20"
                    : "bg-white border-[#E1E4E8] hover:border-[#BDC3C7] text-[#7F8C8D]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2C3E50] flex items-center gap-1.5">
                      <Cpu className={`w-4 h-4 ${selectedModel === "deepseek-v4-pro" ? "text-[#2980B9]" : "text-[#7F8C8D]"}`} />
                      deepseek-v4-pro
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700">
                      DeepSeek
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7F8C8D] mt-2 leading-relaxed">
                    DeepSeek 专业深度逻辑优化版模型，具备超强的数学命题证明、运筹学极值分析与代码推演能力。
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#E1E4E8] flex items-center justify-between text-[11px]">
                  <span className="text-[#95A5A6]">思维链深度: 深度推理</span>
                  {selectedModel === "deepseek-v4-pro" && (
                    <span className="text-[#2980B9] font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 已选中
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* STEP 2: MANUAL API KEY INPUT (手工输入 API-Key) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#2980B9] text-white flex items-center justify-center text-[10px] font-bold">2</span>
                手工输入 {currentPreset.name} API-Key
              </label>
              <a
                href={currentPreset.apiDocUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#2980B9] hover:underline flex items-center gap-1 font-medium"
              >
                <span>获取官方密钥</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#95A5A6]">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder={`请输入您的 ${currentPreset.name} API Key (例如 ${currentPreset.placeholderKey})`}
                className="w-full pl-10 pr-20 py-2.5 text-xs text-[#2C3E50] bg-white rounded-xl border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#2980B9] focus:border-transparent font-mono shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#7F8C8D] hover:text-[#2C3E50] text-xs cursor-pointer"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {validationError && (
              <p className="text-[11px] text-[#E74C3C] font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{validationError}</span>
              </p>
            )}

            <p className="text-[11px] text-[#7F8C8D]">
              密钥仅存放于您的个人浏览器端（LocalStorage），发起诊断与问答时将直接向官方 API 认证。
            </p>
          </div>

          {/* Advanced Endpoint & Temperature Setting (Collapsible) */}
          <div className="border-t border-[#E1E4E8] pt-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-[#7F8C8D] hover:text-[#2C3E50] font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showAdvanced ? "收起高级推理参数" : "展开高级推理参数 (温度系数 / 自定义代理 Base URL)"}</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 p-4 bg-white rounded-xl border border-[#E1E4E8] space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-[#2C3E50]">推理温度系数 (Temperature)</span>
                    <span className="font-mono text-[#2980B9] font-bold">{temperature}</span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={1.0}
                    step={0.05}
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-[#2980B9] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#95A5A6] mt-0.5">
                    <span>0.0 (最严谨数学推导)</span>
                    <span>1.0 (高发散灵感)</span>
                  </div>
                </div>

                {selectedModel === "deepseek-v4-pro" && (
                  <div>
                    <label className="block text-xs font-semibold text-[#2C3E50] mb-1">
                      自定义 DeepSeek API 代理 Base URL (可选)
                    </label>
                    <input
                      type="text"
                      value={customEndpoint}
                      onChange={(e) => setCustomEndpoint(e.target.value)}
                      placeholder="https://api.deepseek.com/chat/completions"
                      className="w-full p-2 text-xs bg-[#F8F9FA] rounded-lg border border-[#E1E4E8] font-mono text-[#2C3E50] focus:outline-none focus:ring-1 focus:ring-[#2980B9]"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* STEP 3: CONFIRMATION & FOOTER (确认大模型) */}
        <div className="bg-[#F8F9FA] px-6 py-4 border-t border-[#E1E4E8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-[#7F8C8D] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#27AE60]" />
            <span>当前选择：<strong className="text-[#2C3E50]">{currentPreset.name}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#7F8C8D] hover:text-[#2C3E50] bg-white hover:bg-slate-100 rounded-xl border border-[#CBD5E1] transition-colors cursor-pointer"
            >
              取消
            </button>

            <button
              type="button"
              onClick={handleConfirmSave}
              className="px-5 py-2 text-xs font-bold text-white bg-[#2980B9] hover:bg-[#3498DB] rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {savedToast ? <Check className="w-4 h-4 text-white" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{savedToast ? "已确认并保存！" : "3. 确认大模型配置"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
