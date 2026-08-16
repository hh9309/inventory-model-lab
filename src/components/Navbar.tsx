import React from "react";
import { ActiveModule } from "../types/inventory";
import {
  RotateCcw,
} from "lucide-react";

interface NavbarProps {
  activeModule: ActiveModule;
  onSelectModule: (module: ActiveModule) => void;
  onResetAll?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeModule,
  onSelectModule,
  onResetAll,
}) => {
  const navItems: { id: ActiveModule; num: string; label: string; badge?: string }[] = [
    { id: "or_eoq_math", num: "01", label: "运筹与EOQ推导" },
    { id: "deterministic", num: "02", label: "确定型模型族" },
    { id: "stochastic", num: "03", label: "随机与安全库存" },
    { id: "tank_sandbox", num: "04", label: "(s,S)水箱沙盒" },
    { id: "decision_3d", num: "05", label: "ABC-XYZ品类矩阵" },
    { id: "case_studies", num: "06", label: "六大实战案例" },
    { id: "python_engine", num: "07", label: "Python代码引擎" },
    { id: "ai_diagnosis", num: "08", label: "AI智能诊断" },
    { id: "knowledge_guide", num: "09", label: "知识导引" },
    { id: "report_export", num: "10", label: "报告与导出" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E1E4E8] shadow-xs no-print">
      {/* Top Main Brand Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 bg-[#34495E] rounded-md flex items-center justify-center text-white font-bold text-lg shadow-xs">
            L
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-[#2C3E50] tracking-tight">
                存储模型与库存控制实验室
              </h1>
              <span className="hidden sm:inline-block text-[11px] font-medium px-2 py-0.5 bg-[#ECF0F1] text-[#34495E] rounded">
                v2.5
              </span>
            </div>
            <p className="text-xs text-[#7F8C8D] uppercase tracking-wider hidden md:block">
              Inventory Control & Optimization Lab · Operations Research
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#27AE60] bg-[#E8F5E9] rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-[#27AE60] animate-pulse" />
            求解引擎就绪
          </span>
          {onResetAll && (
            <button
              onClick={onResetAll}
              title="重置当前参数"
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#BDC3C7] text-[#7F8C8D] hover:text-[#2C3E50] hover:bg-[#F8F9FA] rounded text-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置</span>
            </button>
          )}
          <button
            onClick={() => onSelectModule("tank_sandbox")}
            className="bg-[#2980B9] text-white text-xs font-medium px-4 py-2 rounded hover:bg-[#3498DB] transition-colors shadow-xs"
          >
            运行动态仿真
          </button>
        </div>
      </div>

      {/* Sliced Minimalist Numbered Tabs Nav */}
      <nav className="border-t border-[#E1E4E8] bg-white overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex">
          {navItems.map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectModule(item.id)}
                className={`group flex-1 min-w-[105px] border-r border-[#E1E4E8] py-2.5 px-2 text-center cursor-pointer transition-colors ${
                  isActive
                    ? "bg-[#F8F9FA] border-b-2 border-b-[#2980B9]"
                    : "hover:bg-[#F8F9FA] border-b-2 border-b-transparent"
                }`}
              >
                <div
                  className={`text-[10px] font-mono mb-0.5 ${
                    isActive ? "text-[#2980B9] font-bold" : "text-[#95A5A6] group-hover:text-[#2980B9]"
                  }`}
                >
                  {item.num}
                </div>
                <div
                  className={`text-xs font-semibold whitespace-nowrap flex items-center justify-center gap-1 ${
                    isActive ? "text-[#2980B9]" : "text-[#2C3E50]"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-normal ${
                        isActive
                          ? "bg-[#2980B9]/10 text-[#2980B9]"
                          : "bg-[#ECF0F1] text-[#7F8C8D]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};

