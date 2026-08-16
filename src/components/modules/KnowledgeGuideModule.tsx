import React, { useState, useMemo } from "react";
import {
  BookOpen,
  GitBranch,
  HelpCircle,
  Sigma,
  AlertTriangle,
  Lightbulb,
  Search,
  ArrowRight,
  CheckCircle2,
  Bookmark,
  Compass,
  Layers,
  Sparkles,
  Zap,
  TrendingUp,
  ShieldCheck,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Clock,
  Boxes,
  Activity,
  Grid3X3,
  Flame,
  Snowflake,
  DollarSign,
  Droplets,
  PackageCheck,
  Scale,
  Sliders,
  Filter,
} from "lucide-react";
import { ActiveModule } from "../../types/inventory";

interface KnowledgeGuideModuleProps {
  onNavigateToModule?: (module: ActiveModule) => void;
}

interface FormulaCard {
  id: string;
  name: string;
  category: "deterministic" | "stochastic" | "policy" | "multi_sku";
  categoryLabel: string;
  formula: string;
  latexClean: string;
  variables: { sym: string; name: string; unit: string }[];
  assumptions: string[];
  caveats: string;
  targetModule: ActiveModule;
}

interface DecisionNode {
  id: number;
  question: string;
  description: string;
  options: {
    label: string;
    description: string;
    nextNodeId?: number;
    result?: {
      modelName: string;
      targetModule: ActiveModule;
      summary: string;
      keyFormula: string;
      bestFor: string;
    };
  }[];
}

const DECISION_TREE: Record<number, DecisionNode> = {
  1: {
    id: 1,
    question: "第一步：需求特性属于确定型还是具有随机不确定性？",
    description: "需求模式是选择库存模型的最顶层分水岭。",
    options: [
      {
        label: "确定型需求 (已知且平稳速率 D)",
        description: "需求在全周期内恒定已知，无随机需求波动或提前期扰动",
        nextNodeId: 2,
      },
      {
        label: "随机型需求 (服从正态 / 泊松等概率分布)",
        description: "客户需求存在随机波动，需考虑缺货风险与安全库存缓冲",
        nextNodeId: 3,
      },
      {
        label: "多 SKU 组合品类分类管理",
        description: "面临成百上千种物料，需按价值贡献与波动率进行分级治理",
        result: {
          modelName: "ABC-XYZ 差异化品类控制矩阵",
          targetModule: "decision_3d",
          summary: "以帕累托原则 (ABC) 与变异系数 (XYZ) 将 SKU 划分为 9 大象限，实施分类施策与资金周转控制。",
          keyFormula: "CV = σ_D / μ_D, 累计贡献率 Top 70% (A), 20% (B), 10% (C)",
          bestFor: "多品类、多物料的大中型供应链与仓储分级管理",
        },
      },
    ],
  },
  2: {
    id: 2,
    question: "第二步 (确定型)：补货入库方式与缺货策略如何设定？",
    description: "根据供货模式（瞬时到货 vs 连续生产）与缺货容忍度决定。",
    options: [
      {
        label: "瞬时批量到货 + 不允许缺货",
        description: "外购标准件，订单下发后整批一次性入库，绝不允许缺货",
        result: {
          modelName: "经典 EOQ 经济订货批量模型",
          targetModule: "deterministic",
          summary: "通过在订货成本 K 与持有成本 h 之间取得完美均衡，使得年化变动总成本最小化。",
          keyFormula: "Q* = √(2DK / h), TC* = √(2DKh)",
          bestFor: "常规外购标准件、供应商货源稳定、需求已知平稳场景",
        },
      },
      {
        label: "边生产边消耗 (有限生产速率 P > D)",
        description: "工厂自制加工，生产与消耗并行进行，最高库存小于总生产批量",
        result: {
          modelName: "EPQ 经济生产批量模型",
          targetModule: "deterministic",
          summary: "考虑有限生产速率 P，在机台换产设置成本与在制品暂存成本间寻求最优解。",
          keyFormula: "Q* = √[2DK / (h · (1 - d/P))], I_max = Q · (1 - d/P)",
          bestFor: "制造企业内部工序排产、车间批次加工、自制件生产",
        },
      },
      {
        label: "允许缺货回补 (延期交货 Backorder)",
        description: "客户粘性高或工业定制品，缺货时客户愿意等待，产生单位缺货损失 p",
        result: {
          modelName: "允许缺货 EOQ 模型 (Planned Shortage / Backorder)",
          targetModule: "deterministic",
          summary: "允许在周期末产生适度延期交付，用极低持有成本对冲可承受的缺货惩罚成本。",
          keyFormula: "Q* = √[2DK(h + p) / (hp)], S* = Q* · (h / (h + p))",
          bestFor: "工业大宗原材料、高忠诚度 B2B 客户、缺货惩罚相对可控场景",
        },
      },
      {
        label: "供应商提供阶梯数量价格折扣 (Quantity Discount)",
        description: "单价随单次采购量增加而分档降价 (Price Breaks)",
        result: {
          modelName: "全额 / 增量阶梯数量折扣模型",
          targetModule: "deterministic",
          summary: "权衡大批量采购带来的货品采购单价优惠与库存持有资金膨胀，通过可行域修剪求解全局最优 Q*。",
          keyFormula: "TC(Q) = (D/Q)K + (Q/2)h_i + D · c_i",
          bestFor: "供应商促销返利、大宗物资集采、跨期批量采购协议谈判",
        },
      },
    ],
  },
  3: {
    id: 3,
    question: "第三步 (随机型)：业务周期是单周期易腐/季节性，还是连续多周期运营？",
    description: "单周期不可退回 vs 跨周期动态滚动补货。",
    options: [
      {
        label: "单周期业务 (易腐品 / 节日时令品 / 寿命短时尚品)",
        description: "商品仅在一个销售周期内有效，过季残值极低，超储 (Co) 与缺货 (Cu) 惩罚不对称",
        result: {
          modelName: "报童模型 (Newsvendor Model)",
          targetModule: "stochastic",
          summary: "利用边际分析法，将最优订货量定位在临界分位数 CR* 对应的累积概率点。",
          keyFormula: "F(Q*) = C_u / (C_u + C_o), 其中 C_u = p - c, C_o = c - s",
          bestFor: "生鲜快消、时装早秋订货会、节假日纪念品、航空/酒店客房收益管理",
        },
      },
      {
        label: "连续多周期运营 (需设置安全库存与预警触发水位)",
        description: "常态化运营物料，需求随机且提前期存在波动，需设定 ROP 与安全库存",
        nextNodeId: 4,
      },
    ],
  },
  4: {
    id: 4,
    question: "第四步 (连续控制)：采用连续盘点还是定期周期盘点？",
    description: "监控手段与仓储信息化能力的差异。",
    options: [
      {
        label: "连续盘点 (s, S) 或 (s, Q) 策略",
        description: "库存每发生一次变动即刻结算，当在途+在库 ≤ 触发点 s 时，立即发出订单补齐至上限 S",
        result: {
          modelName: "(s, S) / (s, Q) 连续盘点动态策略",
          targetModule: "tank_sandbox",
          summary: "兼具再订货点灵敏性与批量经济性，在需求大幅突发剧烈波动时具有极强鲁棒性。",
          keyFormula: "ROP = d_L + SS, SS = Z_α · √(μ_L · σ_D² + μ_D² · σ_L²)",
          bestFor: "现代 ERP / WMS 实时联网的高价值核心物料监控与动态水箱仿真",
        },
      },
      {
        label: "定期盘点 (R, S) 策略 (周期 T 盘点一次)",
        description: "固定时间间隔（如每周一、每月底）统一盘点并发出补货单补至目标水位 S",
        result: {
          modelName: "(R, S) 定期盘点补齐策略",
          targetModule: "stochastic",
          summary: "风险暴露期扩大为 (R + L)，安全库存需求更高，但可显著减少盘点操作费用与运输合并开销。",
          keyFormula: "S* = d · (R + L) + Z_α · σ_D · √(R + L)",
          bestFor: "长尾辅料、便利店日常巡检补货、供应商按固定周几送货场景",
        },
      },
    ],
  },
};

