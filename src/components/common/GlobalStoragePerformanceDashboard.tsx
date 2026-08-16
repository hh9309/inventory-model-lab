import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  BarChart,
  AreaChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertOctagon,
  Percent,
  Sliders,
  RotateCcw,
  Sparkles,
  Zap,
  Activity,
  Calendar,
  Layers,
  HelpCircle,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Download,
  ShieldCheck,
  Clock,
  Boxes,
} from "lucide-react";

export interface GlobalDashboardProps {
  initialCollapsed?: boolean;
  onNavigateToModule?: (moduleId: any) => void;
}

// Preset business scenarios
const PRESET_SCENARIOS = [
  {
    id: "fmcg_fast",
    name: "⚡ 快消电商高周转模式",
    desc: "高需求、高周转、交期短，重点压低在库资金占用",
    params: {
      annualDemand: 60000,
      unitPrice: 25,
      orderCostK: 120,
      holdingRatePct: 18,
      shortageCostUnit: 40,
      leadTimeDays: 4,
      leadTimeStdDays: 1,
      demandCv: 0.2,
      serviceLevelPct: 98,
    },
  },
  {
    id: "precision_mfg",
    name: "🏭 精密装备制造精益模式",
    desc: "单价高、长交期、高缺货惩罚，严格防范停线",
    params: {
      annualDemand: 6000,
      unitPrice: 450,
      orderCostK: 600,
      holdingRatePct: 22,
      shortageCostUnit: 800,
      leadTimeDays: 15,
      leadTimeStdDays: 3,
      demandCv: 0.28,
      serviceLevelPct: 99.5,
    },
  },
  {
    id: "fresh_pharma",
    name: "🍎 季节生鲜/医药保供模式",
    desc: "保质期敏感、需求季节波动大、设置动态安全库存",
    params: {
      annualDemand: 24000,
      unitPrice: 35,
      orderCostK: 200,
      holdingRatePct: 32,
      shortageCostUnit: 90,
      leadTimeDays: 3,
      leadTimeStdDays: 1.5,
      demandCv: 0.45,
      serviceLevelPct: 95,
    },
  },
  {
    id: "bulk_material",
    name: "🏗️ 大宗原料长周期集采模式",
    desc: "单价低、订货费与批量大，依赖规模效应",
    params: {
      annualDemand: 120000,
      unitPrice: 12,
      orderCostK: 1800,
      holdingRatePct: 15,
      shortageCostUnit: 30,
      leadTimeDays: 30,
      leadTimeStdDays: 5,
      demandCv: 0.15,
      serviceLevelPct: 90,
    },
  },
];

// Standard Normal Inverse Approximation (Beasley-Springer-Moro)
function normInv(p: number): number {
  if (p <= 0 || p >= 1) return p >= 1 ? 3.5 : -3.5;
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];
  const p_low = 0.02425;
  const p_high = 1 - p_low;
  let q: number, r: number;
  if (p < p_low) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  } else if (p <= p_high) {
    q = p - 0.5;
    r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) *
        q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
}

