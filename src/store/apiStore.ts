import { create } from 'zustand';
import { Api, Module, TestCase, ChangeRecord, Comment, ErrorCode, DebugHistory } from '@/types';
import { mockApis } from '@/mock/api';
import { mockModules } from '@/mock/modules';
import { mockTestCases } from '@/mock/testCases';
import { mockChangeRecords } from '@/mock/changes';
import { mockComments } from '@/mock/comments';
import { mockErrorCodes } from '@/mock/errorCodes';

interface ApiStore {
  apis: Api[];
  modules: Module[];
  testCases: TestCase[];
  changeRecords: ChangeRecord[];
  comments: Comment[];
  errorCodes: ErrorCode[];
  debugHistory: DebugHistory[];
  selectedModuleId: string | null;
  searchKeyword: string;
  statusFilter: string;
  
  setSelectedModuleId: (id: string | null) => void;
  setSearchKeyword: (keyword: string) => void;
  setStatusFilter: (status: string) => void;
  
  getApiById: (id: string) => Api | undefined;
  getModuleById: (id: string) => Module | undefined;
  getApisByModuleId: (moduleId: string) => Api[];
  getCommentsByApiId: (apiId: string) => Comment[];
  getTestCasesByApiId: (apiId: string) => TestCase[];
  getChangeRecordsByApiId: (apiId: string) => ChangeRecord[];
  
  toggleFavorite: (apiId: string) => void;
  addComment: (comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  addDebugHistory: (item: Omit<DebugHistory, 'id' | 'createdAt'>) => void;
  getFilteredApis: () => Api[];
  
  addApi: (api: Omit<Api, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateApi: (id: string, updates: Partial<Api>) => void;
  deleteApi: (id: string) => void;
  
  addTestCase: (tc: Omit<TestCase, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  deleteTestCase: (id: string) => void;
  runTestCase: (id: string) => void;
}

const flattenModules = (modules: Module[]): Module[] => {
  const result: Module[] = [];
  const traverse = (items: Module[]) => {
    items.forEach((m) => {
      result.push(m);
      if (m.children) traverse(m.children);
    });
  };
  traverse(modules);
  return result;
};

export const useApiStore = create<ApiStore>((set, get) => ({
  apis: mockApis,
  modules: mockModules,
  testCases: mockTestCases,
  changeRecords: mockChangeRecords,
  comments: mockComments,
  errorCodes: mockErrorCodes,
  debugHistory: [],
  selectedModuleId: null,
  searchKeyword: '',
  statusFilter: '',

  setSelectedModuleId: (id) => set({ selectedModuleId: id }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  setStatusFilter: (status) => set({ statusFilter: status }),

  getApiById: (id) => get().apis.find((a) => a.id === id),
  getModuleById: (id) => flattenModules(get().modules).find((m) => m.id === id),
  
  getApisByModuleId: (moduleId) => {
    const allModuleIds = [moduleId];
    const findChildren = (parentId: string, modules: Module[]) => {
      modules.forEach((m) => {
        if (m.parentId === parentId) {
          allModuleIds.push(m.id);
          if (m.children) findChildren(m.id, m.children);
        }
      });
    };
    findChildren(moduleId, flattenModules(get().modules));
    return get().apis.filter((a) => allModuleIds.includes(a.moduleId));
  },

  getCommentsByApiId: (apiId) => get().comments.filter((c) => c.apiId === apiId),
  getTestCasesByApiId: (apiId) => get().testCases.filter((tc) => tc.apiId === apiId),
  getChangeRecordsByApiId: (apiId) => get().changeRecords.filter((cr) => cr.apiId === apiId),

  toggleFavorite: (apiId) =>
    set((state) => ({
      apis: state.apis.map((a) =>
        a.id === apiId ? { ...a, isFavorite: !a.isFavorite } : a
      ),
    })),

  addComment: (comment) =>
    set((state) => ({
      comments: [
        ...state.comments,
        {
          ...comment,
          id: `c${Date.now()}`,
          createdAt: new Date().toISOString(),
        },
      ],
    })),

  addDebugHistory: (item) =>
    set((state) => ({
      debugHistory: [
        {
          ...item,
          id: `dh${Date.now()}`,
          createdAt: new Date().toISOString(),
        },
        ...state.debugHistory,
      ].slice(0, 50),
    })),

  getFilteredApis: () => {
    const { apis, selectedModuleId, searchKeyword, statusFilter, getApisByModuleId } = get();
    let result = selectedModuleId ? getApisByModuleId(selectedModuleId) : apis;
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(kw) ||
          a.path.toLowerCase().includes(kw) ||
          a.description.toLowerCase().includes(kw)
      );
    }
    if (statusFilter) {
      result = result.filter((a) => a.status === statusFilter);
    }
    return result;
  },

  addApi: (api) =>
    set((state) => ({
      apis: [
        ...state.apis,
        {
          ...api,
          id: `api${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    })),

  updateApi: (id, updates) =>
    set((state) => ({
      apis: state.apis.map((a) =>
        a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
      ),
    })),

  deleteApi: (id) =>
    set((state) => ({
      apis: state.apis.filter((a) => a.id !== id),
    })),

  addTestCase: (tc) =>
    set((state) => ({
      testCases: [
        ...state.testCases,
        {
          ...tc,
          id: `tc${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    })),

  updateTestCase: (id, updates) =>
    set((state) => ({
      testCases: state.testCases.map((tc) =>
        tc.id === id ? { ...tc, ...updates, updatedAt: new Date().toISOString() } : tc
      ),
    })),

  deleteTestCase: (id) =>
    set((state) => ({
      testCases: state.testCases.filter((tc) => tc.id !== id),
    })),

  runTestCase: (id) =>
    set((state) => ({
      testCases: state.testCases.map((tc) =>
        tc.id === id
          ? {
              ...tc,
              lastRunResult: Math.random() > 0.3 ? 'passed' : 'failed',
              lastRunAt: new Date().toISOString(),
            }
          : tc
      ),
    })),
}));
