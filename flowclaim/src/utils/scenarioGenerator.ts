import { v4 as uuidv4 } from 'uuid';
import type { FlowStep, TestScenario } from '../types';

interface PathResult {
  path: string[];
  branches: { stepId: string; stepName: string; condition: string; value: string }[];
}

/**
 * Find all paths from start to end nodes using DFS
 * Implements Branch Coverage strategy by default
 */
export function findAllPaths(
  steps: FlowStep[],
  maxPaths: number = 50
): PathResult[] {
  const paths: PathResult[] = [];
  const startNodes = steps.filter((s) => s.type === 'start');
  const stepMap = new Map(steps.map((s) => [s.id, s]));
  
  if (startNodes.length === 0) {
    // If no explicit start, try to find nodes with no incoming edges
    const incomingEdges = new Set<string>();
    steps.forEach((s) => {
      s.nextStepIds.forEach((id) => incomingEdges.add(id));
      s.branches?.forEach((b) => incomingEdges.add(b.nextStepId));
    });
    
    const potentialStarts = steps.filter((s) => !incomingEdges.has(s.id));
    if (potentialStarts.length > 0) {
      startNodes.push(...potentialStarts);
    } else if (steps.length > 0) {
      startNodes.push(steps[0]);
    }
  }
  
  function dfs(
    currentId: string,
    currentPath: string[],
    currentBranches: { stepId: string; stepName: string; condition: string; value: string }[],
    visited: Set<string>
  ) {
    if (paths.length >= maxPaths) return;
    
    const step = stepMap.get(currentId);
    if (!step) return;
    
    const newPath = [...currentPath, currentId];
    const newVisited = new Set(visited);
    newVisited.add(currentId);
    
    // Check if this is an end node or has no outgoing edges
    const isEndNode = step.type === 'end' || 
      (step.nextStepIds.length === 0 && (!step.branches || step.branches.length === 0));
    
    if (isEndNode) {
      paths.push({ path: newPath, branches: [...currentBranches] });
      return;
    }
    
    // Handle decision nodes
    if (step.type === 'decision' && step.branches && step.branches.length > 0) {
      for (const branch of step.branches) {
        if (branch.nextStepId && !visited.has(branch.nextStepId)) {
          const newBranches = [
            ...currentBranches,
            {
              stepId: step.id,
              stepName: step.name,
              condition: step.conditionName || step.name,
              value: branch.label,
            },
          ];
          dfs(branch.nextStepId, newPath, newBranches, newVisited);
        }
      }
    } else {
      // Handle regular nodes
      for (const nextId of step.nextStepIds) {
        if (nextId && !visited.has(nextId)) {
          dfs(nextId, newPath, currentBranches, newVisited);
        }
      }
    }
  }
  
  for (const startNode of startNodes) {
    if (paths.length >= maxPaths) break;
    dfs(startNode.id, [], [], new Set());
  }
  
  return paths;
}

/**
 * Generate test scenarios from paths
 */
export function generateTestScenarios(
  steps: FlowStep[],
  maxCases: number = 50
): TestScenario[] {
  const paths = findAllPaths(steps, maxCases);
  const stepMap = new Map(steps.map((s) => [s.id, s]));
  
  return paths.map((pathResult, index) => {
    const { path, branches } = pathResult;
    
    // Generate path description
    const pathNames = path
      .map((id) => stepMap.get(id)?.name || id)
      .join(' → ');
    
    // Generate scenario name
    const branchSummary = branches.length > 0
      ? branches.map((b) => `${b.condition}=${b.value}`).join(', ')
      : '기본 경로';
    
    // Generate test steps
    const testSteps = path
      .map((id, i) => {
        const step = stepMap.get(id);
        if (!step) return '';
        const branchInfo = branches.find((b) => b.stepId === id);
        const branchText = branchInfo ? ` [${branchInfo.condition}: ${branchInfo.value}]` : '';
        return `${i + 1}. ${step.name}${branchText}`;
      })
      .join('\n');
    
    // Generate expected result based on end node
    const endStepId = path[path.length - 1];
    const endStep = stepMap.get(endStepId);
    const expectedResult = endStep 
      ? `${endStep.name} 완료` 
      : '프로세스 완료';
    
    return {
      id: uuidv4(),
      name: `TC-${String(index + 1).padStart(3, '0')}: ${branchSummary}`,
      path,
      pathDescription: pathNames,
      branchConditions: branches,
      preconditions: branches.length > 0 
        ? branches.map((b) => `${b.condition}이(가) "${b.value}" 상태`).join('\n')
        : '없음',
      testData: '',
      steps: testSteps,
      expectedResult,
      priority: index < 5 ? 'high' : index < 15 ? 'medium' : 'low',
      assignee: '',
      result: 'pending',
      notes: '',
    };
  });
}

/**
 * Generate flow description text in natural language
 */
export function generateFlowDescription(steps: FlowStep[]): string {
  const paths = findAllPaths(steps, 10);
  const stepMap = new Map(steps.map((s) => [s.id, s]));
  
  const actorLabels: Record<string, string> = {
    customer: '고객',
    staff: '보상직원',
    system: '시스템',
    external: '외부기관',
    other: '담당자',
  };
  
  if (paths.length === 0) {
    return '플로우차트에 정의된 단계가 없습니다.';
  }
  
  let description = '## 업무 흐름 설명\n\n';
  
  // Describe main flow (first path)
  const mainPath = paths[0];
  description += '### 기본 프로세스\n\n';
  
  mainPath.path.forEach((stepId, index) => {
    const step = stepMap.get(stepId);
    if (!step) return;
    
    const actor = actorLabels[step.actor] || step.actor;
    if (step.type === 'start') {
      description += `${index + 1}. **${step.name}**: ${actor}이(가) ${step.description || '프로세스를 시작합니다'}.\n`;
    } else if (step.type === 'end') {
      description += `${index + 1}. **${step.name}**: ${step.description || '프로세스가 완료됩니다'}.\n`;
    } else if (step.type === 'decision') {
      const branch = mainPath.branches.find((b) => b.stepId === stepId);
      description += `${index + 1}. **${step.name}**: ${actor}이(가) ${step.conditionName || step.name}을(를) 판단합니다.`;
      if (branch) {
        description += ` (${branch.condition}: ${branch.value})`;
      }
      description += '\n';
    } else {
      description += `${index + 1}. **${step.name}**: ${actor}이(가) ${step.description || step.name}을(를) 수행합니다.\n`;
    }
  });
  
  // Describe alternative paths if any
  if (paths.length > 1) {
    description += '\n### 대체 경로\n\n';
    
    paths.slice(1, 5).forEach((path, pathIndex) => {
      const branchSummary = path.branches.length > 0
        ? path.branches.map((b) => `${b.condition}=${b.value}`).join(', ')
        : '대체 경로';
      
      description += `**경로 ${pathIndex + 2}** (${branchSummary}):\n`;
      description += path.path.map((id) => stepMap.get(id)?.name || id).join(' → ');
      description += '\n\n';
    });
  }
  
  // Statistics
  description += '\n### 통계\n\n';
  description += `- 총 단계 수: ${steps.length}개\n`;
  description += `- 분기 노드 수: ${steps.filter((s) => s.type === 'decision').length}개\n`;
  description += `- 가능한 경로 수: ${paths.length}개\n`;
  
  return description;
}
