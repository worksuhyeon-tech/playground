import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { 
  Project, 
  FlowStep, 
  TestScenario, 
  User, 
  FlowType
} from '../types';

interface StoreState {
  // Auth
  currentUser: User | null;
  isLoggedIn: boolean;
  
  // Projects
  projects: Project[];
  currentProjectId: string | null;
  
  // UI State
  selectedStepId: string | null;
  activeTab: 'flowchart' | 'scenarios' | 'description';
  comparisonMode: boolean;
  showAsIs: boolean;
  showToBe: boolean;
  
  // Actions - Auth
  login: (user: User) => void;
  logout: () => void;
  
  // Actions - Projects
  createProject: (name: string, description: string, flowType: FlowType) => string;
  deleteProject: (id: string) => void;
  selectProject: (id: string | null) => void;
  updateProjectName: (id: string, name: string) => void;
  saveVersion: (projectId: string, versionName: string) => void;
  restoreVersion: (projectId: string, version: number) => void;
  
  // Actions - Steps
  addStep: (step: Omit<FlowStep, 'id'>) => string;
  updateStep: (id: string, updates: Partial<FlowStep>) => void;
  deleteStep: (id: string) => void;
  selectStep: (id: string | null) => void;
  
  // Actions - Test Scenarios
  setTestScenarios: (scenarios: TestScenario[]) => void;
  updateTestScenario: (id: string, updates: Partial<TestScenario>) => void;
  deleteTestScenario: (id: string) => void;
  
  // Actions - UI
  setActiveTab: (tab: 'flowchart' | 'scenarios' | 'description') => void;
  toggleComparisonMode: () => void;
  setShowAsIs: (show: boolean) => void;
  setShowToBe: (show: boolean) => void;
  
  // Getters
  getCurrentProject: () => Project | null;
  getStep: (id: string) => FlowStep | undefined;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      isLoggedIn: false,
      projects: [],
      currentProjectId: null,
      selectedStepId: null,
      activeTab: 'flowchart',
      comparisonMode: false,
      showAsIs: true,
      showToBe: true,
      
      // Auth actions
      login: (user) => set({ currentUser: user, isLoggedIn: true }),
      logout: () => set({ currentUser: null, isLoggedIn: false }),
      
      // Project actions
      createProject: (name, description, flowType) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const newProject: Project = {
          id,
          name,
          description,
          flowType,
          steps: [],
          testScenarios: [],
          createdAt: now,
          updatedAt: now,
          version: 1,
          versions: [],
        };
        set((state) => ({
          projects: [...state.projects, newProject],
          currentProjectId: id,
        }));
        return id;
      },
      
      deleteProject: (id) => set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
      })),
      
      selectProject: (id) => set({ currentProjectId: id, selectedStepId: null }),
      
      updateProjectName: (id, name) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p
        ),
      })),
      
      saveVersion: (projectId, versionName) => set((state) => ({
        projects: state.projects.map((p) => {
          if (p.id !== projectId) return p;
          const newVersion = {
            version: p.version,
            name: versionName,
            steps: JSON.parse(JSON.stringify(p.steps)),
            testScenarios: JSON.parse(JSON.stringify(p.testScenarios)),
            createdAt: new Date().toISOString(),
          };
          return {
            ...p,
            version: p.version + 1,
            versions: [...p.versions, newVersion],
            updatedAt: new Date().toISOString(),
          };
        }),
      })),
      
      restoreVersion: (projectId, version) => set((state) => ({
        projects: state.projects.map((p) => {
          if (p.id !== projectId) return p;
          const targetVersion = p.versions.find((v) => v.version === version);
          if (!targetVersion) return p;
          return {
            ...p,
            steps: JSON.parse(JSON.stringify(targetVersion.steps)),
            testScenarios: JSON.parse(JSON.stringify(targetVersion.testScenarios)),
            updatedAt: new Date().toISOString(),
          };
        }),
      })),
      
      // Step actions
      addStep: (step) => {
        const id = uuidv4();
        set((state) => {
          const project = state.projects.find((p) => p.id === state.currentProjectId);
          if (!project) return state;
          
          return {
            projects: state.projects.map((p) =>
              p.id === state.currentProjectId
                ? {
                    ...p,
                    steps: [...p.steps, { ...step, id }],
                    updatedAt: new Date().toISOString(),
                  }
                : p
            ),
          };
        });
        return id;
      },
      
      updateStep: (id, updates) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === state.currentProjectId
            ? {
                ...p,
                steps: p.steps.map((s) => (s.id === id ? { ...s, ...updates } : s)),
                updatedAt: new Date().toISOString(),
              }
            : p
        ),
      })),
      
      deleteStep: (id) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === state.currentProjectId
            ? {
                ...p,
                steps: p.steps.filter((s) => s.id !== id).map((s) => ({
                  ...s,
                  nextStepIds: s.nextStepIds.filter((nid) => nid !== id),
                  branches: s.branches?.map((b) => ({
                    ...b,
                    nextStepId: b.nextStepId === id ? '' : b.nextStepId,
                  })),
                })),
                updatedAt: new Date().toISOString(),
              }
            : p
        ),
        selectedStepId: state.selectedStepId === id ? null : state.selectedStepId,
      })),
      
      selectStep: (id) => set({ selectedStepId: id }),
      
      // Test scenario actions
      setTestScenarios: (scenarios) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === state.currentProjectId
            ? { ...p, testScenarios: scenarios, updatedAt: new Date().toISOString() }
            : p
        ),
      })),
      
      updateTestScenario: (id, updates) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === state.currentProjectId
            ? {
                ...p,
                testScenarios: p.testScenarios.map((s) =>
                  s.id === id ? { ...s, ...updates } : s
                ),
                updatedAt: new Date().toISOString(),
              }
            : p
        ),
      })),
      
      deleteTestScenario: (id) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === state.currentProjectId
            ? {
                ...p,
                testScenarios: p.testScenarios.filter((s) => s.id !== id),
                updatedAt: new Date().toISOString(),
              }
            : p
        ),
      })),
      
      // UI actions
      setActiveTab: (tab) => set({ activeTab: tab }),
      toggleComparisonMode: () => set((state) => ({ comparisonMode: !state.comparisonMode })),
      setShowAsIs: (show) => set({ showAsIs: show }),
      setShowToBe: (show) => set({ showToBe: show }),
      
      // Getters
      getCurrentProject: () => {
        const state = get();
        return state.projects.find((p) => p.id === state.currentProjectId) || null;
      },
      
      getStep: (id) => {
        const project = get().getCurrentProject();
        return project?.steps.find((s) => s.id === id);
      },
    }),
    {
      name: 'flowclaim-storage',
    }
  )
);
