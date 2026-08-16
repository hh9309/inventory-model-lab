// Mathematical helpers and statistical normal distribution functions

// Approximation of standard normal cumulative distribution function Φ(x)
export function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014337 * Math.exp((-x * x) / 2);
  const prob =
    d *
    t *
    (0.31938153 +
      t *
        (-0.356563782 +
          t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x > 0 ? 1 - prob : prob;
}

// Approximation of standard normal inverse cumulative distribution function Φ^(-1)(p)
export function normalInvCDF(p: number): number {
  if (p <= 0) return -4;
  if (p >= 1) return 4;
  if (p === 0.5) return 0;

  // Rational approximation by Acklam
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239e0,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0,
    -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0,
    3.754408661907416e0,
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number, r: number;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  } else if (p <= pHigh) {
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

// Standard normal probability density function φ(x)
export function normalPDF(x: number): number {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

// Standard normal unit loss function L(z) = φ(z) - z * (1 - Φ(z))
export function unitNormalLoss(z: number): number {
  return normalPDF(z) - z * (1 - normalCDF(z));
}

// 1. Classic EOQ Calculation
export function calculateClassicEOQ(D: number, K: number, h: number, c: number = 0) {
  if (D <= 0 || K <= 0 || h <= 0) {
    return { optimalQ: 0, totalCost: 0, orderCost: 0, holdingCost: 0, purchaseCost: 0, cycleTimeYears: 0, cycleTimeDays: 0, ordersPerYear: 0 };
  }
  const optimalQ = Math.sqrt((2 * D * K) / h);
  const orderCost = (D / optimalQ) * K;
  const holdingCost = (optimalQ / 2) * h;
  const purchaseCost = D * c;
  const totalCost = orderCost + holdingCost + purchaseCost;
  const ordersPerYear = D / optimalQ;
  const cycleTimeYears = optimalQ / D;
  const cycleTimeDays = cycleTimeYears * 365;

  return {
    optimalQ,
    orderCost,
    holdingCost,
    purchaseCost,
    totalCost,
    ordersPerYear,
    cycleTimeYears,
    cycleTimeDays,
  };
}

// 2. EPQ (Economic Production Quantity)
export function calculateEPQ(D: number, K: number, h: number, P: number, c: number = 0) {
  if (D <= 0 || K <= 0 || h <= 0 || P <= D) {
    return null;
  }
  const ratio = 1 - D / P;
  const optimalQ = Math.sqrt((2 * D * K) / (h * ratio));
  const maxInventory = optimalQ * ratio;
  const avgInventory = maxInventory / 2;
  const orderCost = (D / optimalQ) * K;
  const holdingCost = avgInventory * h;
  const purchaseCost = D * c;
  const totalCost = orderCost + holdingCost + purchaseCost;
  const productionRunDays = (optimalQ / P) * 365;
  const cycleDays = (optimalQ / D) * 365;

  return {
    optimalQ,
    maxInventory,
    avgInventory,
    orderCost,
    holdingCost,
    purchaseCost,
    totalCost,
    productionRunDays,
    cycleDays,
    ratio,
  };
}

// 3. Planned Shortage / Backorder Model
export function calculateShortageEOQ(D: number, K: number, h: number, p: number, c: number = 0) {
  if (D <= 0 || K <= 0 || h <= 0 || p <= 0) {
    return null;
  }
  const factor = (p + h) / p;
  const optimalQ = Math.sqrt(((2 * D * K) / h) * factor);
  const maxBackorderB = optimalQ * (h / (p + h));
  const maxPositiveInventoryS = optimalQ - maxBackorderB;
  const avgHoldingInventory = Math.pow(maxPositiveInventoryS, 2) / (2 * optimalQ);
  const avgBackorder = Math.pow(maxBackorderB, 2) / (2 * optimalQ);
  const orderCost = (D / optimalQ) * K;
  const holdingCost = avgHoldingInventory * h;
  const shortageCost = avgBackorder * p;
  const purchaseCost = D * c;
  const totalCost = orderCost + holdingCost + shortageCost + purchaseCost;

  return {
    optimalQ,
    maxBackorderB,
    maxPositiveInventoryS,
    avgHoldingInventory,
    avgBackorder,
    orderCost,
    holdingCost,
    shortageCost,
    purchaseCost,
    totalCost,
    backorderFraction: maxBackorderB / optimalQ,
  };
}

// 4. Quantity Discount Model
export interface DiscountTier {
  minQty: number;
  maxQty: number;
  price: number;
}

export function calculateQuantityDiscount(
  D: number,
  K: number,
  hRateOrFixed: number, // holding cost rate (e.g. 0.2 of price) or fixed holding
  isHoldingPercentage: boolean,
  tiers: DiscountTier[]
) {
  const evaluatedTiers = tiers.map((tier, index) => {
    const h = isHoldingPercentage ? hRateOrFixed * tier.price : hRateOrFixed;
    const unconstrainedQ = Math.sqrt((2 * D * K) / h);
    let feasibleQ = unconstrainedQ;
    let isAdjusted = false;

    if (unconstrainedQ < tier.minQty) {
      feasibleQ = tier.minQty;
      isAdjusted = true;
    } else if (unconstrainedQ > tier.maxQty) {
      feasibleQ = tier.maxQty;
      isAdjusted = true;
    }

    const orderCost = (D / feasibleQ) * K;
    const holdingCost = (feasibleQ / 2) * h;
    const purchaseCost = D * tier.price;
    const totalCost = orderCost + holdingCost + purchaseCost;

    return {
      tierIndex: index + 1,
      minQty: tier.minQty,
      maxQty: tier.maxQty,
      price: tier.price,
      h,
      unconstrainedQ,
      feasibleQ,
      isAdjusted,
      orderCost,
      holdingCost,
      purchaseCost,
      totalCost,
    };
  });

  // Find tier with minimum total cost
  let bestTier = evaluatedTiers[0];
  for (const t of evaluatedTiers) {
    if (t.totalCost < bestTier.totalCost) {
      bestTier = t;
    }
  }

  return {
    evaluatedTiers,
    bestTier,
  };
}

// 5. Single-Period Newsvendor Model
export function calculateNewsvendor(
  p: number, // retail price
  c: number, // unit cost
  v: number, // salvage value
  mean: number,
  std: number,
  distribution: "normal" | "uniform" = "normal",
  minDemand: number = 0,
  maxDemand: number = 200
) {
  const Cu = p - c; // underage cost (profit lost per unit of unmet demand)
  const Co = c - v; // overage cost (loss per unit of unsold inventory)
  const criticalRatio = Cu / (Cu + Co);

  let optimalQ = 0;
  let expectedShortage = 0;
  let expectedLeftover = 0;
  let expectedSales = 0;
  let expectedProfit = 0;
  let zScore = 0;

  if (distribution === "normal") {
    zScore = normalInvCDF(criticalRatio);
    optimalQ = mean + zScore * std;
    const lossZ = unitNormalLoss(zScore);
    expectedShortage = std * lossZ;
    expectedLeftover = optimalQ - mean + expectedShortage;
    expectedSales = mean - expectedShortage;
    expectedProfit = p * expectedSales + v * expectedLeftover - c * optimalQ;
  } else {
    // Uniform [a, b]
    const a = minDemand;
    const b = maxDemand;
    optimalQ = a + criticalRatio * (b - a);
    // Integration for uniform distribution expected shortage and leftovers
    if (optimalQ < a) {
      expectedSales = (a + b) / 2;
      expectedShortage = (a + b) / 2 - optimalQ;
      expectedLeftover = 0;
    } else if (optimalQ > b) {
      expectedSales = (a + b) / 2;
      expectedShortage = 0;
      expectedLeftover = optimalQ - (a + b) / 2;
    } else {
      expectedShortage = Math.pow(b - optimalQ, 2) / (2 * (b - a));
      expectedLeftover = Math.pow(optimalQ - a, 2) / (2 * (b - a));
      expectedSales = mean - expectedShortage;
    }
    expectedProfit = p * expectedSales + v * expectedLeftover - c * optimalQ;
  }

  return {
    Cu,
    Co,
    criticalRatio,
    zScore,
    optimalQ: Math.max(0, optimalQ),
    expectedShortage: Math.max(0, expectedShortage),
    expectedLeftover: Math.max(0, expectedLeftover),
    expectedSales: Math.max(0, expectedSales),
    expectedProfit,
  };
}

// 6. Multi-Period Stochastic Safety Stock and ROP
export function calculateSafetyStockROP(
  dailyDemandMean: number,
  dailyDemandStd: number,
  leadTimeDays: number,
  leadTimeStd: number,
  serviceLevelAlpha: number, // CSL
  orderCostK: number,
  holdingCostH: number,
  workingDays: number = 365
) {
  const annualDemand = dailyDemandMean * workingDays;
  const eoqQ = Math.sqrt((2 * annualDemand * orderCostK) / holdingCostH);

  // Variance of demand during lead time: Var(L*D) = L * Var(D) + D_avg^2 * Var(L)
  const leadTimeDemandMean = dailyDemandMean * leadTimeDays;
  const leadTimeDemandStd = Math.sqrt(
    leadTimeDays * Math.pow(dailyDemandStd, 2) +
      Math.pow(dailyDemandMean, 2) * Math.pow(leadTimeStd, 2)
  );

  const zAlpha = normalInvCDF(serviceLevelAlpha);
  const safetyStock = zAlpha * leadTimeDemandStd;
  const reorderPoint = leadTimeDemandMean + safetyStock;

  // Expected Shortage Per Cycle: ESC = σ_L * L(z)
  const expectedShortagePerCycle = leadTimeDemandStd * unitNormalLoss(zAlpha);
  // Fill rate β = 1 - ESC / Q
  const fillRateBeta = Math.max(0, Math.min(1, 1 - expectedShortagePerCycle / eoqQ));
  const annualHoldingSafetyStockCost = safetyStock * holdingCostH;

  return {
    annualDemand,
    eoqQ,
    leadTimeDemandMean,
    leadTimeDemandStd,
    zAlpha,
    safetyStock: Math.max(0, safetyStock),
    reorderPoint: Math.max(0, reorderPoint),
    expectedShortagePerCycle,
    fillRateBeta,
    annualHoldingSafetyStockCost,
  };
}