export const GlobalStoragePerformanceDashboard: React.FC<GlobalDashboardProps> = ({
  initialCollapsed = false,
  onNavigateToModule,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(initialCollapsed);
  const [activeChartTab, setActiveChartTab] = useState<"evolution" | "tradeoff" | "inventory_funds">("evolution");

  // Core Parameters State
  const [annualDemand, setAnnualDemand] = useState<number>(20000);
  const [unitPrice, setUnitPrice] = useState<number>(50);
  const [orderCostK, setOrderCostK] = useState<number>(300);
  const [holdingRatePct, setHoldingRatePct] = useState<number>(20); // 20%
  const [shortageCostUnit, setShortageCostUnit] = useState<number>(75);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(7);
  const [leadTimeStdDays, setLeadTimeStdDays] = useState<number>(1.5);
  const [demandCv, setDemandCv] = useState<number>(0.25);
  const [serviceLevelPct, setServiceLevelPct] = useState<number>(95);
  const [customQMultiplier, setCustomQMultiplier] = useState<number>(1.0); // 1.0 = exact EOQ

  // Derived Unit Holding Cost h = c * (holdingRatePct / 100)
  const unitHoldingCostH = useMemo(() => {
    return Math.max(0.1, (unitPrice * holdingRatePct) / 100);
  }, [unitPrice, holdingRatePct]);

  // Classic Optimal EOQ Q*
  const optimalEoqQ = useMemo(() => {
    return Math.sqrt((2 * annualDemand * orderCostK) / unitHoldingCostH);
  }, [annualDemand, orderCostK, unitHoldingCostH]);

  // Active Batch Size Q
  const currentBatchQ = useMemo(() => {
    return Math.round(optimalEoqQ * customQMultiplier);
  }, [optimalEoqQ, customQMultiplier]);

  // Safety Stock SS = Z_alpha * sqrt(mu_L * sigma_D^2 + mu_D^2 * sigma_L^2)
  const safetyStockCalc = useMemo(() => {
    const alpha = Math.min(0.999, Math.max(0.5, serviceLevelPct / 100));
    const z = normInv(alpha);
    const dailyDemandMean = annualDemand / 365;
    const dailyDemandStd = dailyDemandMean * demandCv;

    const variance =
      leadTimeDays * Math.pow(dailyDemandStd, 2) +
      Math.pow(dailyDemandMean, 2) * Math.pow(leadTimeStdDays, 2);
    const combinedStd = Math.sqrt(Math.max(0, variance));
    const ss = Math.round(z * combinedStd);
    const rop = Math.round(dailyDemandMean * leadTimeDays + ss);

    return { z, ss, rop, dailyDemandMean, dailyDemandStd, combinedStd };
  }, [annualDemand, demandCv, leadTimeDays, leadTimeStdDays, serviceLevelPct]);

  // Global Key Performance Indicators (KPIs)
  const globalKpis = useMemo(() => {
    const avgCycleInventory = currentBatchQ / 2;
    const avgTotalInventory = avgCycleInventory + safetyStockCalc.ss;
    const avgCapitalTiedUp = avgTotalInventory * unitPrice;

    // Inventory Turnover Ratio (ITR) = Annual Demand / Average Inventory
    const inventoryTurnoverRatio =
      avgTotalInventory > 0 ? annualDemand / avgTotalInventory : 0;
    const daysInventoryOutstanding =
      inventoryTurnoverRatio > 0 ? 365 / inventoryTurnoverRatio : 0;

    // Annual Costs
    const annualHoldingCost = avgTotalInventory * unitHoldingCostH;
    const annualOrderingCost =
      currentBatchQ > 0 ? (annualDemand / currentBatchQ) * orderCostK : 0;

    // Estimated Stockout probability and lost sales cost
    const stockoutProbPct = Math.max(
      0.05,
      (1 - serviceLevelPct / 100) * 100 * Math.max(0.4, 1.2 - currentBatchQ / optimalEoqQ)
    );
    const estimatedAnnualStockoutLoss =
      (annualDemand * (stockoutProbPct / 100) * shortageCostUnit) / 5;

    const totalLogisticsCost =
      annualHoldingCost + annualOrderingCost + estimatedAnnualStockoutLoss;

    return {
      avgCycleInventory,
      avgTotalInventory,
      avgCapitalTiedUp,
      inventoryTurnoverRatio,
      daysInventoryOutstanding,
      annualHoldingCost,
      annualOrderingCost,
      stockoutProbPct,
      estimatedAnnualStockoutLoss,
      totalLogisticsCost,
    };
  }, [
    annualDemand,
    currentBatchQ,
    safetyStockCalc.ss,
    unitPrice,
    unitHoldingCostH,
    orderCostK,
    serviceLevelPct,
    optimalEoqQ,
    shortageCostUnit,
  ]);

  // 12-Month Historical & Forecast Evolution Dataset
  const evolutionData = useMemo(() => {
    const months = [
      "1月 (淡季)",
      "2月 (春节)",
      "3月 (回暖)",
      "4月 (稳态)",
      "5月 (初夏)",
      "6月 (大促)",
      "7月 (平稳)",
      "8月 (暑期)",
      "9月 (秋季)",
      "10月 (旺季)",
      "11月 (双11)",
      "12月 (年终)",
    ];

    // Seasonal demand weight pattern
    const seasonWeights = [
      0.75, 0.65, 0.9, 1.0, 1.05, 1.45, 0.95, 1.0, 1.1, 1.25, 1.6, 1.3,
    ];

    let currentInv = globalKpis.avgTotalInventory;

    return months.map((mName, idx) => {
      const weight = seasonWeights[idx];
      const monthlyDemand = (annualDemand / 12) * weight;

      // Dynamic demand variation & seasonal stock fluctuations
      const monthAvgInv =
        (currentBatchQ / 2) * (0.9 + 0.2 * Math.sin(idx)) +
        safetyStockCalc.ss * (weight > 1.2 ? 1.25 : 0.95);
      const monthlyHoldingCost = (monthAvgInv * unitHoldingCostH) / 12;
      const ordersInMonth = Math.max(1, Math.round(monthlyDemand / currentBatchQ));
      const monthlyOrderCost = ordersInMonth * orderCostK;

      // Dynamic stockout rate calculation for month
      const monthlyStockoutRate = Math.max(
        0.1,
        Number(
          (
            (globalKpis.stockoutProbPct * (weight > 1.2 ? 1.6 : 0.8)) /
            (customQMultiplier >= 1 ? 1 : 0.7)
          ).toFixed(2)
        )
      );

      const fillRatePct = Number((100 - monthlyStockoutRate).toFixed(2));

      // Annualized turnover rate for this month
      const monthlyTurnover = Number(
        ((monthlyDemand * 12) / Math.max(1, monthAvgInv)).toFixed(2)
      );

      // Capital tied in inventory (k RMB)
      const fundsTiedK = Number(((monthAvgInv * unitPrice) / 1000).toFixed(1));

      return {
        month: mName,
        shortMonth: `${idx + 1}月`,
        monthlyDemand: Math.round(monthlyDemand),
        avgInventory: Math.round(monthAvgInv),
        turnoverRate: monthlyTurnover,
        holdingCost: Math.round(monthlyHoldingCost),
        orderingCost: Math.round(monthlyOrderCost),
        totalMonthlyCost: Math.round(monthlyHoldingCost + monthlyOrderCost),
        stockoutRate: monthlyStockoutRate,
        fillRate: fillRatePct,
        fundsTiedK: fundsTiedK,
      };
    });
  }, [
    annualDemand,
    currentBatchQ,
    safetyStockCalc.ss,
    unitHoldingCostH,
    orderCostK,
    globalKpis.stockoutProbPct,
    globalKpis.avgTotalInventory,
    customQMultiplier,
    unitPrice,
  ]);

  // Batch Size Q Sensitivity Curve Data (Trade-off)
  const tradeoffCurveData = useMemo(() => {
    const points = [];
    const minQ = Math.max(20, Math.round(optimalEoqQ * 0.25));
    const maxQ = Math.round(optimalEoqQ * 2.5);
    const step = Math.max(10, Math.round((maxQ - minQ) / 35));

    for (let q = minQ; q <= maxQ; q += step) {
      const oc = (annualDemand / q) * orderCostK;
      const hc = (q / 2 + safetyStockCalc.ss) * unitHoldingCostH;
      const turnover = annualDemand / (q / 2 + safetyStockCalc.ss);
      const stockoutPct = Math.max(
        0.05,
        (1 - serviceLevelPct / 100) * 100 * (optimalEoqQ / q)
      );
      const tc = oc + hc + (annualDemand * (stockoutPct / 100) * shortageCostUnit) / 5;

      points.push({
        batchQ: q,
        isCurrent: Math.abs(q - currentBatchQ) < step / 1.5,
        holdingCost: Math.round(hc),
        orderingCost: Math.round(oc),
        totalCost: Math.round(tc),
        turnoverRate: Number(turnover.toFixed(2)),
        stockoutRate: Number(stockoutPct.toFixed(2)),
      });
    }
    return points;
  }, [
    optimalEoqQ,
    annualDemand,
    orderCostK,
    safetyStockCalc.ss,
    unitHoldingCostH,
    serviceLevelPct,
    shortageCostUnit,
    currentBatchQ,
  ]);

  // Load Preset
  const handleLoadPreset = (scenario: (typeof PRESET_SCENARIOS)[0]) => {
    setAnnualDemand(scenario.params.annualDemand);
    setUnitPrice(scenario.params.unitPrice);
    setOrderCostK(scenario.params.orderCostK);
    setHoldingRatePct(scenario.params.holdingRatePct);
    setShortageCostUnit(scenario.params.shortageCostUnit);
    setLeadTimeDays(scenario.params.leadTimeDays);
    setLeadTimeStdDays(scenario.params.leadTimeStdDays);
    setDemandCv(scenario.params.demandCv);
    setServiceLevelPct(scenario.params.serviceLevelPct);
    setCustomQMultiplier(1.0);
  };

  // Reset to default
  const handleResetDefaults = () => {
    setAnnualDemand(20000);
    setUnitPrice(50);
    setOrderCostK(300);
    setHoldingRatePct(20);
    setShortageCostUnit(75);
    setLeadTimeDays(7);
    setLeadTimeStdDays(1.5);
    setDemandCv(0.25);
    setServiceLevelPct(95);
    setCustomQMultiplier(1.0);
  };

  return (
    <section className="bg-white rounded-lg border border-[#CBD5E1] shadow-xs mb-6 overflow-hidden transition-all">
      {/* Top Banner & Cockpit Header */}
      <div className="bg-[#1E293B] text-white p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#2563EB]/40 border border-[#3B82F6]/50 rounded-lg text-blue-300">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>全局存储性能监控看板</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-[#0284C7] text-white rounded font-bold">
                  Recharts 实时驱动
                </span>
              </h3>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed">
              实时推演<strong>库存周转率 (ITR)</strong>、<strong>年化综合持有成本</strong>、<strong>缺货率风险</strong>的历史演变轨迹与参数边际敏感度。
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="flex items-center bg-[#334155] rounded p-0.5 border border-[#475569] text-xs">
            {PRESET_SCENARIOS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleLoadPreset(preset)}
                title={preset.desc}
                className="px-2.5 py-1 text-[11px] font-medium text-[#E2E8F0] hover:text-white hover:bg-[#475569] rounded transition-colors cursor-pointer"
              >
                {preset.name.split(" ")[0]} {preset.name.split(" ")[1]}
              </button>
            ))}
          </div>

          <button
            onClick={handleResetDefaults}
            title="重置为基准默认参数"
            className="p-1.5 bg-[#334155] hover:bg-[#475569] text-[#CBD5E1] hover:text-white rounded border border-[#475569] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            {isCollapsed ? (
              <>
                <span>展开看板</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>收起看板</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards Strip (Always Visible for instant glance) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-[#E2E8F0] bg-[#F8FAFC] border-b border-[#E2E8F0]">
        {/* KPI 1: Inventory Turnover */}
        <div className="p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[#64748B] text-[11px] font-medium">
            <span>库存周转率 (ITR)</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#2563EB]" />
          </div>
          <div className="text-lg font-bold text-[#0F172A] font-mono">
            {globalKpis.inventoryTurnoverRatio.toFixed(2)}
            <span className="text-xs font-normal text-[#64748B] ml-1">次/年</span>
          </div>
          <div className="text-[10px] text-[#2563EB] font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>DIO 周转天数: {globalKpis.daysInventoryOutstanding.toFixed(0)} 天</span>
          </div>
        </div>

        {/* KPI 2: Total Holding Cost */}
        <div className="p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[#64748B] text-[11px] font-medium">
            <span>年综合持有成本</span>
            <DollarSign className="w-3.5 h-3.5 text-[#D97706]" />
          </div>
          <div className="text-lg font-bold text-[#0F172A] font-mono">
            ¥{Math.round(globalKpis.annualHoldingCost).toLocaleString()}
          </div>
          <div className="text-[10px] text-[#64748B]">
            单位 h = ¥{unitHoldingCostH.toFixed(2)} /件/年
          </div>
        </div>

        {/* KPI 3: Stockout Rate */}
        <div className="p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[#64748B] text-[11px] font-medium">
            <span>缺货率风险 (Stockout)</span>
            <AlertOctagon className="w-3.5 h-3.5 text-[#DC2626]" />
          </div>
          <div className="text-lg font-bold text-[#DC2626] font-mono">
            {globalKpis.stockoutProbPct.toFixed(2)}%
          </div>
          <div className="text-[10px] text-emerald-700 font-medium">
            交付满足率: {(100 - globalKpis.stockoutProbPct).toFixed(2)}%
          </div>
        </div>

        {/* KPI 4: Capital Tied Up */}
        <div className="p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[#64748B] text-[11px] font-medium">
            <span>在库占用沉淀资金</span>
            <Package className="w-3.5 h-3.5 text-[#7C3AED]" />
          </div>
          <div className="text-lg font-bold text-[#0F172A] font-mono">
            ¥{(globalKpis.avgCapitalTiedUp / 10000).toFixed(2)}
            <span className="text-xs font-normal text-[#64748B] ml-1">万元</span>
          </div>
          <div className="text-[10px] text-[#64748B]">
            平均库存: {Math.round(globalKpis.avgTotalInventory)} 件
          </div>
        </div>

        {/* KPI 5: Safety Stock Buffer */}
        <div className="p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[#64748B] text-[11px] font-medium">
            <span>安全库存与再订货点</span>
            <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
          </div>
          <div className="text-lg font-bold text-[#059669] font-mono">
            SS={safetyStockCalc.ss}
            <span className="text-xs font-normal text-[#64748B] ml-1">件</span>
          </div>
          <div className="text-[10px] text-[#64748B]">
            ROP = {safetyStockCalc.rop} 件 (Z={safetyStockCalc.z.toFixed(2)})
          </div>
        </div>

        {/* KPI 6: Total Supply Chain Cost */}
        <div className="p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[#64748B] text-[11px] font-medium">
            <span>年变动总运营成本</span>
            <Boxes className="w-3.5 h-3.5 text-[#0284C7]" />
          </div>
          <div className="text-lg font-bold text-[#0284C7] font-mono">
            ¥{Math.round(globalKpis.totalLogisticsCost).toLocaleString()}
          </div>
          <div className="text-[10px] text-[#64748B]">
            订货费: ¥{Math.round(globalKpis.annualOrderingCost).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Expandable Cockpit Body */}
      {!isCollapsed && (
        <div className="p-4 sm:p-6 space-y-6 bg-white">
          {/* Main Grid: Left Controls (1/3) vs Right Interactive Recharts (2/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT: Live Interactive Parameters Panel (4 cols) */}
            <div className="lg:col-span-4 bg-[#F8FAFC] rounded-lg p-4 border border-[#E2E8F0] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  <Sliders className="w-4 h-4 text-[#2563EB]" />
                  <span>实时仿真控制台 (Inputs)</span>
                </div>
                <span className="text-[10px] text-[#64748B] font-mono">毫秒级重算</span>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* 1. Demand D */}
                <div>
                  <div className="flex justify-between font-medium text-[#334155] mb-1">
                    <span>年总需求量 (D)</span>
                    <span className="font-mono font-bold text-[#2563EB]">
                      {annualDemand.toLocaleString()} 件/年
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2000}
                    max={150000}
                    step={1000}
                    value={annualDemand}
                    onChange={(e) => setAnnualDemand(Number(e.target.value))}
                    className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
                  />
                </div>

                {/* 2. Unit Price c & Holding Rate */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#475569] font-medium mb-1">采购单价 (c)</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-[#94A3B8]">¥</span>
                      <input
                        type="number"
                        min={1}
                        max={5000}
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(Math.max(1, Number(e.target.value)))}
                        className="w-full pl-6 pr-2 py-1 bg-white border border-[#CBD5E1] rounded text-xs text-[#0F172A] font-mono focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#475569] font-medium mb-1">年持有费率 (h%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={5}
                        max={60}
                        value={holdingRatePct}
                        onChange={(e) => setHoldingRatePct(Math.max(1, Number(e.target.value)))}
                        className="w-full px-2 py-1 bg-white border border-[#CBD5E1] rounded text-xs text-[#0F172A] font-mono focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                      />
                      <span className="absolute right-2 top-1.5 text-[#94A3B8]">%</span>
                    </div>
                  </div>
                </div>

                {/* 3. Order Cost K & Shortage Penalty */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#475569] font-medium mb-1">订货费 (K /次)</label>
                    <input
                      type="number"
                      min={10}
                      max={5000}
                      value={orderCostK}
                      onChange={(e) => setOrderCostK(Math.max(1, Number(e.target.value)))}
                      className="w-full px-2 py-1 bg-white border border-[#CBD5E1] rounded text-xs text-[#0F172A] font-mono focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#475569] font-medium mb-1">缺货惩罚 (p /件)</label>
                    <input
                      type="number"
                      min={5}
                      max={2000}
                      value={shortageCostUnit}
                      onChange={(e) => setShortageCostUnit(Math.max(1, Number(e.target.value)))}
                      className="w-full px-2 py-1 bg-white border border-[#CBD5E1] rounded text-xs text-[#0F172A] font-mono focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>

                {/* 4. Lead time and Lead time Std */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#475569] font-medium mb-1">提前期均值 (L)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={leadTimeDays}
                        onChange={(e) => setLeadTimeDays(Math.max(1, Number(e.target.value)))}
                        className="w-full px-2 py-1 bg-white border border-[#CBD5E1] rounded text-xs text-[#0F172A] font-mono focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                      />
                      <span className="absolute right-2 top-1.5 text-[#94A3B8]">天</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#475569] font-medium mb-1">提前期波动 (σ_L)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={30}
                        step={0.5}
                        value={leadTimeStdDays}
                        onChange={(e) => setLeadTimeStdDays(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2 py-1 bg-white border border-[#CBD5E1] rounded text-xs text-[#0F172A] font-mono focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                      />
                      <span className="absolute right-2 top-1.5 text-[#94A3B8]">天</span>
                    </div>
                  </div>
                </div>

                {/* 5. Demand CV & Service Level */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#475569] font-medium mb-1">需求波动率 (CV)</label>
                    <input
                      type="number"
                      min={0.05}
                      max={1.5}
                      step={0.05}
                      value={demandCv}
                      onChange={(e) => setDemandCv(Math.max(0.01, Number(e.target.value)))}
                      className="w-full px-2 py-1 bg-white border border-[#CBD5E1] rounded text-xs text-[#0F172A] font-mono focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#475569] font-medium mb-1">目标服务水平 (α)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={75}
                        max={99.9}
                        step={0.5}
                        value={serviceLevelPct}
                        onChange={(e) => setServiceLevelPct(Math.min(99.9, Math.max(70, Number(e.target.value))))}
                        className="w-full px-2 py-1 bg-white border border-[#CBD5E1] rounded text-xs text-[#0F172A] font-mono focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                      />
                      <span className="absolute right-2 top-1.5 text-[#94A3B8]">%</span>
                    </div>
                  </div>
                </div>

                {/* 6. Batch Multiplier Slider (Testing deviation from EOQ) */}
                <div className="pt-2 border-t border-[#E2E8F0] space-y-1">
                  <div className="flex justify-between text-[#334155]">
                    <span className="font-medium">当前订货批量 (Q)</span>
                    <span className="font-mono font-bold text-[#059669]">
                      {currentBatchQ} 件 ({customQMultiplier.toFixed(2)}x EOQ)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.3}
                    max={2.5}
                    step={0.05}
                    value={customQMultiplier}
                    onChange={(e) => setCustomQMultiplier(Number(e.target.value))}
                    className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#059669]"
                  />
                  <div className="flex justify-between text-[10px] text-[#64748B]">
                    <span>0.3x (极速周转)</span>
                    <span className="text-[#2563EB] font-bold">1.0x EOQ ({Math.round(optimalEoqQ)})</span>
                    <span>2.5x (大批量囤货)</span>
                  </div>
                </div>
              </div>

              {/* Status Note */}
              <div className="p-2.5 bg-blue-50/80 rounded border border-blue-200 text-[11px] text-[#1E40AF] leading-relaxed">
                <strong>💡 实时动态观察：</strong>
                当增大批量 $Q$ 时，周转率 $ITR$ 下滑且持有资金激增；当压缩 $Q$ 时，订货频次升高且缺货暴露期变密。
              </div>
            </div>

            {/* RIGHT: Recharts Interactive Visualizer (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Chart Mode Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveChartTab("evolution")}
                    className={`px-3 py-1.5 text-xs font-bold rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeChartTab === "evolution"
                        ? "bg-[#2563EB] text-white shadow-xs"
                        : "bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569]"
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>12个月演变趋势 (周转/成本/缺货)</span>
                  </button>

                  <button
                    onClick={() => setActiveChartTab("tradeoff")}
                    className={`px-3 py-1.5 text-xs font-bold rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeChartTab === "tradeoff"
                        ? "bg-[#2563EB] text-white shadow-xs"
                        : "bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569]"
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>批量 Q 边际博弈曲面</span>
                  </button>

                  <button
                    onClick={() => setActiveChartTab("inventory_funds")}
                    className={`px-3 py-1.5 text-xs font-bold rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeChartTab === "inventory_funds"
                        ? "bg-[#2563EB] text-white shadow-xs"
                        : "bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569]"
                    }`}
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span>月度水位与资金占用 (Bar + Area)</span>
                  </button>
                </div>

                <div className="text-[11px] text-[#64748B] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                  <span>动态刷新中</span>
                </div>
              </div>

              {/* TAB 1: 12-Month Dual Axis Evolution Trend */}
              {activeChartTab === "evolution" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#475569]">
                    <span className="font-semibold text-[#0F172A]">
                      12 个月全周期双轴演变：周转率 (左轴，次/年) vs 持有成本 (左轴，元) vs 缺货率 (右轴，%)
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      年化基准需求: {annualDemand.toLocaleString()} 件
                    </span>
                  </div>

                  <div className="h-72 w-full bg-[#FAFAFA] rounded-lg border border-[#E2E8F0] p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={evolutionData} margin={{ top: 15, right: 25, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="shortMonth" stroke="#64748B" fontSize={11} tickLine={false} />
                        {/* Left Axis: Cost & Turnover */}
                        <YAxis
                          yAxisId="left"
                          stroke="#2563EB"
                          fontSize={11}
                          tickLine={false}
                          label={{
                            value: "持有成本 (元) / 周转率",
                            angle: -90,
                            position: "insideLeft",
                            fontSize: 10,
                            fill: "#2563EB",
                          }}
                        />
                        {/* Right Axis: Stockout Percentage */}
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#DC2626"
                          fontSize={11}
                          tickLine={false}
                          domain={[0, (dataMax: number) => Math.max(5, Math.ceil(dataMax * 1.3))]}
                          unit="%"
                          label={{
                            value: "缺货率 (%)",
                            angle: 90,
                            position: "insideRight",
                            fontSize: 10,
                            fill: "#DC2626",
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1E293B",
                            borderColor: "#334155",
                            color: "#FFFFFF",
                            borderRadius: "6px",
                            fontSize: "11px",
                          }}
                          formatter={(val: any, name: any) => {
                            if (name === "月度持有成本") return [`¥${val} 元`, name];
                            if (name === "月度总变动成本") return [`¥${val} 元`, name];
                            if (name === "库存周转率") return [`${val} 次/年`, name];
                            if (name === "缺货率") return [`${val}%`, name];
                            if (name === "资金占用") return [`¥${val} 千元`, name];
                            return [val, name];
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                        
                        {/* Holding cost Area */}
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="holdingCost"
                          name="月度持有成本"
                          fill="#93C5FD"
                          stroke="#2563EB"
                          fillOpacity={0.3}
                        />

                        {/* Inventory Turnover Line */}
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="turnoverRate"
                          name="库存周转率"
                          stroke="#059669"
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: "#059669" }}
                        />

                        {/* Stockout Rate Line on Right Axis */}
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="stockoutRate"
                          name="缺货率"
                          stroke="#DC2626"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={{ r: 3, fill: "#DC2626" }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* TAB 2: Batch Size Q Trade-off Curves */}
              {activeChartTab === "tradeoff" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#475569]">
                    <span className="font-semibold text-[#0F172A]">
                      订货批量 Q 边际博弈曲面：持有成本 (递增) vs 订货成本 (递减) vs 总成本 (U型极小点)
                    </span>
                    <span className="text-[11px] font-mono text-[#059669]">
                      当前 Q = {currentBatchQ} 件
                    </span>
                  </div>

                  <div className="h-72 w-full bg-[#FAFAFA] rounded-lg border border-[#E2E8F0] p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={tradeoffCurveData} margin={{ top: 15, right: 25, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis
                          dataKey="batchQ"
                          stroke="#64748B"
                          fontSize={11}
                          tickLine={false}
                          label={{ value: "单次订货批量 Q (件)", position: "insideBottom", offset: -3, fontSize: 10 }}
                        />
                        <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit="元" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1E293B",
                            borderColor: "#334155",
                            color: "#FFFFFF",
                            borderRadius: "6px",
                            fontSize: "11px",
                          }}
                          formatter={(val: any, name: any) => [`¥${val} 元`, name]}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />

                        {/* Reference Line for Current Batch Size */}
                        <ReferenceLine
                          x={currentBatchQ}
                          stroke="#E11D48"
                          strokeDasharray="3 3"
                          label={{ value: "当前设定Q", fill: "#E11D48", fontSize: 10, position: "top" }}
                        />

                        <Line
                          type="monotone"
                          dataKey="holdingCost"
                          name="年持有成本 (递增)"
                          stroke="#2563EB"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="orderingCost"
                          name="年订货成本 (递减)"
                          stroke="#D97706"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="totalCost"
                          name="年变动总成本 (U型最优解)"
                          stroke="#059669"
                          strokeWidth={3}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* TAB 3: Monthly Inventory Level & Funds Tied Up */}
              {activeChartTab === "inventory_funds" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#475569]">
                    <span className="font-semibold text-[#0F172A]">
                      月度平均在库量 (Bar，件) 与 占用沉淀资金 (Line，千元)
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      安全库存常备基底: {safetyStockCalc.ss} 件
                    </span>
                  </div>

                  <div className="h-72 w-full bg-[#FAFAFA] rounded-lg border border-[#E2E8F0] p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={evolutionData} margin={{ top: 15, right: 25, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="shortMonth" stroke="#64748B" fontSize={11} tickLine={false} />
                        <YAxis yAxisId="left" stroke="#64748B" fontSize={11} tickLine={false} unit="件" />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#7C3AED"
                          fontSize={11}
                          tickLine={false}
                          unit="k¥"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1E293B",
                            borderColor: "#334155",
                            color: "#FFFFFF",
                            borderRadius: "6px",
                            fontSize: "11px",
                          }}
                          formatter={(val: any, name: any) => {
                            if (name === "在库占用资金") return [`¥${val} 千元`, name];
                            if (name === "平均在库量") return [`${val} 件`, name];
                            if (name === "月度需求量") return [`${val} 件`, name];
                            return [val, name];
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />

                        <Bar
                          yAxisId="left"
                          dataKey="avgInventory"
                          name="平均在库量"
                          fill="#3B82F6"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="monthlyDemand"
                          name="月度需求量"
                          fill="#CBD5E1"
                          radius={[4, 4, 0, 0]}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="fundsTiedK"
                          name="在库占用资金"
                          stroke="#7C3AED"
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: "#7C3AED" }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Bottom Quick Insight Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-[#F8FAFC] rounded border border-[#E2E8F0] text-xs text-[#475569]">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>
                    <strong>运筹决策平衡点：</strong> 经典 EOQ 最优批量 $Q^* = {Math.round(optimalEoqQ)}$ 件，在此点持有成本与订货成本达成完美交叉对等。
                  </span>
                </div>

                {onNavigateToModule && (
                  <button
                    onClick={() => onNavigateToModule("tank_sandbox")}
                    className="text-[#2563EB] hover:underline font-bold text-[11px] flex items-center gap-1 shrink-0"
                  >
                    <span>前往水箱沙盒观察动态浮球响应</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
