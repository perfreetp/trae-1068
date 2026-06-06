export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type ApiStatus = 'draft' | 'developing' | 'testing' | 'completed' | 'deprecated';

export type ParamType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file';

export type UserRole = 'admin' | 'developer' | 'viewer';

export type TestCaseStatus = 'active' | 'inactive';

export type TestRunResult = 'passed' | 'failed';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export type ConfirmationStatus = 'pending' | 'confirmed' | 'questioned';

export type NotificationType = 'change_confirmation' | 'review_result' | 'mention' | 'review_request';

export type NotificationFilterType = 'all' | 'unread' | 'read' | 'change_confirmation' | 'mention' | 'review_result' | 'my_review' | 'my_confirmation';

export type TimelineItemType = 'submit' | 'reviewer_assign' | 'confirmation_assign' | 'confirm' | 'question' | 'approve' | 'reject' | 'reminder';

export type TodoStatus = 'pending' | 'completed' | 'overdue';

export type TodoType = 'confirmation' | 'review' | 'mention' | 'my_review_pending';

export type EnvironmentType = 'local' | 'test' | 'staging' | 'production' | 'custom';

export interface Param {
  id: string;
  name: string;
  type: ParamType;
  required: boolean;
  description: string;
  example: string;
  children?: Param[];
}

export interface ApiRequest {
  headers: Param[];
  query: Param[];
  body: Param[];
}

export interface ResponseExample {
  name: string;
  statusCode: number;
  description: string;
  data: any;
}

export interface ApiResponse {
  success: ResponseExample;
  error: ResponseExample[];
}

export interface Api {
  id: string;
  name: string;
  description: string;
  method: HttpMethod;
  path: string;
  moduleId: string;
  status: ApiStatus;
  creator: string;
  owner: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  request: ApiRequest;
  response: ApiResponse;
}

export interface Module {
  id: string;
  name: string;
  parentId: string | null;
  description: string;
  children?: Module[];
}

export interface Assertion {
  id: string;
  type: 'status' | 'body' | 'header';
  operator: string;
  expected: string;
  actual?: string;
  passed?: boolean;
}

export interface TestCase {
  id: string;
  name: string;
  apiId: string;
  description: string;
  status: TestCaseStatus;
  request: {
    headers: Record<string, string>;
    query: Record<string, string>;
    body: any;
  };
  expected: {
    statusCode: number;
    body: any;
    assertions: Assertion[];
  };
  lastRunResult?: TestRunResult;
  lastRunAt?: string;
  creator: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeItem {
  field: string;
  oldValue: string;
  newValue: string;
  type: 'add' | 'remove' | 'modify';
}

export interface ReviewComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface ConfirmationItem {
  id: string;
  userId: string;
  status: ConfirmationStatus;
  comment?: string;
  confirmedAt?: string;
  deadline?: string;
}

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  userId?: string;
  targetUserId?: string;
  content: string;
  note?: string;
  createdAt: string;
}

export interface DebugEnvironment {
  id: string;
  name: string;
  type: EnvironmentType;
  baseUrl: string;
  headers: Array<{ key: string; value: string; enabled: boolean }>;
  isDefault?: boolean;
}

export interface ChangeRecord {
  id: string;
  apiId: string;
  version: string;
  title: string;
  description: string;
  changeReason: string;
  changes: ChangeItem[];
  submitter: string;
  status: ReviewStatus;
  reviewerId?: string;
  confirmations: ConfirmationItem[];
  reviewComments?: ReviewComment[];
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
  deadline?: string;
  timeline: TimelineItem[];
}

export interface Member {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  joinedAt: string;
}

export interface Comment {
  id: string;
  apiId: string;
  content: string;
  author: string;
  mentions: string[];
  replyTo?: string;
  parentId?: string;
  createdAt: string;
}

export interface TodoItem {
  id: string;
  type: TodoType;
  title: string;
  description: string;
  relatedId: string;
  relatedType: 'api' | 'change' | 'comment';
  status: TodoStatus;
  priority: 'high' | 'medium' | 'low';
  assigneeId: string;
  creatorId: string;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ErrorCode {
  code: string;
  message: string;
  description: string;
  module: string;
}

export interface DebugHistory {
  id: string;
  apiId: string;
  name: string;
  method: HttpMethod;
  url: string;
  request: {
    headers: Record<string, string>;
    query: Record<string, string>;
    body: any;
  };
  response?: {
    status: number;
    statusText: string;
    data: any;
    headers: Record<string, string>;
    duration: number;
  };
  createdAt: string;
}

export interface DebugPreset {
  id: string;
  apiId: string;
  name: string;
  method: HttpMethod;
  url: string;
  bodyTab: 'none' | 'json' | 'form';
  headers: Array<{ key: string; value: string; enabled: boolean }>;
  queryParams: Array<{ key: string; value: string; enabled: boolean }>;
  bodyJson: string;
  formData: Array<{ key: string; value: string; enabled: boolean }>;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  isShared: boolean;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  read: boolean;
  userId: string;
  relatedId: string;
  relatedType: 'api' | 'change' | 'comment';
  senderId?: string;
  createdAt: string;
  readAt?: string;
}

export interface ProjectInfo {
  id: string;
  name: string;
  description: string;
  visibility: 'private' | 'team' | 'public';
  createdAt: string;
  updatedAt: string;
}
