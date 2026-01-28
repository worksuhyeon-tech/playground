import { GitBranch, TestTube, FileText } from 'lucide-react';
import { useStore } from '../../store/useStore';

export function MobileTabBar() {
  const { activeTab, setActiveTab } = useStore();

  const tabs = [
    { id: 'flowchart' as const, label: '플로우차트', icon: GitBranch },
    { id: 'scenarios' as const, label: '테스트', icon: TestTube },
    { id: 'description' as const, label: '설명', icon: FileText },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
      <div className="flex">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center py-3 transition-colors ${
              activeTab === id
                ? 'text-blue-600'
                : 'text-slate-500'
            }`}
          >
            <Icon size={20} />
            <span className="text-xs mt-1">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
