import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Grid3X3,
  Layers,
  Sparkles,
  Sliders,
  Play,
  RotateCcw,
  TrendingDown,
  ShieldAlert,
  Zap,
  Activity,
  ArrowRight,
  Info,
  DollarSign,
  Snowflake,
  Flame,
  CheckCircle2,
  Droplets,
  PackageCheck,
  Search,
} from "lucide-react";

export type AbcType = "A" | "B" | "C";
export type XyzType = "X" | "Y" | "Z";
export type CategoryKey = "AX" | "AY" | "AZ" | "BX" | "BY" | "BZ" | "CX" | "CY" | "CZ";

export interface SkuItem {
  id: string;
  code: string;
  name: string;
  annualRevenue: number; // 销售额 (元)
  cv: number; // 需求波动系数 (标准差/均值)
  abc: AbcType;
  xyz: XyzType;
  category: CategoryKey;
  avgDailyDemand: number;
  unitPrice: number;
  stockQty: number;
  // Canvas coordinate physics
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  scatterX: number;
  scatterY: number;
  gridTargetX: number;
  gridTargetY: number;
  color: string;
  radius: number;
}

export interface CategoryStrategyConfig {
  category: CategoryKey;
  label: string;
  subLabel: string;
  abc: AbcType;
  xyz: XyzType;
  color: string;
  bgClass: string;
  borderClass: string;
  model: string;
  controlPolicy: string;
  reviewFreq: string;
  defaultServiceLevel: number; // %
  currentServiceLevel: number; // %
  leadTimeDays: number;
  safetyStockUnits: number;
  turnoverDaysDIO: number; // 资金周转天数
  capitalOccupied: number; // 资金占用 (元)
  isFrozenWarning: boolean;
  liquidityScore: number; // 0-100 流动性评分
}

const INITIAL_STRATEGIES: Record<CategoryKey, CategoryStrategyConfig> = {
  AX: {
    category: "AX",
    label: "AX 类 (高价值 · 低波动)",
    subLabel: "核心现金牛 / 主力周转品",
    abc: "A",
    xyz: "X",
    color: "#2563eb",
    bgClass: "bg-blue-50/80",
    borderClass: "border-blue-300",
    model: "准时制 JIT / 经典 EOQ 自动高频连续补货",
    controlPolicy: "高频连续盘点 (s, Q)，极低安全库存",
    reviewFreq: "每日连续监控",
    defaultServiceLevel: 98,
    currentServiceLevel: 98,
    leadTimeDays: 3,
    safetyStockUnits: 32,
    turnoverDaysDIO: 12,
    capitalOccupied: 385000,
    isFrozenWarning: false,
    liquidityScore: 96,
  },
  AY: {
    category: "AY",
    label: "AY 类 (高价值 · 中波动)",
    subLabel: "重点防缺品 / 脉冲式采购",
    abc: "A",
    xyz: "Y",
    color: "#0891b2",
    bgClass: "bg-cyan-50/80",
    borderClass: "border-cyan-300",
    model: "动态 (s, S) 连续盘点 + 供应商协同",
    controlPolicy: "动态预警补货水位，适度安全缓冲",
    reviewFreq: "每周二次审核",
    defaultServiceLevel: 96,
    currentServiceLevel: 96,
    leadTimeDays: 5,
    safetyStockUnits: 68,
    turnoverDaysDIO: 22,
    capitalOccupied: 260000,
    isFrozenWarning: false,
    liquidityScore: 84,
  },
  AZ: {
    category: "AZ",
    label: "AZ 类 (高价值 · 极高波动)",
    subLabel: "高风险战略品 / 呆滞极高危",
    abc: "A",
    xyz: "Z",
    color: "#dc2626",
    bgClass: "bg-red-50/80",
    borderClass: "border-red-300",
    model: "单周期报童 / VMI 寄售 / 按单定制 (MTO)",
    controlPolicy: "严格预算审批，临界分位数精算，杜绝超储",
    reviewFreq: "逐单人工专家评审",
    defaultServiceLevel: 92,
    currentServiceLevel: 92,
    leadTimeDays: 10,
    safetyStockUnits: 110,
    turnoverDaysDIO: 48,
    capitalOccupied: 195000,
    isFrozenWarning: true,
    liquidityScore: 42,
  },
  BX: {
    category: "BX",
    label: "BX 类 (中价值 · 低波动)",
    subLabel: "稳定流通件 / 标准品",
    abc: "B",
    xyz: "X",
    color: "#059669",
    bgClass: "bg-emerald-50/80",
    borderClass: "border-emerald-300",
    model: "标准周期盘点 (R, S) 补齐模型",
    controlPolicy: "固定周期自动触发补库，批量合并",
    reviewFreq: "隔周定期盘点",
    defaultServiceLevel: 95,
    currentServiceLevel: 95,
    leadTimeDays: 5,
    safetyStockUnits: 45,
    turnoverDaysDIO: 28,
    capitalOccupied: 140000,
    isFrozenWarning: false,
    liquidityScore: 78,
  },
  BY: {
    category: "BY",
    label: "BY 类 (中价值 · 中波动)",
    subLabel: "常规配件 / 季节性波动",
    abc: "B",
    xyz: "Y",
    color: "#d97706",
    bgClass: "bg-amber-50/80",
    borderClass: "border-amber-300",
    model: "安全库存加权缓冲 + 阶梯折扣订货",
    controlPolicy: "动态调整 ROP，结合大促前置备料",
    reviewFreq: "月度例行调整",
    defaultServiceLevel: 92,
    currentServiceLevel: 92,
    leadTimeDays: 7,
    safetyStockUnits: 82,
    turnoverDaysDIO: 36,
    capitalOccupied: 110000,
    isFrozenWarning: false,
    liquidityScore: 65,
  },
  BZ: {
    category: "BZ",
    label: "BZ 类 (中价值 · 高波动)",
    subLabel: "冷门备件 / 易产生积压",
    abc: "B",
    xyz: "Z",
    color: "#b45309",
    bgClass: "bg-orange-50/80",
    borderClass: "border-orange-300",
    model: "定量订购制 (s, Q) + 最小批量约束",
    controlPolicy: "压缩单次订货上限，延缓提前期备货",
    reviewFreq: "双周抽盘监控",
    defaultServiceLevel: 88,
    currentServiceLevel: 88,
    leadTimeDays: 12,
    safetyStockUnits: 95,
    turnoverDaysDIO: 62,
    capitalOccupied: 85000,
    isFrozenWarning: true,
    liquidityScore: 48,
  },
  CX: {
    category: "CX",
    label: "CX 类 (低价值 · 低波动)",
    subLabel: "标准耗材 / 螺丝紧固件",
    abc: "C",
    xyz: "X",
    color: "#475569",
    bgClass: "bg-slate-50/80",
    borderClass: "border-slate-300",
    model: "双箱法 (Two-Bin System) / 批量合并采购",
    controlPolicy: "一箱见底即补新箱，极大化订货批量降低管理费",
    reviewFreq: "季度抽盘 / 可视化看板",
    defaultServiceLevel: 92,
    currentServiceLevel: 92,
    leadTimeDays: 7,
    safetyStockUnits: 150,
    turnoverDaysDIO: 42,
    capitalOccupied: 35000,
    isFrozenWarning: false,
    liquidityScore: 72,
  },
  CY: {
    category: "CY",
    label: "CY 类 (低价值 · 中波动)",
    subLabel: "低价长尾品 / 慢周转消耗",
    abc: "C",
    xyz: "Y",
    color: "#64748b",
    bgClass: "bg-slate-100/80",
    borderClass: "border-slate-300",
    model: "长周期大批量采购 / 寄售消耗结算",
    controlPolicy: "减少订货操作频次，以空间换管理成本",
    reviewFreq: "半年盘点",
    defaultServiceLevel: 88,
    currentServiceLevel: 88,
    leadTimeDays: 14,
    safetyStockUnits: 200,
    turnoverDaysDIO: 68,
    capitalOccupied: 28000,
    isFrozenWarning: false,
    liquidityScore: 54,
  },
  CZ: {
    category: "CZ",
    label: "CZ 类 (低价值 · 高波动)",
    subLabel: "极度长尾 / 呆滞重灾区",
    abc: "C",
    xyz: "Z",
    color: "#94a3b8",
    bgClass: "bg-slate-200/70",
    borderClass: "border-slate-400",
    model: "双箱法 / 呆滞报废清理 / 无库存采购",
    controlPolicy: "按需零散采购，绝不主动常备大库存，定期清仓",
    reviewFreq: "年度清仓审计",
    defaultServiceLevel: 80,
    currentServiceLevel: 80,
    leadTimeDays: 20,
    safetyStockUnits: 80,
    turnoverDaysDIO: 115,
    capitalOccupied: 22000,
    isFrozenWarning: true,
    liquidityScore: 28,
  },
};

