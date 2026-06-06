import { DebugEnvironment } from '@/types';

export const mockEnvironments: DebugEnvironment[] = [
  {
    id: 'env-local',
    name: '本地环境',
    type: 'local',
    baseUrl: 'http://localhost:3000',
    isDefault: true,
    headers: [
      { key: 'X-Environment', value: 'local', enabled: true },
      { key: 'X-Debug', value: 'true', enabled: true },
    ],
  },
  {
    id: 'env-test',
    name: '测试环境',
    type: 'test',
    baseUrl: 'https://test-api.example.com',
    headers: [
      { key: 'X-Environment', value: 'test', enabled: true },
      { key: 'Authorization', value: 'Bearer test-token', enabled: true },
    ],
  },
  {
    id: 'env-staging',
    name: '预发环境',
    type: 'staging',
    baseUrl: 'https://staging-api.example.com',
    headers: [
      { key: 'X-Environment', value: 'staging', enabled: true },
      { key: 'Authorization', value: 'Bearer staging-token', enabled: true },
    ],
  },
  {
    id: 'env-prod',
    name: '生产环境',
    type: 'production',
    baseUrl: 'https://api.example.com',
    headers: [
      { key: 'X-Environment', value: 'production', enabled: true },
    ],
  },
];
