import React, { useState, useMemo } from "react";
import {
  calculateClassicEOQ,
  calculateEPQ,
  calculateShortageEOQ,
  calculateQuantityDiscount,
  DiscountTier,
} from "../../utils/mathModels";
import { DeterministicSubModel } from "../../types/inventory";
import {
  Boxes,
  Factory,
  AlertOctagon,
  Percent,
  TrendingUp,
  Info,
  Check,
  Layers,
  ArrowRight,
} from "lucide-react";

export const DeterministicModelsModule: React.FC = () => {
  const [activeSubModel, setActiveSubModel] = useState<DeterministicSubModel>("classic");

  // Common parameters
  const [demandD, setDemandD] = useState<number>(10000);
  const [orderCostK, setOrderCostK] = useState<number>(200);
  const [holdingCostH, setHoldingCostH] = useState<number>(3.0);
  const [unitCostC, setUnitCostC] = useState<number>(25.0);

  // EPQ specific
  const [productionRateP, setProductionRateP] = useState<number>(25000);

  // Shortage specific
  const [shortageCostP, setShortageCostP] = useState<number>(15.0);

  // Discount specific
  const [isHoldingPercentage, setIsHoldingPercentage] = useState<boolean>(true);
  const [holdingRateI, setHoldingRateI] = useState<number>(0.15); // 15% of unit cost
  const [discountTiers, setDiscountTiers] = useState<DiscountTier[]>([
    { minQty: 1, maxQty: 499, price: 25.0 },
    { minQty: 500, maxQty: 1499, price: 23.5 },
    { minQty: 1500, maxQty: 999999, price: 21.8 },
  ]);

  // Solvers
  const classicResult = useMemo(
    () => calculateClassicEOQ(demandD, orderCostK, holdingCostH, unitCostC),
    [demandD, orderCostK, holdingCostH, unitCostC]
  );

  const epqResult = useMemo(
    () => calculateEPQ(demandD, orderCostK, holdingCostH, productionRateP, unitCostC),
    [demandD, orderCostK, holdingCostH, productionRateP, unitCostC]
  );

  const shortageResult = useMemo(
    () => calculateShortageEOQ(demandD, orderCostK, holdingCostH, shortageCostP, unitCostC),
    [demandD, orderCostK, holdingCostH, shortageCostP, unitCostC]
  );

  const discountResult = useMemo(
    () =>
      calculateQuantityDiscount(
        demandD,
        orderCostK,
        isHoldingPercentage ? holdingRateI : holdingCostH,
        isHoldingPercentage,
        discountTiers
      ),
    [demandD, orderCostK, isHoldingPercentage, holdingRateI, holdingCostH, discountTiers]
  );

  const subModelTabs = [
    {
      id: "classic" as DeterministicSubModel,
      label: "经典 EOQ",
      icon: <Boxes className="w-4 h-4" />,
      tag: "基础标准",
    },
    {
      id: "epq" as DeterministicSubModel,
      label: "生产批量 EPQ",
      icon: <Factory className="w-4 h-4" />,
      tag: "边产边销",
    },
    {
      id: "shortage" as DeterministicSubModel,
      label: "允许缺货模型",
      icon: <AlertOctagon className="w-4 h-4" />,
      tag: "延迟交货",
    },
    {
      id: "discount" as DeterministicSubModel,
      label: "数量折扣模型",
      icon: <Percent className="w-4 h-4" />,
      tag: "阶梯价格",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Sliced Model Selector Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">确定型库存决策模型族</h2>
            <p className="text-xs text-slate-500">
              切换四大确定型经典模型，对比生产速率约束、缺货惩罚与阶梯折扣下的最优批量与总成本变动。
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {subModelTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubModel(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeSubModel === tab.id
                    ? "bg-white text-teal-800 shadow-xs ring-1 ring-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Comparison Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
          <div className={`p-3 rounded-xl border transition-all ${activeSubModel === "classic" ? "bg-teal-50/70 border-teal-300 ring-2 ring-teal-500/20" : "bg-slate-50/70 border-slate-200/70"}`}>
            <div className="text-[11px] text-slate-500 font-medium">经典 EOQ 最优批量</div>
            <div className="text-lg font-bold font-mono text-teal-800 mt-0.5">
              {Math.round(classicResult.optimalQ).toLocaleString()} <span className="text-xs font-normal">件</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              年变动成本: ¥{Math.round(classicResult.orderCost + classicResult.holdingCost).toLocaleString()}
            </div>
          </div>

          <div className={`p-3 rounded-xl border transition-all ${activeSubModel === "epq" ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20" : "bg-slate-50/70 border-slate-200/70"}`}>
            <div className="text-[11px] text-slate-500 font-medium">EPQ 生产批量 Q*</div>
            <div className="text-lg font-bold font-mono text-indigo-800 mt-0.5">
              {epqResult ? Math.round(epqResult.optimalQ).toLocaleString() : "P <= D 无解"} <span className="text-xs font-normal">套</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              峰值库存: {epqResult ? Math.round(epqResult.maxInventory).toLocaleString() : "-"} 套
            </div>
          </div>

          <div className={`p-3 rounded-xl border transition-all ${activeSubModel === "shortage" ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20" : "bg-slate-50/70 border-slate-200/70"}`}>
            <div className="text-[11px] text-slate-500 font-medium">允许缺货 Q* (含B*)</div>
            <div className="text-lg font-bold font-mono text-amber-800 mt-0.5">
              {shortageResult ? Math.round(shortageResult.optimalQ).toLocaleString() : "-"} <span className="text-xs font-normal">件</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              最大缺货量 B*: {shortageResult ? Math.round(shortageResult.maxBackorderB).toLocaleString() : "-"} 件
            </div>
          </div>

          <div className={`p-3 rounded-xl border transition-all ${activeSubModel === "discount" ? "bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20" : "bg-slate-50/70 border-slate-200/70"}`}>
            <div className="text-[11px] text-slate-500 font-medium">数量折扣最佳梯次</div>
            <div className="text-lg font-bold font-mono text-rose-800 mt-0.5">
              梯次 {discountResult.bestTier.tierIndex} (¥{discountResult.bestTier.price})
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              推荐订货量: {Math.round(discountResult.bestTier.feasibleQ).toLocaleString()} 件
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Model Content Slices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>{subModelTabs.find((t) => t.id === activeSubModel)?.label} 参数配置</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-teal-50 text-teal-700 rounded border border-teal-200">
                {subModelTabs.find((t) => t.id === activeSubModel)?.tag}
              </span>
            </h3>

            {/* Base parameters */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>年总需求量 D (件/年)</span>
                  <span className="font-mono font-bold text-teal-700">{demandD.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="500"
                  value={demandD}
                  onChange={(e) => setDemandD(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>单次订货/换产固定费 K (元/次)</span>
                  <span className="font-mono font-bold text-indigo-700">¥{orderCostK}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="1500"
                  step="20"
                  value={orderCostK}
                  onChange={(e) => setOrderCostK(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>单位年持有成本 h (元/件/年)</span>
                  <span className="font-mono font-bold text-amber-700">¥{holdingCostH.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={holdingCostH}
                  onChange={(e) => setHoldingCostH(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
              </div>

              {/* Conditional Model Inputs */}
              {activeSubModel === "epq" && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>年生产速率 P (件/年, 要求 P &gt; D)</span>
                    <span className="font-mono font-bold text-indigo-700">{productionRateP.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min={Math.round(demandD * 1.1)}
                    max={Math.round(demandD * 5)}
                    step="1000"
                    value={productionRateP}
                    onChange={(e) => setProductionRateP(Number(e.target.value))}
                    className="w-full h-1.5 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    消耗/生产比率 (1 - D/P) = {(1 - demandD / productionRateP).toFixed(3)}
                  </div>
                </div>
              )}

              {activeSubModel === "shortage" && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>单位年缺货损失费 p (元/件/年)</span>
                    <span className="font-mono font-bold text-rose-700">¥{shortageCostP.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="50.0"
                    step="1.0"
                    value={shortageCostP}
                    onChange={(e) => setShortageCostP(Number(e.target.value))}
                    className="w-full h-1.5 bg-rose-100 rounded-lg appearance-none cursor-pointer accent-rose-600"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    缺货扩增因子 √( (p+h)/p ) = {Math.sqrt((shortageCostP + holdingCostH) / shortageCostP).toFixed(3)}
                  </div>
                </div>
              )}

              {activeSubModel === "discount" && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">持有成本计算方式</span>
                    <button
                      onClick={() => setIsHoldingPercentage(!isHoldingPercentage)}
                      className="text-xs text-teal-700 font-semibold underline"
                    >
                      {isHoldingPercentage ? "按单价比例 I × c" : "固定持有费 h"}
                    </button>
                  </div>
                  {isHoldingPercentage && (
                    <div>
                      <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                        <span>年持有费率 I (% of price)</span>
                        <span className="font-mono font-bold text-amber-700">{(holdingRateI * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.40"
                        step="0.01"
                        value={holdingRateI}
                        onChange={(e) => setHoldingRateI(Number(e.target.value))}
                        className="w-full h-1.5 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-amber-600"
                      />
                    </div>
                  )}

                  {/* Tier Editor Table */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-600">折扣区间梯次与报价 (元/件)</span>
                    <div className="space-y-1 text-xs">
                      {discountTiers.map((tier, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                          <span className="font-mono text-slate-600">
                            梯次 {idx + 1}: [{tier.minQty} - {tier.maxQty === 999999 ? "∞" : tier.maxQty}]
                          </span>
                          <span className="font-mono font-bold text-teal-700">¥{tier.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Details & Mathematics Display */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Model Deep Dive Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
              <span>数学解析与运筹推导核心</span>
              <span className="text-xs font-mono text-slate-500">Formulas & Solutions</span>
            </h3>

            {/* Model Formula Cards */}
            {activeSubModel === "classic" && (
              <div className="space-y-3">
                <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-200">
                  <div className="text-xs font-bold text-teal-900 mb-1">经典 EOQ 核心推导公式</div>
                  <div className="font-mono text-xs font-bold text-teal-800 bg-white p-2 rounded-lg border border-teal-100">
                    {`Q* = √(2DK / h) = √(2 × ${demandD} × ${orderCostK} / ${holdingCostH}) = ${Math.round(classicResult.optimalQ)} 件`}
                  </div>
                  <div className="text-xs text-slate-700 mt-2">
                    补货周期 T* = <strong>{(classicResult.cycleTimeDays).toFixed(1)} 天</strong>；年订货次数 N* = <strong>{(classicResult.ordersPerYear).toFixed(2)} 次/年</strong>。
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="text-slate-500 text-[11px]">年订货成本</div>
                    <div className="font-mono font-bold text-indigo-700 mt-0.5">¥{Math.round(classicResult.orderCost).toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="text-slate-500 text-[11px]">年持有成本</div>
                    <div className="font-mono font-bold text-amber-700 mt-0.5">¥{Math.round(classicResult.holdingCost).toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="text-slate-500 text-[11px]">年总变动成本</div>
                    <div className="font-mono font-bold text-teal-700 mt-0.5">¥{Math.round(classicResult.orderCost + classicResult.holdingCost).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}

            {activeSubModel === "epq" && epqResult && (
              <div className="space-y-3">
                <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200">
                  <div className="text-xs font-bold text-indigo-900 mb-1">生产批量 EPQ 核心推导公式</div>
                  <div className="font-mono text-xs font-bold text-indigo-800 bg-white p-2 rounded-lg border border-indigo-100">
                    {`Q_epq* = √[2DK / (h(1 - D/P))] = √[2 × ${demandD} × ${orderCostK} / (${holdingCostH} × (1 - ${demandD}/${productionRateP}))] = ${Math.round(epqResult.optimalQ)} 套`}
                  </div>
                  <div className="text-xs text-slate-700 mt-2">
                    最高在库库存 I_max = <strong>{Math.round(epqResult.maxInventory)} 套</strong> (相比经典 EOQ 降低了 {(epqResult.ratio * 100).toFixed(1)}%)；单次生产时长 = <strong>{epqResult.productionRunDays.toFixed(1)} 天</strong>。
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="text-slate-500 text-[11px]">年换产总成本</div>
                    <div className="font-mono font-bold text-indigo-700 mt-0.5">¥{Math.round(epqResult.orderCost).toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="text-slate-500 text-[11px]">年持有总成本</div>
                    <div className="font-mono font-bold text-amber-700 mt-0.5">¥{Math.round(epqResult.holdingCost).toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="text-slate-500 text-[11px]">EPQ 年变动成本</div>
                    <div className="font-mono font-bold text-indigo-700 mt-0.5">¥{Math.round(epqResult.orderCost + epqResult.holdingCost).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}

            {activeSubModel === "shortage" && shortageResult && (
              <div className="space-y-3">
                <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
                  <div className="text-xs font-bold text-amber-900 mb-1">允许延迟交货 (Backorders) 核心公式</div>
                  <div className="font-mono text-xs font-bold text-amber-800 bg-white p-2 rounded-lg border border-amber-100">
                    {`Q* = √[ (2DK/h) · ((p+h)/p) ] = ${Math.round(shortageResult.optimalQ)} 件  ;  B* = Q* · [h / (p+h)] = ${Math.round(shortageResult.maxBackorderB)} 件`}
                  </div>
                  <div className="text-xs text-slate-700 mt-2">
                    允许适度缺货延迟交货时，最优订货批量被放大至 <strong>{Math.round(shortageResult.optimalQ)}</strong>，最大正向库存压缩至 <strong>{Math.round(shortageResult.maxPositiveInventoryS)}</strong> 件。
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="text-slate-500 text-[11px]">年持有成本</div>
                    <div className="font-mono font-bold text-amber-700 mt-0.5">¥{Math.round(shortageResult.holdingCost).toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="text-slate-500 text-[11px]">年缺货损失</div>
                    <div className="font-mono font-bold text-rose-700 mt-0.5">¥{Math.round(shortageResult.shortageCost).toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="text-slate-500 text-[11px]">年变动总成本</div>
                    <div className="font-mono font-bold text-teal-700 mt-0.5">¥{Math.round(shortageResult.orderCost + shortageResult.holdingCost + shortageResult.shortageCost).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}

            {activeSubModel === "discount" && (
              <div className="space-y-3">
                <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200">
                  <div className="text-xs font-bold text-rose-900 mb-1">数量折扣多梯次全成本对比 (包含采购总货款 cD)</div>
                  <div className="text-xs text-slate-700 mt-1">
                    由于单价变动直接影响总采购金额 $cD$，决策必须依据<strong>全成本 TC(Q) = 订货费 + 持有费 + 货款</strong>。
                  </div>
                </div>

                {/* Tiers evaluation table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-2">梯次</th>
                        <th className="p-2">单价</th>
                        <th className="p-2">无约束 Q*</th>
                        <th className="p-2">可行订货量</th>
                        <th className="p-2">年总成本 TC</th>
                        <th className="p-2">决策结论</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {discountResult.evaluatedTiers.map((t) => {
                        const isBest = t.tierIndex === discountResult.bestTier.tierIndex;
                        return (
                          <tr key={t.tierIndex} className={isBest ? "bg-teal-50/80 font-semibold text-teal-900" : "text-slate-700"}>
                            <td className="p-2">梯次 {t.tierIndex}</td>
                            <td className="p-2 font-mono">¥{t.price.toFixed(2)}</td>
                            <td className="p-2 font-mono">{Math.round(t.unconstrainedQ)}</td>
                            <td className="p-2 font-mono">{Math.round(t.feasibleQ)} {t.isAdjusted && "(端点)"}</td>
                            <td className="p-2 font-mono">¥{Math.round(t.totalCost).toLocaleString()}</td>
                            <td className="p-2">
                              {isBest ? (
                                <span className="inline-flex items-center gap-1 text-teal-700 font-bold">
                                  <Check className="w-3.5 h-3.5" /> 全局最优
                                </span>
                              ) : (
                                <span className="text-slate-400">次优</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Model Family Summary Insight Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
            <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-teal-600" />
              运筹模型族横向对比启示
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li><strong>生产批量 EPQ</strong> 相比经典 EOQ 增大了最优生产批量，但由于边生产边消耗，实际仓库最高库存反向被压缩。</li>
              <li><strong>允许缺货模型</strong> 通过承担适度缺货惩罚 $p$，推迟订货，降低了平均库存积压，适合缺货惩罚不大或客户可等待的场景。</li>
              <li><strong>数量折扣模型</strong> 说明当价格折扣节省的货款大于库存增加的持有成本时，企业应当果断跳档至折扣门槛。</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
