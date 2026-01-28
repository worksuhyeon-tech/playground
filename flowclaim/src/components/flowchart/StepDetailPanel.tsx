import { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Link,
  Unlink
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../../store/useStore';
import { ACTOR_LABELS, STEP_TYPE_LABELS } from '../../types';
import type { StepType, ActorType, BranchCondition } from '../../types';

export function StepDetailPanel() {
  const { 
    selectedStepId, 
    selectStep, 
    getStep, 
    updateStep, 
    deleteStep,
    getCurrentProject 
  } = useStore();

  const step = selectedStepId ? getStep(selectedStepId) : null;
  const project = getCurrentProject();

  const [localName, setLocalName] = useState('');
  const [localDesc, setLocalDesc] = useState('');
  const [localActor, setLocalActor] = useState<ActorType>('system');
  const [localType, setLocalType] = useState<StepType>('process');
  const [localConditionName, setLocalConditionName] = useState('');
  const [localBranches, setLocalBranches] = useState<BranchCondition[]>([]);
  const [localNextStepIds, setLocalNextStepIds] = useState<string[]>([]);
  const [localFlowType, setLocalFlowType] = useState<'as-is' | 'to-be' | 'both'>('both');

  // Sync local state with step
  useEffect(() => {
    if (step) {
      setLocalName(step.name);
      setLocalDesc(step.description);
      setLocalActor(step.actor);
      setLocalType(step.type);
      setLocalConditionName(step.conditionName || '');
      setLocalBranches(step.branches || []);
      setLocalNextStepIds(step.nextStepIds || []);
      setLocalFlowType(step.flowType || 'both');
    }
  }, [step]);

  // Save changes
  const handleSave = () => {
    if (!selectedStepId) return;
    
    updateStep(selectedStepId, {
      name: localName,
      description: localDesc,
      actor: localActor,
      type: localType,
      conditionName: localType === 'decision' ? localConditionName : undefined,
      branches: localType === 'decision' ? localBranches : undefined,
      nextStepIds: localType !== 'decision' ? localNextStepIds : [],
      flowType: localFlowType,
    });
  };

  // Auto-save on changes
  useEffect(() => {
    if (step) {
      const timeout = setTimeout(handleSave, 300);
      return () => clearTimeout(timeout);
    }
  }, [localName, localDesc, localActor, localType, localConditionName, localBranches, localNextStepIds, localFlowType]);

  const handleAddBranch = () => {
    setLocalBranches([
      ...localBranches,
      { id: uuidv4(), label: `Option ${localBranches.length + 1}`, nextStepId: '' },
    ]);
  };

  const handleUpdateBranch = (id: string, updates: Partial<BranchCondition>) => {
    setLocalBranches(localBranches.map((b) => 
      b.id === id ? { ...b, ...updates } : b
    ));
  };

  const handleRemoveBranch = (id: string) => {
    if (localBranches.length > 2) {
      setLocalBranches(localBranches.filter((b) => b.id !== id));
    }
  };

  const handleAddNextStep = () => {
    setLocalNextStepIds([...localNextStepIds, '']);
  };

  const handleUpdateNextStep = (index: number, stepId: string) => {
    const newIds = [...localNextStepIds];
    newIds[index] = stepId;
    setLocalNextStepIds(newIds);
  };

  const handleRemoveNextStep = (index: number) => {
    setLocalNextStepIds(localNextStepIds.filter((_, i) => i !== index));
  };

  const handleDelete = () => {
    if (selectedStepId && confirm('이 단계를 삭제하시겠습니까?')) {
      deleteStep(selectedStepId);
    }
  };

  if (!step || !project) {
    return (
      <aside className="w-80 bg-white border-l border-slate-200 flex items-center justify-center text-slate-400 p-6">
        <p className="text-center text-sm">
          플로우차트에서 단계를 선택하면<br />
          상세 정보를 편집할 수 있습니다.
        </p>
      </aside>
    );
  }

  const otherSteps = project.steps.filter((s) => s.id !== selectedStepId);

  return (
    <aside className="w-80 bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">단계 편집</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDelete}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="삭제"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={() => selectStep(null)}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
            title="닫기"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            단계명 *
          </label>
          <input
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="단계명 입력"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            설명
          </label>
          <textarea
            value={localDesc}
            onChange={(e) => setLocalDesc(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            placeholder="단계 설명 입력"
            rows={2}
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            단계 유형
          </label>
          <select
            value={localType}
            onChange={(e) => setLocalType(e.target.value as StepType)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {Object.entries(STEP_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Actor */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            담당 주체
          </label>
          <select
            value={localActor}
            onChange={(e) => setLocalActor(e.target.value as ActorType)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {Object.entries(ACTOR_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Flow Type (for comparison projects) */}
        {project.flowType === 'comparison' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              플로우 유형
            </label>
            <select
              value={localFlowType}
              onChange={(e) => setLocalFlowType(e.target.value as 'as-is' | 'to-be' | 'both')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="both">공통 (AS-IS & TO-BE)</option>
              <option value="as-is">AS-IS만</option>
              <option value="to-be">TO-BE만</option>
            </select>
          </div>
        )}

        {/* Decision node specific fields */}
        {localType === 'decision' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                조건명
              </label>
              <input
                type="text"
                value={localConditionName}
                onChange={(e) => setLocalConditionName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="예: 접수완료 여부"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">
                  분기 조건
                </label>
                <button
                  onClick={handleAddBranch}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="분기 추가"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {localBranches.map((branch) => (
                  <div key={branch.id} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={branch.label}
                      onChange={(e) => handleUpdateBranch(branch.id, { label: e.target.value })}
                      className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="조건 값"
                    />
                    <select
                      value={branch.nextStepId}
                      onChange={(e) => handleUpdateBranch(branch.id, { nextStepId: e.target.value })}
                      className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">다음 단계 선택</option>
                      {otherSteps.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleRemoveBranch(branch.id)}
                      disabled={localBranches.length <= 2}
                      className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Next steps (for non-decision nodes) */}
        {localType !== 'decision' && localType !== 'end' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">
                다음 단계
              </label>
              <button
                onClick={handleAddNextStep}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="연결 추가"
              >
                <Plus size={16} />
              </button>
            </div>
            {localNextStepIds.length === 0 ? (
              <p className="text-sm text-slate-400">다음 단계가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {localNextStepIds.map((stepId, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Link size={14} className="text-slate-400 flex-shrink-0" />
                    <select
                      value={stepId}
                      onChange={(e) => handleUpdateNextStep(index, e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">다음 단계 선택</option>
                      {otherSteps.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleRemoveNextStep(index)}
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <Unlink size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <p className="text-xs text-slate-500 text-center">
          변경사항이 자동으로 저장됩니다
        </p>
      </div>
    </aside>
  );
}
