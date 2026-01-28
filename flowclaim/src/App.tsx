import { useState } from 'react';
import { useStore } from './store/useStore';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { FlowCanvas } from './components/flowchart/FlowCanvas';
import { StepDetailPanel } from './components/flowchart/StepDetailPanel';
import { TestScenarioTable } from './components/scenarios/TestScenarioTable';
import { DescriptionView } from './components/common/DescriptionView';
import { LoginScreen } from './components/common/LoginScreen';
import { MobileTabBar } from './components/common/MobileTabBar';

function App() {
  const { isLoggedIn, activeTab, selectedStepId } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-100">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
          <Sidebar />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

          <main className="flex-1 flex overflow-hidden">
            {/* Content based on active tab */}
            {activeTab === 'flowchart' && (
              <>
                <FlowCanvas />
                {selectedStepId && <StepDetailPanel />}
              </>
            )}

            {activeTab === 'scenarios' && <TestScenarioTable />}

            {activeTab === 'description' && <DescriptionView />}
          </main>
        </div>
      </div>

      {/* Mobile tab bar */}
      <MobileTabBar />
    </div>
  );
}

export default App;
