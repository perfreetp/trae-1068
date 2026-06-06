import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Api, Module, TestCase, ChangeRecord, Comment, ErrorCode, DebugHistory, DebugPreset, Notification, ConfirmationStatus, ReviewStatus } from '@/types';
import { mockApis } from '@/mock/api';
import { mockModules } from '@/mock/modules';
import { mockTestCases } from '@/mock/testCases';
import { mockChangeRecords } from '@/mock/changes';
import { mockComments } from '@/mock/comments';
import { mockErrorCodes } from '@/mock/errorCodes';
import { mockNotifications } from '@/mock/notifications';

interface ApiStore {
  apis: Api[];
  modules: Module[];
  testCases: TestCase[];
  changeRecords: ChangeRecord[];
  comments: Comment[];
  errorCodes: ErrorCode[];
  debugHistory: DebugHistory[];
  debugPresets: DebugPreset[];
  notifications: Notification[];
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
  getNotificationsByUserId: (userId: string) => Notification[];
  getUnreadNotificationCount: (userId: string) => number;
  
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
  
  addDebugPreset: (preset: Omit<DebugPreset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDebugPreset: (id: string, updates: Partial<DebugPreset>) => void;
  deleteDebugPreset: (id: string) => void;
  getDebugPresetsByApiId: (apiId: string) => DebugPreset[];
  
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  
  updateChangeRecord: (id: string, updates: Partial<ChangeRecord>) => void;
  updateConfirmationStatus: (changeId: string, confirmationId: string, status: ConfirmationStatus, comment?: string) => void;
  reviewChange: (id: string, status: ReviewStatus, reviewerId: string, note?: string) => void;
  addChangeRecord: (record: Omit<ChangeRecord, 'id' | 'createdAt'>) => void;
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

export const useApiStore = create<ApiStore>()(
  persist(
    (set, get) => ({
      apis: mockApis,
      modules: mockModules,
      testCases: mockTestCases,
      changeRecords: mockChangeRecords,
      comments: mockComments,
      errorCodes: mockErrorCodes,
      debugHistory: [],
      debugPresets: [],
      notifications: mockNotifications,
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
      getNotificationsByUserId: (userId) => 
        get().notifications.filter((n) => n.userId === userId).sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      getUnreadNotificationCount: (userId) => 
        get().notifications.filter((n) => n.userId === userId && !n.read).length,

      toggleFavorite: (apiId) =>
        set((state) => ({
          apis: state.apis.map((a) =>
            a.id === apiId ? { ...a, isFavorite: !a.isFavorite } : a
          ),
        })),

      addComment: (comment) => {
        const newComment = {
          ...comment,
          id: `c${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          comments: [...state.comments, newComment],
        }));
        
        if (comment.mentions && comment.mentions.length > 0) {
          const api = get().getApiById(comment.apiId);
          comment.mentions.forEach((userId) => {
            get().addNotification({
              type: 'mention',
              title: '有人在评论中 @ 了您',
              content: `${comment.author} 在【${api?.name || '接口'}】评论中提到了您`,
              read: false,
              userId,
              relatedId: comment.apiId,
              relatedType: 'api',
              senderId: comment.author,
            });
          });
        }
      },

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

      addDebugPreset: (preset) =>
        set((state) => ({
          debugPresets: [
            ...state.debugPresets,
            {
              ...preset,
              id: `dp${Date.now()}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),

      updateDebugPreset: (id, updates) =>
        set((state) => ({
          debugPresets: state.debugPresets.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        })),

      deleteDebugPreset: (id) =>
        set((state) => ({
          debugPresets: state.debugPresets.filter((p) => p.id !== id),
        })),

      getDebugPresetsByApiId: (apiId) => 
        get().debugPresets.filter((p) => p.apiId === apiId),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n
          ),
        })),

      markAllNotificationsRead: (userId) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.userId === userId && !n.read ? { ...n, read: true, readAt: new Date().toISOString() } : n
          ),
        })),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            {
              ...notification,
              id: `n${Date.now()}`,
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateChangeRecord: (id, updates) =>
        set((state) => ({
          changeRecords: state.changeRecords.map((cr) =>
            cr.id === id ? { ...cr, ...updates } : cr
          ),
        })),

      updateConfirmationStatus: (changeId, confirmationId, status, comment) =>
        set((state) => ({
          changeRecords: state.changeRecords.map((cr) =>
            cr.id === changeId
              ? {
                  ...cr,
                  confirmations: cr.confirmations.map((c) =>
                    c.id === confirmationId
                      ? { ...c, status, comment, confirmedAt: new Date().toISOString() }
                      : c
                  ),
                }
              : cr
          ),
        })),

      reviewChange: (id, status, reviewerId, note) => {
        const changeRecord = get().changeRecords.find((cr) => cr.id === id);
        if (!changeRecord) return;

        set((state) => ({
          changeRecords: state.changeRecords.map((cr) =>
            cr.id === id
              ? {
                  ...cr,
                  status,
                  reviewedAt: new Date().toISOString(),
                  reviewedBy: reviewerId,
                  reviewNote: note,
                }
              : cr
          ),
        }));

        const api = get().getApiById(changeRecord.apiId);
        get().addNotification({
          type: 'review_result',
          title: status === 'approved' ? '评审已通过' : '评审已拒绝',
          content: `您提交的【${changeRecord.title}】变更${status === 'approved' ? '已通过' : '被拒绝'}`,
          read: false,
          userId: changeRecord.submitter,
          relatedId: id,
          relatedType: 'change',
          senderId: reviewerId,
        });
      },

      addChangeRecord: (record) => {
        const newRecord = {
          ...record,
          id: `cr${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          changeRecords: [...state.changeRecords, newRecord],
        }));

        if (record.reviewerId) {
          const api = get().getApiById(record.apiId);
          get().addNotification({
            type: 'review_request',
            title: '待您评审',
            content: `【${api?.name || '接口'}】接口变更请求待您评审`,
            read: false,
            userId: record.reviewerId,
            relatedId: newRecord.id,
            relatedType: 'change',
            senderId: record.submitter,
          });
        }

        record.confirmations.forEach((conf) => {
          const api = get().getApiById(record.apiId);
          get().addNotification({
            type: 'change_confirmation',
            title: '接口变更待确认',
            content: `【${api?.name || '接口'}】接口有变更需要您确认`,
            read: false,
            userId: conf.userId,
            relatedId: newRecord.id,
            relatedType: 'change',
            senderId: record.submitter,
          });
        });
      },
    }),
    {
      name: 'api-collab-storage',
      partialize: (state) => ({
        debugPresets: state.debugPresets,
        notifications: state.notifications,
        apis: state.apis,
        comments: state.comments,
        changeRecords: state.changeRecords,
        testCases: state.testCases,
      }),
    }
  )
);