const FORMULA_LIST: FormulaCard[] = [
  {
    id: "eoq_classic",
    name: "经典经济订货批量 (Classic EOQ)",
    category: "deterministic",
    categoryLabel: "确定型模型",
    formula: "Q* = √(2DK / h)",
    latexClean: "Q^* = \\sqrt{\\frac{2DK}{h}}, \\quad TC^* = \\sqrt{2DKh}",
    variables: [
      { sym: "D", name: "年总需求量", unit: "件/年" },
      { sym: "K", name: "单次订货固定费用", unit: "元/次" },
      { sym: "h", name: "单位年持有成本", unit: "元/件/年" },
    ],
    assumptions: ["需求率 D 恒定已知", "瞬时整批补货 (提前期 L=0 或已知恒定)", "不允许缺货", "单价 c 恒定无折扣"],
    caveats: "对参数误差具有天然稳健性（鲁棒性）：参数误差 20% 时，总成本上浮仅约 1.5%。",
    targetModule: "or_eoq_math",
  },
  {
    id: "epq_prod",
    name: "经济生产批量 (EPQ)",
    category: "deterministic",
    categoryLabel: "确定型模型",
    formula: "Q* = √[2DK / (h · (1 - d/P))]",
    latexClean: "Q^* = \\sqrt{\\frac{2DK}{h(1 - d/P)}}, \\quad I_{\\max} = Q^*(1 - d/P)",
    variables: [
      { sym: "P", name: "日生产速率", unit: "件/天 (P > d)" },
      { sym: "d", name: "日消耗速率", unit: "件/天" },
      { sym: "K", name: "机台换产设置费", unit: "元/次" },
    ],
    assumptions: ["边生产边消耗", "生产速率 P 严格大于消耗速率 d", "换产工时与设置费已知"],
    caveats: "当 P 趋近于无穷大时，(1 - d/P) 趋近于 1，EPQ 自然退化为经典 EOQ。",
    targetModule: "deterministic",
  },
  {
    id: "backorder_shortage",
    name: "允许缺货回补模型 (EOQ with Backorder)",
    category: "deterministic",
    categoryLabel: "确定型模型",
    formula: "Q* = √[2DK(h + p) / (hp)]",
    latexClean: "Q^* = \\sqrt{\\frac{2DK(h + p)}{hp}}, \\quad S^* = Q^* \\cdot \\frac{h}{h+p}",
    variables: [
      { sym: "p", name: "单位缺货损失惩罚费", unit: "元/件/年" },
      { sym: "S*", name: "最大缺货回补深度", unit: "件" },
    ],
    assumptions: ["所有缺货订单均能延期完整履约", "客户不发生订单撤销流失", "单位缺货费率线性已知"],
    caveats: "因引入缺货缓解了最高在库压力，其最优批量 Q* 恒大于经典 EOQ 批量。",
    targetModule: "deterministic",
  },
  {
    id: "stochastic_ss",
    name: "双随机提前期安全库存 (Dual-Stochastic SS)",
    category: "stochastic",
    categoryLabel: "随机型模型",
    formula: "SS = Z_α · √(μ_L · σ_D² + μ_D² · σ_L²)",
    latexClean: "SS = Z_{\\alpha} \\sqrt{\\mu_L \\sigma_D^2 + \\mu_D^2 \\sigma_L^2}, \\quad ROP = \\mu_D \\mu_L + SS",
    variables: [
      { sym: "Z_α", name: "标准正态安全系数", unit: "如 95% 对应 1.65" },
      { sym: "μ_D, σ_D", name: "日需求均值与标准差", unit: "件/天" },
      { sym: "μ_L, σ_L", name: "提前期均值与标准差", unit: "天" },
    ],
    assumptions: ["日需求与提前期相互独立", "复合提前期需求服从正态分布", "方差满足加法原理"],
    caveats: "提前期波动 σ_L 对安全库存的放大效应远超日需求波动 σ_D，压缩供应链交付方差是降本首选。",
    targetModule: "stochastic",
  },
  {
    id: "newsvendor_cr",
    name: "单周期报童临界分位数 (Newsvendor Model)",
    category: "stochastic",
    categoryLabel: "随机型模型",
    formula: "F(Q*) = C_u / (C_u + C_o)",
    latexClean: "F(Q^*) = \\frac{C_u}{C_u + C_o} = \\frac{p - c}{(p - c) + (c - s)}",
    variables: [
      { sym: "C_u", name: "单位缺货边际利润损失", unit: "元/件 (p - c)" },
      { sym: "C_o", name: "单位超储边际积压损失", unit: "元/件 (c - s)" },
      { sym: "s", name: "残值回收变现价", unit: "元/件" },
    ],
    assumptions: ["单周期无后续补货机会", "残值 s < 单价 c < 售价 p", "需求累计概率分布已知"],
    caveats: "当毛利率极高时 (Cu >> Co)，临界比率极高，最优备货量将大幅超过均值需求向右侧长尾延伸。",
    targetModule: "stochastic",
  },
  {
    id: "abc_xyz_mat",
    name: "ABC-XYZ 品类分类与离散度",
    category: "multi_sku",
    categoryLabel: "多SKU品类矩阵",
    formula: "CV = σ_D / μ_D",
    latexClean: "CV = \\frac{\\sigma_D}{\\mu_D}, \\quad \\text{ABC: 累计金额 } 70\\% / 20\\% / 10\\%",
    variables: [
      { sym: "CV", name: "变异系数 (离散程度)", unit: "无量纲" },
      { sym: "X/Y/Z", name: "波动级别划分", unit: "X<0.25, 0.25≤Y<0.55, Z≥0.55" },
    ],
    assumptions: ["帕累托 20/80 法则成立", "历史销售数据平稳或具备统计意义"],
    caveats: "AX 类重在压缩周转天数减少资金占用；CZ 类重在防止长尾呆滞与年度清仓。",
    targetModule: "decision_3d",
  },
];

