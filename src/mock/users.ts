import { Member } from '@/types';

export const mockMembers: Member[] = [
  {
    id: 'user-1',
    name: '张三',
    email: 'zhangsan@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
    role: 'admin',
    joinedAt: '2024-01-15T09:00:00Z',
  },
  {
    id: 'user-2',
    name: '李四',
    email: 'lisi@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi',
    role: 'developer',
    joinedAt: '2024-02-20T10:30:00Z',
  },
  {
    id: 'user-3',
    name: '王五',
    email: 'wangwu@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu',
    role: 'developer',
    joinedAt: '2024-03-10T14:00:00Z',
  },
  {
    id: 'user-4',
    name: '赵六',
    email: 'zhaoliu@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoliu',
    role: 'developer',
    joinedAt: '2024-04-05T11:00:00Z',
  },
  {
    id: 'user-5',
    name: '钱七',
    email: 'qianqi@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=qianqi',
    role: 'viewer',
    joinedAt: '2024-05-01T09:30:00Z',
  },
];

export const mockCurrentUser = mockMembers[0];
