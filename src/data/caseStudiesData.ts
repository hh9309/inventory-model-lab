import { CaseStudyItem } from "../types/inventory";

export const CASE_STUDIES: CaseStudyItem[] = [
  {
    id: "case-supermarket-eoq",
    title: "超市快消标品常规补货决策",
    category: "经典 EOQ 经济订货批量",
    iconName: "ShoppingCart",
    badge: "快消零售 / 基础稳态",
    summary: "大型商超连锁主力洗发水标品，利用经典 EOQ 平衡单次物流运杂费与仓库持有资金占用。",
    story:
      "某大型连锁超市在华东中心仓常备某品牌主力洗发水（SKU: SHP-800ML）。经历史销售数据分析，年稳定需求量为 12,000 瓶；每次向日化厂家下达订货单时，产生的固定物流干线运费、质检交接与单据处理费合计为 200 元/次；单瓶洗发水采购单价为 25 元，包括资金利息占用、仓储库位租金与防盗防损的年综合持有成本折算为 3.0 元/瓶/年。超市希望确定最优单次采购批量与全年的补货节奏，并在面对运费上涨时评估成本灵敏度。",
    modelType: "classic_eoq",
    parameters: {
      D: 12000,
      K: 200,
      h: 3.0,
      c: 25,
    },
    keyFormulas: [
      "Q^* = \\sqrt{\\frac{2DK}{h}} = \\sqrt{\\frac{2 \\times 12000 \\times 200}{3}} = 1264.91 \\approx 1265 \\text{ 瓶}",
      "TC^* = \\sqrt{2DKh} + cD = \\sqrt{2 \\times 12000 \\times 200 \\times 3} + 25 \\times 12000 = 3,794.73 + 300,000 = 303,795 \\text{ 元}",
      "T^* = \\frac{Q^*}{D} \\times 365 = \\frac{1265}{12000} \\times 365 \\approx 38.5 \\text{ 天 (年订货约 9.5 次)}",
    ],
    takeaways: [
      "经典 EOQ 的最优点恰好落在年订货成本曲线与年持有成本曲线的交点，两者均等于 1,897 元。",
      "由于 EOQ 总成本曲线在最小值附近具有著名的『方根平坦性 (Square Root Flatness)』，订货量偏差 ±20% 时，总变动成本仅上升不到 1.7%，为实际供应链整数托盘打包（如每托 300 瓶，取 1200 或 1500 瓶）留出充裕容错空间。",
    ],
    explanation:
      "超市采购决策中，不可盲目追求『少批量高频次』或『大批量压货』。EOQ 提供了边际平衡的量化标尺，为托盘整进整出提供数学底座。",
  },
  {
    id: "case-fresh-seafood-newsvendor",
    title: "生鲜海鲜易腐品日配决策",
    category: "单周期报童模型 (Newsvendor)",
    iconName: "Fish",
    badge: "生鲜零售 / 易腐残值",
    summary: "进口冰鲜三文鱼每日进货量决策，运用临界比率 (Critical Fractile) 平衡断货毛利损失与次日变质折价。",
    story:
      "生鲜超市每日清晨从海鲜批发集散地采购挪威冰鲜三文鱼段。由于生鲜保质期极短（仅限当日刺身级售卖），进货进价为 45 元/kg，白日正常零售定价为 90 元/kg。若当日营业结束（21:00）未售完，剩余三文鱼只能作为熟食煎烤原料以 20 元/kg 的残值打包清仓处理。经测算，每日顾客随机购买量服从正态分布，平均需求为 100 kg，标准差为 25 kg。店长需要决定每天清晨的最佳备货斤两以最大化期望日收益。",
    modelType: "newsvendor",
    parameters: {
      retailPrice: 90,
      costPrice: 45,
      salvageValue: 20,
      meanDemand: 100,
      stdDemand: 25,
      distribution: "normal",
    },
    keyFormulas: [
      "C_u = p - c = 90 - 45 = 45 \\text{ 元/kg (缺货少赚边际利润)}",
      "C_o = c - v = 45 - 20 = 25 \\text{ 元/kg (多进滞销边际亏损)}",
      "CR^* = \\frac{C_u}{C_u + C_o} = \\frac{45}{45 + 25} = \\frac{45}{70} \\approx 0.6429 \\; (64.29\\%)",
      "z^* = \\Phi^{-1}(0.6429) \\approx 0.366 \\implies Q^* = \\mu + z^* \\cdot \\sigma = 100 + 0.366 \\times 25 \\approx 109.15 \\text{ kg}",
    ],
    takeaways: [
      "因为毛利比残值损失更丰厚 (45 > 25)，最优备货量应当大于平均需求 100 kg（高出约 9.2 kg 作为安全垫）。",
      "若盲目按照平均值 100 kg 备货，将损失高需求日期的可观暴利；若盲目备货 130 kg，则会导致大量滞销打折拖垮整体单店盈利。",
    ],
    explanation:
      "报童模型揭示了短生命周期商品（时效报刊、生鲜、鲜花、快时尚）的核心逻辑：决策量完全由『缺货成本』与『滞销成本』的相对强弱决定。",
  },
  {
    id: "case-auto-parts-epq",
    title: "汽配工厂刹车片 JIT 经济生产批量",
    category: "生产批量模型 (EPQ)",
    iconName: "Cog",
    badge: "智能制造 / 边产边销",
    summary: "汽车零部件总装线考虑内部冲压换模与边生产边消耗机制，推导最优生产批次与最高库存水位。",
    story:
      "某汽车制动系统制造工厂为主机厂配套生产陶瓷刹车片总成。该刹车片全年在装配车间的年需求量为 20,000 套；由于冲压与热压成型车间产能充沛，日生产速率为 150 套/天（按年 250 个工作日换算年生产能力 P = 37,500 套/年），日均装配消耗需求为 80 套/天。由于每次调整冲压模具、清洁加热炉和调机试切的固定换产成本为 500 元/次，每套刹车片在成品库的年仓储费为 5.0 元。厂长希望优化单次开机生产批量，降低在制品与成品库存。",
    modelType: "epq",
    parameters: {
      D: 20000,
      K: 500,
      h: 5.0,
      P: 37500,
      c: 120,
    },
    keyFormulas: [
      "1 - \\frac{D}{P} = 1 - \\frac{20000}{37500} = 1 - 0.5333 = 0.4667",
      "Q_{EPQ}^* = \\sqrt{\\frac{2DK}{h(1 - D/P)}} = \\sqrt{\\frac{2 \\times 20000 \\times 500}{5 \\times 0.4667}} = 2927.7 \\approx 2928 \\text{ 套}",
      "I_{max} = Q^*(1 - D/P) = 2928 \\times 0.4667 \\approx 1,366.5 \\text{ 套 (远低于经典 EOQ 的 2000 套峰值)}",
      "t_p = \\frac{Q^*}{P} = \\frac{2928}{150} \\approx 19.5 \\text{ 生产天数} \\; ; \\; t_{cycle} = \\frac{2928}{80} \\approx 36.6 \\text{ 天}",
    ],
    takeaways: [
      "因为生产过程中同时在被下游装配线领用消耗，库房实际积压的最高库存仅为生产批量的 46.7%，显著缓释了仓库库容与资金压力。",
      "EPQ 相比外购 EOQ，最优生产批量由 2000 放大至 2928，因为边产边销降低了实际持有成本。",
    ],
    explanation:
      "EPQ 是精益生产 (Lean) 与丰田生产方式 (TPS) 计算看板经济换模批量 (SMED) 的核心运筹依据。",
  },
  {
    id: "case-pharma-hospital-ss",
    title: "三甲医院关键抢救药品安全库存配置",
    category: "多周期随机模型与安全库存 (SS / ROP)",
    iconName: "ShieldAlert",
    badge: "医疗急救 / 高服务水平",
    summary: "关键救命急救针剂面对需求与送达提前期双重随机波动，设定 98% 服务水平与动态再订货点。",
    story:
      "某省重点三甲医院药剂科负责管理关键心血管急救注射液。该注射液月均急诊消耗量为 500 盒，月消耗标准差为 80 盒；医药分销商从外地冷链干线发货，平均提前期为 0.5 个月（约 15 天），且由于极端天气和冷链温控质检，提前期本身存在标准差 0.1 个月。医院药事委员会规定：该品种作为重点抢救用药，必须确保不低于 98% 的周期服务水平（Cycle Service Level α = 98%）。药剂科主任需要确定安全库存 (SS) 与触发采购的再订货点 (ROP)。",
    modelType: "safety_stock_rop",
    parameters: {
      demandMean: 500,
      demandStd: 80,
      leadTimeMean: 0.5,
      leadTimeStd: 0.1,
      alpha: 0.98,
      K: 150,
      h: 12,
    },
    keyFormulas: [
      "\\mu_L = \\bar{d} \\times L = 500 \\times 0.5 = 250 \\text{ 盒 (提前期期望消耗)}",
      "\\sigma_L = \\sqrt{L \\cdot \\sigma_d^2 + \\bar{d}^2 \\cdot \\sigma_L^2} = \\sqrt{0.5 \\times 80^2 + 500^2 \\times 0.1^2} = \\sqrt{3200 + 2500} = 75.5 \\text{ 盒}",
      "z_{0.98} = \\Phi^{-1}(0.98) \\approx 2.054",
      "SS = z_{0.98} \\times \\sigma_L = 2.054 \\times 75.5 \\approx 155 \\text{ 盒}",
      "ROP = \\mu_L + SS = 250 + 155 = 405 \\text{ 盒 (当药房盘存降至 405 盒时立即报单)}",
    ],
    takeaways: [
      "提前期的波动（$\\sigma_L = 0.1$ 月）贡献了方差的一半以上（2500 vs 3200），说明『缩短并稳定供应商交期』比单纯做精准需求预测更能大幅压降安全库存。",
      "安全系数从 90% (z=1.28) 提升至 98% (z=2.05)，安全库存从 96 盒激增至 155 盒，体现了服务水平边际成本递增效应。",
    ],
    explanation:
      "在医疗、航天军工等对断供零容忍的场景中，安全库存是防范生命危险与停工损失的不可替代防线。",
  },
  {
    id: "case-ecommerce-continuous-review",
    title: "电商 3C 数码全自动 (s, Q) 连续盘点调度",
    category: "连续盘点 (s, Q) 策略",
    iconName: "Cpu",
    badge: "智慧仓配 / 自动化触发",
    summary: "智能仓储机器人自动追踪智能手表库存地位 (IP)，实时扣减并触发固定批次补货指令。",
    story:
      "某主流电商自营数码仓存放一款热销智能运动手表。WMS 仓储系统配备 RFID 实时过闸扫描与自动化立体库。该手表日均销量为 30 台，服从泊松随机波动；从代工厂保税仓集货调拨的提前期稳定在 3 天；单次发起调拨调车的干线成本为 400 元，每台手表年仓储与资金占用费为 80 元（折合 0.22 元/天）。若因缺货导致订单取消，按平台协议需赔付消费者 50 元/台代金券并承担商誉损失。系统需要设定最优连续盘点触发线 s 与每次采购批量 Q。",
    modelType: "continuous_s_q",
    parameters: {
      dailyDemand: 30,
      leadTime: 3,
      orderCost: 400,
      holdingCostAnnual: 80,
      stockoutPenalty: 50,
    },
    keyFormulas: [
      "D_{annual} = 30 \\times 365 = 10,950 \\text{ 台}",
      "Q^* = \\sqrt{\\frac{2 \\times 10950 \\times 400}{80}} = 330.9 \\approx 331 \\text{ 台}",
      "\\mu_L = 30 \\times 3 = 90 \\text{ 台} \\; ; \\; \\sigma_L = \\sqrt{3 \\times 30} = 9.49 \\text{ 台 (泊松性质)}",
      "s = \\mu_L + z_{0.99} \\cdot \\sigma_L = 90 + 2.33 \\times 9.49 \\approx 112 \\text{ 台}",
    ],
    takeaways: [
      "WMS 系统在每个订单出库时实时更新『库存地位 = 现存库存 + 在途订单 - 已分配未发订单』，一旦地位低于 112 台，系统瞬时下发 331 台采购订单。",
      "由于是连续扫描监测，相比按周盘点能减少『盘点滞后暴露期』，以更少的安全库存实现更高的订单满足率。",
    ],
    explanation:
      "这是现代敏捷供应链与高度自动化 WMS/ERP（如 SAP、京东物流）中最常用的核心控制逻辑。",
  },
  {
    id: "case-oil-depot-periodic-sS",
    title: "大型石化油库储罐 (T, s, S) 定期调度与防溢防断",
    category: "定期盘点 (T, s, S) 水位策略",
    iconName: "Flame",
    badge: "大宗能源 / 罐区安全",
    summary: "5000吨级汽油储罐每周检尺盘点，基于目标充满水位 S 与报警下限 s 执行管道泵送补货。",
    story:
      "某区域国家战略与商业混合成品油油库拥有一座 5,000 吨级大型地上拱顶汽油储罐。由于石化调度安全规范与长输管道排班限制，油库调度室固定每 7 天（T = 7天）对油罐进行一次综合检尺与水杂化验盘点。长输管道从炼油厂泵送打油的在途时滞为 2 天。油库规定安全警戒下限为 s = 1,200 吨（防范加油站断油与罐底死油抽取），目标充满上限为 S = 4,800 吨（预留 200 吨防气温膨胀溢罐安全气囊）。调度员每次盘点若油量低于 1,200 吨，即刻申请充满至 4,800 吨。",
    modelType: "periodic_t_s_S",
    parameters: {
      tankMax: 5000,
      reviewT: 7,
      sThreshold: 1200,
      STarget: 4800,
      leadTime: 2,
      dailyDrainAvg: 220,
    },
    keyFormulas: [
      "\\text{防护暴露期} = T + L = 7 + 2 = 9 \\text{ 天}",
      "\\text{暴露期期望消耗} = 220 \\text{ 吨/天} \\times 9 \\text{ 天} = 1,980 \\text{ 吨}",
      "\\text{触发条件}: \\text{若第 } k \\text{ 个周期末净库存 } I_k \\le 1,200 \\text{ 吨，则订货 } Q_k = 4,800 - (I_k + \\text{在途})",
      "\\text{若 } I_k > 1,200 \\text{ 吨，则本周不启动昂贵的长输管道开泵流程，节省管道启停固定费。}",
    ],
    takeaways: [
      "双阈值 (s, S) 巧妙利用了『(S - s)』的缓冲间隙，避免了每周为了微小差额频繁启动管道泵送产生的巨额固定开机费与管损。",
      "直观上就如水箱浮球阀：小幅水位波动不触发进水，一旦跌破阈值则一次性充盈至额定上限。",
    ],
    explanation:
      "这是运筹学中求解带固定交易成本的随机动态规划（Scarf 定理）在能源与大宗散货储运中最经典的物理实现。",
  },
];
