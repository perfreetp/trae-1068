import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Api, Module, TestCase, ChangeRecord, Comment, ErrorCode, DebugHistory, DebugPreset, Notification, ConfirmationStatus, ReviewStatus, DebugEnvironment, TodoItem, TimelineItem, TimelineItemType } from '@/types';
import { mockApis } from '@/mock/api';
import { mockModules } from '@/mock/modules';
import { mockTestCases } from '@/mock/testCases';
import { mockChangeRecords } from '@/mock/changes';
import { mockComments } from '@/mock/comments';
import { mockErrorCodes } from '@/mock/errorCodes';
import { mockNotifications } from '@/mock/notifications';
import { mockEnvironments } from '@/mock/environments';
import { mockTodos } from '@/mock/todos';

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
  environments: DebugEnvironment[];
  todos: TodoItem[];
  selectedModuleId: string | null;
  searchKeyword: string;
  statusFilter: string;
  selectedEnvironmentId: string;
  
  setSelectedModuleId: (id: string | null) => void;
  setSearchKeyword: (keyword: string) => void;
  setStatusFilter: (status: string) => void;
  setSelectedEnvironmentId: (id: string) => void;
  
  getApiById: (id: string) => Api | undefined;
  getModuleById: (id: string) => Module | undefined;
  getApisByModuleId: (moduleId: string) => Api[];
  getCommentsByApiId: (apiId: string) => Comment[];
  getTestCasesByApiId: (apiId: string) => TestCase[];
  getChangeRecordsByApiId: (apiId: string) => ChangeRecord[];
  getNotificationsByUserId: (userId: string) => Notification[];
  getUnreadNotificationCount: (userId: string) => number;
  getTodosByUserId: (userId: string) => TodoItem[];
  getMyDebugPresets: (apiId: string, userId: string) => DebugPreset[];
  getSharedPresets: (apiId: string) => DebugPreset[];
  
  toggleFavorite: (apiId: string) => void;
  addComment: (comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  addApiComment: (comment: Omit<Comment, 'id' | 'createdAt'>) => void;
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
  sharePreset: (id: string, isShared: boolean) => void;
  copyPreset: (preset: DebugPreset, userId: string) => string;
  
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  
  updateChangeRecord: (id: string, updates: Partial<ChangeRecord>) => void;
  updateConfirmationStatus: (changeId: string, confirmationId: string, status: ConfirmationStatus, comment?: string) => void;
  reviewChange: (id: string, status: ReviewStatus, reviewerId: string, note?: string) => void;
  addChangeRecord: (record: Omit<ChangeRecord, 'id' | 'createdAt' | 'timeline'>) => void;
  addTimelineItem: (changeId: string, item: Omit<TimelineItem, 'id' | 'createdAt'>) => void;
  sendReminder: (changeId: string, targetUserId: string, senderId: string) => void;
  
  addEnvironment: (env: Omit<DebugEnvironment, 'id'>) => void;
  updateEnvironment: (id: string, updates: Partial<DebugEnvironment>) => void;
  deleteEnvironment: (id: string) => void;
  getCurrentEnvironment: () => DebugEnvironment | undefined;
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
      environments: mockEnvironments,
      todos: mockTodos,
      selectedModuleId: null,
      searchKeyword: '',
      statusFilter: '',
      selectedEnvironmentId: 'env-local',

      setSelectedModuleId: (id) => set({ selectedModuleId: id }),
      setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
      setStatusFilter: (status) => set({ statusFilter: status }),
      setSelectedEnvironmentId: (id) => set({ selectedEnvironmentId: id }),

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

      getTodosByUserId: (userId) => 
        get().todos.filter((t) => t.assigneeId === userId).sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),

      getMyDebugPresets: (apiId, userId) => 
        get().debugPresets.filter((p) => p.apiId === apiId && p.ownerId === userId && !p.isShared),

      getSharedPresets: (apiId) => 
        get().debugPresets.filter((p) => p.apiId === apiId && p.isShared),

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
        
        const mentionedUsers = comment.mentions || comment.mentionedUserIds || [];
        if (mentionedUsers.length > 0) {
          const api = get().getApiById(comment.apiId);
          const senderName = comment.author || comment.userId || '有人';
          mentionedUsers.forEach((userId) => {
            get().addNotification({
              type: 'mention',
              title: '有人在评论中 @ 了您',
              content: `${senderName} 在【${api?.name || '接口'}】评论中提到了您`,
              read: false,
              userId,
              relatedId: comment.apiId,
              relatedType: 'api',
              senderId: comment.author || comment.userId,
              commentId: newComment.id,
            });
          });
        }
      },

      addApiComment: (comment) => {
        const newComment = {
          ...comment,
          id: `c${Date.now()}`,
          createdAt: new Date().toISOString(),
          author: comment.userId || comment.author || '',
          userId: comment.userId || comment.author || '',
          mentions: comment.mentionedUserIds || comment.mentions || [],
          mentionedUserIds: comment.mentionedUserIds || comment.mentions || [],
        };
        set((state) => ({
          comments: [...state.comments, newComment],
        }));
        
        const mentionedUsers = newComment.mentionedUserIds;
        if (mentionedUsers.length > 0) {
          const api = get().getApiById(comment.apiId);
          const senderName = newComment.author || '有人';
          mentionedUsers.forEach((userId) => {
            get().addNotification({
              type: 'mention',
              title: '有人在评论中 @ 了您',
              content: `${senderName} 在【${api?.name || '接口'}】评论中提到了您`,
              read: false,
              userId,
              relatedId: comment.apiId,
              relatedType: 'api',
              senderId: newComment.userId,
              commentId: newComment.id,
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

      sharePreset: (id, isShared) =>
        set((state) => ({
          debugPresets: state.debugPresets.map((p) =>
            p.id === id ? { ...p, isShared, updatedAt: new Date().toISOString() } : p
          ),
        })),

      copyPreset: (preset, userId) => {
        const newId = `dp${Date.now()}`;
        set((state) => ({
          debugPresets: [
            ...state.debugPresets,
            {
              ...preset,
              id: newId,
              name: `${preset.name} (副本)`,
              ownerId: userId,
              isShared: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }));
        return newId;
      },

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

      updateConfirmationStatus: (changeId, confirmationId, status, comment) => {
        const timelineType: TimelineItemType = status === 'confirmed' ? 'confirm' : 'question';
        get().addTimelineItem(changeId, {
          type: timelineType,
          userId: 'current-user',
          content: status === 'confirmed' ? '确认了变更' : '提出了疑问',
          note: comment,
        });
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
        }));
      },

      reviewChange: (id, status, reviewerId, note) => {
        const changeRecord = get().changeRecords.find((cr) => cr.id === id);
        if (!changeRecord) return;

        const timelineType: TimelineItemType = status === 'approved' ? 'approve' : 'reject';
        get().addTimelineItem(id, {
          type: timelineType,
          userId: reviewerId,
          content: status === 'approved' ? '通过了评审' : '驳回了评审',
          note,
        });

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
        const now = new Date().toISOString();
        const timeline: TimelineItem[] = [
          {
            id: `tl${Date.now()}-1`,
            type: 'submit',
            userId: record.submitter,
            content: '提交了变更申请',
            createdAt: now,
          },
        ];
        if (record.reviewerId) {
          timeline.push({
            id: `tl${Date.now()}-2`,
            type: 'reviewer_assign',
            userId: record.submitter,
            targetUserId: record.reviewerId,
            content: '指定了评审人',
            createdAt: now,
          });
        }
        record.confirmations.forEach((conf, idx) => {
          timeline.push({
            id: `tl${Date.now()}-${3 + idx}`,
            type: 'confirmation_assign',
            userId: record.submitter,
            targetUserId: conf.userId,
            content: '指定了确认人',
            createdAt: now,
          });
        });

        const newRecord = {
          ...record,
          id: `cr${Date.now()}`,
          createdAt: now,
          timeline,
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

      addTimelineItem: (changeId, item) =>
        set((state) => ({
          changeRecords: state.changeRecords.map((cr) =>
            cr.id === changeId
              ? {
                  ...cr,
                  timeline: [
                    ...cr.timeline,
                    { ...item, id: `tl${Date.now()}`, createdAt: new Date().toISOString() },
                  ],
                }
              : cr
          ),
        })),

      sendReminder: (changeId, targetUserId, senderId) => {
        const changeRecord = get().changeRecords.find((cr) => cr.id === changeId);
        if (!changeRecord) return;

        get().addTimelineItem(changeId, {
          type: 'reminder',
          userId: senderId,
          targetUserId,
          content: '发送了催办提醒',
        });

        const api = get().getApiById(changeRecord.apiId);
        get().addNotification({
          type: 'change_confirmation',
          title: '变更处理催办',
          content: `请尽快处理【${api?.name || '接口'}】的变更`,
          read: false,
          userId: targetUserId,
          relatedId: changeId,
          relatedType: 'change',
          senderId,
        });
      },

      addEnvironment: (env) =>
        set((state) => ({
          environments: [...state.environments, { ...env, id: `env${Date.now()}` }],
        })),

      updateEnvironment: (id, updates) =>
        set((state) => ({
          environments: state.environments.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),

      deleteEnvironment: (id) =>
        set((state) => ({
          environments: state.environments.filter((e) => e.id !== id),
        })),

      getCurrentEnvironment: () => {
        const { environments, selectedEnvironmentId } = get();
        return environments.find((e) => e.id === selectedEnvironmentId) || environments[0];
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
        environments: state.environments,
        todos: state.todos,
        selectedEnvironmentId: state.selectedEnvironmentId,
      }),
    }
  )
);
