import React, { useState, useMemo } from "react";
import {
  calculateNewsvendor,
  calculateSafetyStockROP,
  normalPDF,
} from "../../utils/mathModels";
import { StochasticSubModel } from "../../types/inventory";
import {
  Activity,
  ShieldCheck,
  Percent,
  Sliders,
  TrendingUp,
  Sparkles,
  Info,
  Scale,
} from "lucide-react";

export const StochasticModelsModule: React.FC = () => {
  const [activeSub, setActiveSub] = useState<StochasticSubModel>("newsvendor");

  // Newsvendor parameters
  const [nvRetailP, setNvRetailP] = useState<number>(90); // 售价
  const [nvCostC, setNvCostC] = useState<number>(45); // 成本
  const [nvSalvageV, setNvSalvageV] = useState<number>(20); // 残值
  const [nvMean, setNvMean] = useState<number>(100);
  const [nvStd, setNvStd] = useState<number>(25);
  const [nvDist, setNvDist] = useState<"normal" | "uniform">("normal");

  // Multi-period parameters
  const [dailyDemandMean, setDailyDemandMean] = useState<number>(50);
  const [dailyDemandStd, setDailyDemandStd] = useState<number>(12);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(5);
  const [leadTimeStd, setLeadTimeStd] = useState<number>(0.5);
  const [serviceAlpha, setServiceAlpha] = useState<number>(0.95);
  const [orderCostK, setOrderCostK] = useState<number>(150);
  const [holdingCostH, setHoldingCostH] = useState<number>(4.0);

  // Solvers
  const newsvendorRes = useMemo(
    () => calculateNewsvendor(nvRetailP, nvCostC, nvSalvageV, nvMean, nvStd, nvDist),
    [nvRetailP, nvCostC, nvSalvageV, nvMean, nvStd, nvDist]
  );

  const multiPeriodRes = useMemo(
    () =>
      calculateSafetyStockROP(
        dailyDemandMean,
        dailyDemandStd,
        leadTimeDays,
        leadTimeStd,
        serviceAlpha,
        orderCostK,
        holdingCostH
      ),
    [dailyDemandMean, dailyDemandStd, leadTimeDays, leadTimeStd, serviceAlpha, orderCostK, holdingCostH]
  );

  // Newsvendor expected profit curve points
  const nvProfitPoints = useMemo(() => {
    const minQ = Math.max(10, Math.round(nvMean - 3 * nvStd));
    const maxQ = Math.round(nvMean + 3 * nvStd);
    const step = Math.max(1, Math.round((maxQ - minQ) / 40));
    const points = [];

    for (let q = minQ; q <= maxQ; q += step) {
      const sim = calculateNewsvendor(nvRetailP, nvCostC, nvSalvageV, nvMean, nvStd, nvDist, 0, 200);
      // approximate profit for candidate Q
      const z = (q - nvMean) / (nvStd || 1);
      const lossZ = Math.max(0, normalPDF(z) - z * (1 - (0.5 + 0.5 * Math.tanh(z * 0.8))));
      const expShort = nvStd * lossZ;
      const expSales = nvMean - expShort;
      const expLeft = q - nvMean + expShort;
      const profit = nvRetailP * expSales + nvSalvageV * expLeft - nvCostC * q;
      points.push({ q, profit });
    }
    return points;
  }, [nvRetailP, nvCostC, nvSalvageV, nvMean, nvStd, nvDist]);

  return (
    <div className="space-y-6">
      {/* Sliced Model Switcher Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">随机型存储模型与安全库存决策</h2>
          <p className="text-xs text-slate-500">
            涵盖单周期随机需求易腐品（报童模型边际分析）与多周期连续盘点服务水平（安全库存 SS 与再订货点 ROP）。
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSub("newsvendor")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeSub === "newsvendor"
                ? "bg-white text-teal-800 shadow-xs ring-1 ring-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>单周期报童模型</span>
          </button>
          <button
            onClick={() => setActiveSub("multi_period")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeSub === "multi_period"
                ? "bg-white text-teal-800 shadow-xs ring-1 ring-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>多周期安全库存 (SS / ROP)</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Newsvendor Model */}
      {activeSub === "newsvendor" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Inputs */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>报童模型参数切片</span>
                <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  边际分析
                </span>
              </h3>

              <div className="space-y-4">
                {/* Retail price p */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>正常零售售价 p (元/件)</span>
                    <span className="font-mono font-bold text-emerald-700">¥{nvRetailP}</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="300"
                    step="5"
                    value={nvRetailP}
                    onChange={(e) => setNvRetailP(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>

                {/* Unit Cost c */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>进货采购成本 c (元/件)</span>
                    <span className="font-mono font-bold text-indigo-700">¥{nvCostC}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max={nvRetailP - 1}
                    step="1"
                    value={nvCostC}
                    onChange={(e) => setNvCostC(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Salvage value v */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>期末清仓残值 v (元/件, v &lt; c)</span>
                    <span className="font-mono font-bold text-amber-700">¥{nvSalvageV}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={nvCostC - 1}
                    step="1"
                    value={nvSalvageV}
                    onChange={(e) => setNvSalvageV(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>需求均值 μ (期望销量)</span>
                    <span className="font-mono font-bold text-teal-700">{nvMean} 件</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="500"
                    step="5"
                    value={nvMean}
                    onChange={(e) => setNvMean(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>需求标准差 σ (波动率)</span>
                    <span className="font-mono font-bold text-rose-700">{nvStd} 件</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="100"
                    step="1"
                    value={nvStd}
                    onChange={(e) => setNvStd(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                  />
                </div>
              </div>
            </div>

            {/* Critical Fractile Card */}
            <div className="bg-teal-50/80 rounded-xl p-4 border border-teal-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-teal-900">边际分析与临界比率 (Critical Fractile)</span>
                <span className="font-mono font-bold text-teal-700">
                  CR* = {(newsvendorRes.criticalRatio * 100).toFixed(2)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex">
                <div
                  className="bg-teal-600 h-full transition-all duration-300"
                  style={{ width: `${newsvendorRes.criticalRatio * 100}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-white p-2 rounded border border-teal-100">
                  <div className="text-slate-500 text-[10px]">缺货边际损失 Cu = p - c</div>
                  <div className="font-mono font-bold text-teal-800">¥{newsvendorRes.Cu}</div>
                </div>
                <div className="bg-white p-2 rounded border border-teal-100">
                  <div className="text-slate-500 text-[10px]">滞销边际损失 Co = c - v</div>
                  <div className="font-mono font-bold text-amber-800">¥{newsvendorRes.Co}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Results & Visual Distribution */}
          <div className="lg:col-span-7 space-y-5">
            {/* KPI Banner */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="text-xs text-slate-500">最优备货决策订货量 Q*</div>
                  <div className="text-2xl font-black text-teal-800 font-mono">
                    {Math.round(newsvendorRes.optimalQ)} <span className="text-xs font-normal text-slate-500">件</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">最大期望利润 E[Π]</div>
                  <div className="text-xl font-bold text-emerald-700 font-mono">
                    ¥{Math.round(newsvendorRes.expectedProfit).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  <div className="text-slate-500 text-[11px]">期望销量 E[Sales]</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">
                    {newsvendorRes.expectedSales.toFixed(1)} 件
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  <div className="text-slate-500 text-[11px]">期望滞销打折 E[Leftover]</div>
                  <div className="font-mono font-bold text-amber-700 mt-0.5">
                    {newsvendorRes.expectedLeftover.toFixed(1)} 件
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  <div className="text-slate-500 text-[11px]">期望缺货缺单 E[Shortage]</div>
                  <div className="font-mono font-bold text-rose-700 mt-0.5">
                    {newsvendorRes.expectedShortage.toFixed(1)} 件
                  </div>
                </div>
              </div>
            </div>

            {/* Distribution Curve SVG */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                需求概率密度正态钟形曲线与备货分位点
              </h4>
              <div className="relative w-full h-56 bg-slate-50/50 rounded-xl border border-slate-200/80 p-2">
                <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                  {(() => {
                    const mu = nvMean;
                    const sigma = nvStd || 1;
                    const xMin = mu - 3.2 * sigma;
                    const xMax = mu + 3.2 * sigma;
                    const xToPx = (x: number) => 30 + ((x - xMin) / (xMax - xMin)) * 440;
                    const maxPdf = normalPDF(0) / sigma;
                    const yToPx = (pdf: number) => 170 - (pdf / (maxPdf * 1.15)) * 150;

                    const curvePoints: string[] = [];
                    const qStar = newsvendorRes.optimalQ;

                    for (let x = xMin; x <= xMax; x += (xMax - xMin) / 60) {
                      const pdf = normalPDF((x - mu) / sigma) / sigma;
                      curvePoints.push(`${xToPx(x)},${yToPx(pdf)}`);
                    }

                    const qStarPx = xToPx(qStar);
                    const muPx = xToPx(mu);

                    return (
                      <>
                        {/* Shaded Area under curve up to Q* */}
                        <path
                          d={`M ${xToPx(xMin)},170 L ${curvePoints.join(" L ")} L ${xToPx(xMax)},170 Z`}
                          fill="#0d9488"
                          fillOpacity="0.12"
                        />
                        {/* Bell curve line */}
                        <path d={`M ${curvePoints.join(" L ")}`} fill="none" stroke="#0d9488" strokeWidth="2.5" />

                        {/* Mean line */}
                        <line x1={muPx} y1="20" x2={muPx} y2="170" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
                        <text x={muPx - 20} y="185" fill="#64748b" fontSize="10">均值 μ = {mu}</text>

                        {/* Q* line */}
                        <line x1={qStarPx} y1="15" x2={qStarPx} y2="170" stroke="#e11d48" strokeWidth="2" />
                        <circle cx={qStarPx} cy={yToPx(normalPDF((qStar - mu) / sigma) / sigma)} r="4" fill="#e11d48" />
                        <text x={qStarPx + 6} y="30" fill="#be123c" fontSize="11" fontWeight="bold">
                          Q* = {Math.round(qStar)} (满足率 {(newsvendorRes.criticalRatio * 100).toFixed(1)}%)
                        </text>
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Multi-Period Safety Stock & ROP */}
      {activeSub === "multi_period" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Inputs */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>多周期安全库存与提前期参数</span>
                <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  (s, Q) 连续盘点
                </span>
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>日均需求量 d (件/天)</span>
                    <span className="font-mono font-bold text-teal-700">{dailyDemandMean} 件</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={dailyDemandMean}
                    onChange={(e) => setDailyDemandMean(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>日需求标准差 σ_d (件/天)</span>
                    <span className="font-mono font-bold text-rose-700">{dailyDemandStd} 件</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={dailyDemandStd}
                    onChange={(e) => setDailyDemandStd(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>供应商提前期 L (天)</span>
                    <span className="font-mono font-bold text-indigo-700">{leadTimeDays} 天</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={leadTimeDays}
                    onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>提前期波动标准差 σ_L (天)</span>
                    <span className="font-mono font-bold text-amber-700">{leadTimeStd} 天</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={leadTimeStd}
                    onChange={(e) => setLeadTimeStd(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>目标周期服务水平 CSL (α)</span>
                    <span className="font-mono font-bold text-teal-700">{(serviceAlpha * 100).toFixed(1)}% (z = {multiPeriodRes.zAlpha.toFixed(2)})</span>
                  </div>
                  <input
                    type="range"
                    min="0.80"
                    max="0.999"
                    step="0.005"
                    value={serviceAlpha}
                    onChange={(e) => setServiceAlpha(Number(e.target.value))}
                    className="w-full h-1.5 bg-teal-100 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right SS and ROP Results */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-800">安全库存与再订货点解构</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-teal-50/70 p-4 rounded-xl border border-teal-200">
                  <div className="text-xs text-slate-500 font-medium">安全库存 (Safety Stock SS)</div>
                  <div className="text-2xl font-black text-teal-800 font-mono mt-0.5">
                    {Math.round(multiPeriodRes.safetyStock)} <span className="text-xs font-normal">件</span>
                  </div>
                  <div className="text-[11px] text-teal-700 mt-1 font-mono">
                    SS = z_α × σ_L = {multiPeriodRes.zAlpha.toFixed(2)} × {multiPeriodRes.leadTimeDemandStd.toFixed(1)}
                  </div>
                </div>

                <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200">
                  <div className="text-xs text-slate-500 font-medium">再订货点 (Reorder Point ROP)</div>
                  <div className="text-2xl font-black text-indigo-800 font-mono mt-0.5">
                    {Math.round(multiPeriodRes.reorderPoint)} <span className="text-xs font-normal">件</span>
                  </div>
                  <div className="text-[11px] text-indigo-700 mt-1 font-mono">
                    ROP = d × L + SS = {Math.round(multiPeriodRes.leadTimeDemandMean)} + {Math.round(multiPeriodRes.safetyStock)}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">提前期内总需求均值 (μ_L):</span>
                  <span className="font-mono font-bold text-slate-800">{Math.round(multiPeriodRes.leadTimeDemandMean)} 件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">提前期综合需求标准差 (σ_L):</span>
                  <span className="font-mono font-bold text-rose-700">{multiPeriodRes.leadTimeDemandStd.toFixed(2)} 件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">填充率估计 (Fill Rate β):</span>
                  <span className="font-mono font-bold text-emerald-700">{(multiPeriodRes.fillRateBeta * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">年安全库存持有成本:</span>
                  <span className="font-mono font-bold text-amber-700">¥{Math.round(multiPeriodRes.annualHoldingSafetyStockCost).toLocaleString()} /年</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