// ABC-XYZ Matrix Detailed Playbook Data
interface AbcXyzPlaybookItem {
  code: string;
  name: string;
  valueLevel: string;
  volatilityLevel: string;
  revenueShare: string;
  cvRange: string;
  recommendedModel: string;
  replenishmentPolicy: string;
  safetyStockLevel: string;
  inventoryTurnoverDIO: string;
  auditFrequency: string;
  keyRisk: string;
  bestPractice: string;
  colorClass: string;
  badgeClass: string;
}

const ABC_XYZ_PLAYBOOK: AbcXyzPlaybookItem[] = [
  {
    code: "AX",
    name: "AX 级：核心主力现金牛",
    valueLevel: "高价值 (Top 70%)",
    volatilityLevel: "低波动 (CV < 0.25)",
    revenueShare: "占资金 ~45%，SKU 数 ~15%",
    cvRange: "0.05 ~ 0.25",
    recommendedModel: "准时制 JIT / 经典 EOQ / 连续自动补货",
    replenishmentPolicy: "高频、小批量、连续监控 (s, Q)",
    safetyStockLevel: "极低安全库存 (Z=1.96, ~3天)",
    inventoryTurnoverDIO: "10 ~ 15 天 (极速周转)",
    auditFrequency: "每日/实时系统跟踪",
    keyRisk: "供应商突发断货导致主力营收停摆",
    bestPractice: "与战略供应商深度绑定，建立 EDI/API 自动触发补货，维持极低仓储占用。",
    colorClass: "border-blue-300 bg-blue-50/50",
    badgeClass: "bg-blue-600 text-white",
  },
  {
    code: "AY",
    name: "AY 级：高价值重点防缺品",
    valueLevel: "高价值 (Top 70%)",
    volatilityLevel: "中等波动 (0.25 ≤ CV < 0.55)",
    revenueShare: "占资金 ~20%，SKU 数 ~8%",
    cvRange: "0.25 ~ 0.55",
    recommendedModel: "动态 (s, S) 连续盘点 + 预测协同",
    replenishmentPolicy: "动态预警补货水位，结合大促前置备料",
    safetyStockLevel: "适度动态安全库存 (~7天)",
    inventoryTurnoverDIO: "20 ~ 25 天",
    auditFrequency: "每周 2 次人工审核",
    keyRisk: "促销或旺季预测不准导致高额缺货损失",
    bestPractice: "引入短期滚动需求预测，设定动态再订货点 ROP，前置锁定产能。",
    colorClass: "border-cyan-300 bg-cyan-50/50",
    badgeClass: "bg-cyan-600 text-white",
  },
  {
    code: "AZ",
    name: "AZ 级：高风险战略定制品",
    valueLevel: "高价值 (Top 70%)",
    volatilityLevel: "极高波动 (CV ≥ 0.55)",
    revenueShare: "占资金 ~15%，SKU 数 ~5%",
    cvRange: "0.55 ~ 1.50+",
    recommendedModel: "单周期报童 / VMI 寄售 / 按单生产 (MTO)",
    replenishmentPolicy: "逐单严格审批，严禁主动常备大库存",
    safetyStockLevel: "严格受控或 0 安全库存 (寄售代管)",
    inventoryTurnoverDIO: "45 ~ 60 天 (高呆滞风险)",
    auditFrequency: "每单专家/供应链总监联签",
    keyRisk: "单件货值极高，一旦滞销将形成巨额呆滞死库",
    bestPractice: "推行按单定制采购或由供应商负责 VMI 仓库，仅在领用消耗时结算。",
    colorClass: "border-red-300 bg-red-50/50",
    badgeClass: "bg-red-600 text-white",
  },
  {
    code: "BX",
    name: "BX 级：稳定流通标准品",
    valueLevel: "中等价值 (20%)",
    volatilityLevel: "低波动 (CV < 0.25)",
    revenueShare: "占资金 ~10%，SKU 数 ~20%",
    cvRange: "0.05 ~ 0.25",
    recommendedModel: "定期盘点 (R, S) 补齐策略",
    replenishmentPolicy: "固定周期自动触发补货，集中合并订单",
    safetyStockLevel: "低安全库存 (~5天)",
    inventoryTurnoverDIO: "25 ~ 30 天",
    auditFrequency: "隔周定期盘点",
    keyRisk: "频繁琐碎下单增加采购处理费用",
    bestPractice: "设定经济订货周期，与其他物料合并集运以分摊固定物流运费。",
    colorClass: "border-emerald-300 bg-emerald-50/50",
    badgeClass: "bg-emerald-600 text-white",
  },
  {
    code: "BY",
    name: "BY 级：常规配件与季节品",
    valueLevel: "中等价值 (20%)",
    volatilityLevel: "中等波动 (0.25 ≤ CV < 0.55)",
    revenueShare: "占资金 ~8%，SKU 数 ~15%",
    cvRange: "0.25 ~ 0.55",
    recommendedModel: "安全库存加权缓冲 + 阶梯批量折扣",
    replenishmentPolicy: "定量订购制 (s, Q)，争取梯级价格优惠",
    safetyStockLevel: "中等安全库存 (~10天)",
    inventoryTurnoverDIO: "35 ~ 45 天",
    auditFrequency: "月度例行调整",
    keyRisk: "过量享受折扣导致持有成本超支",
    bestPractice: "严密评估阶梯折扣平衡点，防范大批量囤货导致的库容紧张与保质期折损。",
    colorClass: "border-amber-300 bg-amber-50/50",
    badgeClass: "bg-amber-600 text-white",
  },
  {
    code: "BZ",
    name: "BZ 级：冷门备件与特规件",
    valueLevel: "中等价值 (20%)",
    volatilityLevel: "极高波动 (CV ≥ 0.55)",
    revenueShare: "占资金 ~5%，SKU 数 ~10%",
    cvRange: "0.55 ~ 1.20",
    recommendedModel: "定量订购制 + 最小批量 (MOQ) 约束",
    replenishmentPolicy: "按需触发，拉长提前期承诺，小单采购",
    safetyStockLevel: "低配置安全库存或无备货",
    inventoryTurnoverDIO: "55 ~ 75 天 (偏慢)",
    auditFrequency: "双周抽盘监控",
    keyRisk: "长周期无消耗演变为死库存",
    bestPractice: "与客户约定交期缓冲，优先消耗通用替代件，降低专用备件建库比例。",
    colorClass: "border-orange-300 bg-orange-50/50",
    badgeClass: "bg-orange-600 text-white",
  },
  {
    code: "CX",
    name: "CX 级：标准耗材与紧固件",
    valueLevel: "低价值 (10%)",
    volatilityLevel: "低波动 (CV < 0.25)",
    revenueShare: "占资金 ~2%，SKU 数 ~20%",
    cvRange: "0.05 ~ 0.25",
    recommendedModel: "双箱法 (Two-Bin System) / 批量合并采购",
    replenishmentPolicy: "一箱见底即补新箱，极大化订货批量",
    safetyStockLevel: "高安全库存 (1箱全额缓冲)",
    inventoryTurnoverDIO: "40 ~ 50 天",
    auditFrequency: "季度抽盘 / 可视化看板",
    keyRisk: "过度精细化管理消耗采购人力",
    bestPractice: "全面使用车间目视化双箱法或面包车直送 (Vendor Managed)，降低管控人力成本。",
    colorClass: "border-slate-300 bg-slate-50/70",
    badgeClass: "bg-slate-700 text-white",
  },
  {
    code: "CY",
    name: "CY 级：低值长尾消耗品",
    valueLevel: "低价值 (10%)",
    volatilityLevel: "中等波动 (0.25 ≤ CV < 0.55)",
    revenueShare: "占资金 ~2%，SKU 数 ~15%",
    cvRange: "0.25 ~ 0.55",
    recommendedModel: "长周期大批量采购 / 寄售消耗",
    replenishmentPolicy: "减少订购频次，半年或季度下单一次",
    safetyStockLevel: "充裕安全库存",
    inventoryTurnoverDIO: "60 ~ 80 天",
    auditFrequency: "半年度例行盘点",
    keyRisk: "零星散单采购导致运费高于货值",
    bestPractice: "按包/箱/托盘整单采购，避免零散拆包，以仓储空间换取管理与物流成本节约。",
    colorClass: "border-slate-300 bg-slate-100/70",
    badgeClass: "bg-slate-600 text-white",
  },
  {
    code: "CZ",
    name: "CZ 级：极度长尾呆滞区",
    valueLevel: "低价值 (10%)",
    volatilityLevel: "极高波动 (CV ≥ 0.55)",
    revenueShare: "占资金 ~1%，SKU 数 ~15%",
    cvRange: "0.55 ~ 2.00+",
    recommendedModel: "无库存采购 / 报废清理 / 呆滞清仓",
    replenishmentPolicy: "按需零散采购，绝不主动常备大库存",
    safetyStockLevel: "0 安全库存",
    inventoryTurnoverDIO: "100 ~ 180+ 天 (极度沉淀)",
    auditFrequency: "年度清仓报废专项审计",
    keyRisk: "库位被大量无效死物料挤占",
    bestPractice: "定期发起清仓甩卖、折价退回或报废核销，果断释放货架资源与库容。",
    colorClass: "border-slate-400 bg-slate-200/80",
    badgeClass: "bg-slate-800 text-white",
  },
];

