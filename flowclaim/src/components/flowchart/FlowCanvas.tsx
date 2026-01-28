import React, { useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  ReactFlowProvider,
} from '@xyflow/react';
import type {
  Connection,
  Edge,
  Node,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '../../store/useStore';
import { CustomNode } from './CustomNode';
import { StepToolbar } from './StepToolbar';
import type { FlowStep, StepType } from '../../types';

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

// Convert FlowStep to React Flow Node
function stepToNode(step: FlowStep): Node {
  return {
    id: step.id,
    type: 'custom',
    position: step.position,
    data: {
      label: step.name,
      stepType: step.type,
      actor: step.actor,
      description: step.description,
      flowType: step.flowType,
      conditionName: step.conditionName,
      branches: step.branches,
    },
    draggable: true,
  };
}

// Convert FlowStep connections to React Flow Edges
function stepsToEdges(steps: FlowStep[]): Edge[] {
  const edges: Edge[] = [];
  
  steps.forEach((step) => {
    // Regular next steps
    step.nextStepIds.forEach((nextId) => {
      if (nextId) {
        edges.push({
          id: `${step.id}-${nextId}`,
          source: step.id,
          target: nextId,
          type: 'smoothstep',
          animated: false,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { strokeWidth: 2 },
        });
      }
    });
    
    // Branch connections (for decision nodes)
    step.branches?.forEach((branch) => {
      if (branch.nextStepId) {
        edges.push({
          id: `${step.id}-${branch.id}-${branch.nextStepId}`,
          source: step.id,
          target: branch.nextStepId,
          type: 'smoothstep',
          label: branch.label,
          labelStyle: { fontSize: 11, fontWeight: 500 },
          labelBgStyle: { fill: '#fff', fillOpacity: 0.9 },
          labelBgPadding: [4, 4] as [number, number],
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { strokeWidth: 2 },
          animated: false,
        });
      }
    });
  });
  
  return edges;
}

function FlowCanvasInner() {
  const { 
    getCurrentProject, 
    updateStep, 
    selectStep,
    showAsIs,
    showToBe 
  } = useStore();
  
  const project = getCurrentProject();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // Filter steps based on AS-IS/TO-BE visibility
  const visibleSteps = useMemo(() => {
    if (!project) return [];
    
    if (project.flowType === 'comparison') {
      return project.steps.filter((step) => {
        if (step.flowType === 'both') return true;
        if (step.flowType === 'as-is' && showAsIs) return true;
        if (step.flowType === 'to-be' && showToBe) return true;
        return false;
      });
    }
    
    return project.steps;
  }, [project, showAsIs, showToBe]);
  
  // Convert steps to nodes and edges
  const initialNodes = useMemo(() => visibleSteps.map(stepToNode), [visibleSteps]);
  const initialEdges = useMemo(() => stepsToEdges(visibleSteps), [visibleSteps]);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Sync with store when steps change
  React.useEffect(() => {
    setNodes(visibleSteps.map(stepToNode));
    setEdges(stepsToEdges(visibleSteps));
  }, [visibleSteps, setNodes, setEdges]);
  
  // Handle node position changes
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      updateStep(node.id, { position: node.position });
    },
    [updateStep]
  );
  
  // Handle node selection
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectStep(node.id);
    },
    [selectStep]
  );
  
  // Handle edge connections
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      
      const sourceStep = project?.steps.find((s) => s.id === connection.source);
      if (!sourceStep) return;
      
      // Update the source step's nextStepIds
      const newNextStepIds = [...sourceStep.nextStepIds];
      if (!newNextStepIds.includes(connection.target)) {
        newNextStepIds.push(connection.target);
        updateStep(sourceStep.id, { nextStepIds: newNextStepIds });
      }
      
      setEdges((eds) => addEdge({
        ...connection,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 2 },
      }, eds));
    },
    [project, updateStep, setEdges]
  );
  
  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    selectStep(null);
  }, [selectStep]);

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="text-center">
          <p className="text-lg mb-2">프로젝트를 선택하세요</p>
          <p className="text-sm">좌측 사이드바에서 프로젝트를 선택하거나 새로 생성하세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative" ref={reactFlowWrapper}>
      <ReactFlow
        id="flowchart-canvas"
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
        }}
      >
        <Background color="#e2e8f0" gap={15} />
        <Controls position="bottom-right" />
        <MiniMap 
          nodeStrokeColor="#64748b"
          nodeColor={(node) => {
            const stepType = node.data?.stepType as StepType;
            switch (stepType) {
              case 'start': return '#22c55e';
              case 'end': return '#ef4444';
              case 'decision': return '#f59e0b';
              default: return '#3b82f6';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          position="bottom-left"
        />
        <Panel position="top-left">
          <StepToolbar />
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner />
    </ReactFlowProvider>
  );
}
