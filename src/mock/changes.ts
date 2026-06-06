import { ChangeRecord } from '@/types';

export const mockChangeRecords: ChangeRecord[] = [
  {
    id: 'cr-1',
    apiId: 'api-1',
    version: 'v1.2.0',
    title: '登录接口增加图形验证码',
    description: '为了防止机器人攻击，登录接口增加图形验证码字段',
    changes: [
      { field: 'request.body', oldValue: '无captcha字段', newValue: '新增captcha字段', type: 'add' },
      { field: 'description', oldValue: '用户通过手机号和密码登录', newValue: '用户通过手机号、密码和验证码登录', type: 'modify' },
    ],
    submitter: 'user-2',
    status: 'approved',
    reviewers: ['user-1'],
    reviewComments: [
      { id: 'rc1', author: 'user-1', content: '变更合理，同意通过', createdAt: '2024-06-01T16:00:00Z' },
    ],
    createdAt: '2024-06-01T15:00:00Z',
    reviewedAt: '2024-06-01T16:00:00Z',
  },
  {
    id: 'cr-2',
    apiId: 'api-3',
    version: 'v1.1.0',
    title: '订单列表增加搜索功能',
    description: '新增keyword参数，支持按订单号和商品名称搜索',
    changes: [
      { field: 'request.query', oldValue: '无keyword字段', newValue: '新增keyword字段', type: 'add' },
    ],
    submitter: 'user-3',
    status: 'pending',
    reviewers: ['user-1', 'user-2'],
    createdAt: '2024-06-05T10:00:00Z',
  },
  {
    id: 'cr-3',
    apiId: 'api-4',
    version: 'v1.0.0',
    title: '创建订单接口初稿',
    description: '创建订单接口第一版，包含基本的商品和地址字段',
    changes: [
      { field: '接口状态', oldValue: 'draft', newValue: 'developing', type: 'modify' },
    ],
    submitter: 'user-3',
    status: 'rejected',
    reviewers: ['user-1'],
    reviewComments: [
      { id: 'rc2', author: 'user-1', content: '缺少优惠券字段，请补充后重新提交', createdAt: '2024-06-03T14:00:00Z' },
    ],
    createdAt: '2024-06-03T09:00:00Z',
    reviewedAt: '2024-06-03T14:00:00Z',
  },
  {
    id: 'cr-4',
    apiId: 'api-8',
    version: 'v1.0.0',
    title: '更新用户信息接口',
    description: '支持更新昵称、头像和邮箱',
    changes: [
      { field: '接口状态', oldValue: 'draft', newValue: 'testing', type: 'modify' },
    ],
    submitter: 'user-2',
    status: 'pending',
    reviewers: ['user-1'],
    createdAt: '2024-06-03T14:00:00Z',
  },
];