const PITFALL_RULES = [
  {
    title: "1. 提前期方差放大陷阱 (Lead Time Variance Trap)",
    level: "高危风险",
    summary: "许多管理者只关注压缩平均交期，却忽略了交期标准差 σ_L。",
    detail:
      "由双随机方差公式知：提前期方差对安全库存的贡献与日需求平方 (μ_D²) 成正比。当供应商交期极不稳定时，哪怕平均天数只有 3 天，安全库存也会成倍暴涨。稳定交付可靠性优先级远高于单纯压缩名义交期。",
    badgeColor: "bg-red-100 text-red-700 border-red-200",
  },
  {
    title: "2. 阶梯折扣大批量囤货陷阱 (Bulk Discount Illusion)",
    level: "资金占用",
    summary: "表面上看单价节省了 5%，但资金周转天数 (DIO) 飙升至 180 天。",
    detail:
      "当为了达到折扣起订门槛 (Price Break Tier) 而大幅膨胀订货量时，仓储占用、资金机会成本、保质期贬值以及呆滞报废风险激增，通常会导致实际综合年化成本反超经典 EOQ。",
    badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
  },
  {
    title: "3. 99.9% 极致服务水平的非线性资金陡增",
    level: "边际递减",
    summary: "服务水平从 95% 提升至 99.9%，安全库存不是增加 5%，而是翻倍暴涨。",
    detail:
      "安全系数 Z 从 1.65 (95%) 跃升至 3.09 (99.9%)，增长达 87%；若再考虑随机提前期，库存资金呈现指数级恶化。针对非核心长尾品（B/C 类），盲目追求高服务水平是企业现金流枯竭的常见主因。",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    title: "4. 牛鞭效应 (Bullwhip Effect) 与信息孤岛",
    level: "协同瓶颈",
    summary: "下游零售端 5% 的微小需求震荡，传导至上游原材料端将放大为 40% 的剧烈波动。",
    detail:
      "根源在于各层级独立做批量订货 (Batch Ordering)、价格博弈以及提前期过长。应优先推广 VMI 供应商协同补货与 POS 实时销售数据共享以熨平需求失真。",
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
  },
];

