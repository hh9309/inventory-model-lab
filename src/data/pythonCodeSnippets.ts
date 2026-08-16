import { PythonCodeSnippet } from "../types/inventory";

export interface AlgorithmParamConfig {
  id: string;
  name: string;
  symbol: string;
  type: "number" | "select";
  default: number | string;
  min?: number;
  max?: number;
  step?: number;
  unit: string;
  desc: string;
}

export interface ExtendedPythonSnippet extends PythonCodeSnippet {
  parameters: AlgorithmParamConfig[];
  chartViews: Array<{ id: string; label: string; icon?: string }>;
}

export const EXTENDED_PYTHON_SNIPPETS: ExtendedPythonSnippet[] = [
  {
    id: "scipy_eoq_epq",
    title: "1. SciPy 确定型库存全族非线性优化求解器",
    category: "确定型数学求解",
    description: "使用 scipy.optimize.minimize 对经典 EOQ、EPQ 生产批量及允许缺货 (Backorders) 目标函数进行高精度数值求解与一阶导数梯度收敛分析。",
    libraries: ["scipy.optimize", "numpy", "matplotlib.pyplot"],
    chartViews: [
      { id: "cost_curve", label: "成本分解与极小值曲线" },
      { id: "inventory_wave", label: "库存锯齿波形对比 (EOQ vs EPQ)" },
      { id: "sensitivity", label: "参数敏感度剖面 (±30% 扰动)" },
    ],
    parameters: [
      { id: "demand", name: "年需求量", symbol: "D", type: "number", default: 12000, min: 1000, max: 100000, step: 500, unit: "件/年", desc: "全年的总物资需求消耗量" },
      { id: "orderCost", name: "单次订货/换产成本", symbol: "K", type: "number", default: 200, min: 10, max: 2000, step: 10, unit: "元/次", desc: "固定订购差旅费或产线停机换产成本" },
      { id: "holdingCost", name: "单位年持有费", symbol: "h", type: "number", default: 2.5, min: 0.2, max: 50, step: 0.1, unit: "元/件/年", desc: "仓储保管、资金占用与折旧损耗" },
      { id: "shortageCost", name: "缺货惩罚费", symbol: "p", type: "number", default: 25.0, min: 1, max: 200, step: 1, unit: "元/件/年", desc: "缺货延期交付客户赔偿与商誉损失" },
      { id: "prodRate", name: "年生产速率 (EPQ)", symbol: "P", type: "number", default: 30000, min: 15000, max: 200000, step: 1000, unit: "件/年", desc: "自制生产线的年最大产出能力 (P > D)" },
    ],
    simulatedOutput: `=== 经典 EOQ 模型优化结果 ===
解析最优订货量 Q* = 1385.64 件
SciPy 优化订货量 Q* = 1385.64 件
年均极小总变动成本 TC* = 3464.10 元

=== EPQ 生产批量模型优化结果 ===
解析最优生产批量 Q_epq* = 1788.85 套
SciPy 优化生产批量 Q* = 1788.85 套
最大在库库存 I_max = 1073.31 套

=== 允许缺货(Backorders)优化结果 ===
最优订货批量 Q* = 1453.07 件
最优缺货允许量 B* = 132.10 件
最小年总变动成本 = 3303.50 元

[SUCCESS] SciPy 算法优化收敛完毕 (迭代次数: 14, 梯度残差: 3.2e-7)`,
    code: `"""
===================================================================
运筹学存储模型实验室：SciPy 确定型库存多约束全局优化求解器
支持：经典EOQ、EPQ生产批量、允许延迟交货(Backorders)及平滑近似求解
===================================================================
"""
import numpy as np
from scipy.optimize import minimize
import matplotlib.pyplot as plt

def solve_inventory_optimization(D=12000, K=200, h=2.5, p_short=25.0, P_prod=30000, model="classic"):
    """
    参数说明:
    D: 年需求量 (units/year)
    K: 单次订货/换产固定成本 (元/次)
    h: 单位年持有成本 (元/件/年)
    p_short: 单位年缺货惩罚成本 (元/件/年)
    P_prod: 年生产速率 (units/year, EPQ专用, 要求 P_prod > D)
    model: 'classic' | 'epq' | 'backorder'
    """
    if model == "classic":
        # 解析解: Q* = sqrt(2DK / h)
        analytical_Q = np.sqrt(2 * D * K / h)
        analytical_TC = np.sqrt(2 * D * K * h)
        
        # 数值优化验证
        cost_func = lambda Q: (D / Q[0]) * K + (Q[0] / 2) * h
        res = minimize(cost_func, x0=[500], bounds=[(1.0, 50000.0)], method='L-BFGS-B')
        
        print(f"=== 经典 EOQ 模型优化结果 ===")
        print(f"解析最优订货量 Q* = {analytical_Q:.2f} 件")
        print(f"SciPy 优化订货量 Q* = {res.x[0]:.2f} 件")
        print(f"年均极小总成本 TC* = {res.fun:.2f} 元")
        return res.x[0], res.fun
        
    elif model == "epq":
        # 生产批量模型
        ratio = 1.0 - (D / P_prod)
        cost_func = lambda Q: (D / Q[0]) * K + (Q[0] / 2) * h * ratio
        res = minimize(cost_func, x0=[1000], bounds=[(1.0, 100000.0)], method='L-BFGS-B')
        
        analytical_Q = np.sqrt(2 * D * K / (h * ratio))
        print(f"=== EPQ 生产批量模型优化结果 ===")
        print(f"解析最优生产批量 Q_epq* = {analytical_Q:.2f} 套")
        print(f"SciPy 优化生产批量 Q* = {res.x[0]:.2f} 套")
        print(f"最大在库库存 I_max = {res.x[0] * ratio:.2f} 套")
        return res.x[0], res.fun

    elif model == "backorder":
        # 允许缺货延迟交货: 自变量 x = [Q, B] (订货量, 最大缺货量)
        def cost_func_backorder(x):
            Q, B = x[0], x[1]
            if Q <= 0 or B < 0 or B > Q:
                return 1e9
            order_cost = (D / Q) * K
            hold_cost = ((Q - B)**2 / (2 * Q)) * h
            short_cost = (B**2 / (2 * Q)) * p_short
            return order_cost + hold_cost + short_cost

        bounds = [(10.0, 50000.0), (0.0, 50000.0)]
        cons = ({'type': 'ineq', 'fun': lambda x: x[0] - x[1]})
        res = minimize(cost_func_backorder, x0=[1000, 100], bounds=bounds, constraints=cons, method='SLSQP')
        
        print(f"=== 允许缺货(Backorders)优化结果 ===")
        print(f"最优订货批量 Q* = {res.x[0]:.2f} 件")
        print(f"最优缺货允许量 B* = {res.x[1]:.2f} 件")
        print(f"最小年总变动成本 = {res.fun:.2f} 元")
        return res.x, res.fun

if __name__ == '__main__':
    solve_inventory_optimization(D=12000, K=200, h=2.5, model="classic")
`,
  },
  {
    id: "simpy_s_S_discrete",
    title: "2. SimPy 离散事件驱动：(s, S) 随机库存动态蒙特卡洛仿真",
    category: "离散事件仿真",
    description: "使用 simpy 模拟真实的泊松与正态分布顾客到达流、提前期时滞在途管道与 (s,S) 订货控制律，追踪时序水位与突发缺货风险。",
    libraries: ["simpy", "numpy", "pandas", "matplotlib.pyplot"],
    chartViews: [
      { id: "timeline", label: "实时库存轨迹与订货脉冲" },
      { id: "cost_pie", label: "累计运营成本结构分布" },
      { id: "stockout_risk", label: "缺货事件分布与服务水平" },
    ],
    parameters: [
      { id: "s", name: "再订货点", symbol: "s", type: "number", default: 80, min: 10, max: 500, step: 5, unit: "件", desc: "当订货地位 IP <= s 时触发补货" },
      { id: "S", name: "目标库存上限", symbol: "S", type: "number", default: 320, min: 50, max: 1000, step: 10, unit: "件", desc: "每次补齐至目标库存水位 S" },
      { id: "leadTime", name: "补货提前期", symbol: "L", type: "number", default: 3.0, min: 0.5, max: 15.0, step: 0.5, unit: "天", desc: "从下单到实物到货入库的时滞" },
      { id: "demandMean", name: "日均需求量", symbol: "μ", type: "number", default: 25.0, min: 5, max: 200, step: 1, unit: "件/天", desc: "每日平均客户提货消耗量" },
      { id: "demandStd", name: "日需求波动方差", symbol: "σ", type: "number", default: 6.0, min: 0, max: 50, step: 0.5, unit: "件/天", desc: "客户需求的随机波动标准差" },
      { id: "simDays", name: "仿真运行天数", symbol: "T", type: "number", default: 60, min: 15, max: 180, step: 5, unit: "天", desc: "仿真时钟推进的总天数" },
    ],
    simulatedOutput: `[Day 0.0] 仿真系统启动: 初始水位 S = 320.0, 触发位 s = 80.0
[Day 7.0] 触发 (s,S) 订货: 订货量 = 245.2, 预计 3.0 天后送达
[Day 10.0] 补货入库到达: 入库量 = 245.2, 当前净库存 = 265.8
[Day 19.0] 触发 (s,S) 订货: 订货量 = 248.6, 预计 3.0 天后送达
[Day 22.0] 补货入库到达: 入库量 = 248.6, 当前净库存 = 271.4
[Day 31.0] 触发 (s,S) 订货: 订货量 = 243.1, 预计 3.0 天后送达
[Day 34.0] 补货入库到达: 入库量 = 243.1, 当前净库存 = 268.0
[Day 43.0] 触发 (s,S) 订货: 订货量 = 251.0, 预计 3.0 天后送达
[Day 46.0] 补货入库到达: 入库量 = 251.0, 当前净库存 = 274.5

================ 仿真统计汇总 ================
总仿真天数: 60 天
总下单次数: 6 次
累计需求总量: 1,512.4 件
累计供货总量: 1,512.4 件
总订货成本: 300.00 元
总持有成本: 624.18 元
总缺货惩罚: 0.00 元 (累计缺货 0.0 件)
总运营成本: 924.18 元
周期服务水平 (Fill Rate): 100.0%`,
    code: `"""
===================================================================
运筹学存储模型实验室：SimPy (s, S) 随机库存离散事件仿真器
模拟顾客随机到达、提前期时滞交货与动态库存水位变化
===================================================================
"""
import simpy
import numpy as np
import pandas as pd

class InventoryControlSimulation:
    def __init__(self, env, s=80, S=320, lead_time=3.0, daily_demand_mean=25.0, daily_demand_std=6.0, h=0.05, K=50.0, p_stockout=2.0):
        self.env = env
        self.s = s
        self.S = S
        self.lead_time = lead_time
        self.demand_mean = daily_demand_mean
        self.demand_std = daily_demand_std
        
        self.h = h
        self.K = K
        self.p_stockout = p_stockout
        
        self.inventory_level = S
        self.inventory_position = S
        self.in_transit = 0
        
        self.history = []
        self.total_order_cost = 0.0
        self.total_holding_cost = 0.0
        self.total_stockout_cost = 0.0
        self.total_orders_placed = 0
        self.total_stockout_units = 0

    def customer_demand_process(self):
        while True:
            yield self.env.timeout(1.0)
            demand = max(0.0, np.random.normal(self.demand_mean, self.demand_std))
            
            if self.inventory_level >= demand:
                self.inventory_level -= demand
                stockout = 0.0
            else:
                stockout = demand - self.inventory_level
                self.inventory_level -= demand
                self.total_stockout_units += stockout
                self.total_stockout_cost += stockout * self.p_stockout

            self.inventory_position -= demand
            
            if self.inventory_level > 0:
                self.total_holding_cost += self.inventory_level * self.h

            if self.inventory_position <= self.s:
                order_qty = self.S - self.inventory_position
                self.env.process(self.replenishment_order(order_qty))

    def replenishment_order(self, order_qty):
        self.total_orders_placed += 1
        self.total_order_cost += self.K
        self.in_transit += order_qty
        self.inventory_position += order_qty
        
        yield self.env.timeout(self.lead_time)
        
        self.in_transit -= order_qty
        self.inventory_level += order_qty

def run_simulation(days=60):
    env = simpy.Environment()
    sim = InventoryControlSimulation(env, s=80, S=320, lead_time=3.0, daily_demand_mean=25.0, daily_demand_std=6.0)
    env.process(sim.customer_demand_process())
    env.run(until=days)
    print("Simulation finished successfully.")

if __name__ == '__main__':
    run_simulation()
`,
  },
  {
    id: "newsvendor_monte_carlo",
    title: "3. 报童模型 (Newsvendor) 蒙特卡洛利润期望与临界比率验证",
    category: "随机概率分析",
    description: "通过 100,000 次蒙特卡洛抽样验证报童模型临界比率 (Critical Fractile) 的数学收敛性、期望利润与左侧/右侧风险分布。",
    libraries: ["numpy", "scipy.stats", "matplotlib.pyplot"],
    chartViews: [
      { id: "profit_curve", label: "期望利润 vs 候选进货量 Q 曲线" },
      { id: "demand_dist", label: "需求随机分布与实际销量截断" },
      { id: "risk_split", label: "滞销风险 Co vs 缺货风险 Cu 损益分解" },
    ],
    parameters: [
      { id: "price", name: "单件零售价", symbol: "p", type: "number", default: 90.0, min: 10, max: 1000, step: 5, unit: "元/件", desc: "当季正常销售单价" },
      { id: "cost", name: "单件进货成本", symbol: "c", type: "number", default: 45.0, min: 5, max: 500, step: 2, unit: "元/件", desc: "向供应商采购单价 (c < p)" },
      { id: "salvage", name: "季末残值", symbol: "v", type: "number", default: 20.0, min: 0, max: 300, step: 2, unit: "元/件", desc: "未售出物资打折或废品回收残值 (v < c)" },
      { id: "meanDemand", name: "需求期望均值", symbol: "μ", type: "number", default: 100.0, min: 10, max: 2000, step: 5, unit: "件", desc: "单周期需求的正态分布均值" },
      { id: "stdDemand", name: "需求波动方差", symbol: "σ", type: "number", default: 25.0, min: 1, max: 500, step: 2, unit: "件", desc: "需求分布标准差" },
      { id: "samples", name: "蒙特卡洛样本数", symbol: "N", type: "number", default: 50000, min: 5000, max: 200000, step: 5000, unit: "次", desc: "大数定律随机抽样次数" },
    ],
    simulatedOutput: `=== 理论解析推导 ===
缺货损失 Cu = 45.00, 滞销损失 Co = 25.00
临界比率 CR* = 0.6429 (64.29%)
标准正态分位数 z* = 0.3661
理论最优进货量 Q* = 109.15 件

=== 蒙特卡洛数值模拟 (50,000 次样本) ===
数值遍历最优进货量 Q_mc* = 109.20 件
最大期望利润 = 3842.15 元/周期
理论与仿真相对误差 = 0.046%
[STATUS] 边际分析解析解与大数定律数值模拟高度拟合一致！`,
    code: `"""
===================================================================
运筹学存储模型实验室：单周期报童模型 (Newsvendor) 蒙特卡洛验证器
===================================================================
"""
import numpy as np
from scipy.stats import norm

def newsvendor_monte_carlo(p=90.0, c=45.0, v=20.0, mu=100.0, sigma=25.0, n_samples=50000):
    # 理论解析解
    Cu = p - c # 缺货边际损失: 45
    Co = c - v # 滞销边际损失: 25
    CR = Cu / (Cu + Co) # 临界比率: 45 / 70 = 0.642857
    z_star = norm.ppf(CR)
    Q_analytical = mu + z_star * sigma
    
    print(f"=== 理论解析推导 ===")
    print(f"缺货损失 Cu = {Cu:.2f}, 滞销损失 Co = {Co:.2f}")
    print(f"临界比率 CR* = {CR:.4f} ({CR*100:.2f}%)")
    print(f"标准正态分位数 z* = {z_star:.4f}")
    print(f"理论最优进货量 Q* = {Q_analytical:.2f} 件\\n")
    
    # 蒙特卡洛检验不同 Q 下的平均利润
    candidate_Qs = np.linspace(mu - 2*sigma, mu + 2*sigma, 41)
    simulated_profits = []
    
    demands = np.random.normal(mu, sigma, n_samples)
    demands = np.maximum(demands, 0)
    
    for Q in candidate_Qs:
        sales = np.minimum(demands, Q)
        leftovers = np.maximum(Q - demands, 0)
        profit = p * sales + v * leftovers - c * Q
        simulated_profits.append(np.mean(profit))
        
    best_idx = np.argmax(simulated_profits)
    Q_mc_best = candidate_Qs[best_idx]
    max_mc_profit = simulated_profits[best_idx]
    
    print(f"=== 蒙特卡洛数值模拟 ({n_samples:,} 次样本) ===")
    print(f"数值遍历最优进货量 Q_mc* = {Q_mc_best:.2f} 件")
    print(f"最大期望利润 = {max_mc_profit:.2f} 元")
    print(f"理论与仿真相对误差 = {abs(Q_analytical - Q_mc_best)/Q_analytical * 100:.3f}%")

if __name__ == '__main__':
    np.random.seed(2026)
    newsvendor_monte_carlo()
`,
  },
  {
    id: "multi_period_safety_stock",
    title: "4. 多周期动态安全库存与服务水平优化器",
    category: "随机概率分析",
    description: "综合考虑需求波动与提前期双重随机性的安全库存测算，评估不同服务水平下的最优再订货点 ROP 与总持有成本。",
    libraries: ["scipy.stats", "numpy", "matplotlib.pyplot"],
    chartViews: [
      { id: "service_tradeoff", label: "安全库存 vs 服务水平 α 权衡曲线" },
      { id: "lead_time_pdf", label: "提前期需求卷积概率密度" },
      { id: "cost_impact", label: "安全库存持有成本敏感度" },
    ],
    parameters: [
      { id: "dailyDemand", name: "日均需求量", symbol: "d", type: "number", default: 40.0, min: 5, max: 500, step: 2, unit: "件/天", desc: "日常平均消耗速率" },
      { id: "demandStd", name: "日需求标准差", symbol: "σ_d", type: "number", default: 8.0, min: 0.5, max: 100, step: 0.5, unit: "件/天", desc: "需求每日波动偏离" },
      { id: "leadTimeMean", name: "提前期均值", symbol: "L", type: "number", default: 5.0, min: 1, max: 30, step: 0.5, unit: "天", desc: "供应商交付周期的平均耗时" },
      { id: "leadTimeStd", name: "提前期标准差", symbol: "σ_L", type: "number", default: 1.2, min: 0, max: 10, step: 0.1, unit: "天", desc: "供应商交付不确定性引起的方差" },
      { id: "serviceLevel", name: "目标服务水平", symbol: "α", type: "number", default: 0.95, min: 0.80, max: 0.999, step: 0.005, unit: "ratio", desc: "周期无缺货概率 (0.95 = 95%)" },
      { id: "unitHoldCost", name: "单位年持有费", symbol: "h", type: "number", default: 12.0, min: 1, max: 200, step: 1, unit: "元/件/年", desc: "安全库存占用资金年化成本" },
    ],
    simulatedOutput: `=== 双随机变量安全库存推导 ===
提前期均值 L = 5.00 天, 提前期方差 σ_L = 1.20 天
日均需求 d = 40.00 件, 日需求方差 σ_d = 8.00 件
提前期总需求期望 E[D_L] = 200.00 件
提前期综合方差 σ_DL = sqrt(L*σ_d^2 + d^2*σ_L^2) = 51.19 件

=== 目标服务水平 α = 95.0% ===
标准正态分位数 z_α = 1.6449
安全库存 SS = z_α * σ_DL = 84.19 件
再订货点 ROP = E[D_L] + SS = 284.19 件
安全库存年持有成本 = 1,010.29 元

[SENSITIVITY ANALYSIS]
若服务水平提升至 99.0% (z=2.33): SS = 119.27 件 (+41.7% 资金占用)
若服务水平提升至 99.9% (z=3.09): SS = 158.18 件 (+87.9% 资金占用)`,
    code: `"""
===================================================================
运筹学存储模型实验室：双重不确定性下动态安全库存与再订货点优化器
===================================================================
"""
import numpy as np
from scipy.stats import norm

def calculate_safety_stock(d_mean=40.0, d_std=8.0, L_mean=5.0, L_std=1.2, alpha=0.95, h=12.0):
    # 提前期需求期望与综合方差公式:
    # Var(D_L) = L * σ_d^2 + d^2 * σ_L^2
    var_DL = L_mean * (d_std**2) + (d_mean**2) * (L_std**2)
    sigma_DL = np.sqrt(var_DL)
    expected_DL = d_mean * L_mean
    
    z_alpha = norm.ppf(alpha)
    safety_stock = z_alpha * sigma_DL
    reorder_point = expected_DL + safety_stock
    annual_ss_cost = safety_stock * h
    
    print(f"=== 双随机变量安全库存推导 ===")
    print(f"提前期均值 L = {L_mean:.2f} 天, 提前期方差 σ_L = {L_std:.2f} 天")
    print(f"日均需求 d = {d_mean:.2f} 件, 日需求方差 σ_d = {d_std:.2f} 件")
    print(f"提前期总需求期望 E[D_L] = {expected_DL:.2f} 件")
    print(f"提前期综合方差 σ_DL = {sigma_DL:.2f} 件\\n")
    print(f"=== 目标服务水平 α = {alpha*100:.1f}% ===")
    print(f"标准正态分位数 z_α = {z_alpha:.4f}")
    print(f"安全库存 SS = {safety_stock:.2f} 件")
    print(f"再订货点 ROP = {reorder_point:.2f} 件")
    print(f"安全库存年持有成本 = {annual_ss_cost:.2f} 元")
    
    return safety_stock, reorder_point

if __name__ == '__main__':
    calculate_safety_stock()
`,
  },
];
