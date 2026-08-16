import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini client lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Inventory Diagnosis Endpoint
app.post("/api/ai-diagnose", async (req, res) => {
  try {
    const { modelType, params, metrics, customNotes } = req.body;

    const ai = getGeminiClient();

    const prompt = `你是一位世界顶级的运筹学 (Operations Research) 与供应链库存控制专家。请根据以下企业当前库存参数与运行指标，进行深度专业诊断。

【当前运行模型与场景】：${modelType || "通用存储模型"}
【输入参数】：
${JSON.stringify(params, null, 2)}

【计算指标与运行表现】：
${JSON.stringify(metrics, null, 2)}

【用户特别关注或补充说明】：
${customNotes || "无特别说明"}

请提供结构化的诊断报告，包含以下四大核心维度（请使用精炼、专业、富有洞察力的简体中文，条理清晰，使用 Markdown 格式）：
1. 💡 **现状评估与健康度评分 (0-100分)**：评估当前参数匹配度、周转效率与资金占用情况。
2. ⚠️ **核心隐患与风险剖析**：诊断是否存在“牛鞭效应 (Bullwhip Effect) 放大”、“安全库存冗余/不足”、“订货批量过大导致持有成本激增”、“缺货脱销风险”或“价格折扣陷阱”。
3. 🎯 **运筹学优化与调优建议**：给出具体的数学调优方向（例如：批量调整、安全系数修正、协同补货周期、提前期缩短策略）。
4. 📈 **预期收益与实施路径**：预估优化后总成本下降百分比、资金占用释放及服务水平提升路径。`;

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt,
          config: {
            systemInstruction:
              "你是精通运筹学、经典EOQ/EPQ理论、随机报童模型、(s,S)多周期控制与供应链量化分析的首席专家。输出必须严谨、专业、针对性强、条目清晰。",
          },
        });

        return res.json({
          success: true,
          source: "gemini",
          report: response.text,
        });
      } catch (genAiErr: any) {
        console.error("Gemini API error, using algorithmic fallback:", genAiErr?.message);
      }
    }

    // Fallback professional rule-based operations research diagnosis if API key not available or network error
    const fallbackReport = generateRuleBasedDiagnosis(modelType, params, metrics, customNotes);
    return res.json({
      success: true,
      source: "heuristic-expert",
      report: fallbackReport,
    });
  } catch (error: any) {
    console.error("Diagnosis error:", error);
    res.status(500).json({ error: error.message || "Internal diagnosis error" });
  }
});

function generateRuleBasedDiagnosis(modelType: string, params: any, metrics: any, customNotes: string): string {
  const D = params?.demand || params?.D || 10000;
  const K = params?.orderCost || params?.K || 100;
  const h = params?.holdingCost || params?.h || 2;
  const tc = metrics?.totalCost || 0;
  const q = metrics?.optimalQ || metrics?.Q || 0;
  const ss = metrics?.safetyStock || 0;
  const sl = metrics?.serviceLevel || metrics?.alpha || 0.95;

  let healthScore = 86;
  let bullwhipRisk = "中等受控";
  let turnOverRatio = (D / (q / 2 + (ss || 1))).toFixed(1);

  if (q > D * 0.4) {
    healthScore -= 15;
    bullwhipRisk = "显著偏高（大批量集中订货诱发上游需求脉冲震荡）";
  } else if (q < D * 0.02) {
    healthScore -= 10;
  }

  return `### 💡 1. 现状评估与健康度评分
- **综合库存健康度评分**：**${healthScore} / 100**
- **当前决策模型**：${modelType}
- **理论库存周转率**：预估 **${turnOverRatio} 次/年**
- **经济批量 (Q\*)**：${Math.round(q)} 单位（年订货频次约 ${(D / (q || 1)).toFixed(1)} 次）

---

### ⚠️ 2. 核心隐患与风险剖析
1. **牛鞭效应 (Bullwhip Effect) 评估**：${bullwhipRisk}。
   - 当单次订货量过大时，下游平稳需求向上游传导会产生“长鞭放大”效应，导致供应商排产剧烈波动。
2. **持有成本 vs. 订货成本平衡状态**：
   - 经济订货批量在边际持有成本与边际订货成本交点取得极小值。若单次订货费 $K$ 居高不下，将被迫推高每次订货量 $Q$，间接加剧仓库库容压力与资金沉淀。
3. **缺货与波动风险**：
   ${ss > 0 ? `- 当前配置安全库存 **${Math.round(ss)}** 件，对应服务水平 **${(sl * 100).toFixed(1)}%**。需防范供应商提前期突发延长与极端需求脉冲。` : "- 当前为确定型稳态假设。若进入实际运行，需引入提前期标准差 $\\sigma_L$ 进行安全库存缓冲防范脱销。"}

---

### 🎯 3. 运筹学优化与调优建议
- **推进订货固定费 $K$ 降本（SMED / 数字化直连）**：降低单次下单和交接成本，从而平抑最优订货量 $Q^*$，在不增加总费用的前提下提升周转率。
- **动态修正 $(s, S)$ 水位**：结合季节性变动将固定 $(s, S)$ 升级为动态时变控制带。
- **精细化服务水平分级**：对高价值 A 类 SKU 设置 95% 目标服务水平，对关键长尾救急品采用高安全系数 ($z \\ge 2.33$)，平衡资金占用与缺货损失。

---

### 📈 4. 预期收益与实施路径
- **总运营成本预期改善**：预估可降低 **8% ~ 18%** 的综合库存成本。
- **流动资金释放**：优化批量后预计释放约 **15% ~ 25%** 的平均在库沉淀资金。
- **落地步骤**：第一阶段校准实际持有费率 $h$（含资金机会成本与损耗）；第二阶段在 ERP/WMS 中固化动态再订货点计算公式。`;
}

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Inventory Control Lab server running on port ${PORT}`);
  });
}

startServer();
