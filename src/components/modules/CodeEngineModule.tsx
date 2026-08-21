import React, { useState, useMemo, useEffect } from "react";
import { EXTENDED_PYTHON_SNIPPETS, ExtendedPythonSnippet } from "../../data/pythonCodeSnippets";
import {
  runSciPyEOQOptimization,
  runSimPyDiscreteSimulation,
  runNewsvendorMonteCarlo,
  runSafetyStockOptimizer,
  SimulationResult,
} from "../../utils/pythonSimEngine";
import { PythonVisualizerWindow } from "./PythonVisualizerWindow";
import {
  Play,
  Copy,
  Check,
  Download,
  Terminal,
  FileCode,
  Sparkles,
  RefreshCw,
  Sliders,
  HelpCircle,
  Layers,
} from "lucide-react";

export const CodeEngineModule: React.FC = () => {
  const [selectedSnippetId, setSelectedSnippetId] = useState<string>(EXTENDED_PYTHON_SNIPPETS[0].id);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  // Active Snippet
  const activeSnippet: ExtendedPythonSnippet = useMemo(() => {
    return EXTENDED_PYTHON_SNIPPETS.find((s) => s.id === selectedSnippetId) || EXTENDED_PYTHON_SNIPPETS[0];
  }, [selectedSnippetId]);

  // Parameters state per snippet
  const [paramsState, setParamsState] = useState<Record<string, Record<string, number>>>({
    scipy_eoq_epq: { demand: 12000, orderCost: 200, holdingCost: 2.5, shortageCost: 25.0, prodRate: 30000 },
    simpy_s_S_discrete: { s: 80, S: 320, leadTime: 3.0, demandMean: 25.0, demandStd: 6.0, simDays: 60 },
    newsvendor_monte_carlo: { price: 90.0, cost: 45.0, salvage: 20.0, meanDemand: 100.0, stdDemand: 25.0, samples: 50000 },
    multi_period_safety_stock: { dailyDemand: 40.0, demandStd: 8.0, leadTimeMean: 5.0, leadTimeStd: 1.2, serviceLevel: 0.95, unitHoldCost: 12.0 },
  });

  // Current simulation result state per snippet
  const [simulationResults, setSimulationResults] = useState<Record<string, SimulationResult>>({});

  // Helper to execute simulation for a snippet
  const computeSimulation = (snippetId: string, currentParams: Record<string, number>): SimulationResult => {
    switch (snippetId) {
      case "scipy_eoq_epq":
        return runSciPyEOQOptimization(currentParams);
      case "simpy_s_S_discrete":
        return runSimPyDiscreteSimulation(currentParams);
      case "newsvendor_monte_carlo":
        return runNewsvendorMonteCarlo(currentParams);
      case "multi_period_safety_stock":
        return runSafetyStockOptimizer(currentParams);
      default:
        return runSciPyEOQOptimization(currentParams);
    }
  };

  // Run initial simulation if not yet present
  useEffect(() => {
    if (!simulationResults[selectedSnippetId]) {
      const defaultParams = paramsState[selectedSnippetId] || {};
      const res = computeSimulation(selectedSnippetId, defaultParams);
      setSimulationResults((prev) => ({ ...prev, [selectedSnippetId]: res }));
    }
  }, [selectedSnippetId]);

  const currentResult: SimulationResult = simulationResults[selectedSnippetId] || computeSimulation(
    selectedSnippetId,
    paramsState[selectedSnippetId] || {}
  );

  const handleParamChange = (paramId: string, value: number) => {
    setParamsState((prev) => ({
      ...prev,
      [selectedSnippetId]: {
        ...(prev[selectedSnippetId] || {}),
        [paramId]: value,
      },
    }));
  };

  const handleRunSimulation = () => {
    setIsExecuting(true);
    setTimeout(() => {
      const curParams = paramsState[selectedSnippetId] || {};
      const res = computeSimulation(selectedSnippetId, curParams);
      setSimulationResults((prev) => ({ ...prev, [selectedSnippetId]: res }));
      setIsExecuting(false);
    }, 350);
  };

  const handleResetParams = () => {
    const defaults: Record<string, number> = {};
    activeSnippet.parameters.forEach((p) => {
      defaults[p.id] = p.default as number;
    });
    setParamsState((prev) => ({
      ...prev,
      [selectedSnippetId]: defaults,
    }));
    const res = computeSimulation(selectedSnippetId, defaults);
    setSimulationResults((prev) => ({ ...prev, [selectedSnippetId]: res }));
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCode = () => {
    const element = document.createElement("a");
    const file = new Blob([activeSnippet.code], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${activeSnippet.id}_inventory.py`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#34495E] rounded-lg p-5 sm:p-6 text-white border border-[#2C3E50] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#2980B9]/30 text-blue-200 border border-[#2980B9]/40 mb-2">
              <Sparkles className="w-3 h-3 text-[#3498DB]" />
              运筹仿真引擎 · Python / SciPy / SimPy / NumPy
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              Python 运筹算法引擎与交互式仿真输出窗口
            </h2>
            <p className="text-xs text-[#BDC3C7] mt-1 max-w-3xl leading-relaxed">
              内置工业级 Python 运筹仿真脚本。点击“运行仿真算法”可即时在右侧/下方输出窗口生成<strong>科学可视化图表 (Matplotlib 风格)</strong>、<strong>逐行终端运行日志</strong>及<strong>决策指标报表</strong>。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleRunSimulation}
              disabled={isExecuting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2980B9] hover:bg-[#3498DB] text-white text-xs font-bold rounded shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isExecuting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>运行仿真算法</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sliced Algorithm Switcher Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {EXTENDED_PYTHON_SNIPPETS.map((snippet) => {
          const isSelected = snippet.id === selectedSnippetId;
          return (
            <button
              key={snippet.id}
              onClick={() => setSelectedSnippetId(snippet.id)}
              className={`p-3.5 rounded-lg text-left border transition-all cursor-pointer ${
                isSelected
                  ? "bg-white border-[#2980B9] ring-2 ring-[#2980B9]/20 text-[#2C3E50] shadow-xs font-semibold"
                  : "bg-white border-[#E1E4E8] text-[#7F8C8D] hover:border-[#BDC3C7] hover:text-[#2C3E50]"
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs">
                <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-[#2980B9]" : "text-[#7F8C8D]"}`} />
                <span className="truncate">{snippet.title}</span>
              </div>
              <div className="text-[10px] text-[#95A5A6] mt-1 font-mono">{snippet.category}</div>
            </button>
          );
        })}
      </div>

      {/* Main Two-Column Layout: Left Python Code Editor + Right Interactive Output Window */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Python Code Editor View */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#1E293B] rounded-lg border border-[#334155] shadow-xs flex flex-col overflow-hidden">
            {/* Editor Window Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#0F172A] border-b border-[#334155] text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E74C3C] inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#F1C40F] inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#2ECC71] inline-block" />
                <span className="ml-2 font-mono text-[#E2E8F0] font-bold">{activeSnippet.id}.py</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyCode}
                  className="p-1 px-2 text-[11px] font-medium text-[#94A3B8] hover:text-white bg-[#1E293B] hover:bg-[#334155] rounded border border-[#334155] transition-colors flex items-center gap-1 cursor-pointer"
                  title="复制代码"
                >
                  {copied ? <Check className="w-3 h-3 text-[#2ECC71]" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "已复制" : "复制"}</span>
                </button>

                <button
                  onClick={handleDownloadCode}
                  className="p-1 px-2 text-[11px] font-medium text-[#94A3B8] hover:text-white bg-[#1E293B] hover:bg-[#334155] rounded border border-[#334155] transition-colors flex items-center gap-1 cursor-pointer"
                  title="下载 Python 脚本文件"
                >
                  <Download className="w-3 h-3" />
                  <span>下载 .py</span>
                </button>
              </div>
            </div>

            {/* Code Block Container */}
            <div className="p-4 font-mono text-[11px] text-[#CBD5E1] leading-relaxed max-h-[500px] overflow-y-auto overflow-x-auto">
              <pre className="text-[#38BDF8]">
                <code>{activeSnippet.code}</code>
              </pre>
            </div>
          </div>

          {/* Code Architecture & External Run Guide Card */}
          <div className="bg-white rounded-lg p-4 border border-[#E1E4E8] shadow-xs space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#E1E4E8]">
              <h4 className="font-bold text-[#2C3E50] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#2980B9]" />
                外部环境直接运行指南 (CLI / Jupyter / PyCharm)
              </h4>
              <span className="px-2 py-0.5 bg-[#27AE60]/10 text-[#27AE60] font-mono text-[10px] rounded font-bold">
                独立完整可运行 · 0 外部项目耦合
              </span>
            </div>

            <p className="text-[#7F8C8D] leading-relaxed">
              当前脚本包含<strong>完整的 main 入口</strong>、<strong>全参数默认值</strong>及 <strong>Matplotlib 图表渲染代码</strong>。复制后可直接粘贴至任意外部环境（如本地 VS Code、PyCharm、Google Colab 或 Linux 终端）运行：
            </p>

            <div className="bg-[#1E293B] text-[#E2E8F0] p-3 rounded font-mono text-[11px] space-y-1.5 border border-[#334155]">
              <div className="text-[#94A3B8] text-[10px]"># 1. 在本地终端安装所需依赖包</div>
              <div className="text-[#38BDF8] select-all">
                pip install {activeSnippet.libraries.map(lib => lib.split('.')[0]).filter((v, i, a) => a.indexOf(v) === i).join(" ")}
              </div>
              <div className="text-[#94A3B8] text-[10px] pt-1"># 2. 运行保存的 Python 脚本</div>
              <div className="text-[#2ECC71] select-all">
                python {activeSnippet.id}.py
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[#95A5A6] text-[11px]">调用库模块:</span>
              {activeSnippet.libraries.map((lib, i) => (
                <span key={i} className="px-2 py-0.5 bg-[#F8F9FA] text-[#2980B9] font-mono text-[10px] rounded border border-[#E1E4E8]">
                  {lib}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Full Interactive Output Window with Visual Plots, Terminal, KPIs, & Tuning */}
        <div className="lg:col-span-7">
          <PythonVisualizerWindow
            snippet={activeSnippet}
            result={currentResult}
            params={paramsState[selectedSnippetId] || {}}
            onParamChange={handleParamChange}
            onRunSimulation={handleRunSimulation}
            onResetParams={handleResetParams}
            isExecuting={isExecuting}
          />
        </div>
      </div>
    </div>
  );
};
