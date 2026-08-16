import React, { useState, useMemo } from "react";
import { calculateClassicEOQ } from "../../utils/mathModels";
import {
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Scale,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from "lucide-react";

export const EoqMathDerivationModule: React.FC = () => {
  const [demandD, setDemandD] = useState<number>(10000);
  const [orderCostK, setOrderCostK] = useState<number>(200);
  const [holdingCostH, setHoldingCostH] = useState<number>(2.5);
  const [unitCostC, setUnitCostC] = useState<number>(20);
  const [inspectedQ, setInspectedQ] = useState<number>(1265);
  const [stepIndex, setStepIndex] = useState<number>(3); // 0 to 5

  // Calculations
  const eoq = useMemo(
    () => calculateClassicEOQ(demandD, orderCostK, holdingCostH, unitCostC),
    [demandD, orderCostK, holdingCostH, unitCostC]
  );

  // Sync inspectedQ when EOQ changes initially
  React.useEffect(() => {
    setInspectedQ(Math.round(eoq.optimalQ));
  }, [eoq.optimalQ]);

  // Current candidate Q cost breakdown
  const candidateMetrics = useMemo(() => {
    const q = Math.max(10, inspectedQ);
    const oc = (demandD / q) * orderCostK;
    const hc = (q / 2) * holdingCostH;
    const tcVar = oc + hc;
    const tcTotal = tcVar + demandD * unitCostC;
    const optimalTcVar = 2 * Math.sqrt(demandD * orderCostK * holdingCostH);
    const penaltyRatio = tcVar / (optimalTcVar || 1);
    return { q, oc, hc, tcVar, tcTotal, penaltyRatio };
  }, [inspectedQ, demandD, orderCostK, holdingCostH, unitCostC]);

  // Plot data points
  const plotData = useMemo(() => {
    const qStar = eoq.optimalQ || 1000;
    const minQ = Math.max(20, Math.round(qStar * 0.2));
    const maxQ = Math.round(qStar * 2.5);
    const step = (maxQ - minQ) / 80;

    const points = [];
    let maxCost = 0;
    for (let q = minQ; q <= maxQ; q += step) {
      const oc = (demandD / q) * orderCostK;
      const hc = (q / 2) * holdingCostH;
      const tc = oc + hc;
      if (tc < (eoq.holdingCost + eoq.orderCost) * 4) {
        maxCost = Math.max(maxCost, tc);
      }
      points.push({ q, oc, hc, tc });
    }
    return { points, minQ, maxQ, maxCost: maxCost * 1.05 };
  }, [demandD, orderCostK, holdingCostH, eoq]);

  const steps = [
    {
      title: "步骤 1：两难权衡与订货成本 (Ordering Cost)",
      subtitle: "批量越大，年订货次数越少，年订货费成反比例下降",
      formula: "OC(Q) = \\frac{D}{Q} \\cdot K",
      desc: "企业每年总需求为 D。若单次订货批量为 Q，则全年需要下单 N = D/Q 次。每次下单固定产生文书交接、质检与干线运杂费 K 元。因此年订货成本 OC(Q) 与批量 Q 成反比。",
      highlight: "oc",
    },
    {
      title: "步骤 2：持有成本与库存占用 (Holding Cost)",
      subtitle: "批量越大，仓库平均积压库存越多，持有保管费线性上升",
      formula: "HC(Q) = \\frac{Q}{2} \\cdot h",
      desc: "在需求均匀消耗且瞬时到货假设下，库存呈现典型『锯齿波 (Sawtooth Pattern)』，最高库存为 Q，最低为 0，平均库存为 Q/2。若每件商品每年占用资金利息、仓储租金与损耗费为 h，则年持有成本为 (Q/2)h。",
      highlight: "hc",
    },
    {
      title: "步骤 3：构建年总变动成本目标函数 (Total Cost)",
      subtitle: "总成本为订货成本与持有成本之和（加上固定采购额 cD）",
      formula: "TC(Q) = \\frac{D}{Q}K + \\frac{Q}{2}h + cD",
      desc: "订货费试图拉大 Q（减少下单频次），持有费试图缩小 Q（减少积压占用）。两者形成天然的此消彼长冲突。运筹学的目标是寻找一个最佳 Q* 使得总和 TC(Q) 达到全局极小值。",
      highlight: "tc",
    },
    {
      title: "步骤 4：微积分一阶导数极值推导 (FOC = 0)",
      subtitle: "令一阶导数为零，求驻点，得到著名的平方根公式",
      formula: "\\frac{dTC(Q)}{dQ} = -\\frac{DK}{Q^2} + \\frac{h}{2} = 0 \\implies Q^* = \\sqrt{\\frac{2DK}{h}}",
      desc: "在极值点处，边际订货成本减少速率恰好等于边际持有成本增加速率。求解得到 Ford W. Harris (1913) 提出的经典经济订货批量 EOQ 公式。",
      highlight: "qStar",
    },
    {
      title: "步骤 5：二阶充分条件验证 (SOC > 0 严格凸函数)",
      subtitle: "二阶导数恒大于零，证明驻点是全局唯一严格极小值点",
      formula: "\\frac{d^2TC(Q)}{dQ^2} = \\frac{2DK}{Q^3} > 0 \\quad (\\forall Q > 0)",
      desc: "二阶导数在正数域恒正，严格保证了 TC(Q) 为严格凸函数 (Strictly Convex)，不存在多局部极值陷阱。最优点处必满足：年订货费 = 年持有费 = √(DKh/2)。",
      highlight: "convex",
    },
    {
      title: "步骤 6：敏感度分析与著名的『方根平坦性』",
      subtitle: "偏离最优订货量时，总成本上升非常平缓，容错性极高",
      formula: "\\frac{TC(Q) - cD}{TC(Q^*) - cD} = \\frac{1}{2} \\left( \\frac{Q}{Q^*} + \\frac{Q^*}{Q} \\right)",
      desc: "即使实际订货批量 Q 偏离最优 Q* 达 ±20%（例如为了整箱/托盘包装对齐），总变动成本的增加幅度仅为 1.67%；偏离 ±50% 时也仅增加 8.3%，体现了 EOQ 模型的极高鲁棒性。",
      highlight: "sensitivity",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#34495E] rounded-lg p-5 sm:p-6 text-white shadow-xs border border-[#2C3E50]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#2980B9]/30 text-blue-200 border border-[#2980B9]/40 mb-2">
              <Sparkles className="w-3 h-3 text-[#3498DB]" />
              运筹学第一原理 · 经典理论体系
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              运筹模型与经典 EOQ 数学演导演绎
            </h2>
            <p className="text-xs text-[#BDC3C7] mt-1 max-w-3xl leading-relaxed">
              从订货固定费与仓储资金占用的边际权衡出发，严谨推导一阶导数、二阶充分条件、交点平衡律与方根平坦敏感性。
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded border border-white/15 shrink-0">
            <div className="text-right">
              <div className="text-[11px] text-[#BDC3C7]">最优经济批量 Q*</div>
              <div className="text-xl font-bold text-white font-mono">
                {Math.round(eoq.optimalQ).toLocaleString()} <span className="text-xs font-normal text-[#BDC3C7]">件</span>
              </div>
            </div>
            <div className="h-7 w-px bg-white/20" />
            <div className="text-right">
              <div className="text-[11px] text-[#BDC3C7]">极小年变动成本</div>
              <div className="text-lg font-bold text-[#F1C40F] font-mono">
                ¥{Math.round(eoq.orderCost + eoq.holdingCost).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parameter Slices & Interactive Sliders */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-lg p-5 border border-[#E1E4E8] shadow-xs">
            <h3 className="text-xs font-bold text-[#7F8C8D] uppercase tracking-widest mb-4 flex items-center justify-between">
              <span>运筹参数切片控制</span>
              <span className="text-[11px] font-normal text-[#95A5A6]">实时重算</span>
            </h3>

            <div className="space-y-4">
              {/* Demand D */}
              <div>
                <div className="flex justify-between text-xs font-medium text-[#2C3E50] mb-1.5">
                  <span>年需求量 D (件/年)</span>
                  <span className="font-mono font-bold text-[#2980B9]">{demandD.toLocaleString()} unit</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="500"
                  value={demandD}
                  onChange={(e) => setDemandD(Number(e.target.value))}
                  className="w-full accent-[#2980B9] cursor-pointer"
                />
              </div>

              {/* Order Cost K */}
              <div>
                <div className="flex justify-between text-xs font-medium text-[#2C3E50] mb-1.5">
                  <span>单次订货费 K (元/次)</span>
                  <span className="font-mono font-bold text-[#2980B9]">¥{orderCostK}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="1000"
                  step="10"
                  value={orderCostK}
                  onChange={(e) => setOrderCostK(Number(e.target.value))}
                  className="w-full accent-[#2980B9] cursor-pointer"
                />
              </div>

              {/* Holding Cost h */}
              <div>
                <div className="flex justify-between text-xs font-medium text-[#2C3E50] mb-1.5">
                  <span>单位年持有费 h (元/件/年)</span>
                  <span className="font-mono font-bold text-[#2980B9]">¥{holdingCostH.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={holdingCostH}
                  onChange={(e) => setHoldingCostH(Number(e.target.value))}
                  className="w-full accent-[#2980B9] cursor-pointer"
                />
              </div>

              {/* Unit Purchase Cost c */}
              <div>
                <div className="flex justify-between text-xs font-medium text-[#2C3E50] mb-1.5">
                  <span>单件采购基准价 c (元/件)</span>
                  <span className="font-mono font-bold text-[#34495E]">¥{unitCostC}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={unitCostC}
                  onChange={(e) => setUnitCostC(Number(e.target.value))}
                  className="w-full accent-[#2980B9] cursor-pointer"
                />
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#F2F2F2]">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="font-semibold text-[#2C3E50]">当前试探批量 Q</span>
                <span className="font-mono text-[#2980B9] font-bold bg-[#F8F9FA] px-2 py-0.5 rounded border border-[#E1E4E8]">
                  {inspectedQ} 件 ({((inspectedQ / (eoq.optimalQ || 1)) * 100).toFixed(0)}% Q*)
                </span>
              </div>
              <input
                type="range"
                min={Math.max(50, Math.round(eoq.optimalQ * 0.25))}
                max={Math.round(eoq.optimalQ * 2.2)}
                step="10"
                value={inspectedQ}
                onChange={(e) => setInspectedQ(Number(e.target.value))}
                className="w-full accent-[#2980B9] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#95A5A6] mt-1.5">
                <span>偏小 (高订货频次)</span>
                <button
                  type="button"
                  className="text-[#2980B9] font-medium hover:underline cursor-pointer"
                  onClick={() => setInspectedQ(Math.round(eoq.optimalQ))}
                >
                  对齐最优 Q*
                </button>
                <span>偏大 (高库存积压)</span>
              </div>
            </div>
          </div>

          {/* Real-time KPI Card */}
          <div className="bg-white rounded-lg p-4 border border-[#E1E4E8] shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-[#7F8C8D] uppercase tracking-widest">
              试探点 Q = {candidateMetrics.q} 成本核算
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#F8F9FA] p-2.5 rounded border border-[#E1E4E8]">
                <div className="text-[#7F8C8D] text-[10px]">年订货成本 OC</div>
                <div className="font-mono font-bold text-[#2980B9] mt-0.5">
                  ¥{Math.round(candidateMetrics.oc).toLocaleString()}
                </div>
              </div>
              <div className="bg-[#F8F9FA] p-2.5 rounded border border-[#E1E4E8]">
                <div className="text-[#7F8C8D] text-[10px]">年持有成本 HC</div>
                <div className="font-mono font-bold text-[#2C3E50] mt-0.5">
                  ¥{Math.round(candidateMetrics.hc).toLocaleString()}
                </div>
              </div>
              <div className="bg-[#F8F9FA] p-2.5 rounded border border-[#E1E4E8]">
                <div className="text-[#7F8C8D] text-[10px]">年订货频次 N</div>
                <div className="font-mono font-bold text-[#2C3E50] mt-0.5">
                  {(demandD / candidateMetrics.q).toFixed(2)} 次/年
                </div>
              </div>
              <div className="bg-[#F8F9FA] p-2.5 rounded border border-[#E1E4E8]">
                <div className="text-[#7F8C8D] text-[10px]">相对最优点成本比</div>
                <div className={`font-mono font-bold mt-0.5 ${candidateMetrics.penaltyRatio > 1.05 ? 'text-[#E74C3C]' : 'text-[#27AE60]'}`}>
                  {(candidateMetrics.penaltyRatio * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Step-by-Step Derivation & Interactive SVG Plot */}
        <div className="lg:col-span-8 space-y-5">
          {/* Interactive Stepper Bar */}
          <div className="bg-white rounded-lg p-5 border border-[#E1E4E8] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#7F8C8D] uppercase tracking-widest">
                推导演进步骤 ({stepIndex + 1} / {steps.length})
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={stepIndex === 0}
                  onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
                  className="p-1 text-[#7F8C8D] hover:bg-[#F8F9FA] hover:text-[#2C3E50] disabled:opacity-30 rounded transition-colors border border-[#BDC3C7]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={stepIndex === steps.length - 1}
                  onClick={() => setStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
                  className="p-1 text-[#7F8C8D] hover:bg-[#F8F9FA] hover:text-[#2C3E50] disabled:opacity-30 rounded transition-colors border border-[#BDC3C7]"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Stepper Slices */}
            <div className="grid grid-cols-6 gap-1.5 mb-4">
              {steps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setStepIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === stepIndex
                      ? "bg-[#2980B9]"
                      : idx < stepIndex
                      ? "bg-[#3498DB]/50"
                      : "bg-[#E1E4E8] hover:bg-[#BDC3C7]"
                  }`}
                  title={step.title}
                />
              ))}
            </div>

            {/* Current Step Card */}
            <div className="bg-[#F8F9FA] rounded p-4 border-l-4 border-[#2980B9] border-y border-r border-[#E1E4E8]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-[#2C3E50]">{steps[stepIndex].title}</h4>
                  <p className="text-[11px] text-[#7F8C8D] mt-0.5">{steps[stepIndex].subtitle}</p>
                </div>
                <div className="px-3 py-1.5 bg-white font-mono text-xs font-bold text-[#2980B9] rounded border border-[#E1E4E8] self-start sm:self-auto">
                  {steps[stepIndex].formula}
                </div>
              </div>
              <p className="text-xs text-[#2C3E50] mt-3 leading-relaxed">
                {steps[stepIndex].desc}
              </p>
            </div>
          </div>

          {/* Interactive Cost Curves Plot */}
          <div className="bg-white rounded-lg p-5 border border-[#E1E4E8] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider">
                  总成本与分项成本权衡曲线 (TC, OC, HC)
                </h3>
                <p className="text-[11px] text-[#7F8C8D]">
                  蓝线为总成本 TC(Q)，虚线为订货成本 OC(Q)，细线为持有成本 HC(Q)。Q* 恰为交点。
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="inline-flex items-center gap-1 text-[#2980B9] font-medium">
                  <span className="w-3 h-0.5 bg-[#2980B9] inline-block" /> TC
                </span>
                <span className="inline-flex items-center gap-1 text-[#34495E] font-medium">
                  <span className="w-3 h-0.5 bg-[#34495E] inline-block border-dashed" /> OC
                </span>
                <span className="inline-flex items-center gap-1 text-[#7F8C8D] font-medium">
                  <span className="w-3 h-0.5 bg-[#95A5A6] inline-block" /> HC
                </span>
              </div>
            </div>

            {/* SVG Plot */}
            <div className="relative w-full h-72 bg-[#F8F9FA] rounded border border-[#E1E4E8] p-2 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
                {/* Grid Lines */}
                {[0.25, 0.5, 0.75].map((ratio, i) => (
                  <line
                    key={i}
                    x1="40"
                    y1={200 * ratio}
                    x2="580"
                    y2={200 * ratio}
                    stroke="#E1E4E8"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Coordinates helper functions */}
                {(() => {
                  const { points, minQ, maxQ, maxCost } = plotData;
                  const xCoord = (q: number) => 40 + ((q - minQ) / (maxQ - minQ)) * 540;
                  const yCoord = (cost: number) => 210 - (Math.min(cost, maxCost) / maxCost) * 190;

                  const tcPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xCoord(p.q)} ${yCoord(p.tc)}`).join(" ");
                  const ocPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xCoord(p.q)} ${yCoord(p.oc)}`).join(" ");
                  const hcPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xCoord(p.q)} ${yCoord(p.hc)}`).join(" ");

                  const qStarX = xCoord(eoq.optimalQ);
                  const qStarY = yCoord(eoq.orderCost + eoq.holdingCost);

                  const inspX = xCoord(candidateMetrics.q);
                  const inspY = yCoord(candidateMetrics.tcVar);

                  return (
                    <>
                      {/* Curves */}
                      <path d={ocPath} fill="none" stroke="#34495E" strokeWidth="1.5" strokeDasharray="3 3" />
                      <path d={hcPath} fill="none" stroke="#95A5A6" strokeWidth="1.5" />
                      <path d={tcPath} fill="none" stroke="#2980B9" strokeWidth="2.5" />

                      {/* Optimal Q* Vertical Drop Line */}
                      <line x1={qStarX} y1="20" x2={qStarX} y2="210" stroke="#2980B9" strokeWidth="1.5" strokeDasharray="4 4" />
                      <circle cx={qStarX} cy={qStarY} r="4" fill="#2980B9" stroke="#ffffff" strokeWidth="2" />
                      <text x={qStarX + 6} y={qStarY - 8} fill="#2980B9" fontSize="11" fontWeight="bold">
                        Q* = {Math.round(eoq.optimalQ)}
                      </text>

                      {/* Inspected Q Vertical Line */}
                      {Math.abs(candidateMetrics.q - eoq.optimalQ) > 20 && (
                        <>
                          <line x1={inspX} y1="20" x2={inspX} y2="210" stroke="#7F8C8D" strokeWidth="1.2" strokeDasharray="2 2" />
                          <circle cx={inspX} cy={inspY} r="4" fill="#E74C3C" stroke="#ffffff" strokeWidth="2" />
                          <text x={inspX + 6} y={inspY - 6} fill="#E74C3C" fontSize="10" fontWeight="bold">
                            试探 Q = {candidateMetrics.q}
                          </text>
                        </>
                      )}

                      {/* Axis labels */}
                      <text x="50" y="230" fill="#95A5A6" fontSize="10">批量 Q (小)</text>
                      <text x="540" y="230" fill="#95A5A6" fontSize="10">批量 Q (大)</text>
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* Bottom Insight Bar */}
            <div className="mt-4 p-3 bg-[#F8F9FA] rounded flex items-center justify-between text-xs text-[#2C3E50] border border-[#E1E4E8]">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#2980B9] shrink-0" />
                <span>
                  <strong>运筹学黄金交点定理</strong>：在最优点 Q* 处，年订货总成本 <strong>¥{Math.round(eoq.orderCost).toLocaleString()}</strong> 严格等于年持有总成本 <strong>¥{Math.round(eoq.holdingCost).toLocaleString()}</strong>。
                </span>
              </div>
              <button
                onClick={() => setInspectedQ(Math.round(eoq.optimalQ))}
                className="shrink-0 px-3 py-1 text-xs font-medium text-[#2980B9] bg-white border border-[#2980B9]/30 hover:bg-[#F8F9FA] rounded transition-colors"
              >
                锁定最优点
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
