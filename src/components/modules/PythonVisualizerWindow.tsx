import React, { useState } from "react";
import {
  ExtendedPythonSnippet,
} from "../../data/pythonCodeSnippets";
import {
  SimulationResult,
} from "../../utils/pythonSimEngine";
import {
  Terminal,
  BarChart3,
  Sliders,
  TableProperties,
  Copy,
  Check,
  Download,
  RotateCcw,
  Sparkles,
  Play,
  TrendingUp,
  Activity,
  Layers,
  ArrowUpRight,
} from "lucide-react";

interface PythonVisualizerWindowProps {
  snippet: ExtendedPythonSnippet;
  result: SimulationResult;
  params: Record<string, number>;
  onParamChange: (paramId: string, value: number) => void;
  onRunSimulation: () => void;
  onResetParams: () => void;
  isExecuting: boolean;
}

export const PythonVisualizerWindow: React.FC<PythonVisualizerWindowProps> = ({
  snippet,
  result,
  params,
  onParamChange,
  onRunSimulation,
  onResetParams,
  isExecuting,
}) => {
  const [activeOutputTab, setActiveOutputTab] = useState<"visual" | "terminal" | "kpis" | "params">("visual");
  const [activeChartIndex, setActiveChartIndex] = useState<number>(0);
  const [copiedLog, setCopiedLog] = useState<boolean>(false);

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(result.logs.join("\n"));
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  const handleDownloadLog = () => {
    const blob = new Blob([result.logs.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${snippet.id}_output_${Date.now()}.log`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentChartView = snippet.chartViews[activeChartIndex] || snippet.chartViews[0];

  return (
    <div className="bg-white rounded-lg border border-[#E1E4E8] shadow-xs flex flex-col overflow-hidden">
      {/* Output Window Header & Tabs */}
      <div className="bg-[#2C3E50] text-white p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2C3E50]">
        <div className="flex items-center gap-2">
          <span className="p-1 bg-[#34495E] rounded text-[#3498DB]">
            <Terminal className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white">仿真算法运行输出控制台</span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono bg-[#27AE60]/20 text-[#2ECC71] border border-[#27AE60]/40 rounded">
                SciPy / NumPy Engine
              </span>
            </div>
            <p className="text-[11px] text-[#BDC3C7]">实时计算图表、收敛日志流与决策数据矩阵</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-[#34495E] p-1 rounded border border-white/10 text-xs">
          <button
            onClick={() => setActiveOutputTab("visual")}
            className={`px-3 py-1 font-medium rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeOutputTab === "visual"
                ? "bg-[#2980B9] text-white shadow-xs"
                : "text-[#BDC3C7] hover:text-white"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>科学图表 ({snippet.chartViews.length})</span>
          </button>

          <button
            onClick={() => setActiveOutputTab("terminal")}
            className={`px-3 py-1 font-medium rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeOutputTab === "terminal"
                ? "bg-[#2980B9] text-white shadow-xs"
                : "text-[#BDC3C7] hover:text-white"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>控制台日志</span>
          </button>

          <button
            onClick={() => setActiveOutputTab("kpis")}
            className={`px-3 py-1 font-medium rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeOutputTab === "kpis"
                ? "bg-[#2980B9] text-white shadow-xs"
                : "text-[#BDC3C7] hover:text-white"
            }`}
          >
            <TableProperties className="w-3.5 h-3.5" />
            <span>指标矩阵</span>
          </button>

          <button
            onClick={() => setActiveOutputTab("params")}
            className={`px-3 py-1 font-medium rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeOutputTab === "params"
                ? "bg-[#2980B9] text-white shadow-xs"
                : "text-[#BDC3C7] hover:text-white"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>参数调优</span>
          </button>
        </div>
      </div>

      {/* Main Output Content Area */}
      <div className="p-4 sm:p-5 flex-1 min-h-[380px] bg-[#FAFBFC]">
        {/* 1. VISUAL SCIENTIFIC CHARTS TAB */}
        {activeOutputTab === "visual" && (
          <div className="space-y-4">
            {/* Chart Sub-views Selector */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E1E4E8]">
              <div className="flex items-center gap-1">
                {snippet.chartViews.map((cv, idx) => (
                  <button
                    key={cv.id}
                    onClick={() => setActiveChartIndex(idx)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
                      activeChartIndex === idx
                        ? "bg-[#2980B9] text-white"
                        : "bg-white text-[#7F8C8D] hover:text-[#2C3E50] border border-[#E1E4E8]"
                    }`}
                  >
                    {cv.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#95A5A6]">执行耗时:</span>
                <span className="font-mono font-bold text-[#2980B9] bg-white px-2 py-0.5 rounded border border-[#E1E4E8]">
                  {result.executionTimeMs} ms
                </span>
              </div>
            </div>

            {/* Render Algorithm Specific Visualizer */}
            {snippet.id === "scipy_eoq_epq" && (
              <RenderSciPyVisualizer
                viewId={currentChartView.id}
                chartData={result.chartData}
                kpis={result.kpis}
              />
            )}

            {snippet.id === "simpy_s_S_discrete" && (
              <RenderSimPyVisualizer
                viewId={currentChartView.id}
                chartData={result.chartData}
                kpis={result.kpis}
              />
            )}

            {snippet.id === "newsvendor_monte_carlo" && (
              <RenderNewsvendorVisualizer
                viewId={currentChartView.id}
                chartData={result.chartData}
                kpis={result.kpis}
              />
            )}

            {snippet.id === "multi_period_safety_stock" && (
              <RenderSafetyStockVisualizer
                viewId={currentChartView.id}
                chartData={result.chartData}
                kpis={result.kpis}
              />
            )}
          </div>
        )}

        {/* 2. TERMINAL LOGS STREAM TAB */}
        {activeOutputTab === "terminal" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#7F8C8D]">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#27AE60] animate-pulse" />
                <span>Python 3.11 Runtime Output (STDOUT / STDERR)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLogs}
                  className="px-2.5 py-1 bg-white hover:bg-[#F8F9FA] text-[#2C3E50] border border-[#BDC3C7] rounded flex items-center gap-1 font-medium transition-colors cursor-pointer"
                >
                  {copiedLog ? <Check className="w-3 h-3 text-[#27AE60]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLog ? "已复制" : "复制全部日志"}</span>
                </button>
                <button
                  onClick={handleDownloadLog}
                  className="px-2.5 py-1 bg-white hover:bg-[#F8F9FA] text-[#2C3E50] border border-[#BDC3C7] rounded flex items-center gap-1 font-medium transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>导出 .log</span>
                </button>
              </div>
            </div>

            <div className="bg-[#1E293B] rounded-lg p-4 font-mono text-xs text-[#E2E8F0] min-h-[300px] max-h-[420px] overflow-y-auto leading-relaxed border border-[#334155] shadow-inner">
              {result.logs.map((line, idx) => {
                const isHeader = line.startsWith("===");
                const isSuccess = line.includes("[SUCCESS]") || line.includes("正常完成");
                const isWarning = line.includes("[WARNING]");
                const isIter = line.startsWith("[ITERATION]");
                const isConfig = line.startsWith("[CONFIG]") || line.startsWith("[INFO]");

                let colorClass = "text-[#E2E8F0]";
                if (isHeader) colorClass = "text-[#F1C40F] font-bold";
                else if (isSuccess) colorClass = "text-[#2ECC71] font-bold";
                else if (isWarning) colorClass = "text-[#E74C3C] font-bold";
                else if (isIter) colorClass = "text-[#94A3B8]";
                else if (isConfig) colorClass = "text-[#38BDF8]";

                return (
                  <div key={idx} className={`${colorClass} py-0.5 whitespace-pre-wrap`}>
                    {line}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. KPI NUMERICAL DECISION MATRIX TAB */}
        {activeOutputTab === "kpis" && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#7F8C8D] uppercase tracking-wider">
              运筹学模型核心决策输出指标
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(result.kpis).map(([kpiName, kpiVal], idx) => (
                <div key={idx} className="bg-white p-3.5 rounded border border-[#E1E4E8] shadow-2xs">
                  <div className="text-[11px] text-[#7F8C8D]">{kpiName}</div>
                  <div className="text-lg font-bold font-mono text-[#2C3E50] mt-1">{kpiVal}</div>
                </div>
              ))}
            </div>

            {/* Model Architecture & Formulation notes */}
            <div className="bg-white rounded p-4 border border-[#E1E4E8] space-y-2 text-xs">
              <div className="font-bold text-[#2C3E50] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#2980B9]" />
                数学原理与计算特征
              </div>
              <p className="text-[#7F8C8D] leading-relaxed">{snippet.description}</p>
              <div className="text-[11px] text-[#2980B9] font-mono bg-[#F8F9FA] p-2.5 rounded border border-[#E1E4E8]">
                <strong>载入库：</strong> {snippet.libraries.join(", ")}
              </div>
            </div>
          </div>
        )}

        {/* 4. RUNTIME PARAMETERS TUNING TAB */}
        {activeOutputTab === "params" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E1E4E8]">
              <div>
                <h4 className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider">算法运行时参数实时调优</h4>
                <p className="text-[11px] text-[#7F8C8D]">调节参数滑块后，点击下方“重新运行仿真算法”实时刷新图表与日志</p>
              </div>
              <button
                onClick={onResetParams}
                className="px-2.5 py-1 bg-white hover:bg-[#F8F9FA] text-[#7F8C8D] hover:text-[#2C3E50] border border-[#BDC3C7] rounded text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>重置默认</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {snippet.parameters.map((p) => {
                const currentVal = params[p.id] ?? (p.default as number);
                return (
                  <div key={p.id} className="bg-white p-3.5 rounded border border-[#E1E4E8] shadow-2xs space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-[#2C3E50]">
                        {p.name} ({p.symbol})
                      </span>
                      <span className="font-mono font-bold text-[#2980B9] bg-[#F8F9FA] px-2 py-0.5 rounded border border-[#E1E4E8]">
                        {currentVal} {p.unit}
                      </span>
                    </div>

                    <input
                      type="range"
                      min={p.min}
                      max={p.max}
                      step={p.step}
                      value={currentVal}
                      onChange={(e) => onParamChange(p.id, parseFloat(e.target.value))}
                      className="w-full accent-[#2980B9] cursor-pointer"
                    />

                    <p className="text-[10px] text-[#95A5A6]">{p.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={onRunSimulation}
                disabled={isExecuting}
                className="px-5 py-2.5 bg-[#2980B9] hover:bg-[#3498DB] text-white text-xs font-bold rounded shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>立即重新计算并运行仿真</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Output Window Bottom Quick Action Footer */}
      <div className="bg-[#F8F9FA] px-4 py-2.5 border-t border-[#E1E4E8] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="text-[#7F8C8D] flex items-center gap-2">
          <span>当前算法：<strong className="text-[#2C3E50]">{snippet.title}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveOutputTab("visual")}
            className="text-[#2980B9] hover:underline font-medium cursor-pointer flex items-center gap-0.5"
          >
            <span>查看完整图表</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Sub-components: Chart Renderers for each algorithm
function RenderSciPyVisualizer({ viewId, chartData }: { viewId: string; chartData: any; kpis: any }) {
  if (!chartData) return null;

  if (viewId === "inventory_wave") {
    const wave = chartData.wavePointsEOQ || [];
    const maxVal = Math.max(...wave.map((w: any) => Math.max(w.eoqLevel, w.epqLevel))) || 100;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="font-bold text-[#2C3E50]">库存锯齿波形对比 (EOQ 瞬时到货 vs EPQ 生产边产边销)</div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-[#2980B9] font-medium">
              <span className="w-3 h-0.5 bg-[#2980B9] inline-block" /> EOQ 阶跃锯齿波
            </span>
            <span className="flex items-center gap-1 text-[#27AE60] font-medium">
              <span className="w-3 h-0.5 bg-[#27AE60] inline-block" /> EPQ 梯形渐进波
            </span>
          </div>
        </div>

        <div className="relative w-full h-64 bg-white rounded border border-[#E1E4E8] p-2 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
            {/* Grid */}
            {[0.25, 0.5, 0.75].map((r, i) => (
              <line key={i} x1="30" y1={180 * r} x2="490" y2={180 * r} stroke="#F2F2F2" strokeDasharray="3 3" />
            ))}

            {/* EOQ Line */}
            <polyline
              fill="none"
              stroke="#2980B9"
              strokeWidth="2"
              points={wave
                .map(
                  (w: any, idx: number) =>
                    `${30 + (idx / (wave.length - 1)) * 450},${180 - (w.eoqLevel / maxVal) * 160}`
                )
                .join(" ")}
            />

            {/* EPQ Line */}
            <polyline
              fill="none"
              stroke="#27AE60"
              strokeWidth="2"
              strokeDasharray="4 2"
              points={wave
                .map(
                  (w: any, idx: number) =>
                    `${30 + (idx / (wave.length - 1)) * 450},${180 - (w.epqLevel / maxVal) * 160}`
                )
                .join(" ")}
            />

            {/* Labels */}
            <text x="35" y="195" fill="#95A5A6" fontSize="9">0 天</text>
            <text x="460" y="195" fill="#95A5A6" fontSize="9">时间周期</text>
          </svg>
        </div>
      </div>
    );
  }

  if (viewId === "sensitivity") {
    const sens = chartData.sensitivityData || [];
    return (
      <div className="space-y-3">
        <div className="font-bold text-xs text-[#2C3E50]">参数敏感度剖面 (当 D, K, h 发生 ±30% 扰动时对 Q* 的影响)</div>
        <div className="overflow-x-auto bg-white rounded border border-[#E1E4E8]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8F9FA] text-[#7F8C8D] uppercase font-bold text-[10px] border-b border-[#E1E4E8]">
              <tr>
                <th className="p-2.5">扰动幅度</th>
                <th className="p-2.5">年需求 D 变化时 Q*</th>
                <th className="p-2.5">订货费 K 变化时 Q*</th>
                <th className="p-2.5">持有费 h 变化时 Q*</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E4E8] font-mono">
              {sens.map((s: any, idx: number) => (
                <tr key={idx} className={s.pct === "0%" ? "bg-[#F4F5F7] font-bold text-[#2980B9]" : "text-[#2C3E50]"}>
                  <td className="p-2.5 font-bold">{s.pct}</td>
                  <td className="p-2.5">{s.demandQ.toLocaleString()} 件</td>
                  <td className="p-2.5">{s.orderCostQ.toLocaleString()} 件</td>
                  <td className="p-2.5">{s.holdingCostQ.toLocaleString()} 件</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Default: Cost curve
  const points = chartData.costPoints || [];
  const maxTC = Math.max(...points.map((p: any) => p.tc)) || 1000;
  const qStar = chartData.optimalQ || 1000;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <div className="font-bold text-[#2C3E50]">
          SciPy 目标函数凸优化曲线 (Total Cost TC, Ordering Cost OC, Holding Cost HC)
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-[#2980B9] font-medium">
            <span className="w-3 h-0.5 bg-[#2980B9] inline-block" /> TC(Q)
          </span>
          <span className="flex items-center gap-1 text-[#34495E] font-medium">
            <span className="w-3 h-0.5 bg-[#34495E] inline-block border-dashed" /> OC(Q)
          </span>
          <span className="flex items-center gap-1 text-[#7F8C8D] font-medium">
            <span className="w-3 h-0.5 bg-[#95A5A6] inline-block" /> HC(Q)
          </span>
        </div>
      </div>

      <div className="relative w-full h-64 bg-white rounded border border-[#E1E4E8] p-2 overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
          {/* Grid */}
          {[0.25, 0.5, 0.75].map((r, i) => (
            <line key={i} x1="30" y1={180 * r} x2="490" y2={180 * r} stroke="#F2F2F2" strokeDasharray="3 3" />
          ))}

          {/* Curves */}
          <polyline
            fill="none"
            stroke="#34495E"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            points={points
              .map(
                (p: any, idx: number) =>
                  `${30 + (idx / (points.length - 1)) * 450},${180 - (p.oc / maxTC) * 160}`
              )
              .join(" ")}
          />
          <polyline
            fill="none"
            stroke="#95A5A6"
            strokeWidth="1.5"
            points={points
              .map(
                (p: any, idx: number) =>
                  `${30 + (idx / (points.length - 1)) * 450},${180 - (p.hc / maxTC) * 160}`
              )
              .join(" ")}
          />
          <polyline
            fill="none"
            stroke="#2980B9"
            strokeWidth="2.5"
            points={points
              .map(
                (p: any, idx: number) =>
                  `${30 + (idx / (points.length - 1)) * 450},${180 - (p.tc / maxTC) * 160}`
              )
              .join(" ")}
          />

          {/* Optimal Q drop line */}
          {(() => {
            const optimalIdx = points.findIndex((p: any) => p.q >= qStar);
            if (optimalIdx >= 0) {
              const xOpt = 30 + (optimalIdx / (points.length - 1)) * 450;
              const yOpt = 180 - (points[optimalIdx].tc / maxTC) * 160;
              return (
                <g>
                  <line x1={xOpt} y1="15" x2={xOpt} y2="185" stroke="#2980B9" strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle cx={xOpt} cy={yOpt} r="4" fill="#2980B9" stroke="#ffffff" strokeWidth="2" />
                  <text x={xOpt + 6} y={yOpt - 6} fill="#2980B9" fontSize="10" fontWeight="bold">
                    Q* = {Math.round(qStar)}
                  </text>
                </g>
              );
            }
            return null;
          })()}

          <text x="35" y="195" fill="#95A5A6" fontSize="9">订货量 Q (小)</text>
          <text x="430" y="195" fill="#95A5A6" fontSize="9">订货量 Q (大)</text>
        </svg>
      </div>
    </div>
  );
}

function RenderSimPyVisualizer({ viewId, chartData }: { viewId: string; chartData: any; kpis: any }) {
  if (!chartData) return null;

  if (viewId === "cost_pie") {
    const pie = chartData.costPie || [];
    const total = pie.reduce((acc: number, cur: any) => acc + cur.value, 0) || 1;

    return (
      <div className="space-y-3">
        <div className="font-bold text-xs text-[#2C3E50]">SimPy 累计运营成本结构分解</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {pie.map((item: any, idx: number) => {
            const pct = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={idx} className="bg-white p-3.5 rounded border border-[#E1E4E8] shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs text-[#7F8C8D]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <div className="text-lg font-bold font-mono text-[#2C3E50] mt-1">¥{item.value.toLocaleString()}</div>
                <div className="text-[10px] text-[#95A5A6] mt-0.5">占总成本比重: {pct}%</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Default: Timeline trajectory
  const timeline = chartData.timelineData || [];
  const s = chartData.s;
  const S = chartData.S;
  const maxLevel = Math.max(S * 1.2, ...timeline.map((t: any) => Math.max(t.inventory, t.inventoryPosition))) || 400;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <div className="font-bold text-[#2C3E50]">
          SimPy 离散时序水位轨迹 I(t) 与 订货触发事件
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-[#2980B9] font-medium">
            <span className="w-3 h-0.5 bg-[#2980B9] inline-block" /> 净库存 I(t)
          </span>
          <span className="flex items-center gap-1 text-[#7F8C8D] font-medium">
            <span className="w-3 h-0.5 bg-[#7F8C8D] inline-block border-dashed" /> 订货地位 IP(t)
          </span>
          <span className="flex items-center gap-1 text-[#E74C3C] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#E74C3C] inline-block" /> 下单点
          </span>
        </div>
      </div>

      <div className="relative w-full h-64 bg-white rounded border border-[#E1E4E8] p-2 overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
          {/* Guide lines S and s */}
          {(() => {
            const yS = 180 - (S / maxLevel) * 160;
            const ys = 180 - (s / maxLevel) * 160;
            return (
              <g>
                <line x1="30" y1={yS} x2="490" y2={yS} stroke="#27AE60" strokeWidth="1" strokeDasharray="4 4" />
                <text x="450" y={yS - 4} fill="#27AE60" fontSize="8" fontWeight="bold">S={S}</text>
                <line x1="30" y1={ys} x2="490" y2={ys} stroke="#F1C40F" strokeWidth="1" strokeDasharray="3 3" />
                <text x="450" y={ys - 4} fill="#D68910" fontSize="8" fontWeight="bold">s={s}</text>
              </g>
            );
          })()}

          {/* Zero Line */}
          <line x1="30" y1="180" x2="490" y2="180" stroke="#E1E4E8" strokeWidth="1.5" />

          {/* IP Line */}
          <polyline
            fill="none"
            stroke="#7F8C8D"
            strokeWidth="1.2"
            strokeDasharray="2 2"
            points={timeline
              .map(
                (t: any, idx: number) =>
                  `${30 + (idx / (timeline.length - 1)) * 450},${180 - (Math.max(0, t.inventoryPosition) / maxLevel) * 160}`
              )
              .join(" ")}
          />

          {/* Inventory Line */}
          <polyline
            fill="none"
            stroke="#2980B9"
            strokeWidth="2"
            points={timeline
              .map(
                (t: any, idx: number) =>
                  `${30 + (idx / (timeline.length - 1)) * 450},${180 - (Math.max(0, t.inventory) / maxLevel) * 160}`
              )
              .join(" ")}
          />

          {/* Order dots */}
          {timeline.map((t: any, idx: number) => {
            if (t.orderPlaced > 0) {
              const x = 30 + (idx / (timeline.length - 1)) * 450;
              const y = 180 - (Math.max(0, t.inventory) / maxLevel) * 160;
              return <circle key={idx} cx={x} cy={y} r="3" fill="#E74C3C" stroke="#ffffff" strokeWidth="1" />;
            }
            return null;
          })}

          <text x="35" y="195" fill="#95A5A6" fontSize="9">第 1 天</text>
          <text x="450" y="195" fill="#95A5A6" fontSize="9">第 {timeline.length} 天</text>
        </svg>
      </div>
    </div>
  );
}

function RenderNewsvendorVisualizer({ viewId, chartData }: { viewId: string; chartData: any; kpis: any }) {
  if (!chartData) return null;

  if (viewId === "demand_dist") {
    const hist = chartData.histData || [];
    const maxCount = Math.max(...hist.map((h: any) => Math.max(h.count, h.normalFit))) || 100;

    return (
      <div className="space-y-3">
        <div className="font-bold text-xs text-[#2C3E50]">蒙特卡洛抽样需求频数直方图与正态概率密度拟合曲线</div>
        <div className="relative w-full h-64 bg-white rounded border border-[#E1E4E8] p-2 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
            {hist.map((h: any, idx: number) => {
              const x = 35 + (idx / hist.length) * 440;
              const w = 440 / hist.length - 2;
              const hBar = (h.count / maxCount) * 160;
              const y = 180 - hBar;
              return (
                <rect key={idx} x={x} y={y} width={w} height={hBar} fill="#2980B9" fillOpacity="0.75" rx="1" />
              );
            })}

            {/* Normal fit polyline */}
            <polyline
              fill="none"
              stroke="#E74C3C"
              strokeWidth="2"
              points={hist
                .map(
                  (h: any, idx: number) =>
                    `${35 + ((idx + 0.5) / hist.length) * 440},${180 - (h.normalFit / maxCount) * 160}`
                )
                .join(" ")}
            />

            <text x="35" y="195" fill="#95A5A6" fontSize="9">需求偏小区间</text>
            <text x="440" y="195" fill="#95A5A6" fontSize="9">需求偏大区间</text>
          </svg>
        </div>
      </div>
    );
  }

  // Default: Profit curve
  const points = chartData.profitCurveData || [];
  const maxProfit = Math.max(...points.map((p: any) => p.profit)) || 1000;
  const minProfit = Math.min(...points.map((p: any) => p.profit)) || 0;
  const qStar = chartData.Q_analytical || 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <div className="font-bold text-[#2C3E50]">期望利润 E[Π(Q)] vs 候选订货量 Q 凹函数曲线</div>
        <div className="text-[11px] font-mono text-[#2980B9]">
          理论最优 Q* = {qStar.toFixed(1)} 件
        </div>
      </div>

      <div className="relative w-full h-64 bg-white rounded border border-[#E1E4E8] p-2 overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
          {/* Grid */}
          {[0.25, 0.5, 0.75].map((r, i) => (
            <line key={i} x1="30" y1={180 * r} x2="490" y2={180 * r} stroke="#F2F2F2" strokeDasharray="3 3" />
          ))}

          {/* Profit Polyline */}
          <polyline
            fill="none"
            stroke="#2980B9"
            strokeWidth="2.5"
            points={points
              .map(
                (p: any, idx: number) =>
                  `${30 + (idx / (points.length - 1)) * 450},${
                    180 - ((p.profit - minProfit) / (maxProfit - minProfit || 1)) * 160
                  }`
              )
              .join(" ")}
          />

          {/* Analytical Q* mark */}
          {(() => {
            const optIdx = points.findIndex((p: any) => p.q >= qStar);
            if (optIdx >= 0) {
              const xOpt = 30 + (optIdx / (points.length - 1)) * 450;
              const yOpt =
                180 - ((points[optIdx].profit - minProfit) / (maxProfit - minProfit || 1)) * 160;
              return (
                <g>
                  <line x1={xOpt} y1="15" x2={xOpt} y2="185" stroke="#E74C3C" strokeWidth="1.5" strokeDasharray="3 3" />
                  <circle cx={xOpt} cy={yOpt} r="4" fill="#E74C3C" stroke="#ffffff" strokeWidth="2" />
                  <text x={xOpt + 6} y={yOpt - 6} fill="#E74C3C" fontSize="10" fontWeight="bold">
                    极大值 Q* = {qStar.toFixed(1)}
                  </text>
                </g>
              );
            }
            return null;
          })()}

          <text x="35" y="195" fill="#95A5A6" fontSize="9">订货量 Q (低)</text>
          <text x="430" y="195" fill="#95A5A6" fontSize="9">订货量 Q (高)</text>
        </svg>
      </div>
    </div>
  );
}

function RenderSafetyStockVisualizer({ viewId, chartData }: { viewId: string; chartData: any; kpis: any }) {
  if (!chartData) return null;

  const tradeoff = chartData.tradeoffCurve || [];
  const maxSS = Math.max(...tradeoff.map((t: any) => t.safetyStock)) || 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <div className="font-bold text-[#2C3E50]">安全库存 SS vs 目标服务水平 α 边际递增曲线</div>
        <div className="text-[11px] text-[#7F8C8D]">
          当服务水平接近 99.9% 时，安全库存呈现指数级飙升
        </div>
      </div>

      <div className="relative w-full h-64 bg-white rounded border border-[#E1E4E8] p-2 overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
          {/* Grid */}
          {[0.25, 0.5, 0.75].map((r, i) => (
            <line key={i} x1="30" y1={180 * r} x2="490" y2={180 * r} stroke="#F2F2F2" strokeDasharray="3 3" />
          ))}

          {/* Polyline */}
          <polyline
            fill="none"
            stroke="#2980B9"
            strokeWidth="2.5"
            points={tradeoff
              .map(
                (t: any, idx: number) =>
                  `${30 + (idx / (tradeoff.length - 1)) * 450},${180 - (t.safetyStock / maxSS) * 160}`
              )
              .join(" ")}
          />

          {/* Dots */}
          {tradeoff.map((t: any, idx: number) => {
            const x = 30 + (idx / (tradeoff.length - 1)) * 450;
            const y = 180 - (t.safetyStock / maxSS) * 160;
            return (
              <g key={idx}>
                <circle cx={x} cy={y} r="3.5" fill="#2980B9" stroke="#ffffff" strokeWidth="1.5" />
                <text x={x} y={y - 8} fill="#2C3E50" fontSize="8" textAnchor="middle" fontWeight="bold">
                  {t.safetyStock}
                </text>
              </g>
            );
          })}

          <text x="35" y="195" fill="#95A5A6" fontSize="9">服务水平 α=80%</text>
          <text x="430" y="195" fill="#95A5A6" fontSize="9">服务水平 α=99.9%</text>
        </svg>
      </div>
    </div>
  );
}
