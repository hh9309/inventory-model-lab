import React, { useState } from "react";
import { CASE_STUDIES } from "../../data/caseStudiesData";
import { CaseStudyItem, ActiveModule } from "../../types/inventory";
import {
  Layers,
  ShoppingCart,
  Fish,
  Cog,
  ShieldAlert,
  Cpu,
  Flame,
  ArrowRight,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface CaseStudiesModuleProps {
  onLoadCaseToModule?: (caseItem: CaseStudyItem) => void;
}

export const CaseStudiesModule: React.FC<CaseStudiesModuleProps> = ({
  onLoadCaseToModule,
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(CASE_STUDIES[0].id);
  const [activeWalkthroughStep, setActiveWalkthroughStep] = useState<number>(0);

  const activeCase = CASE_STUDIES.find((c) => c.id === selectedCaseId) || CASE_STUDIES[0];

  const getCaseIcon = (iconName: string) => {
    switch (iconName) {
      case "ShoppingCart":
        return <ShoppingCart className="w-5 h-5" />;
      case "Fish":
        return <Fish className="w-5 h-5" />;
      case "Cog":
        return <Cog className="w-5 h-5" />;
      case "ShieldAlert":
        return <ShieldAlert className="w-5 h-5" />;
      case "Cpu":
        return <Cpu className="w-5 h-5" />;
      case "Flame":
        return <Flame className="w-5 h-5" />;
      default:
        return <Layers className="w-5 h-5" />;
    }
  };

  const walkthroughSteps = [
    { title: "1. 业务背景与现实痛点", key: "story" },
    { title: "2. 运筹学建模与参数提炼", key: "params" },
    { title: "3. 关键数学公式与代入求解", key: "math" },
    { title: "4. 管理学洞见与实操落地", key: "takeaways" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">六大经典行业应用案例库</h2>
          <p className="text-xs text-slate-500">
            涵盖快消、生鲜、汽配、医药、电商与大宗能源，支持一键加载参数与交互式分步深度解构演播。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-teal-50 text-teal-800 text-xs font-semibold rounded-lg border border-teal-200">
            精选 6 大工业场景
          </span>
        </div>
      </div>

      {/* Sliced 6-Case Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CASE_STUDIES.map((c) => {
          const isSelected = c.id === selectedCaseId;
          return (
            <div
              key={c.id}
              onClick={() => {
                setSelectedCaseId(c.id);
                setActiveWalkthroughStep(0);
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                isSelected
                  ? "bg-teal-50/80 border-teal-400 ring-2 ring-teal-500/20 shadow-sm"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className={`p-2 rounded-lg ${isSelected ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                  {getCaseIcon(c.iconName)}
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {c.badge}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{c.title}</h3>
              <p className="text-xs text-teal-700 font-medium mt-0.5">{c.category}</p>
              <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{c.summary}</p>
            </div>
          );
        })}
      </div>

      {/* Selected Case Deep Dive Walkthrough Panel */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-600 text-white rounded-xl shadow-xs">
              {getCaseIcon(activeCase.iconName)}
            </div>
            <div>
              <div className="text-xs font-semibold text-teal-700 uppercase tracking-wider">{activeCase.category}</div>
              <h3 className="text-lg font-bold text-slate-800">{activeCase.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onLoadCaseToModule && onLoadCaseToModule(activeCase)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>载入模型演练</span>
            </button>
          </div>
        </div>

        {/* Walkthrough Stepper Slices */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {walkthroughSteps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setActiveWalkthroughStep(idx)}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                activeWalkthroughStep === idx
                  ? "bg-teal-50 border-teal-300 font-bold text-teal-900 ring-2 ring-teal-500/20"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="text-[11px]">{step.title}</div>
            </button>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/80 space-y-4">
          {activeWalkthroughStep === 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-teal-600" />
                真实业务情境描述
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-200">
                {activeCase.story}
              </p>
            </div>
          )}

          {activeWalkthroughStep === 1 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-800">运筹学参数提炼</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(activeCase.parameters).map(([key, val]) => (
                  <div key={key} className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="text-[11px] text-slate-500 font-mono">{key}</div>
                    <div className="text-base font-bold font-mono text-teal-800 mt-0.5">{String(val)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeWalkthroughStep === 2 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-800">关键推导与计算过程</h4>
              <div className="space-y-2">
                {activeCase.keyFormulas.map((f, i) => (
                  <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-xs text-teal-900">
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeWalkthroughStep === 3 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-800">供应链与运筹管理学核心启示</h4>
              <ul className="space-y-2">
                {activeCase.takeaways.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