export const KnowledgeGuideModule: React.FC<KnowledgeGuideModuleProps> = ({
  onNavigateToModule,
}) => {
  const [activeTab, setActiveTab] = useState<"tree" | "abc_xyz" | "formulas" | "pitfalls">("tree");
  const [currentNodeId, setCurrentNodeId] = useState<number>(1);
  const [historyNodeIds, setHistoryNodeIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [selectedAbcXyzCode, setSelectedAbcXyzCode] = useState<string>("all");

  const currentNode = DECISION_TREE[currentNodeId];

  const handleSelectOption = (option: (typeof currentNode.options)[0]) => {
    if (option.nextNodeId) {
      setHistoryNodeIds((prev) => [...prev, currentNodeId]);
      setCurrentNodeId(option.nextNodeId);
    }
  };

  const handleResetDecisionTree = () => {
    setCurrentNodeId(1);
    setHistoryNodeIds([]);
  };

  const handleGoBackStep = () => {
    if (historyNodeIds.length === 0) return;
    const lastId = historyNodeIds[historyNodeIds.length - 1];
    setHistoryNodeIds((prev) => prev.slice(0, -1));
    setCurrentNodeId(lastId);
  };

  // Filter formulas
  const filteredFormulas = useMemo(() => {
    return FORMULA_LIST.filter((f) => {
      const matchCat = selectedCategoryFilter === "all" || f.category === selectedCategoryFilter;
      const matchSearch =
        !searchTerm ||
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.formula.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.assumptions.some((a) => a.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [searchTerm, selectedCategoryFilter]);

  // Filter ABC-XYZ Playbook
  const filteredPlaybook = useMemo(() => {
    return ABC_XYZ_PLAYBOOK.filter((item) => {
      if (selectedAbcXyzCode !== "all" && item.code !== selectedAbcXyzCode) {
        return false;
      }
      return true;
    });
  }, [selectedAbcXyzCode]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#34495E] rounded-lg p-5 sm:p-6 text-white border border-[#2C3E50] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#2980B9]/40 text-blue-200 rounded border border-[#2980B9]/50">
                <BookOpen className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>09. 运筹学与存储控制知识导引</span>
              </h2>
            </div>
            <p className="text-xs text-[#BDC3C7] mt-1.5 leading-relaxed max-w-4xl">
              系统梳理运筹学库存控制理论全景，汇集 <strong>交互式模型选型决策树</strong>、<strong>ABC-XYZ 品类管控矩阵专题</strong>、<strong>核心数学公式速查字典</strong> 与 <strong>实战落地避坑准则</strong>，助您迅速锚定业务场景并直达对应计算模块。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("tree")}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "tree" ? "bg-[#2980B9] text-white" : "bg-white/10 hover:bg-white/20 text-[#ECF0F1]"
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>选型决策树</span>
            </button>

            <button
              onClick={() => setActiveTab("abc_xyz")}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "abc_xyz" ? "bg-[#2980B9] text-white" : "bg-white/10 hover:bg-white/20 text-[#ECF0F1]"
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>ABC-XYZ 品类矩阵</span>
            </button>

            <button
              onClick={() => setActiveTab("formulas")}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "formulas" ? "bg-[#2980B9] text-white" : "bg-white/10 hover:bg-white/20 text-[#ECF0F1]"
              }`}
            >
              <Sigma className="w-3.5 h-3.5" />
              <span>公式速查速记</span>
            </button>

            <button
              onClick={() => setActiveTab("pitfalls")}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "pitfalls" ? "bg-[#2980B9] text-white" : "bg-white/10 hover:bg-white/20 text-[#ECF0F1]"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>四大实战避坑</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: Interactive Model Selection Decision Tree */}
      {activeTab === "tree" && (
        <div className="bg-white rounded-lg p-5 sm:p-6 border border-[#E1E4E8] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E1E4E8]">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#2980B9]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C3E50]">
                业务场景模型选型导航器 (Interactive Decision Tree)
              </h3>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {historyNodeIds.length > 0 && (
                <button
                  onClick={handleGoBackStep}
                  className="px-2.5 py-1 border border-[#CBD5E1] text-[#2C3E50] hover:bg-[#F8F9FA] rounded text-[11px] font-medium transition-colors cursor-pointer"
                >
                  返回上一步
                </button>
              )}
              <button
                onClick={handleResetDecisionTree}
                className="px-2.5 py-1 text-[#7F8C8D] hover:text-[#2C3E50] text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>从头开始</span>
              </button>
            </div>
          </div>

          {/* Breadcrumb Steps */}
          <div className="flex items-center gap-2 text-xs text-[#7F8C8D] overflow-x-auto pb-1">
            <span className="font-bold text-[#2980B9]">选型路径：</span>
            <span className="px-2 py-0.5 bg-blue-50 text-[#2980B9] rounded border border-blue-200">
              根节点 (需求分类)
            </span>
            {historyNodeIds.map((hId, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1]" />
                <span className="px-2 py-0.5 bg-[#F8F9FA] text-[#2C3E50] rounded border border-[#E1E4E8]">
                  阶段 {hId}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Current Question Block */}
          {currentNode && (
            <div className="space-y-4">
              <div className="p-4 bg-[#F8F9FA] rounded-lg border border-[#E1E4E8] space-y-1">
                <div className="text-sm font-bold text-[#2C3E50] flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#2980B9]" />
                  <span>{currentNode.question}</span>
                </div>
                <p className="text-xs text-[#7F8C8D] pl-6">{currentNode.description}</p>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentNode.options.map((opt, oIdx) => (
                  <div
                    key={oIdx}
                    onClick={() => handleSelectOption(opt)}
                    className={`p-4 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                      opt.result
                        ? "bg-emerald-50/70 border-emerald-300 hover:border-emerald-500 hover:shadow-xs"
                        : "bg-white border-[#E1E4E8] hover:border-[#2980B9] hover:bg-blue-50/30 hover:shadow-xs"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs text-[#2C3E50] leading-snug">
                          {opt.label}
                        </span>
                        {opt.result ? (
                          <span className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold shrink-0">
                            推荐最优解
                          </span>
                        ) : (
                          <ArrowRight className="w-4 h-4 text-[#94A3B8] shrink-0 mt-0.5" />
                        )}
                      </div>

                      <p className="text-xs text-[#7F8C8D] leading-relaxed">
                        {opt.description}
                      </p>
                    </div>

                    {/* If this option leads directly to a Result */}
                    {opt.result && (
                      <div className="mt-3 pt-3 border-t border-emerald-200/80 space-y-2 text-xs">
                        <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>推荐运筹模型：{opt.result.modelName}</span>
                        </div>
                        <div className="text-[11px] text-emerald-800 bg-white/70 p-2 rounded border border-emerald-200 font-mono">
                          核心公式：{opt.result.keyFormula}
                        </div>
                        <div className="text-[11px] text-emerald-700">
                          <strong>最佳适配场景：</strong> {opt.result.bestFor}
                        </div>

                        {onNavigateToModule && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToModule(opt.result!.targetModule);
                            }}
                            className="w-full mt-2 py-1.5 bg-[#27AE60] hover:bg-[#2ECC71] text-white font-bold rounded text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <span>立即前往对应模块体验与测算</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ABC-XYZ Category Strategy Playbook & Deep Dive */}
      {activeTab === "abc_xyz" && (
        <div className="bg-white rounded-lg p-5 sm:p-6 border border-[#E1E4E8] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E1E4E8]">
            <div className="flex items-center gap-2">
              <Grid3X3 className="w-4 h-4 text-[#2980B9]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C3E50]">
                ABC-XYZ 差异化品类管控理论全景与 9 大象限策略指引
              </h3>
            </div>

            {/* Filter by Category */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#7F8C8D] font-bold">象限筛选：</span>
              <select
                value={selectedAbcXyzCode}
                onChange={(e) => setSelectedAbcXyzCode(e.target.value)}
                className="px-2.5 py-1 text-xs bg-[#F8F9FA] rounded border border-[#E1E4E8] text-[#2C3E50] focus:outline-none focus:ring-1 focus:ring-[#2980B9]"
              >
                <option value="all">查看全部 9 大象限 (All)</option>
                <option value="AX">AX 类 (高价值 · 低波动)</option>
                <option value="AY">AY 类 (高价值 · 中波动)</option>
                <option value="AZ">AZ 类 (高价值 · 极高波动)</option>
                <option value="BX">BX 类 (中价值 · 低波动)</option>
                <option value="BY">BY 类 (中价值 · 中波动)</option>
                <option value="BZ">BZ 类 (中价值 · 极高波动)</option>
                <option value="CX">CX 类 (低价值 · 低波动)</option>
                <option value="CY">CY 类 (低价值 · 中波动)</option>
                <option value="CZ">CZ 类 (低价值 · 极高波动)</option>
              </select>
            </div>
          </div>

          {/* Mathematical Foundation of ABC & XYZ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#F8F9FA] rounded-lg border border-[#E1E4E8] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#2C3E50]">
                <Scale className="w-4 h-4 text-[#2980B9]" />
                <span>1. ABC 价值维度划分标准 (Pareto 80/20 法则)</span>
              </div>
              <p className="text-xs text-[#7F8C8D] leading-relaxed">
                按 SKU 年销售额（或年消耗金额 $D \times c$）从高到低排序，计算累计金额贡献率：
              </p>
              <div className="text-[11px] space-y-1 bg-white p-2.5 rounded border border-[#E1E4E8] text-[#34495E]">
                <div>• <strong className="text-blue-600">A 类品</strong>：累计金额前 <strong>70%~80%</strong>，通常仅占 SKU 数量的 <strong>10%~20%</strong>（严密管控）。</div>
                <div>• <strong className="text-emerald-600">B 类品</strong>：累计金额随后 <strong>15%~20%</strong>，占 SKU 数量的 <strong>20%~30%</strong>（常规平衡）。</div>
                <div>• <strong className="text-slate-600">C 类品</strong>：累计金额仅占 <strong>5%~10%</strong>，却占 SKU 数量的 <strong>50%~60%</strong>（粗放合并）。</div>
              </div>
            </div>

            <div className="p-4 bg-[#F8F9FA] rounded-lg border border-[#E1E4E8] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#2C3E50]">
                <Activity className="w-4 h-4 text-[#8E44AD]" />
                <span>2. XYZ 需求波动度划分标准 (变异系数 CV)</span>
              </div>
              <p className="text-xs text-[#7F8C8D] leading-relaxed">
                以统计学变异系数 CV = σ_D / μ_D（需求标准差 / 需求均值）度量可预测性：
              </p>
              <div className="text-[11px] space-y-1 bg-white p-2.5 rounded border border-[#E1E4E8] text-[#34495E]">
                <div>• <strong className="text-blue-600">X 稳定类</strong>：CV &lt; 0.25，需求规律平稳，可预测性极高，适合准时制 (JIT)。</div>
                <div>• <strong className="text-amber-600">Y 波动类</strong>：0.25 ≤ CV &lt; 0.55，存在季节性或大促波动，需动态安全库存。</div>
                <div>• <strong className="text-red-600">Z 剧烈类</strong>：CV ≥ 0.55，脉冲式随机爆发或零星慢动，禁止盲目常备大库存。</div>
              </div>
            </div>
          </div>

          {/* 9 Quadrants Strategy Cards */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2C3E50]">
                9 大象限差异化运筹策略手册 ({filteredPlaybook.length} 个象限)：
              </span>
              {onNavigateToModule && (
                <button
                  onClick={() => onNavigateToModule("decision_3d")}
                  className="text-xs text-[#2980B9] font-bold hover:underline flex items-center gap-1"
                >
                  <span>直达 05. ABC-XYZ 品类矩阵控制台实操</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredPlaybook.map((item) => (
                <div
                  key={item.code}
                  className={`p-4 rounded-lg border flex flex-col justify-between space-y-3 ${item.colorClass}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${item.badgeClass}`}>
                        {item.code}
                      </span>
                      <span className="text-[11px] font-bold text-[#2C3E50]">{item.name}</span>
                    </div>

                    <div className="text-[11px] text-[#7F8C8D] space-y-0.5 pt-1">
                      <div><strong>价值 / 波动：</strong>{item.valueLevel} | {item.volatilityLevel}</div>
                      <div><strong>资金特征：</strong>{item.revenueShare}</div>
                      <div><strong>变异系数：</strong>$CV \in [{item.cvRange}]$</div>
                      <div><strong>周转天数 (DIO)：</strong>{item.inventoryTurnoverDIO}</div>
                    </div>

                    <div className="p-2.5 bg-white/85 rounded border border-[#E1E4E8] text-[11px] space-y-1 text-[#34495E]">
                      <div><strong>推荐运筹模型：</strong>{item.recommendedModel}</div>
                      <div><strong>补货控制机制：</strong>{item.replenishmentPolicy}</div>
                      <div><strong>安全库存配置：</strong>{item.safetyStockLevel}</div>
                      <div><strong>盘点审计频次：</strong>{item.auditFrequency}</div>
                    </div>

                    <div className="text-[11px] text-red-700 bg-red-50/80 p-2 rounded border border-red-200">
                      <strong>⚠️ 核心风险：</strong>{item.keyRisk}
                    </div>

                    <div className="text-[11px] text-emerald-800 bg-emerald-50/80 p-2 rounded border border-emerald-200">
                      <strong>💡 落地最佳实践：</strong>{item.bestPractice}
                    </div>
                  </div>

                  {onNavigateToModule && (
                    <button
                      onClick={() => onNavigateToModule("decision_3d")}
                      className="w-full py-1.5 bg-[#2980B9] hover:bg-[#3498DB] text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer mt-2"
                    >
                      <span>在指挥舱调优 {item.code} 策略参数</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OR Formula Cheat Sheet & Reference Lexicon */}
      {activeTab === "formulas" && (
        <div className="bg-white rounded-lg p-5 sm:p-6 border border-[#E1E4E8] shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E1E4E8]">
            <div className="flex items-center gap-2">
              <Sigma className="w-4 h-4 text-[#2980B9]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C3E50]">
                运筹学经典存储模型公式速查字典 ({filteredFormulas.length} 个核心公式)
              </h3>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#95A5A6]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索模型名 / 公式 / 假设..."
                  className="pl-8 pr-3 py-1 text-xs bg-[#F8F9FA] rounded border border-[#E1E4E8] text-[#2C3E50] focus:outline-none focus:ring-1 focus:ring-[#2980B9]"
                />
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-2.5 py-1 text-xs bg-[#F8F9FA] rounded border border-[#E1E4E8] text-[#2C3E50] focus:outline-none focus:ring-1 focus:ring-[#2980B9]"
              >
                <option value="all">全部分类</option>
                <option value="deterministic">确定型模型族</option>
                <option value="stochastic">随机型模型族</option>
                <option value="multi_sku">多 SKU 品类矩阵</option>
              </select>
            </div>
          </div>

          {/* Formula Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFormulas.map((card) => (
              <div
                key={card.id}
                className="p-4 bg-[#FAFBFC] rounded-lg border border-[#E1E4E8] flex flex-col justify-between space-y-3 hover:border-[#2980B9] transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-[#2C3E50]">{card.name}</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-[#2980B9] rounded text-[10px] font-bold border border-blue-200">
                      {card.categoryLabel}
                    </span>
                  </div>

                  {/* Math Formula Highlight Box */}
                  <div className="p-3 bg-white rounded border border-[#E1E4E8] text-center font-mono font-bold text-xs text-[#2C3E50] shadow-2xs">
                    {card.formula}
                  </div>

                  {/* Variables */}
                  <div className="text-[11px] text-[#7F8C8D] space-y-1">
                    <div className="font-bold text-[#2C3E50]">变量定义与量纲：</div>
                    <ul className="list-disc list-inside space-y-0.5 text-[#34495E]">
                      {card.variables.map((v, vIdx) => (
                        <li key={vIdx}>
                          <strong className="font-mono text-[#2980B9]">{v.sym}</strong>: {v.name} ({v.unit})
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Assumptions */}
                  <div className="text-[11px] text-[#7F8C8D] space-y-0.5">
                    <div className="font-bold text-[#2C3E50]">核心理论假设：</div>
                    <p className="text-[#64748B]">{card.assumptions.join(" · ")}</p>
                  </div>

                  {/* Caveats */}
                  <div className="p-2 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                    <strong>💡 运筹洞察：</strong> {card.caveats}
                  </div>
                </div>

                {onNavigateToModule && (
                  <button
                    onClick={() => onNavigateToModule(card.targetModule)}
                    className="w-full py-1.5 border border-[#2980B9] text-[#2980B9] hover:bg-[#2980B9] hover:text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>跳转至对应测算模块</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Four Practical Pitfalls & Supply Chain Heuristics */}
      {activeTab === "pitfalls" && (
        <div className="bg-white rounded-lg p-5 sm:p-6 border border-[#E1E4E8] shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E1E4E8]">
            <AlertTriangle className="w-4 h-4 text-[#E67E22]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C3E50]">
              企业供应链库存控制实战四大避坑指南 (Operations Research Pitfalls)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PITFALL_RULES.map((rule, idx) => (
              <div
                key={idx}
                className="p-4 bg-[#F8F9FA] rounded-lg border border-[#E1E4E8] space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-[#2C3E50]">{rule.title}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${rule.badgeColor}`}>
                    {rule.level}
                  </span>
                </div>

                <p className="text-xs font-medium text-[#2C3E50] bg-white p-2.5 rounded border border-[#E1E4E8]">
                  {rule.summary}
                </p>

                <p className="text-xs text-[#7F8C8D] leading-relaxed">
                  {rule.detail}
                </p>
              </div>
            ))}
          </div>

          {/* Golden Rules Summary Box */}
          <div className="p-4 bg-[#34495E] rounded-lg text-white space-y-2">
            <div className="text-xs font-bold flex items-center gap-1.5 text-amber-300">
              <Sparkles className="w-4 h-4" />
              <span>运筹控制黄金法则 (The Golden Rules of Inventory OR)</span>
            </div>
            <ul className="text-xs text-[#BDC3C7] space-y-1 list-disc list-inside">
              <li><strong>法则一：</strong>稳定交期方差（压缩 σ_L）的降本效果，通常高于单纯向供应商压价 3%。</li>
              <li><strong>法则二：</strong>永远对高价值核心品（A类）采取连续精细盘点，对低值紧固耗材（C类）使用双箱粗放管理。</li>
              <li><strong>法则三：</strong>易腐短生命周期品用报童边际利润临界比求解，切忌使用确定型 EOQ 盲目加总。</li>
              <li><strong>法则四：</strong>多 SKU 组合中警惕 CZ 类长尾呆滞累积，每年必须至少开展一次死库存报废与清仓核销。</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
