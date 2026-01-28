import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { ACTOR_LABELS } from '../../types';
import type { StepType, ActorType, BranchCondition } from '../../types';

interface CustomNodeData {
  label: string;
  stepType: StepType;
  actor: ActorType;
  description?: string;
  flowType?: 'as-is' | 'to-be' | 'both';
  conditionName?: string;
  branches?: BranchCondition[];
}

const nodeStyles: Record<StepType, { bg: string; border: string; shape: string }> = {
  start: {
    bg: 'bg-green-500',
    border: 'border-green-600',
    shape: 'rounded-full',
  },
  end: {
    bg: 'bg-red-500',
    border: 'border-red-600',
    shape: 'rounded-full',
  },
  process: {
    bg: 'bg-blue-500',
    border: 'border-blue-600',
    shape: 'rounded-lg',
  },
  decision: {
    bg: 'bg-amber-500',
    border: 'border-amber-600',
    shape: 'rotate-45',
  },
};

const flowTypeColors: Record<string, string> = {
  'as-is': 'ring-2 ring-orange-400',
  'to-be': 'ring-2 ring-green-400',
  'both': '',
};

export const CustomNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as CustomNodeData;
  const { label, stepType, actor, description, flowType, conditionName, branches } = nodeData;
  const style = nodeStyles[stepType] || nodeStyles.process;
  
  const isDecision = stepType === 'decision';
  const flowRing = flowType ? flowTypeColors[flowType] : '';

  return (
    <div className="relative">
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white"
      />
      
      {/* Decision node wrapper for rotation */}
      {isDecision ? (
        <div
          className={`
            relative w-24 h-24 flex items-center justify-center
            ${style.bg} ${style.border} ${style.shape}
            border-2 shadow-lg cursor-pointer transition-all
            ${selected ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
            ${flowRing}
          `}
        >
          <div className="-rotate-45 text-center px-1">
            <span className="text-white text-xs font-medium leading-tight block">
              {label}
            </span>
            {conditionName && (
              <span className="text-white/80 text-[10px] block mt-0.5">
                {conditionName}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div
          className={`
            px-4 py-3 min-w-[120px] max-w-[180px]
            ${style.bg} ${style.border} ${style.shape}
            border-2 shadow-lg cursor-pointer transition-all
            ${selected ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
            ${flowRing}
          `}
        >
          <div className="text-center">
            <span className="text-white text-sm font-medium block">
              {label}
            </span>
            {description && (
              <span className="text-white/70 text-xs block mt-1 truncate">
                {description}
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Actor badge */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
          {ACTOR_LABELS[actor] || actor}
        </span>
      </div>
      
      {/* Flow type indicator */}
      {flowType && flowType !== 'both' && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            flowType === 'as-is' 
              ? 'bg-orange-100 text-orange-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {flowType.toUpperCase()}
          </span>
        </div>
      )}
      
      {/* Multiple handles for decision nodes */}
      {isDecision && branches && branches.length > 1 ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="right"
            className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="bottom"
            className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white"
          />
          <Handle
            type="source"
            position={Position.Left}
            id="left"
            className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white"
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white"
        />
      )}
    </div>
  );
});

CustomNode.displayName = 'CustomNode';