// Generate realistic mock dataset of 220 SKU items
function generateMockSkuList(): SkuItem[] {
  const categories: CategoryKey[] = ["AX", "AY", "AZ", "BX", "BY", "BZ", "CX", "CY", "CZ"];
  const counts: Record<CategoryKey, number> = {
    AX: 35,
    AY: 20,
    AZ: 10,
    BX: 45,
    BY: 30,
    BZ: 15,
    CX: 35,
    CY: 20,
    CZ: 10,
  };

  const skuNames: Record<CategoryKey, string[]> = {
    AX: ["精密主控 MCU-900", "高频滤波器 FL-10", "高能锂电模组 P-80", "主驱动芯片 DRV-44", "高速光耦 OP-200"],
    AY: ["工业传感器 SN-50", "功率放大器 PA-88", "步进电机驱动 ST-12", "精密编码器 EN-300"],
    AZ: ["特种定制芯片 AS-99", "军工级电容 CAP-SP", "航空级连接器 CN-X", "高压晶闸管 SCR-800"],
    BX: ["铝合金散热器 HS-40", "稳压电源板 PS-24", "标准继电器 RY-12", "工业风扇 FAN-80"],
    BY: ["微动开关 SW-05", "屏蔽电缆线 CB-5M", "压敏电阻 RV-20", "接线端子排 TB-10"],
    BZ: ["进口调谐器 TU-9", "特规热敏电阻 NT-8", "激光发射管 LD-650", "高频变压器 TR-100"],
    CX: ["不锈钢自攻螺栓 M3", "绝缘垫片 WP-04", "扎带包 ZD-100", "固定卡扣 CL-08", "热缩套管 HS-20"],
    CY: ["包装封箱胶带 TAPE", "防静电泡沫棉 FOAM", "防尘塞 CAP-06", "标签打印碳带 RB-10"],
    CZ: ["备用特种扳手 WT-01", "停产老款垫圈 RG-02", "淘汰机箱螺母 NT-M2", "测试引脚治具 PIN-8"],
  };

  const list: SkuItem[] = [];
  let index = 1;

  for (const cat of categories) {
    const count = counts[cat];
    const names = skuNames[cat];
    const abc = cat[0] as AbcType;
    const xyz = cat[1] as XyzType;
    const cfg = INITIAL_STRATEGIES[cat];

    for (let i = 0; i < count; i++) {
      const code = `SKU-${cat}-${(100 + index).toString()}`;
      const name = `${names[i % names.length]}-${(i + 1).toString().padStart(2, "0")}`;

      // Revenue Distribution
      let baseRev = 20000;
      if (abc === "A") baseRev = 350000 + Math.random() * 400000;
      else if (abc === "B") baseRev = 80000 + Math.random() * 180000;
      else baseRev = 5000 + Math.random() * 45000;

      // CV Distribution
      let cv = 0.15;
      if (xyz === "X") cv = 0.05 + Math.random() * 0.18; // 0.05 - 0.23
      else if (xyz === "Y") cv = 0.26 + Math.random() * 0.24; // 0.26 - 0.50
      else cv = 0.55 + Math.random() * 0.55; // 0.55 - 1.10

      const unitPrice = abc === "A" ? 450 + Math.random() * 800 : abc === "B" ? 80 + Math.random() * 200 : 2 + Math.random() * 20;
      const avgDailyDemand = Math.max(1, Math.round(baseRev / (unitPrice * 300)));

      list.push({
        id: `sku_${index}`,
        code,
        name,
        annualRevenue: Math.round(baseRev),
        cv: parseFloat(cv.toFixed(2)),
        abc,
        xyz,
        category: cat,
        avgDailyDemand,
        unitPrice: parseFloat(unitPrice.toFixed(1)),
        stockQty: Math.round(avgDailyDemand * (cfg.turnoverDaysDIO * (0.8 + Math.random() * 0.4))),
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        scatterX: 0,
        scatterY: 0,
        gridTargetX: 0,
        gridTargetY: 0,
        color: cfg.color,
        radius: abc === "A" ? 5 : abc === "B" ? 4 : 3,
      });

      index++;
    }
  }

  return list;
}

