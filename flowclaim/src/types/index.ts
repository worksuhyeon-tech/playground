// Step/Node types
export type StepType = 'start' | 'end' | 'process' | 'decision';
export type ActorType = 'customer' | 'staff' | 'system' | 'external' | 'other';
export type FlowType = 'as-is' | 'to-be' | 'comparison';
export type TestResult = 'pass' | 'fail' | 'pending' | 'blocked';
export type Priority = 'high' | 'medium' | 'low';

// Branch condition for decision nodes
export interface BranchCondition {
  id: string;
  label: string;  // e.g., "Yes", "No", "A", "B", "C"
  nextStepId: string;
}

// Flow step (node)
export interface FlowStep {
  id: string;
  name: string;
  description: string;
  actor: ActorType;
  type: StepType;
  nextStepIds: string[];  // For non-decision nodes
  branches?: BranchCondition[];  // For decision nodes
  conditionName?: string;  // For decision nodes - e.g., "접수완료 여부"
  position: { x: number; y: number };
  flowType: 'as-is' | 'to-be' | 'both';  // Which flow this step belongs to
}

// Test scenario
export interface TestScenario {
  id: string;
  name: string;
  path: string[];  // Step IDs in order
  pathDescription: string;  // Human readable path
  branchConditions: { stepId: string; stepName: string; condition: string; value: string }[];
  preconditions: string;
  testData: string;
  steps: string;
  expectedResult: string;
  priority: Priority;
  assignee: string;
  result: TestResult;
  notes: string;
}

// Project
export interface Project {
  id: string;
  name: string;
  description: string;
  flowType: FlowType;
  steps: FlowStep[];
  testScenarios: TestScenario[];
  createdAt: string;
  updatedAt: string;
  version: number;
  versions: ProjectVersion[];
}

// Project version for history
export interface ProjectVersion {
  version: number;
  name: string;
  steps: FlowStep[];
  testScenarios: TestScenario[];
  createdAt: string;
}

// User for login
export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
}

// App state
export interface AppState {
  currentUser: User | null;
  projects: Project[];
  currentProjectId: string | null;
  selectedStepId: string | null;
  activeTab: 'flowchart' | 'scenarios' | 'description';
  comparisonMode: boolean;
  showAsIs: boolean;
  showToBe: boolean;
}

// Actor display names (Korean)
export const ACTOR_LABELS: Record<ActorType, string> = {
  customer: '고객',
  staff: '보상직원',
  system: '시스템',
  external: '외부기관',
  other: '기타',
};

// Step type display names (Korean)
export const STEP_TYPE_LABELS: Record<StepType, string> = {
  start: '시작',
  end: '종료',
  process: '프로세스',
  decision: '분기',
};

// Flow type display names (Korean)
export const FLOW_TYPE_LABELS: Record<FlowType, string> = {
  'as-is': 'AS-IS',
  'to-be': 'TO-BE',
  comparison: '비교',
};

// Priority display names (Korean)
export const PRIORITY_LABELS: Record<Priority, string> = {
  high: '높음',
  medium: '중간',
  low: '낮음',
};

// Test result display names (Korean)
export const TEST_RESULT_LABELS: Record<TestResult, string> = {
  pass: '통과',
  fail: '실패',
  pending: '대기',
  blocked: '차단됨',
};
