import { useState } from 'react';
import { 
  FolderPlus, 
  Folder, 
  Trash2, 
  ChevronRight,
  ChevronDown,
  History,
  LogOut,
  User
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { FLOW_TYPE_LABELS } from '../../types';
import type { FlowType } from '../../types';

export function Sidebar() {
  const { 
    projects, 
    currentProjectId, 
    currentUser,
    selectProject, 
    createProject, 
    deleteProject,
    logout
  } = useStore();
  
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectType, setNewProjectType] = useState<FlowType>('as-is');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProject(newProjectName.trim(), newProjectDesc.trim(), newProjectType);
      setNewProjectName('');
      setNewProjectDesc('');
      setNewProjectType('as-is');
      setShowNewProject(false);
    }
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedProjects);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedProjects(next);
  };

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-full">
      {/* User section */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <User size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{currentUser?.name || '사용자'}</p>
            <p className="text-xs text-slate-400 truncate">{currentUser?.department || '부서'}</p>
          </div>
          <button 
            onClick={logout}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            title="로그아웃"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Projects header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-700">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-slate-400">
          프로젝트
        </h2>
        <button
          onClick={() => setShowNewProject(true)}
          className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
          title="새 프로젝트"
        >
          <FolderPlus size={18} />
        </button>
      </div>

      {/* New project form */}
      {showNewProject && (
        <div className="p-4 bg-slate-800 border-b border-slate-700">
          <input
            type="text"
            placeholder="프로젝트명"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <input
            type="text"
            placeholder="설명 (선택)"
            value={newProjectDesc}
            onChange={(e) => setNewProjectDesc(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={newProjectType}
            onChange={(e) => setNewProjectType(e.target.value as FlowType)}
            className="w-full px-3 py-2 bg-slate-700 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="as-is">AS-IS</option>
            <option value="to-be">TO-BE</option>
            <option value="comparison">비교</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleCreateProject}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
            >
              생성
            </button>
            <button
              onClick={() => setShowNewProject(false)}
              className="flex-1 px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm font-medium transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Project list */}
      <div className="flex-1 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">
            프로젝트가 없습니다.
            <br />
            새 프로젝트를 생성하세요.
          </div>
        ) : (
          <ul className="py-2">
            {projects.map((project) => (
              <li key={project.id}>
                <div
                  className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer transition-colors ${
                    currentProjectId === project.id 
                      ? 'bg-blue-600' 
                      : 'hover:bg-slate-800'
                  }`}
                >
                  <button
                    onClick={() => toggleExpand(project.id)}
                    className="p-0.5 hover:bg-slate-700 rounded"
                  >
                    {expandedProjects.has(project.id) ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </button>
                  <Folder size={16} className="text-slate-400 flex-shrink-0" />
                  <button
                    onClick={() => selectProject(project.id)}
                    className="flex-1 text-left truncate text-sm"
                  >
                    {project.name}
                  </button>
                  <span className="text-xs px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">
                    {FLOW_TYPE_LABELS[project.flowType]}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('프로젝트를 삭제하시겠습니까?')) {
                        deleteProject(project.id);
                      }
                    }}
                    className="p-1 hover:bg-red-600 rounded opacity-50 hover:opacity-100 transition-all"
                    title="삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                {/* Project details when expanded */}
                {expandedProjects.has(project.id) && (
                  <div className="bg-slate-800/50 px-4 py-2 text-xs text-slate-400 border-l-2 border-slate-700 ml-6">
                    <p className="mb-1">단계: {project.steps.length}개</p>
                    <p className="mb-1">시나리오: {project.testScenarios.length}개</p>
                    <p className="mb-1 flex items-center gap-1">
                      <History size={12} />
                      버전: v{project.version}
                    </p>
                    <p className="text-slate-500">
                      수정: {new Date(project.updatedAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 text-center">
        <p className="text-xs text-slate-500">FlowClaim v1.0</p>
      </div>
    </aside>
  );
}