export const AbcXyzStrategyModule: React.FC = () => {
  const [skuList, setSkuList] = useState<SkuItem[]>(() => generateMockSkuList());
  const [strategies, setStrategies] = useState<Record<CategoryKey, CategoryStrategyConfig>>(INITIAL_STRATEGIES);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("AX");
  const [viewMode, setViewMode] = useState<"cluster" | "scatter">("cluster");
  const [hoveredSku, setHoveredSku] = useState<SkuItem | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [rippleTarget, setRippleTarget] = useState<CategoryKey | null>(null);
  const [rippleKey, setRippleKey] = useState<number>(0);

  // Canvas Refs
  const scatterCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const replenishmentCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const capitalPipelineCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Particle systems
  const animFrameIdRef = useRef<number | null>(null);
  const replenishmentAnimRef = useRef<number | null>(null);
  const capitalAnimRef = useRef<number | null>(null);

  const selectedStrategy = strategies[selectedCategory];

  // 1. Calculate Canvas Coordinates for SKUs
  const canvasWidth = 720;
  const canvasHeight = 440;

  useEffect(() => {
    // Recompute target positions for all SKUs
    setSkuList((prev) =>
      prev.map((sku) => {
        // Continuous Scatter Coordinate (CV on X: 0 - 1.1 -> 60 to 660, Revenue on Y: 5k - 800k -> 380 to 50)
        const cvNorm = Math.min(1, Math.max(0, (sku.cv - 0.05) / 1.05));
        const revNorm = Math.min(1, Math.max(0, Math.log10(sku.annualRevenue / 4000) / Math.log10(800000 / 4000)));

        const scatterX = 70 + cvNorm * (canvasWidth - 130);
        const scatterY = canvasHeight - 50 - revNorm * (canvasHeight - 90);

        // 3x3 Grid Cluster Target Coordinate
        // Col: X (0), Y (1), Z (2)
        // Row: A (0), B (1), C (2)
        const colIdx = sku.xyz === "X" ? 0 : sku.xyz === "Y" ? 1 : 2;
        const rowIdx = sku.abc === "A" ? 0 : sku.abc === "B" ? 1 : 2;

        const cellW = (canvasWidth - 100) / 3;
        const cellH = (canvasHeight - 80) / 3;

        const cellCenterX = 70 + colIdx * cellW + cellW / 2;
        const cellCenterY = 40 + rowIdx * cellH + cellH / 2;

        // Add soft radial organic dispersion within cell
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * (Math.min(cellW, cellH) * 0.35);
        const gridTargetX = cellCenterX + Math.cos(angle) * dist;
        const gridTargetY = cellCenterY + Math.sin(angle) * dist;

        return {
          ...sku,
          scatterX,
          scatterY,
          gridTargetX,
          gridTargetY,
          x: sku.x === 0 ? (viewMode === "cluster" ? gridTargetX : scatterX) : sku.x,
          y: sku.y === 0 ? (viewMode === "cluster" ? gridTargetY : scatterY) : sku.y,
          targetX: viewMode === "cluster" ? gridTargetX : scatterX,
          targetY: viewMode === "cluster" ? gridTargetY : scatterY,
        };
      })
    );
  }, [viewMode]);

  // 2. Main Scatter / Cluster Animation Loop
  useEffect(() => {
    const canvas = scatterCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Draw Grid Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const cellW = (canvasWidth - 100) / 3;
      const cellH = (canvasHeight - 80) / 3;

      // Draw 3x3 Grid Zones
      const catsMatrix: CategoryKey[][] = [
        ["AX", "AY", "AZ"],
        ["BX", "BY", "BZ"],
        ["CX", "CY", "CZ"],
      ];

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const cat = catsMatrix[r][c];
          const x0 = 70 + c * cellW;
          const y0 = 40 + r * cellH;

          const isSelected = selectedCategory === cat;
          const isRipple = rippleTarget === cat;

          // Fill Zone
          if (viewMode === "cluster") {
            ctx.fillStyle = isSelected ? "rgba(37, 99, 235, 0.08)" : (r + c) % 2 === 0 ? "#fafbfc" : "#f4f6f8";
            ctx.fillRect(x0, y0, cellW, cellH);

            // Border
            ctx.strokeStyle = isSelected ? "#2563eb" : "#e2e8f0";
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.strokeRect(x0, y0, cellW, cellH);

            // Label
            ctx.fillStyle = isSelected ? "#1e40af" : "#64748b";
            ctx.font = "bold 12px sans-serif";
            ctx.fillText(cat, x0 + 10, y0 + 20);

            ctx.font = "10px sans-serif";
            ctx.fillStyle = "#94a3b8";
            ctx.fillText(INITIAL_STRATEGIES[cat].subLabel.split("/")[0], x0 + 38, y0 + 20);
          } else {
            // Faint boundary in scatter mode
            ctx.strokeStyle = "#f1f5f9";
            ctx.lineWidth = 1;
            ctx.strokeRect(x0, y0, cellW, cellH);
          }

          // Ripple Effect Rendering
          if (isRipple) {
            const time = Date.now() * 0.005;
            const radius = ((Math.sin(time) + 1) / 2) * (cellW * 0.6);
            ctx.beginPath();
            ctx.arc(x0 + cellW / 2, y0 + cellH / 2, radius, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(220, 38, 38, 0.6)";
            ctx.lineWidth = 2.5;
            ctx.stroke();
          }
        }
      }

      // Draw Axis Lines & Labels
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(70, 40);
      ctx.lineTo(70, canvasHeight - 40);
      ctx.lineTo(canvasWidth - 30, canvasHeight - 40);
      ctx.stroke();

      // Axis Labels
      ctx.fillStyle = "#334155";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("需求波动率 CV (XYZ: X稳定 → Y中等 → Z剧烈)", canvasWidth / 2 - 120, canvasHeight - 15);

      ctx.save();
      ctx.translate(22, canvasHeight / 2 + 60);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("年销售额 (ABC: A高价值 → B中价值 → C长尾)", 0, 0);
      ctx.restore();

      // Tick marks on Axis
      ctx.font = "10px monospace";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("X(CV<0.25)", 70 + cellW * 0.35, canvasHeight - 26);
      ctx.fillText("Y(0.25≤CV<0.55)", 70 + cellW * 1.25, canvasHeight - 26);
      ctx.fillText("Z(CV≥0.55)", 70 + cellW * 2.35, canvasHeight - 26);

      ctx.fillText("A(Top 70%)", 30, 40 + cellH * 0.5);
      ctx.fillText("B(20%)", 30, 40 + cellH * 1.5);
      ctx.fillText("C(10%)", 30, 40 + cellH * 2.5);

      // Smooth Particle Interpolation & Render
      setSkuList((prev) =>
        prev.map((sku) => {
          // Physics glide towards target
          const dx = sku.targetX - sku.x;
          const dy = sku.targetY - sku.y;
          const newX = sku.x + dx * 0.08;
          const newY = sku.y + dy * 0.08;

          const isCatSelected = sku.category === selectedCategory;
          const isHovered = hoveredSku?.id === sku.id;
          const isSearchMatch = searchTerm && (sku.code.toLowerCase().includes(searchTerm.toLowerCase()) || sku.name.includes(searchTerm));

          // Draw SKU Node
          ctx.beginPath();
          const r = isHovered ? sku.radius + 3 : isCatSelected ? sku.radius + 1 : sku.radius;
          ctx.arc(newX, newY, r, 0, Math.PI * 2);

          if (isHovered || isSearchMatch) {
            ctx.fillStyle = "#f59e0b";
            ctx.shadowColor = "#f59e0b";
            ctx.shadowBlur = 8;
          } else if (isCatSelected) {
            ctx.fillStyle = sku.color;
            ctx.shadowColor = sku.color;
            ctx.shadowBlur = 4;
          } else {
            ctx.fillStyle = sku.color + "99";
            ctx.shadowBlur = 0;
          }

          ctx.fill();
          ctx.shadowBlur = 0;

          // Border for A-class
          if (sku.abc === "A") {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          return {
            ...sku,
            x: newX,
            y: newY,
          };
        })
      );

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [viewMode, selectedCategory, hoveredSku, searchTerm, rippleTarget]);

  // 3. Visual Feature 2: Replenishment Particle Stream Simulation Canvas (AX vs CZ vs AY etc.)
  useEffect(() => {
    const canvas = replenishmentCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;
    let tick = 0;

    interface Particle {
      x: number;
      y: number;
      vy: number;
      size: number;
      alpha: number;
    }

    const particles: Particle[] = [];
    let currentWaterHeight = 60; // 0-100%
    let targetWaterHeight = selectedCategory === "AX" ? 30 : selectedCategory === "CZ" ? 85 : 55;

    const renderReplenish = () => {
      if (!running) return;
      tick++;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Dynamic parameters based on category
      const isAX = selectedCategory === "AX";
      const isCZ = selectedCategory === "CZ";
      const isAZ = selectedCategory === "AZ";

      // 1. Spawning Particles
      if (isAX) {
        // High frequency, tiny fine continuous stream
        if (tick % 2 === 0) {
          particles.push({
            x: w / 2 + (Math.random() - 0.5) * 16,
            y: 15,
            vy: 3 + Math.random() * 2,
            size: 2 + Math.random() * 2,
            alpha: 0.9,
          });
        }
        targetWaterHeight = 28 + Math.sin(tick * 0.05) * 4; // ultra stable low level
      } else if (isCZ) {
        // Low frequency, sudden massive burst every 80 ticks
        if (tick % 70 < 12) {
          for (let k = 0; k < 3; k++) {
            particles.push({
              x: w / 2 + (Math.random() - 0.5) * 45,
              y: 15,
              vy: 5 + Math.random() * 3,
              size: 4 + Math.random() * 4,
              alpha: 1.0,
            });
          }
        }
        targetWaterHeight = 78 + Math.sin(tick * 0.01) * 10; // high stagnant sedimentation
      } else if (isAZ) {
        // Intense pulse surge
        if (tick % 45 < 8) {
          particles.push({
            x: w / 2 + (Math.random() - 0.5) * 30,
            y: 15,
            vy: 4 + Math.random() * 2,
            size: 3 + Math.random() * 3,
            alpha: 0.9,
          });
        }
        targetWaterHeight = 50 + Math.sin(tick * 0.03) * 18;
      } else {
        // Regular periodic stepping stream
        if (tick % 15 === 0) {
          particles.push({
            x: w / 2 + (Math.random() - 0.5) * 22,
            y: 15,
            vy: 3.5,
            size: 3,
            alpha: 0.85,
          });
        }
        targetWaterHeight = 52 + Math.sin(tick * 0.02) * 8;
      }

      currentWaterHeight += (targetWaterHeight - currentWaterHeight) * 0.05;

      // Draw Tank Outline
      const tankX = 35;
      const tankY = 25;
      const tankW = w - 70;
      const tankH = h - 50;

      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 2;
      ctx.strokeRect(tankX, tankY, tankW, tankH);

      // Water Level in Tank
      const waterPixelH = (tankH * currentWaterHeight) / 100;
      const waterTopY = tankY + tankH - waterPixelH;

      // Water body gradient
      const waterGrad = ctx.createLinearGradient(0, waterTopY, 0, tankY + tankH);
      if (isAX) {
        waterGrad.addColorStop(0, "rgba(59, 130, 246, 0.7)");
        waterGrad.addColorStop(1, "rgba(37, 99, 235, 0.9)");
      } else if (isCZ) {
        // Sedimentary murky color with bottom freeze
        waterGrad.addColorStop(0, "rgba(148, 163, 184, 0.6)");
        waterGrad.addColorStop(1, "rgba(100, 116, 139, 0.85)");
      } else {
        waterGrad.addColorStop(0, "rgba(14, 165, 233, 0.6)");
        waterGrad.addColorStop(1, "rgba(2, 132, 199, 0.85)");
      }

      ctx.fillStyle = waterGrad;
      ctx.fillRect(tankX + 1, waterTopY, tankW - 2, waterPixelH - 1);

      // Surface Wave
      ctx.beginPath();
      ctx.moveTo(tankX + 1, waterTopY);
      for (let x = tankX + 1; x <= tankX + tankW - 1; x += 5) {
        const wave = Math.sin((x + tick * 4) * 0.08) * (isAX ? 1.5 : isCZ ? 1 : 3);
        ctx.lineTo(x, waterTopY + wave);
      }
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Bottom Sedimentation Visual for CZ
      if (isCZ) {
        ctx.fillStyle = "rgba(71, 85, 105, 0.7)";
        ctx.fillRect(tankX + 1, tankY + tankH - 18, tankW - 2, 17);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px sans-serif";
        ctx.fillText("底部呆滞沉淀层", tankX + 15, tankY + tankH - 5);
      }

      // Draw and update falling stream particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.y += p.vy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = isAX ? `rgba(96, 165, 250, ${p.alpha})` : isCZ ? `rgba(148, 163, 184, ${p.alpha})` : `rgba(56, 189, 248, ${p.alpha})`;
        ctx.fill();

        if (p.y >= waterTopY) {
          particles.splice(i, 1);
        }
      }

      // Top Inflow Pipe
      ctx.fillStyle = "#64748b";
      ctx.fillRect(w / 2 - 14, 0, 28, 22);

      // Bottom Drainage Flow
      ctx.fillStyle = "#64748b";
      ctx.fillRect(w / 2 - 10, tankY + tankH, 20, 15);

      // Status HUD in Tank
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(`净水位: ${Math.round(currentWaterHeight)}%`, tankX + 8, waterTopY + 16);

      replenishmentAnimRef.current = requestAnimationFrame(renderReplenish);
    };

    renderReplenish();

    return () => {
      running = false;
      if (replenishmentAnimRef.current) cancelAnimationFrame(replenishmentAnimRef.current);
    };
  }, [selectedCategory]);

  // 4. Visual Feature 3: Capital Liquidity & Pipeline "Freezing/Stagnation" Canvas
  useEffect(() => {
    const canvas = capitalPipelineCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;
    let flowOffset = 0;

    const renderCapitalFlow = () => {
      if (!running) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cfg = strategies[selectedCategory];
      const isFrozen = cfg.isFrozenWarning || cfg.turnoverDaysDIO > 60;
      const speed = isFrozen ? 0.3 : (cfg.liquidityScore / 100) * 4.5;
      flowOffset += speed;

      // Pipe Background
      const pipeY = h / 2 - 18;
      const pipeH = 36;

      ctx.fillStyle = isFrozen ? "#1e293b" : "#0f172a";
      ctx.fillRect(20, pipeY, w - 40, pipeH);
      ctx.strokeStyle = isFrozen ? "#64748b" : "#3b82f6";
      ctx.lineWidth = 2;
      ctx.strokeRect(20, pipeY, w - 40, pipeH);

      // Fluid Flow Lines
      ctx.lineWidth = 3;
      const lineCount = 7;
      for (let i = 0; i < lineCount; i++) {
        const y = pipeY + 6 + (i * (pipeH - 12)) / (lineCount - 1);
        ctx.beginPath();
        ctx.strokeStyle = isFrozen ? "rgba(148, 163, 184, 0.4)" : `rgba(59, 130, 246, ${0.4 + (i % 2) * 0.4})`;

        ctx.setLineDash([12, 12]);
        ctx.lineDashOffset = -flowOffset * (1 + (i % 3) * 0.4);
        ctx.moveTo(25, y);
        ctx.lineTo(w - 25, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Frost / Ice Crystal Visual Effect for Frozen/Stagnant Categories (CZ, BZ, AZ)
      if (isFrozen) {
        ctx.fillStyle = "rgba(224, 242, 254, 0.85)";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText("❄️ 资金结冰停滞：高周转天数 (DIO " + cfg.turnoverDaysDIO + "天) 严重冻结现金流", 35, pipeY + 22);

        // Draw ice cracks/spikes
        ctx.strokeStyle = "rgba(186, 230, 253, 0.9)";
        ctx.lineWidth = 1.5;
        for (let ix = 40; ix < w - 40; ix += 45) {
          ctx.beginPath();
          ctx.moveTo(ix, pipeY + 2);
          ctx.lineTo(ix + 6, pipeY + 12);
          ctx.lineTo(ix + 12, pipeY + 4);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = "#67e8f9";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText(`⚡ 高速资金旋转环路：周转天数 ${cfg.turnoverDaysDIO} 天 | 流动性评分 ${cfg.liquidityScore}/100`, 35, pipeY + 22);
      }

      capitalAnimRef.current = requestAnimationFrame(renderCapitalFlow);
    };

    renderCapitalFlow();

    return () => {
      running = false;
      if (capitalAnimRef.current) cancelAnimationFrame(capitalAnimRef.current);
    };
  }, [selectedCategory, strategies]);

  // 5. Visual Feature 4: Ripple Effect on Strategy Slider Change & Global KPI Linkage
  const handleServiceLevelChange = (cat: CategoryKey, newSL: number) => {
    setStrategies((prev) => {
      const target = prev[cat];
      // Recalculate dynamic safety stock & capital occupied
      const zFactor = newSL >= 99 ? 2.33 : newSL >= 95 ? 1.65 : newSL >= 90 ? 1.28 : 1.04;
      const baseUnits = target.abc === "A" ? 25 : target.abc === "B" ? 50 : 100;
      const newSS = Math.round(baseUnits * zFactor);
      const newCapital = Math.round(target.capitalOccupied * (1 + ((newSL - target.defaultServiceLevel) / 100) * 0.6));

      return {
        ...prev,
        [cat]: {
          ...target,
          currentServiceLevel: newSL,
          safetyStockUnits: newSS,
          capitalOccupied: newCapital,
        },
      };
    });

    // Trigger visual ripple effect
    setRippleTarget(cat);
    setRippleKey((k) => k + 1);
    setTimeout(() => setRippleTarget(null), 1200);
  };

  // Aggregated Portfolio KPIs
  const totalAnnualCapital = useMemo(() => {
    return (Object.values(strategies) as CategoryStrategyConfig[]).reduce(
      (acc, item) => acc + item.capitalOccupied,
      0
    );
  }, [strategies]);

  const weightedFillRate = useMemo(() => {
    const totalRev = skuList.reduce((acc, s) => acc + s.annualRevenue, 0) || 1;
    let weightedSL = 0;
    for (const sku of skuList) {
      const sl = strategies[sku.category].currentServiceLevel;
      weightedSL += (sku.annualRevenue / totalRev) * sl;
    }
    return (weightedSL / 100) * 100;
  }, [strategies, skuList]);

  const totalSafetyStockItems = useMemo(() => {
    return (Object.values(strategies) as CategoryStrategyConfig[]).reduce(
      (acc, item) => acc + item.safetyStockUnits,
      0
    );
  }, [strategies]);

  const stockoutRiskIndex = useMemo(() => {
    return Math.max(0.4, (100 - weightedFillRate) * 0.8).toFixed(1);
  }, [weightedFillRate]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#34495E] rounded-lg p-5 sm:p-6 text-white border border-[#2C3E50] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#2980B9]/40 text-blue-200 rounded border border-[#2980B9]/50">
                <Grid3X3 className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>05. ABC-XYZ 品类矩阵与差别化策略控制台</span>
              </h2>
            </div>
            <p className="text-xs text-[#BDC3C7] mt-1.5 leading-relaxed max-w-4xl">
              结合销售贡献价值 (ABC) 与需求不确定性波动率 (XYZ)，通过 <strong>SKU 聚类归位动画</strong>、<strong>九宫格补货拟态流</strong>、<strong>资金结冰与流动性水流</strong> 以及 <strong>策略调优光圈涟漪</strong> 四重动态交互，打造高响应度的品类运筹指挥舱。
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setViewMode(viewMode === "cluster" ? "scatter" : "cluster")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2980B9] hover:bg-[#3498DB] text-white text-xs font-bold rounded shadow-xs transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>{viewMode === "cluster" ? "切换为: 连续散点视图" : "切换为: 九宫格吸附聚类"}</span>
            </button>
          </div>
        </div>

        {/* Global Linked Scoreboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
          <div className="bg-[#2C3E50] p-3 rounded border border-white/5">
            <span className="text-[#BDC3C7] text-[11px] block">全库库存总占用资金</span>
            <span className="text-base font-bold font-mono text-[#3498DB]">
              ¥{(totalAnnualCapital / 10000).toFixed(1)} 万元
            </span>
          </div>

          <div className="bg-[#2C3E50] p-3 rounded border border-white/5">
            <span className="text-[#BDC3C7] text-[11px] block">综合加权订单满足率</span>
            <span className="text-base font-bold font-mono text-[#2ECC71]">
              {weightedFillRate.toFixed(1)}%
            </span>
          </div>

          <div className="bg-[#2C3E50] p-3 rounded border border-white/5">
            <span className="text-[#BDC3C7] text-[11px] block">全库动态安全库存总量</span>
            <span className="text-base font-bold font-mono text-[#F39C12]">
              {totalSafetyStockItems} 件
            </span>
          </div>

          <div className="bg-[#2C3E50] p-3 rounded border border-white/5">
            <span className="text-[#BDC3C7] text-[11px] block">全局缺货暴露风险指数</span>
            <span className="text-base font-bold font-mono text-[#E74C3C]">
              {stockoutRiskIndex}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid & Interactive Visual Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: SKU Scatter / Cluster Canvas & 9-Cell Quick Selector */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-lg p-5 border border-[#E1E4E8] shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E1E4E8]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2980B9]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C3E50]">
                  1. SKU 散点聚类归位交互星图 (220 个活跃 SKU)
                </h3>
              </div>

              {/* Search SKU Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#95A5A6]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索 SKU 编码 / 品名..."
                  className="pl-8 pr-3 py-1 text-xs bg-[#F8F9FA] rounded border border-[#E1E4E8] text-[#2C3E50] focus:outline-none focus:ring-1 focus:ring-[#2980B9]"
                />
              </div>
            </div>

            {/* Canvas Container */}
            <div className="relative overflow-hidden rounded border border-[#E1E4E8] bg-white flex justify-center">
              <canvas
                ref={scatterCanvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="w-full max-w-[720px] h-auto cursor-crosshair block"
              />

              {/* Floating Instructions */}
              <div className="absolute top-2 right-2 px-2.5 py-1 bg-slate-900/75 text-white text-[10px] rounded backdrop-blur-xs flex items-center gap-1.5 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-[#3498DB] animate-ping" />
                <span>{viewMode === "cluster" ? "当前：九宫格吸附聚类态" : "当前：连续坐标散点态"}</span>
              </div>
            </div>

            {/* Quick 9-Quadrant Selector Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-bold text-[#7F8C8D] uppercase">
                点击九宫格区块激活专属差异化策略控制：
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
                {(["AX", "AY", "AZ", "BX", "BY", "BZ", "CX", "CY", "CZ"] as CategoryKey[]).map((cat) => {
                  const cfg = strategies[cat];
                  const isSelected = selectedCategory === cat;
                  const isRipple = rippleTarget === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`p-2 rounded text-center text-xs font-bold transition-all border cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? "bg-[#2980B9] text-white border-[#2980B9] shadow-xs"
                          : `${cfg.bgClass} text-[#2C3E50] ${cfg.borderClass} hover:border-[#2980B9]`
                      }`}
                    >
                      {isRipple && (
                        <span className="absolute inset-0 bg-red-400/30 animate-ping rounded pointer-events-none" />
                      )}
                      <div>{cat}</div>
                      <div className={`text-[9px] font-normal truncate ${isSelected ? "text-blue-100" : "text-[#7F8C8D]"}`}>
                        {cfg.currentServiceLevel}% SL
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Visual Feature 3: Capital Pipeline Liquidity & Freezing View */}
          <div className="bg-white rounded-lg p-5 border border-[#E1E4E8] shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E1E4E8]">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#27AE60]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C3E50]">
                  3. 资金流动性与“沉淀/结冰”可视化管道 (Capital Liquidity Stream)
                </h3>
              </div>
              <span className="text-[11px] text-[#7F8C8D]">
                当前品类：<strong className="text-[#2C3E50]">{selectedStrategy.label}</strong>
              </span>
            </div>

            <canvas
              ref={capitalPipelineCanvasRef}
              width={680}
              height={75}
              className="w-full h-[75px] rounded bg-slate-900 block"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-2.5 bg-[#F8F9FA] rounded border border-[#E1E4E8]">
                <span className="text-[#7F8C8D] text-[11px] block">占用库存资金</span>
                <span className="font-mono font-bold text-[#2C3E50] text-sm">
                  ¥{selectedStrategy.capitalOccupied.toLocaleString()} 元
                </span>
              </div>

              <div className="p-2.5 bg-[#F8F9FA] rounded border border-[#E1E4E8]">
                <span className="text-[#7F8C8D] text-[11px] block">资金周转天数 (DIO)</span>
                <span className={`font-mono font-bold text-sm ${selectedStrategy.turnoverDaysDIO > 50 ? "text-[#E74C3C]" : "text-[#27AE60]"}`}>
                  {selectedStrategy.turnoverDaysDIO} 天 {selectedStrategy.turnoverDaysDIO > 50 ? "(周转迟缓)" : "(高速周转)"}
                </span>
              </div>

              <div className="p-2.5 bg-[#F8F9FA] rounded border border-[#E1E4E8]">
                <span className="text-[#7F8C8D] text-[11px] block">流动性健康状态</span>
                <span className="font-bold text-xs flex items-center gap-1 mt-0.5">
                  {selectedStrategy.isFrozenWarning ? (
                    <span className="text-[#E74C3C] flex items-center gap-1">
                      <Snowflake className="w-3.5 h-3.5" /> 存在沉淀冻结风险
                    </span>
                  ) : (
                    <span className="text-[#27AE60] flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> 优良高速流动
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Replenishment Flow Simulation & Strategy Tuning Console */}
        <div className="lg:col-span-5 space-y-4">
          {/* Visual Feature 2: Dedicated Replenishment Stream Water Tank */}
          <div className="bg-white rounded-lg p-5 border border-[#E1E4E8] shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E1E4E8]">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-[#2980B9]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C3E50]">
                  2. 九宫格差异化补货拟态水流
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#2980B9]">
                {selectedCategory} 专属流速
              </span>
            </div>

            <div className="flex justify-center bg-[#FAFBFC] rounded p-2 border border-[#E1E4E8]">
              <canvas
                ref={replenishmentCanvasRef}
                width={360}
                height={200}
                className="w-full max-w-[360px] h-[200px] block"
              />
            </div>

            <div className="text-xs space-y-1.5 bg-[#F8F9FA] p-3 rounded border border-[#E1E4E8]">
              <div className="font-bold text-[#2C3E50] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#2980B9]" />
                <span>补货流态特征剖析：</span>
              </div>
              <p className="text-[11px] text-[#7F8C8D] leading-relaxed">
                {selectedCategory === "AX" &&
                  "【高频连续粒子流】：JIT 准时制供料，水流细水长流，水位保持极低且平稳，杜绝多余库存资金占用。"}
                {selectedCategory === "CZ" &&
                  "【低频大批量突发流】：长时间排水消耗，偶发大批量冲注，底部形成大面积死水沉淀层，需警惕呆滞。"}
                {selectedCategory === "AZ" &&
                  "【脉冲波动激流】：高价值高风险，严密警戒水位控制，单次补货需极强按需审批与临界比率约束。"}
                {selectedCategory !== "AX" &&
                  selectedCategory !== "CZ" &&
                  selectedCategory !== "AZ" &&
                  "【标准周期补齐波】：固定盘点周期阶段性注水，保持中等安全库存缓冲与稳健履约。"}
              </p>
            </div>
          </div>

          {/* Visual Feature 4: Strategy Tuning & Ripple Control Deck */}
          <div className="bg-white rounded-lg p-5 border border-[#E1E4E8] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E1E4E8]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#8E44AD]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C3E50]">
                  4. 策略调优联动“涟漪效应”控制台
                </h3>
              </div>
              <span className="text-[10px] text-[#8E44AD] font-bold">全库实时联动</span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Category Info Banner */}
              <div className={`p-3 rounded border ${selectedStrategy.borderClass} ${selectedStrategy.bgClass}`}>
                <div className="font-bold text-[#2C3E50] flex items-center justify-between">
                  <span>{selectedStrategy.label}</span>
                  <span className="text-[11px] font-mono font-bold text-[#2980B9]">
                    安全库存: {selectedStrategy.safetyStockUnits} 件
                  </span>
                </div>
                <div className="text-[11px] text-[#7F8C8D] mt-1 space-y-0.5">
                  <div><strong>推荐运筹模型：</strong>{selectedStrategy.model}</div>
                  <div><strong>控制策略：</strong>{selectedStrategy.controlPolicy}</div>
                  <div><strong>盘点审计频次：</strong>{selectedStrategy.reviewFreq}</div>
                </div>
              </div>

              {/* Service Level Slider with Ripple Trigger */}
              <div className="space-y-2 bg-[#FAFBFC] p-3.5 rounded border border-[#E1E4E8]">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#2C3E50]">
                    目标周期服务水平 (Cycle Service Level)
                  </span>
                  <span className="font-mono font-bold text-[#2980B9] text-sm">
                    {selectedStrategy.currentServiceLevel}%
                  </span>
                </div>

                <input
                  type="range"
                  min={75}
                  max={99.9}
                  step={0.5}
                  value={selectedStrategy.currentServiceLevel}
                  onChange={(e) => handleServiceLevelChange(selectedCategory, parseFloat(e.target.value))}
                  className="w-full accent-[#2980B9] cursor-pointer"
                />

                <div className="flex justify-between text-[10px] text-[#95A5A6]">
                  <span>75% (低成本·高缺货)</span>
                  <span>95% (基准)</span>
                  <span>99.9% (极致保障·资金剧增)</span>
                </div>

                <p className="text-[10px] text-[#7F8C8D] pt-1">
                  💡 提示：拖动滑块时，星图对应九宫格区块将向外扩散<strong>光圈涟漪</strong>，并联动上方全库资金、满足率与缺货率看板实时重算。
                </p>
              </div>

              {/* Reset to Defaults */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => {
                    handleServiceLevelChange(selectedCategory, selectedStrategy.defaultServiceLevel);
                  }}
                  className="text-xs text-[#7F8C8D] hover:text-[#2C3E50] flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>恢复此类默认策略参数</span>
                </button>

                <span className="text-[11px] text-[#27AE60] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 策略已生效
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
