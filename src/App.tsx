import React, { useState } from "react";
import { ActiveModule, CaseStudyItem } from "./types/inventory";
import { Navbar } from "./components/Navbar";
import { GlobalStoragePerformanceDashboard } from "./components/common/GlobalStoragePerformanceDashboard";
import { EoqMathDerivationModule } from "./components/modules/EoqMathDerivationModule";
import { DeterministicModelsModule } from "./components/modules/DeterministicModelsModule";
import { StochasticModelsModule } from "./components/modules/StochasticModelsModule";
import { WaterTankSandboxModule } from "./components/modules/WaterTankSandboxModule";
import { AbcXyzStrategyModule } from "./components/modules/AbcXyzStrategyModule";
import { CaseStudiesModule } from "./components/modules/CaseStudiesModule";
import { CodeEngineModule } from "./components/modules/CodeEngineModule";
import { AiDiagnosisEngineModule } from "./components/modules/AiDiagnosisEngineModule";
import { KnowledgeGuideModule } from "./components/modules/KnowledgeGuideModule";
import { ReportExportModule } from "./components/modules/ReportExportModule";

export default function App() {
  const [activeModule, setActiveModule] = useState<ActiveModule>("or_eoq_math");
  const [showGlobalDashboard, setShowGlobalDashboard] = useState<boolean>(true);

  // Handler to jump from case studies to active simulation / model
  const handleLoadCaseToModule = (caseItem: CaseStudyItem) => {
    if (caseItem.id === "case_supermarket") {
      setActiveModule("or_eoq_math");
    } else if (caseItem.id === "case_fresh_food") {
      setActiveModule("stochastic");
    } else if (caseItem.id === "case_factory_jit") {
      setActiveModule("deterministic");
    } else if (caseItem.id === "case_pharma") {
      setActiveModule("stochastic");
    } else if (caseItem.id === "case_ecommerce" || caseItem.id === "case_oil_tank") {
      setActiveModule("tank_sandbox");
    } else {
      setActiveModule("or_eoq_math");
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#2C3E50] flex flex-col font-sans selection:bg-[#2980B9]/20 selection:text-[#2980B9]">
      {/* Top Main Navigation Bar with Clean Minimalist Sliced Tabs */}
      <Navbar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        showDashboardToggle={true}
        isDashboardOpen={showGlobalDashboard}
        onToggleDashboard={() => setShowGlobalDashboard((prev) => !prev)}
      />

      {/* Main Lab Content View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Global Storage Performance Cockpit Dashboard */}
        {showGlobalDashboard && (
          <GlobalStoragePerformanceDashboard
            initialCollapsed={false}
            onNavigateToModule={setActiveModule}
          />
        )}

        {activeModule === "or_eoq_math" && <EoqMathDerivationModule />}
        {activeModule === "deterministic" && <DeterministicModelsModule />}
        {activeModule === "stochastic" && <StochasticModelsModule />}
        {activeModule === "tank_sandbox" && <WaterTankSandboxModule />}
        {activeModule === "decision_3d" && <AbcXyzStrategyModule />}
        {activeModule === "case_studies" && (
          <CaseStudiesModule onLoadCaseToModule={handleLoadCaseToModule} />
        )}
        {activeModule === "python_engine" && <CodeEngineModule />}
        {activeModule === "ai_diagnosis" && <AiDiagnosisEngineModule />}
        {activeModule === "knowledge_guide" && (
          <KnowledgeGuideModule onNavigateToModule={setActiveModule} />
        )}
        {activeModule === "report_export" && <ReportExportModule />}
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="bg-[#34495E] text-[#BDC3C7] px-6 sm:px-8 py-3 text-[11px] flex flex-col sm:flex-row justify-between items-center gap-2 print:hidden border-t border-slate-700">
        <div>
          © 2026 <strong>运筹学存储模型与库存控制实验室</strong> · Inventory Control & Operations Research
        </div>
        <div className="flex gap-6 font-mono text-[10px] text-slate-300">
          <span>内核版本: Python 3.11 / SciPy / SimPy</span>
          <span>实验室状态: 就绪 (Ready)</span>
        </div>
      </footer>
    </div>
  );
}

