import { useState, useMemo } from 'react';
import { 
  RefreshCw, 
  Download, 
  Search,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { generateTestScenarios } from '../../utils/scenarioGenerator';
import { exportToExcel } from '../../utils/exportUtils';
import type { TestScenario, Priority, TestResult } from '../../types';

export function TestScenarioTable() {
  const { getCurrentProject, setTestScenarios, updateTestScenario, deleteTestScenario } = useStore();
  const project = getCurrentProject();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof TestScenario>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterResult, setFilterResult] = useState<TestResult | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [maxCases, setMaxCases] = useState(50);
  const [showGenerateOptions, setShowGenerateOptions] = useState(false);

  const scenarios = project?.testScenarios || [];

  // Filter and sort scenarios
  const filteredScenarios = useMemo(() => {
    let result = [...scenarios];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((s) =>
        s.name.toLowerCase().includes(term) ||
        s.pathDescription.toLowerCase().includes(term) ||
        s.steps.toLowerCase().includes(term)
      );
    }

    // Priority filter
    if (filterPriority !== 'all') {
      result = result.filter((s) => s.priority === filterPriority);
    }

    // Result filter
    if (filterResult !== 'all') {
      result = result.filter((s) => s.result === filterResult);
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [scenarios, searchTerm, filterPriority, filterResult, sortField, sortDirection]);

  const handleSort = (field: keyof TestScenario) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleGenerate = () => {
    if (!project) return;

    if (scenarios.length > 0) {
      if (!confirm('기존 시나리오가 삭제됩니다. 계속하시겠습니까?')) {
        return;
      }
    }

    const newScenarios = generateTestScenarios(project.steps, maxCases);
    setTestScenarios(newScenarios);
    setShowGenerateOptions(false);

    if (newScenarios.length === 0) {
      alert('생성할 수 있는 테스트 시나리오가 없습니다. 플로우차트에 단계를 추가하세요.');
    } else if (newScenarios.length >= maxCases) {
      alert(`최대 케이스 수(${maxCases})에 도달했습니다. 일부 경로가 생략되었을 수 있습니다.`);
    }
  };

  const handleExport = async () => {
    if (!project) return;
    await exportToExcel(scenarios, project.name);
  };

  const startEdit = (id: string, field: string, value: string) => {
    setEditingId(id);
    setEditingField(field);
    setEditValue(value);
  };

  const saveEdit = () => {
    if (editingId && editingField) {
      updateTestScenario(editingId, { [editingField]: editValue });
    }
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingField(null);
    setEditValue('');
  };

  const handleDelete = (id: string) => {
    if (confirm('이 테스트 시나리오를 삭제하시겠습니까?')) {
      deleteTestScenario(id);
    }
  };

  const SortIcon = ({ field }: { field: keyof TestScenario }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 text-slate-500">
        <p>프로젝트를 선택하세요</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 bg-white border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-4">
          {/* Generate button */}
          <div className="relative">
            <button
              onClick={() => setShowGenerateOptions(!showGenerateOptions)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <RefreshCw size={16} />
              시나리오 생성
            </button>
            
            {showGenerateOptions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowGenerateOptions(false)} />
                <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-20">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    최대 케이스 수
                  </label>
                  <select
                    value={maxCases}
                    onChange={(e) => setMaxCases(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-3 text-sm"
                  >
                    <option value={20}>20개</option>
                    <option value={50}>50개</option>
                    <option value={100}>100개</option>
                  </select>
                  <button
                    onClick={handleGenerate}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    생성하기
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={scenarios.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            <Download size={16} />
            Excel 다운로드
          </button>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="검색..."
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="all">모든 우선순위</option>
            <option value="high">높음</option>
            <option value="medium">중간</option>
            <option value="low">낮음</option>
          </select>

          <select
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value as TestResult | 'all')}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="all">모든 결과</option>
            <option value="pending">대기</option>
            <option value="pass">통과</option>
            <option value="fail">실패</option>
            <option value="blocked">차단됨</option>
          </select>
        </div>

        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
          <span>총 {scenarios.length}개 시나리오</span>
          <span>•</span>
          <span className="text-green-600">{scenarios.filter(s => s.result === 'pass').length} 통과</span>
          <span className="text-red-600">{scenarios.filter(s => s.result === 'fail').length} 실패</span>
          <span className="text-slate-400">{scenarios.filter(s => s.result === 'pending').length} 대기</span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {scenarios.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <RefreshCw size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-lg mb-2">테스트 시나리오가 없습니다</p>
              <p className="text-sm">플로우차트를 기반으로 시나리오를 생성하세요.</p>
            </div>
          </div>
        ) : (
          <table className="w-full min-w-[1200px]">
            <thead className="bg-slate-100 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-24">
                  <button onClick={() => handleSort('name')} className="flex items-center gap-1">
                    TC_ID <SortIcon field="name" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-48">
                  시나리오명
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-64">
                  커버 경로
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-40">
                  분기 조건
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-32">
                  기대결과
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-24">
                  <button onClick={() => handleSort('priority')} className="flex items-center gap-1">
                    우선순위 <SortIcon field="priority" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-24">
                  담당자
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-24">
                  <button onClick={() => handleSort('result')} className="flex items-center gap-1">
                    결과 <SortIcon field="result" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-32">
                  비고
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide w-20">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredScenarios.map((scenario, index) => (
                <tr key={scenario.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-mono text-slate-600">
                    TC-{String(index + 1).padStart(3, '0')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <EditableCell
                      value={scenario.name}
                      isEditing={editingId === scenario.id && editingField === 'name'}
                      editValue={editValue}
                      onEdit={() => startEdit(scenario.id, 'name', scenario.name)}
                      onChange={setEditValue}
                      onSave={saveEdit}
                      onCancel={cancelEdit}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    <div className="truncate max-w-xs" title={scenario.pathDescription}>
                      {scenario.pathDescription}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {scenario.branchConditions.map((b, i) => (
                      <span key={i} className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded mr-1 mb-1">
                        {b.condition}={b.value}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <EditableCell
                      value={scenario.expectedResult}
                      isEditing={editingId === scenario.id && editingField === 'expectedResult'}
                      editValue={editValue}
                      onEdit={() => startEdit(scenario.id, 'expectedResult', scenario.expectedResult)}
                      onChange={setEditValue}
                      onSave={saveEdit}
                      onCancel={cancelEdit}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={scenario.priority}
                      onChange={(e) => updateTestScenario(scenario.id, { priority: e.target.value as Priority })}
                      className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${
                        scenario.priority === 'high' ? 'bg-red-100 text-red-700' :
                        scenario.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <option value="high">높음</option>
                      <option value="medium">중간</option>
                      <option value="low">낮음</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <EditableCell
                      value={scenario.assignee}
                      isEditing={editingId === scenario.id && editingField === 'assignee'}
                      editValue={editValue}
                      onEdit={() => startEdit(scenario.id, 'assignee', scenario.assignee)}
                      onChange={setEditValue}
                      onSave={saveEdit}
                      onCancel={cancelEdit}
                      placeholder="-"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={scenario.result}
                      onChange={(e) => updateTestScenario(scenario.id, { result: e.target.value as TestResult })}
                      className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${
                        scenario.result === 'pass' ? 'bg-green-100 text-green-700' :
                        scenario.result === 'fail' ? 'bg-red-100 text-red-700' :
                        scenario.result === 'blocked' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <option value="pending">대기</option>
                      <option value="pass">통과</option>
                      <option value="fail">실패</option>
                      <option value="blocked">차단됨</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <EditableCell
                      value={scenario.notes}
                      isEditing={editingId === scenario.id && editingField === 'notes'}
                      editValue={editValue}
                      onEdit={() => startEdit(scenario.id, 'notes', scenario.notes)}
                      onChange={setEditValue}
                      onSave={saveEdit}
                      onCancel={cancelEdit}
                      placeholder="-"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(scenario.id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      title="삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Editable cell component
interface EditableCellProps {
  value: string;
  isEditing: boolean;
  editValue: string;
  onEdit: () => void;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  placeholder?: string;
}

function EditableCell({
  value,
  isEditing,
  editValue,
  onEdit,
  onChange,
  onSave,
  onCancel,
  placeholder = '-',
}: EditableCellProps) {
  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={editValue}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave();
            if (e.key === 'Escape') onCancel();
          }}
          className="w-full px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
        />
        <button onClick={onSave} className="p-1 text-green-600 hover:bg-green-50 rounded">
          <Check size={14} />
        </button>
        <button onClick={onCancel} className="p-1 text-red-600 hover:bg-red-50 rounded">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onEdit}
      className="text-left w-full group flex items-center gap-1"
    >
      <span className={value ? '' : 'text-slate-400'}>{value || placeholder}</span>
      <Edit2 size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" />
    </button>
  );
}
