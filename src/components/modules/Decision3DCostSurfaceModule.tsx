import React, { useState, useMemo, useRef, useEffect } from "react";
import { calculateClassicEOQ } from "../../utils/mathModels";
import {
  Gauge,
  Rotate3d,
  Layers,
  Sparkles,
  Sliders,
  ZoomIn,
  Move,
  Maximize2,
  TrendingUp,
} from "lucide-react";

export const Decision3DCostSurfaceModule: React.FC = () => {
  // Base parameter state
  const [demandD, setDemandD] = useState<number>(12000);
  const [orderCostK, setOrderCostK] = useState<number>(200);
  const [holdingCostH, setHoldingCostH] = useState<number>(3.0);
  const [unitCostC, setUnitCostC] = useState<number>(25.0);

  // 3D View angles
  const [azimuthDeg, setAzimuthDeg] = useState<number>(45); // horizontal rotation
  const [elevationDeg, setElevationDeg] = useState<number>(30); // vertical tilt
  const [sliceKValue, setSliceKValue] = useState<number>(200); // 2D slice cross section
  const [activeViewMode, setActiveViewMode] = useState<"surface" | "contour" | "slice">("surface");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Optimal EOQ at current central parameters
  const currentEOQ = useMemo(
    () => calculateClassicEOQ(demandD, orderCostK, holdingCostH, unitCostC),
    [demandD, orderCostK, holdingCostH, unitCostC]
  );

  // Generate 3D Grid points for TC(Q, K)
  const grid3D = useMemo(() => {
    const qMin = Math.max(100, Math.round(currentEOQ.optimalQ * 0.3));
    const qMax = Math.round(currentEOQ.optimalQ * 2.2);
    const kMin = 50;
    const kMax = 500;
    const stepsX = 22;
    const stepsY = 18;

    const points: Array<Array<{ q: number; k: number; tc: number; x3: number; y3: number; z3: number }>> = [];
    let minTC = Infinity;
    let maxTC = -Infinity;

    for (let i = 0; i <= stepsX; i++) {
      const row = [];
      const q = qMin + (i / stepsX) * (qMax - qMin);
      for (let j = 0; j <= stepsY; j++) {
        const k = kMin + (j / stepsY) * (kMax - kMin);
        const oc = (demandD / q) * k;
        const hc = (q / 2) * holdingCostH;
        const tc = oc + hc;
        minTC = Math.min(minTC, tc);
        maxTC = Math.max(maxTC, tc);
        row.push({ q, k, tc, x3: 0, y3: 0, z3: 0 });
      }
      points.push(row);
    }

    return { points, qMin, qMax, kMin, kMax, minTC, maxTC };
  }, [demandD, holdingCostH, currentEOQ]);

  // 3D Canvas Rendering Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, "#0f172a");
    bgGrad.addColorStop(1, "#1e293b");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Coordinate projection calculations
    const azRad = (azimuthDeg * Math.PI) / 180;
    const elRad = (elevationDeg * Math.PI) / 180;

    const cosAz = Math.cos(azRad);
    const sinAz = Math.sin(azRad);
    const cosEl = Math.cos(elRad);
    const sinEl = Math.sin(elRad);

    const { points, qMin, qMax, kMin, kMax, minTC, maxTC } = grid3D;
    const tcRange = maxTC - minTC || 1;

    const project3D = (q: number, k: number, tc: number) => {
      // Normalize to [-1, 1]
      const nx = ((q - qMin) / (qMax - qMin) - 0.5) * 2;
      const ny = ((k - kMin) / (kMax - kMin) - 0.5) * 2;
      const nz = (((tc - minTC) / tcRange) * 0.9 - 0.45) * 2;

      // 3D Isometric rotation
      const xRot = nx * cosAz - ny * sinAz;
      const yRot = nx * sinAz + ny * cosAz;
      const zRot = nz;

      // Vertical tilt
      const xProj = xRot;
      const yProj = yRot * sinEl - zRot * cosEl;

      const scale = width * 0.28;
      const screenX = width / 2 + xProj * scale;
      const screenY = height / 2 + yProj * scale;

      return { x: screenX, y: screenY, depth: yRot * cosEl + zRot * sinEl };
    };

    // Draw 3D surface wireframe & quads
    for (let i = 0; i < points.length - 1; i++) {
      for (let j = 0; j < points[i].length - 1; j++) {
        const p00 = project3D(points[i][j].q, points[i][j].k, points[i][j].tc);
        const p10 = project3D(points[i + 1][j].q, points[i + 1][j].k, points[i + 1][j].tc);
        const p11 = project3D(points[i + 1][j + 1].q, points[i + 1][j + 1].k, points[i + 1][j + 1].tc);
        const p01 = project3D(points[i][j + 1].q, points[i][j + 1].k, points[i][j + 1].tc);

        const avgTC = (points[i][j].tc + points[i + 1][j].tc + points[i + 1][j + 1].tc + points[i][j + 1].tc) / 4;
        const normalizedColor = Math.min(1, Math.max(0, (avgTC - minTC) / tcRange));

        // Color ramp from cyan-teal (low cost) to amber-rose (high cost)
        const r = Math.round(13 + normalizedColor * 220);
        const g = Math.round(148 - normalizedColor * 80);
        const b = Math.round(136 - normalizedColor * 80);

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.75)`;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 0.8;

        ctx.beginPath();
        ctx.moveTo(p00.x, p00.y);
        ctx.lineTo(p10.x, p10.y);
        ctx.lineTo(p11.x, p11.y);
        ctx.lineTo(p01.x, p01.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // Highlight Global Minimum Star
    const qOpt = currentEOQ.optimalQ;
    const kOpt = orderCostK;
    const tcOpt = currentEOQ.orderCost + currentEOQ.holdingCost;
    const pOpt = project3D(qOpt, kOpt, tcOpt);

    ctx.fillStyle = "#facc15";
    ctx.shadowColor = "#facc15";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(pOpt.x, pOpt.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px monospace";
    ctx.fillText(`极小值点 Q*=${Math.round(qOpt)}, K=¥${kOpt}`, pOpt.x + 10, pOpt.y - 8);

    // Axis indicator labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px sans-serif";
    ctx.fillText("X轴: 订货量 Q →", 20, height - 30);
    ctx.fillText("Y轴: 订货费 K →", 20, height - 15);
  }, [grid3D, azimuthDeg, elevationDeg, orderCostK, currentEOQ]);

  return (
    <div className="space-y-6">
      {/* Sliced Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">多维度决策引擎与 3D 成本曲面</h2>
          <p className="text-xs text-slate-500">
            三维投影渲染总成本曲面 $TC(Q, K)$ 与二维切片抛物线，直观呈现鞍点、极小值盆地与多维参数灵敏度。
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveViewMode("surface")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeViewMode === "surface"
                ? "bg-white text-teal-800 shadow-xs ring-1 ring-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Rotate3d className="w-3.5 h-3.5 inline mr-1" />
            3D 曲面视角
          </button>
          <button
            onClick={() => setActiveViewMode("slice")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeViewMode === "slice"
                ? "bg-white text-teal-800 shadow-xs ring-1 ring-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5 inline mr-1" />
            2D 切片抛物线
          </button>
        </div>
      </div>

      {/* Main Surface + Sliders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 3D Projection Canvas View */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-teal-600" />
              总成本 3D 空间曲面 TC(Q, K) = (D/Q)K + (Q/2)h
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 text-teal-700">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" /> 低成本洼地
              </span>
              <span className="inline-flex items-center gap-1 text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> 高成本峰区
              </span>
            </div>
          </div>

          {/* 3D Canvas Box */}
          <div className="relative w-full rounded-2xl overflow-hidden shadow-inner border border-slate-700 bg-slate-950 flex justify-center">
            <canvas ref={canvasRef} width={640} height={380} className="w-full h-auto max-h-[380px] object-contain" />
          </div>

          {/* 3D View Angle Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 text-xs">
            <div>
              <div className="flex justify-between text-slate-600 mb-1">
                <span>水平旋转角 (方位角 Azimuth)</span>
                <span className="font-mono font-bold text-teal-700">{azimuthDeg}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={azimuthDeg}
                onChange={(e) => setAzimuthDeg(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-600 mb-1">
                <span>垂直俯仰角 (Elevation)</span>
                <span className="font-mono font-bold text-indigo-700">{elevationDeg}°</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                step="5"
                value={elevationDeg}
                onChange={(e) => setElevationDeg(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="col-span-2 sm:col-span-1 flex items-center justify-end">
              <button
                onClick={() => {
                  setAzimuthDeg(45);
                  setElevationDeg(30);
                }}
                className="w-full sm:w-auto px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-semibold"
              >
                重置 3D 视角
              </button>
            </div>
          </div>
        </div>

        {/* Right: Sensitivity & Slice Controls */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>曲面剖面切片参数</span>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Slice View
              </span>
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>年总需求 D (件/年)</span>
                  <span className="font-mono font-bold text-teal-700">{demandD.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="40000"
                  step="1000"
                  value={demandD}
                  onChange={(e) => setDemandD(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>单次订货费 K (元/次)</span>
                  <span className="font-mono font-bold text-indigo-700">¥{orderCostK}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="10"
                  value={orderCostK}
                  onChange={(e) => setOrderCostK(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>单位年持有费 h (元/件/年)</span>
                  <span className="font-mono font-bold text-amber-700">¥{holdingCostH.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={holdingCostH}
                  onChange={(e) => setHoldingCostH(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
              </div>
            </div>

            {/* Sensitivity Analysis Table */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-xs font-bold text-slate-800">
                订货量偏差敏感性指标 (方根平坦性)
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-200/60">
                  <span className="text-slate-600">批量偏小 -20% (0.8 Q*):</span>
                  <span className="font-mono font-bold text-teal-700">+1.67% 成本</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-200/60">
                  <span className="text-slate-600">批量偏大 +20% (1.2 Q*):</span>
                  <span className="font-mono font-bold text-teal-700">+1.67% 成本</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-200/60">
                  <span className="text-slate-600">批量偏大 +50% (1.5 Q*):</span>
                  <span className="font-mono font-bold text-amber-700">+8.33% 成本</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
