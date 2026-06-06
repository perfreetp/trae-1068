import dayjs from 'dayjs';
import { HttpMethod, ApiStatus, UserRole, ReviewStatus, TestRunResult, TestCaseStatus } from '@/types';

export const formatDate = (date: string, format: string = 'YYYY-MM-DD HH:mm') => {
  return dayjs(date).format(format);
};

export const formatRelativeTime = (date: string) => {
  const diff = dayjs().diff(dayjs(date), 'minute');
  if (diff < 1) return '刚刚';
  if (diff < 60) return `${diff}分钟前`;
  const hours = Math.floor(diff / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return formatDate(date, 'YYYY-MM-DD');
};

export const getMethodColor = (method: HttpMethod): string => {
  const colors: Record<HttpMethod, string> = {
    GET: '#52c41a',
    POST: '#1890ff',
    PUT: '#faad14',
    DELETE: '#ff4d4f',
    PATCH: '#722ed1',
  };
  return colors[method];
};

export const getMethodBgColor = (method: HttpMethod): string => {
  const colors: Record<HttpMethod, string> = {
    GET: '#f6ffed',
    POST: '#e6f7ff',
    PUT: '#fffbe6',
    DELETE: '#fff1f0',
    PATCH: '#f9f0ff',
  };
  return colors[method];
};

export const getStatusText = (status: ApiStatus): string => {
  const texts: Record<ApiStatus, string> = {
    draft: '草稿',
    developing: '开发中',
    testing: '测试中',
    completed: '已完成',
    deprecated: '已废弃',
  };
  return texts[status];
};

export const getStatusColor = (status: ApiStatus): string => {
  const colors: Record<ApiStatus, string> = {
    draft: 'default',
    developing: 'processing',
    testing: 'warning',
    completed: 'success',
    deprecated: 'error',
  };
  return colors[status];
};

export const getRoleText = (role: UserRole): string => {
  const texts: Record<UserRole, string> = {
    admin: '管理员',
    developer: '开发者',
    viewer: '访客',
  };
  return texts[role];
};

export const getReviewStatusText = (status: ReviewStatus): string => {
  const texts: Record<ReviewStatus, string> = {
    pending: '待评审',
    approved: '已通过',
    rejected: '已拒绝',
  };
  return texts[status];
};

export const getReviewStatusColor = (status: ReviewStatus): string => {
  const colors: Record<ReviewStatus, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
  };
  return colors[status];
};

export const getRunResultText = (result?: TestRunResult): string => {
  if (!result) return '未执行';
  return result === 'passed' ? '通过' : '失败';
};

export const getRunResultColor = (result?: TestRunResult): string => {
  if (!result) return 'default';
  return result === 'passed' ? 'success' : 'error';
};

export const getTestCaseStatusText = (status: TestCaseStatus): string => {
  return status === 'active' ? '启用' : '禁用';
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const downloadJSON = (data: any, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
