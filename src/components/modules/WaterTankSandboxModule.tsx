import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  InventoryPolicyType,
  WaterTankSimulationConfig,
  WaterTankSimulationStep,
} from "../../types/inventory";
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Flame,
  Zap,
  Waves,
  ShieldAlert,
  Sliders,
  Sparkles,
  ArrowDown,
  ArrowUp,
  Clock,
  CheckCircle,
} from "lucide-react";

export const WaterTankSandboxModule: React.FC = () => {
  // Policy and Simulation Config
  const [policy, setPolicy] = useState<InventoryPolicyType>("continuous_s_S");
  const [tankCapacityMax, setTankCapacityMax] = useState<number>(500);
  const [targetLevelS, setTargetLevelS] = useState<number>(380);
  const [triggerLevels, setTriggerLevels] = useState<number>(120);
  const [orderBatchQ, setOrderBatchQ] = useState<number>(260);
  const [leadTimeDelay, setLeadTimeDelay] = useState<number>(3); // 3 steps delay
  const [reviewPeriodT, setReviewPeriodT] = useState<number>(5); // for periodic
  const [demandMean, setDemandMean] = useState<number>(22);
  const [demandStd, setDemandStd] = useState<number>(6);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1); // 1x, 2x, 4x

  // Simulation State
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [netInventory, setNetInventory] = useState<number>(380);
  const [inTransitOrders, setInTransitOrders] = useState<
    Array<{ arrivalStep: number; amount: number }>
  >([]);
  const [history, setHistory] = useState<WaterTankSimulationStep[]>([]);
  const [flushPulseActive, setFlushPulseActive] = useState<boolean>(false);
  const [stockoutOccurred, setStockoutOccurred] = useState<boolean>(false);
  const [isPouringWater, setIsPouringWater] = useState<boolean>(false);

  // Cumulative Metrics
  const [cumDemand, setCumDemand] = useState<number>(0);
  const [cumStockout, setCumStockout] = useState<number>(0);
  const [cumOrdersCount, setCumOrdersCount] = useState<number>(0);
  const [cumTotalCost, setCumTotalCost] = useState<number>(0);

  // Auto-reset when critical parameters change radically
  const resetSimulation = () => {
    setCurrentStep(0);
    setNetInventory(targetLevelS);
    setInTransitOrders([]);
    setHistory([
      {
        step: 0,
        time: 0,
        inventoryLevel: targetLevelS,
        inventoryPosition: targetLevelS,
        floatBallLevel: (targetLevelS / tankCapacityMax) * 100,
        valveOpen: false,
        isFilling: false,
        pipelineInTransit: 0,
        demand: 0,
        stockoutLoss: 0,
        orderPlacedAmount: 0,
      },
    ]);
    setCumDemand(0);
    setCumStockout(0);
    setCumOrdersCount(0);
    setCumTotalCost(0);
    setStockoutOccurred(false);
    setIsPouringWater(false);
  };

  // Inventory Position = Net Inventory + On-Order in transit
  const totalInTransit = inTransitOrders.reduce((sum, o) => sum + o.amount, 0);
  const inventoryPosition = netInventory + totalInTransit;

  // Single step tick function
  const stepSimulation = () => {
    setCurrentStep((prevStep) => {
      const nextStep = prevStep + 1;

      // 1. Process Arrivals from lead time pipeline
      let arrivingQty = 0;
      const remainingOrders: Array<{ arrivalStep: number; amount: number }> = [];

      for (const order of inTransitOrders) {
        if (order.arrivalStep <= nextStep) {
          arrivingQty += order.amount;
        } else {
          remainingOrders.push(order);
        }
      }

      // 2. Determine Demand for this period
      let stepDemand = Math.max(
        0,
        Math.round(demandMean + (Math.random() - 0.5) * 2 * demandStd * 1.5)
      );
      if (flushPulseActive) {
        stepDemand += 120; // sudden massive toilet flush
        setFlushPulseActive(false);
      }

      // 3. Update Net Inventory
      const newInventory = netInventory + arrivingQty - stepDemand;
      const stepStockout = newInventory < 0 ? Math.abs(newInventory) : 0;
      const effectiveStock = Math.max(-100, newInventory);

      if (effectiveStock <= 0) {
        setStockoutOccurred(true);
      } else {
        setStockoutOccurred(false);
      }

      // 4. Policy Replenishment Trigger logic
      let orderPlacedQty = 0;
      const currentIP = effectiveStock + remainingOrders.reduce((s, o) => s + o.amount, 0);

      if (policy === "continuous_s_S") {
        if (currentIP <= triggerLevels) {
          orderPlacedQty = Math.max(0, targetLevelS - currentIP);
        }
      } else if (policy === "continuous_s_Q") {
        if (currentIP <= triggerLevels) {
          orderPlacedQty = orderBatchQ;
        }
      } else if (policy === "periodic_T_s_S") {
        if (nextStep % reviewPeriodT === 0 && currentIP <= triggerLevels) {
          orderPlacedQty = Math.max(0, targetLevelS - currentIP);
        }
      } else if (policy === "periodic_T_S") {
        if (nextStep % reviewPeriodT === 0) {
          orderPlacedQty = Math.max(0, targetLevelS - currentIP);
        }
      }

      if (orderPlacedQty > 0) {
        remainingOrders.push({
          arrivalStep: nextStep + leadTimeDelay,
          amount: orderPlacedQty,
        });
        setCumOrdersCount((c) => c + 1);
        setCumTotalCost((prev) => prev + 50); // fixed order cost 50
      }

      setInTransitOrders(remainingOrders);
      setNetInventory(effectiveStock);
      setIsPouringWater(arrivingQty > 0);

      // 5. Update Metrics
      setCumDemand((d) => d + stepDemand);
      if (stepStockout > 0) {
        setCumStockout((s) => s + stepStockout);
        setCumTotalCost((prev) => prev + stepStockout * 2.0); // 2.0 shortage cost
      }
      if (effectiveStock > 0) {
        setCumTotalCost((prev) => prev + effectiveStock * 0.05); // holding cost
      }

      // 6. Record History for Trajectory Graph
      const floatPct = Math.min(100, Math.max(0, (effectiveStock / tankCapacityMax) * 100));
      const newStepRecord: WaterTankSimulationStep = {
        step: nextStep,
        time: nextStep,
        inventoryLevel: effectiveStock,
        inventoryPosition: currentIP + orderPlacedQty,
        floatBallLevel: floatPct,
        valveOpen: currentIP <= triggerLevels || arrivingQty > 0,
        isFilling: arrivingQty > 0,
        pipelineInTransit: remainingOrders.reduce((s, o) => s + o.amount, 0),
        demand: stepDemand,
        stockoutLoss: stepStockout,
        orderPlacedAmount: orderPlacedQty,
      };

      setHistory((prevH) => [...prevH.slice(-45), newStepRecord]);
      return nextStep;
    });
  };

  // Timer loop for simulation
  useEffect(() => {
    if (!isRunning) return;
    const intervalMs = Math.round(900 / speedMultiplier);
    const timer = setInterval(() => {
      stepSimulation();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [
    isRunning,
    speedMultiplier,
    netInventory,
    inTransitOrders,
    policy,
    triggerLevels,
    targetLevelS,
    orderBatchQ,
    leadTimeDelay,
    reviewPeriodT,
    demandMean,
    demandStd,
    flushPulseActive,
  ]);

  // Visual calculation for float arm angle and water height
  const waterHeightPct = Math.min(100, Math.max(0, (netInventory / tankCapacityMax) * 100));
  const isValveOpen = inventoryPosition <= triggerLevels || isPouringWater;
  const floatBallY = 240 - (waterHeightPct / 100) * 170; // coordinate in SVG
  const armAngle = -((waterHeightPct - 50) / 50) * 25; // tilt degrees

  const policyLabels = [
    { id: "continuous_s_S" as InventoryPolicyType, label: "(s, S) 连续盘点", desc: "实时监测，水位≤s立即补至S" },
    { id: "continuous_s_Q" as InventoryPolicyType, label: "(s, Q) 连续固定量", desc: "水位≤s立即采购固定批量Q" },
    { id: "periodic_T_s_S" as InventoryPolicyType, label: "(T, s, S) 定期双阈值", desc: "每隔T天检查，若≤s补至S" },
    { id: "periodic_T_S" as InventoryPolicyType, label: "(T, S) 定期顶格补", desc: "每隔T天不管水位多少均补至S" },
  ];

  return (
    <div className="space-y-6">
      {/* Sliced Policy Selector Bar */}
      <div className="bg-white rounded-lg p-4 sm:p-5 border border-[#E1E4E8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#ECF0F1] text-[#34495E] rounded">
              <Waves className="w-4 h-4 text-[#2980B9]" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-[#2C3E50] tracking-tight">
              (s, S) 策略与“马桶/水箱浮球阀”动态物理沙盒
            </h2>
          </div>
          <p className="text-xs text-[#7F8C8D] mt-1">
            用直观生动的水箱浮球与冲水物理机制，演示库存水位下降、浮球阀开闭、提前期充水时滞与缺货溢出风险。
          </p>
        </div>

        {/* Slices */}
        <div className="flex items-center gap-1 bg-[#F8F9FA] p-1 rounded border border-[#E1E4E8] overflow-x-auto">
          {policyLabels.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPolicy(p.id);
                resetSimulation();
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-all whitespace-nowrap cursor-pointer ${
                policy === p.id
                  ? "bg-white text-[#2980B9] shadow-xs border border-[#E1E4E8]"
                  : "text-[#7F8C8D] hover:text-[#2C3E50]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Sandbox Layout: Left Tank Physics + Right Live Trajectory Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Water Tank Physics Visualizer */}
        <div className="lg:col-span-6 bg-white rounded-lg p-5 border border-[#E1E4E8] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#7F8C8D] uppercase tracking-widest">水箱与浮球机械结构剖面</span>
              {isPouringWater && (
                <span className="animate-pulse px-2 py-0.5 text-[10px] font-bold bg-[#E8F5E9] text-[#27AE60] rounded">
                  🌊 充水中 (+补货到达)
                </span>
              )}
              {stockoutOccurred && (
                <span className="animate-bounce px-2 py-0.5 text-[10px] font-bold bg-[#FDEAEA] text-[#E74C3C] rounded flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> 缺货脱销警报！
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFlushPulseActive(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FDEAEA] hover:bg-[#FADBD8] text-[#E74C3C] text-xs font-semibold rounded border border-[#E74C3C]/30 transition-colors"
                title="模拟顾客需求突发暴涨，水箱剧烈放水冲刷"
              >
                <Zap className="w-3.5 h-3.5 text-[#E74C3C]" />
                <span>一键大冲水 (需求脉冲)</span>
              </button>
            </div>
          </div>

          {/* SVG Physical Tank Canvas */}
          <div className="relative w-full h-80 bg-[#34495E] rounded-lg overflow-hidden border border-[#2C3E50] p-2">
            <svg className="w-full h-full" viewBox="0 0 420 280">
              <defs>
                {/* Water Gradient */}
                <linearGradient id="tankWaterGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3498DB" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#2980B9" stopOpacity="0.95" />
                </linearGradient>
                {/* Metallic Lever arm gradient */}
                <linearGradient id="metalArm" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#95A5A6" />
                  <stop offset="50%" stopColor="#ECF0F1" />
                  <stop offset="100%" stopColor="#7F8C8D" />
                </linearGradient>
                {/* Float Ball 3D Radial */}
                <radialGradient id="floatBallGrad" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#F1C40F" />
                  <stop offset="70%" stopColor="#D68910" />
                  <stop offset="100%" stopColor="#7E5109" />
                </radialGradient>
              </defs>

              {/* Tank Glass Outer Outline */}
              <rect x="70" y="40" width="280" height="210" rx="8" fill="#2C3E50" stroke="#4A6572" strokeWidth="3" />

              {/* Ruler Calibrations on left side */}
              {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
                const y = 240 - frac * 180;
                const val = Math.round(tankCapacityMax * frac);
                return (
                  <g key={idx}>
                    <line x1="75" y1={y} x2="88" y2={y} stroke="#7F8C8D" strokeWidth="1.5" />
                    <text x="50" y={y + 3} fill="#BDC3C7" fontSize="9" textAnchor="end" fontFamily="monospace">
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Target Water Level Line S (Green) */}
              {(() => {
                const yS = 240 - (targetLevelS / tankCapacityMax) * 180;
                return (
                  <g>
                    <line x1="72" y1={yS} x2="348" y2={yS} stroke="#27AE60" strokeWidth="2" strokeDasharray="5 3" />
                    <rect x="270" y={yS - 9} width="75" height="18" rx="3" fill="#1E824C" fillOpacity="0.85" />
                    <text x="307" y={yS + 3} fill="#E8F5E9" fontSize="9" fontWeight="bold" textAnchor="middle">
                      满水位 S = {targetLevelS}
                    </text>
                  </g>
                );
              })()}

              {/* Trigger Level Line s (Amber) */}
              {(() => {
                const ys = 240 - (triggerLevels / tankCapacityMax) * 180;
                return (
                  <g>
                    <line x1="72" y1={ys} x2="348" y2={ys} stroke="#F1C40F" strokeWidth="2" strokeDasharray="3 3" />
                    <rect x="270" y={ys - 9} width="75" height="18" rx="3" fill="#7D6608" fillOpacity="0.85" />
                    <text x="307" y={ys + 3} fill="#FEF9E7" fontSize="9" fontWeight="bold" textAnchor="middle">
                      再订货点 s = {triggerLevels}
                    </text>
                  </g>
                );
              })()}

              {/* Top Inflow Supply Pipe (Lead Time delayed pipeline) */}
              <path d="M 20 45 L 120 45 L 120 65" fill="none" stroke="#7F8C8D" strokeWidth="10" strokeLinecap="round" />
              {/* Inflow Valve Box at (120, 60) */}
              <rect x="110" y="52" width="20" height="20" rx="3" fill={isValveOpen ? "#27AE60" : "#E74C3C"} stroke="#ffffff" strokeWidth="1.5" />

              {/* In-Transit Lead Time Indicator Dots inside pipe */}
              {inTransitOrders.length > 0 && (
                <g>
                  <circle cx="55" cy="45" r="4" fill="#3498DB" className="animate-pulse" />
                  <circle cx="85" cy="45" r="4" fill="#3498DB" className="animate-pulse" />
                  <text x="60" y="32" fill="#AED6F1" fontSize="9" fontWeight="bold">
                    在途水流: {totalInTransit} 件
                  </text>
                </g>
              )}

              {/* Pouring Water Stream Animation from Valve Nozzle into Tank */}
              {isPouringWater && (
                <g>
                  <rect x="117" y="72" width="6" height={Math.max(10, floatBallY - 70)} fill="#3498DB" opacity="0.85" />
                  <circle cx="115" cy={floatBallY} r="5" fill="#D4E6F1" opacity="0.8" />
                  <circle cx="125" cy={floatBallY - 4} r="4" fill="#EAF2F8" opacity="0.9" />
                </g>
              )}

              {/* The Actual Water Liquid inside tank */}
              {waterHeightPct > 0 && (
                <g>
                  <rect
                    x="72"
                    y={240 - (waterHeightPct / 100) * 180}
                    width="276"
                    height={(waterHeightPct / 100) * 180}
                    fill="url(#tankWaterGrad)"
                    rx="6"
                  />
                  <ellipse
                    cx="210"
                    cy={240 - (waterHeightPct / 100) * 180}
                    rx="138"
                    ry="5"
                    fill="#5DADE2"
                    opacity="0.6"
                  />
                </g>
              )}

              {/* Mechanical Float Ball Lever Arm & Float Ball */}
              <g>
                <line
                  x1="120"
                  y1="62"
                  x2="210"
                  y2={floatBallY}
                  stroke="url(#metalArm)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <circle cx="120" cy="62" r="4" fill="#2C3E50" stroke="#BDC3C7" strokeWidth="1.5" />
                <circle
                  cx="210"
                  cy={floatBallY}
                  r="18"
                  fill="url(#floatBallGrad)"
                  stroke="#F1C40F"
                  strokeWidth="1.5"
                />
                <circle cx="204" cy={floatBallY - 6} r="4" fill="#ffffff" opacity="0.5" />
              </g>

              {/* Bottom Drain Pipe & Demand Outflow */}
              <path d="M 210 250 L 210 275 L 370 275" fill="none" stroke="#7F8C8D" strokeWidth="10" strokeLinecap="round" />
              <rect x="207" y="250" width="6" height="25" fill="#3498DB" opacity="0.8" />
              <text x="310" y="270" fill="#BDC3C7" fontSize="9">
                排水 / 需求流
              </text>
            </svg>
          </div>

          {/* Controls Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded transition-colors cursor-pointer ${
                  isRunning
                    ? "bg-[#34495E] hover:bg-[#2C3E50] text-white"
                    : "bg-[#2980B9] hover:bg-[#3498DB] text-white"
                }`}
              >
                {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isRunning ? "暂停仿真" : "启动动态沙盒"}</span>
              </button>

              <button
                disabled={isRunning}
                onClick={stepSimulation}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold border border-[#BDC3C7] text-[#7F8C8D] hover:text-[#2C3E50] hover:bg-[#F8F9FA] rounded transition-colors disabled:opacity-40"
              >
                <StepForward className="w-3.5 h-3.5" />
                <span>单步</span>
              </button>

              <button
                onClick={resetSimulation}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold border border-[#BDC3C7] text-[#7F8C8D] hover:text-[#2C3E50] hover:bg-[#F8F9FA] rounded transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重置</span>
              </button>
            </div>

            {/* Speed Multiplier */}
            <div className="flex items-center gap-1 bg-[#F8F9FA] p-1 rounded border border-[#E1E4E8] text-xs">
              <span className="text-[10px] text-[#7F8C8D] px-1 font-medium">速率:</span>
              {[1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSpeedMultiplier(spd)}
                  className={`px-2 py-0.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                    speedMultiplier === spd
                      ? "bg-[#2980B9] text-white"
                      : "text-[#7F8C8D] hover:text-[#2C3E50]"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Real-Time Trajectory Chart & KPIs */}
        <div className="lg:col-span-6 space-y-4">
          {/* Synchronized Live Trajectory Chart */}
          <div className="bg-white rounded-lg p-5 border border-[#E1E4E8] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider">
                  实时水位轨迹 I(t) 与 订货地位 IP(t)
                </h3>
                <p className="text-[11px] text-[#7F8C8D]">
                  绿线为目标上限 S，黄线为触发水位 s。红色圆点表示在此刻触发了采购下单。
                </p>
              </div>
              <div className="text-right font-mono text-xs">
                <span className="text-[#95A5A6]">步数:</span> <strong className="text-[#2980B9]">{currentStep}</strong>
              </div>
            </div>

            {/* SVG Trajectory Stream Chart */}
            <div className="relative w-full h-52 bg-[#F8F9FA] rounded border border-[#E1E4E8] p-2 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 450 180" preserveAspectRatio="none">
                {/* Horizontal Guide Lines */}
                {(() => {
                  const yS = 160 - (targetLevelS / tankCapacityMax) * 140;
                  const ys = 160 - (triggerLevels / tankCapacityMax) * 140;
                  const yZero = 160;

                  return (
                    <g>
                      <line x1="20" y1={yZero} x2="440" y2={yZero} stroke="#BDC3C7" strokeWidth="1.2" />
                      <line x1="20" y1={ys} x2="440" y2={ys} stroke="#F1C40F" strokeWidth="1.2" strokeDasharray="3 3" />
                      <line x1="20" y1={yS} x2="440" y2={yS} stroke="#27AE60" strokeWidth="1.2" strokeDasharray="4 4" />
                    </g>
                  );
                })()}

                {/* Trajectory Polyline */}
                {history.length > 1 && (
                  (() => {
                    const maxLen = 45;
                    const xCoord = (idx: number) => 30 + (idx / (maxLen - 1)) * 400;
                    const yCoord = (inv: number) => 160 - (Math.max(0, inv) / tankCapacityMax) * 140;

                    const points = history
                      .map((h, i) => `${xCoord(i)},${yCoord(h.inventoryLevel)}`)
                      .join(" ");

                    const ipPoints = history
                      .map((h, i) => `${xCoord(i)},${yCoord(h.inventoryPosition)}`)
                      .join(" ");

                    return (
                      <g>
                        <polygon
                          points={`30,160 ${points} ${xCoord(history.length - 1)},160`}
                          fill="#3498DB"
                          fillOpacity="0.15"
                        />
                        <polyline points={ipPoints} fill="none" stroke="#7F8C8D" strokeWidth="1.2" strokeDasharray="2 2" />
                        <polyline points={points} fill="none" stroke="#2980B9" strokeWidth="2" />

                        {history.map((h, idx) => {
                          if (h.orderPlacedAmount > 0) {
                            return (
                              <g key={idx}>
                                <circle cx={xCoord(idx)} cy={yCoord(h.inventoryLevel)} r="3.5" fill="#E74C3C" />
                              </g>
                            );
                          }
                          return null;
                        })}
                      </g>
                    );
                  })()
                )}
              </svg>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#7F8C8D]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-[#2980B9] inline-block" /> 净库存 I(t)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-[#7F8C8D] inline-block border-dashed" /> 订货地位 IP(t)
              </span>
              <span className="flex items-center gap-1 text-[#E74C3C] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#E74C3C] inline-block" /> 补货触发点
              </span>
            </div>
          </div>

          {/* Sandbox Live Metrics Dashboard */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-lg border border-[#E1E4E8] shadow-xs">
              <div className="text-[#7F8C8D] text-[10px] uppercase font-bold tracking-wider">净库存 (I)</div>
              <div className="text-xl font-bold font-mono text-[#2980B9] mt-0.5">
                {netInventory} <span className="text-xs font-normal text-[#7F8C8D]">件</span>
              </div>
              <div className="text-[10px] text-[#95A5A6] mt-0.5">
                水位: {((netInventory / tankCapacityMax) * 100).toFixed(0)}%
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-[#E1E4E8] shadow-xs">
              <div className="text-[#7F8C8D] text-[10px] uppercase font-bold tracking-wider">在途补货 (On-Order)</div>
              <div className="text-xl font-bold font-mono text-[#34495E] mt-0.5">
                {totalInTransit} <span className="text-xs font-normal text-[#7F8C8D]">件</span>
              </div>
              <div className="text-[10px] text-[#95A5A6] mt-0.5">
                下单: {cumOrdersCount} 次
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-[#E1E4E8] shadow-xs">
              <div className="text-[#7F8C8D] text-[10px] uppercase font-bold tracking-wider">服务水平 (Fill Rate)</div>
              <div className="text-xl font-bold font-mono text-[#27AE60] mt-0.5">
                {cumDemand > 0
                  ? `${Math.max(0, ((1 - cumStockout / cumDemand) * 100)).toFixed(1)}%`
                  : "100%"}
              </div>
              <div className="text-[10px] text-[#95A5A6] mt-0.5">
                缺货: {cumStockout} 件
              </div>
            </div>
          </div>

          {/* Sandbox Interactive Parameter Sliders */}
          <div className="bg-[#F8F9FA] p-4 rounded-lg border border-[#E1E4E8] space-y-3 text-xs">
            <div className="font-bold text-[#2C3E50] flex items-center justify-between">
              <span>沙盒控制参数微调</span>
              <span className="text-[10px] font-normal text-[#7F8C8D]">动态影响后续模拟步</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-[#2C3E50] mb-1">
                  <span>目标满水位 S</span>
                  <span className="font-mono font-bold text-[#2980B9]">{targetLevelS}</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="480"
                  step="10"
                  value={targetLevelS}
                  onChange={(e) => setTargetLevelS(Number(e.target.value))}
                  className="w-full accent-[#2980B9] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#2C3E50] mb-1">
                  <span>进水触发阈值 s</span>
                  <span className="font-mono font-bold text-[#2980B9]">{triggerLevels}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max={Math.round(targetLevelS * 0.7)}
                  step="5"
                  value={triggerLevels}
                  onChange={(e) => setTriggerLevels(Number(e.target.value))}
                  className="w-full accent-[#2980B9] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#2C3E50] mb-1">
                  <span>充水提前期 L (步数)</span>
                  <span className="font-mono font-bold text-[#34495E]">{leadTimeDelay} 步</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="1"
                  value={leadTimeDelay}
                  onChange={(e) => setLeadTimeDelay(Number(e.target.value))}
                  className="w-full accent-[#2980B9] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#2C3E50] mb-1">
                  <span>平均流速 μ (需求量)</span>
                  <span className="font-mono font-bold text-[#34495E]">{demandMean} 件/步</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="45"
                  step="1"
                  value={demandMean}
                  onChange={(e) => setDemandMean(Number(e.target.value))}
                  className="w-full accent-[#2980B9] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
