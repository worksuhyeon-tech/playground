import { useState } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  FileImage, 
  FileText, 
  Presentation,
  Save,
  Layers,
  Eye,
  EyeOff,
  Menu
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { 
  exportToExcel, 
  exportToPNG, 
  exportToPDF, 
  exportToPPTX,
  exportToJSON 
} from '../../utils/exportUtils';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { 
    activeTab, 
    setActiveTab,
    showAsIs,
    showToBe,
    setShowAsIs,
    setShowToBe,
    saveVersion,
    getCurrentProject
  } = useStore();

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionName, setVersionName] = useState('');

  const project = getCurrentProject();

  const handleExport = async (type: 'excel' | 'png' | 'pdf' | 'pptx' | 'json') => {
    if (!project) return;

    try {
      switch (type) {
        case 'excel':
          await exportToExcel(project.testScenarios, project.name);
          break;
        case 'png':
          await exportToPNG('flowchart-canvas', project.name);
          break;
        case 'pdf':
          await exportToPDF('flowchart-canvas', project.name);
          break;
        case 'pptx':
          await exportToPPTX(project.steps, project.name, project.description);
          break;
        case 'json':
          exportToJSON(project);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('내보내기에 실패했습니다.');
    }

    setShowExportMenu(false);
  };

  const handleSaveVersion = () => {
    if (project && versionName.trim()) {
      saveVersion(project.id, versionName.trim());
      setVersionName('');
      setShowVersionModal(false);
      alert('버전이 저장되었습니다.');
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-4">
      {/* Mobile menu button */}
      <button 
        onClick={onToggleSidebar}
        className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
      >
        <Menu size={20} />
      </button>

      {/* Project name */}
      <div className="flex-1 min-w-0">
        <h1 className="font-semibold text-slate-900 truncate">
          {project?.name || 'FlowClaim'}
        </h1>
        {project && (
          <p className="text-xs text-slate-500">
            v{project.version} · {project.steps.length}개 단계
          </p>
        )}
      </div>

      {/* Tabs */}
      <nav className="hidden md:flex items-center bg-slate-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('flowchart')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'flowchart'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          플로우차트
        </button>
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'scenarios'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          테스트 시나리오
        </button>
        <button
          onClick={() => setActiveTab('description')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'description'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          설명 텍스트
        </button>
      </nav>

      {/* Comparison mode toggle (for comparison projects) */}
      {project?.flowType === 'comparison' && activeTab === 'flowchart' && (
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg">
          <Layers size={16} className="text-slate-500" />
          <button
            onClick={() => setShowAsIs(!showAsIs)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              showAsIs ? 'bg-orange-100 text-orange-700' : 'text-slate-500'
            }`}
          >
            {showAsIs ? <Eye size={14} /> : <EyeOff size={14} />}
            <span className="ml-1">AS-IS</span>
          </button>
          <button
            onClick={() => setShowToBe(!showToBe)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              showToBe ? 'bg-green-100 text-green-700' : 'text-slate-500'
            }`}
          >
            {showToBe ? <Eye size={14} /> : <EyeOff size={14} />}
            <span className="ml-1">TO-BE</span>
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Save version */}
        <button
          onClick={() => setShowVersionModal(true)}
          disabled={!project}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="버전 저장"
        >
          <Save size={20} className="text-slate-600" />
        </button>

        {/* Export dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={!project}
            className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            <span className="hidden sm:inline">내보내기</span>
          </button>

          {showExportMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowExportMenu(false)} 
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 text-left"
                >
                  <FileSpreadsheet size={16} className="text-green-600" />
                  <span className="text-sm">Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => handleExport('pptx')}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 text-left"
                >
                  <Presentation size={16} className="text-orange-600" />
                  <span className="text-sm">PowerPoint (.pptx)</span>
                </button>
                <button
                  onClick={() => handleExport('png')}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 text-left"
                >
                  <FileImage size={16} className="text-purple-600" />
                  <span className="text-sm">이미지 (.png)</span>
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 text-left"
                >
                  <FileText size={16} className="text-red-600" />
                  <span className="text-sm">PDF (.pdf)</span>
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => handleExport('json')}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 text-left"
                >
                  <FileText size={16} className="text-slate-600" />
                  <span className="text-sm">JSON (백업)</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Version save modal */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">버전 저장</h3>
            <input
              type="text"
              placeholder="버전명 (예: v1.0 초안)"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowVersionModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveVersion}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
