export type ActiveModule =
  | "or_eoq_math"
  | "deterministic"
  | "stochastic"
  | "tank_sandbox"
  | "decision_3d"
  | "case_studies"
  | "python_engine"
  | "ai_diagnosis"
  | "knowledge_guide"
  | "report_export";

// 1. OR & EOQ Foundation
export interface EOQMathDerivationState {
  demand: number; // D (件/年)
  orderCost: number; // K (元/次)
  holdingCost: number; // h (元/件/年)
  unitCost: number; // c (元/件)
  currentQ: number; // 观察点 Q
  stepIndex: number; // 推导步骤
}

// 2. Deterministic Models
export type DeterministicSubModel = "classic" | "epq" | "shortage" | "discount";

export interface DeterministicParams {
  demand: number; // D
  orderCost: number; // K
  holdingCost: number; // h
  unitCost: number; // c
  productionRate?: number; // P for EPQ (P > D)
  shortageCost?: number; // p for Backorders
  discountTiers?: Array<{
    minQty: number;
    maxQty: number; // Infinity for open ended
    price: number;
  }>;
}

// 3. Stochastic Models
export type StochasticSubModel = "newsvendor" | "multi_period";

export interface NewsvendorParams {
  retailPrice: number; // p (售价)
  costPrice: number; // c (进货成本)
  salvageValue: number; // v (残值)
  distributionType: "normal" | "uniform";
  meanDemand: number; // μ
  stdDemand: number; // σ
  minDemand?: number; // for uniform
  maxDemand?: number; // for uniform
}

export interface MultiPeriodParams {
  dailyDemandMean: number; // d_avg (件/天)
  dailyDemandStd: number; // σ_d (件/天)
  leadTimeDays: number; // L (天)
  leadTimeStd: number; // σ_L (天)
  serviceLevelAlpha: number; // 周期服务水平 α (如 0.95, 0.98)
  orderCostK: number; // K
  holdingCostH: number; // h (元/件/年)
  workingDaysPerYear: number; // 365 or 250
}

// 4. (s, S) Water Tank Float Valve Sandbox
export type InventoryPolicyType =
  | "continuous_s_S" // (s, S) 连续盘点
  | "continuous_s_Q" // (s, Q) 连续盘点固定批量
  | "periodic_T_s_S" // (T, s, S) 定期盘点阈值补齐
  | "periodic_T_S"; // (T, S) 定期盘点补齐目标

export interface WaterTankSimulationConfig {
  policy: InventoryPolicyType;
  tankCapacityMax: number; // 水箱物理上限容量
  targetLevelS: number; // S (高水位上限 / 目标补库位)
  triggerLevels: number; // s (低水位阈值 / 浮球阀触发线)
  orderBatchQ: number; // Q for (s, Q)
  reviewPeriodT: number; // T (定期盘点周期，时间步)
  leadTimeDelay: number; // 提前期 (充水时滞，秒或步)
  inflowRate: number; // 进水充水速度 (件/步)
  demandDistribution: "normal" | "poisson" | "uniform" | "custom_pulse";
  demandMean: number; // 平均流速/需求量
  demandStd: number; // 需求波动方差
  timeScale: number; // 动画速率 (1x, 2x, 5x)
}

export interface WaterTankSimulationStep {
  step: number;
  time: number;
  inventoryLevel: number; // 实际净水位/实物库存 I
  inventoryPosition: number; // 库存地位 IP = I + 在途 - 缺货
  floatBallLevel: number; // 浮球实时高度 (0-100%)
  valveOpen: boolean; // 阀门开启状态
  isFilling: boolean; // 是否正在注水补货
  pipelineInTransit: number; // 管道内已下单在途水流
  demand: number; // 本期排水量/客户需求
  stockoutLoss: number; // 缺货量 (水位跌破0)
  orderPlacedAmount: number; // 本期触发的订货量
}

// 5. 3D Decision Engine & Cost Surface
export interface CostSurfaceConfig {
  xParam: "Q"; // x轴: 订货量 Q
  yParam: "K" | "D" | "h"; // y轴: 变动参数
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  resolution: number; // 网格细度 20-50
}

// 6. Six Classic Case Studies
export interface CaseStudyItem {
  id: string;
  title: string;
  category: string;
  iconName: string;
  badge: string;
  summary: string;
  story: string;
  modelType: string;
  parameters: Record<string, number | any>;
  keyFormulas: string[];
  takeaways: string[];
  explanation: string;
}

// 7. Python Engine
export interface PythonCodeSnippet {
  id: string;
  title: string;
  category: string;
  description: string;
  libraries: string[];
  code: string;
  simulatedOutput: string;
}

// 8. AI Diagnosis
export interface AIDiagnosisResult {
  source: "gemini" | "heuristic-expert";
  report: string;
  timestamp: string;
  healthScore?: number;
}
