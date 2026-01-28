import React from 'react';
import { 
  Play, 
  Square, 
  Circle, 
  Diamond,
  Zap
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../../store/useStore';
import type { StepType, ActorType } from '../../types';

const stepButtons: { type: StepType; icon: React.ReactNode; label: string; color: string }[] = [
  { type: 'start', icon: <Play size={14} />, label: '시작', color: 'bg-green-500 hover:bg-green-600' },
  { type: 'process', icon: <Square size={14} />, label: '프로세스', color: 'bg-blue-500 hover:bg-blue-600' },
  { type: 'decision', icon: <Diamond size={14} />, label: '분기', color: 'bg-amber-500 hover:bg-amber-600' },
  { type: 'end', icon: <Circle size={14} />, label: '종료', color: 'bg-red-500 hover:bg-red-600' },
];

export function StepToolbar() {
  const { addStep, getCurrentProject } = useStore();
  const project = getCurrentProject();

  const handleAddStep = (type: StepType) => {
    if (!project) return;

    // Calculate position based on existing steps
    const existingSteps = project.steps;
    const lastStep = existingSteps[existingSteps.length - 1];
    
    let position = { x: 100, y: 100 };
    if (lastStep) {
      position = {
        x: lastStep.position.x + 200,
        y: lastStep.position.y,
      };
      // Wrap to new row if too far right
      if (position.x > 800) {
        position = { x: 100, y: lastStep.position.y + 150 };
      }
    }

    const defaultNames: Record<StepType, string> = {
      start: '시작',
      end: '종료',
      process: '새 프로세스',
      decision: '조건 확인',
    };

    const newStep = {
      name: defaultNames[type],
      description: '',
      actor: 'system' as ActorType,
      type,
      nextStepIds: [],
      branches: type === 'decision' ? [
        { id: uuidv4(), label: 'Yes', nextStepId: '' },
        { id: uuidv4(), label: 'No', nextStepId: '' },
      ] : undefined,
      conditionName: type === 'decision' ? '조건' : undefined,
      position,
      flowType: project.flowType === 'comparison' ? 'both' as const : 
                project.flowType === 'as-is' ? 'as-is' as const : 'to-be' as const,
    };

    addStep(newStep);
  };

  const handleAutoLayout = () => {
    if (!project || project.steps.length === 0) return;

    // Simple auto-layout: arrange in a grid
    const { updateStep } = useStore.getState();
    const columns = 4;
    const startX = 100;
    const startY = 100;
    const gapX = 220;
    const gapY = 150;

    project.steps.forEach((step, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      updateStep(step.id, {
        position: {
          x: startX + col * gapX,
          y: startY + row * gapY,
        },
      });
    });
  };

  if (!project) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-2">
      <div className="flex items-center gap-1">
        {stepButtons.map(({ type, icon, label, color }) => (
          <button
            key={type}
            onClick={() => handleAddStep(type)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-colors ${color}`}
            title={`${label} 추가`}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
        
        <div className="w-px h-6 bg-slate-200 mx-1" />
        
        <button
          onClick={handleAutoLayout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
          title="자동 정렬"
        >
          <Zap size={14} />
          <span className="hidden sm:inline">자동 정렬</span>
        </button>
      </div>
    </div>
  );
}
