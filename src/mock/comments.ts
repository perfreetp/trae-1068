import { Comment } from '@/types';

export const mockComments: Comment[] = [
  {
    id: 'c1',
    apiId: 'api-1',
    content: '这个接口的密码字段需要加密传输吧？',
    author: 'user-3',
    mentions: [],
    createdAt: '2024-05-20T10:00:00Z',
  },
  {
    id: 'c2',
    apiId: 'api-1',
    content: '@王五 是的，前端会做RSA加密，后端解密',
    author: 'user-2',
    mentions: ['user-3'],
    replyTo: 'c1',
    createdAt: '2024-05-20T10:30:00Z',
  },
  {
    id: 'c3',
    apiId: 'api-1',
    content: '验证码字段是必须的吗？有没有跳过的方案？',
    author: 'user-4',
    mentions: [],
    createdAt: '2024-06-01T14:00:00Z',
  },
  {
    id: 'c4',
    apiId: 'api-3',
    content: '订单状态枚举值有哪些？文档里好像没写全',
    author: 'user-4',
    mentions: ['user-3'],
    createdAt: '2024-06-04T09:00:00Z',
  },
  {
    id: 'c5',
    apiId: 'api-4',
    content: 'items数组里的price字段是单价还是总价？',
    author: 'user-2',
    mentions: [],
    createdAt: '2024-06-02T15:00:00Z',
  },
];
