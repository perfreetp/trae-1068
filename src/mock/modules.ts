import { Module } from '@/types';

export const mockModules: Module[] = [
  {
    id: 'module-1',
    name: '用户管理',
    parentId: null,
    description: '用户相关的接口',
    children: [
      {
        id: 'module-1-1',
        name: '认证',
        parentId: 'module-1',
        description: '登录、注册、登出等认证接口',
      },
      {
        id: 'module-1-2',
        name: '用户信息',
        parentId: 'module-1',
        description: '用户资料、头像等接口',
      },
    ],
  },
  {
    id: 'module-2',
    name: '订单管理',
    parentId: null,
    description: '订单相关的接口',
    children: [
      {
        id: 'module-2-1',
        name: '订单查询',
        parentId: 'module-2',
        description: '订单列表、详情查询',
      },
      {
        id: 'module-2-2',
        name: '订单操作',
        parentId: 'module-2',
        description: '创建、取消、退款等操作',
      },
    ],
  },
  {
    id: 'module-3',
    name: '商品管理',
    parentId: null,
    description: '商品相关的接口',
    children: [
      {
        id: 'module-3-1',
        name: '商品查询',
        parentId: 'module-3',
        description: '商品列表、详情',
      },
      {
        id: 'module-3-2',
        name: '商品管理',
        parentId: 'module-3',
        description: '商品增删改查',
      },
    ],
  },
  {
    id: 'module-4',
    name: '支付模块',
    parentId: null,
    description: '支付相关的接口',
  },
  {
    id: 'module-5',
    name: '系统设置',
    parentId: null,
    description: '系统配置相关接口',
  },
];
