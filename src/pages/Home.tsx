import { Card, Row, Col, Statistic, List, Tag, Avatar, Button, Space, Timeline, Progress } from 'antd';
import {
  ApiOutlined,
  FolderOpenOutlined,
  FileTextOutlined,
  TeamOutlined,
  PlusOutlined,
  ImportOutlined,
  StarOutlined,
  HistoryOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useApiStore } from '@/store/apiStore';
import { useUserStore } from '@/store/userStore';
import { useProjectStore } from '@/store/projectStore';
import { ApiMethodTag } from '@/components/ApiMethodTag';
import { formatRelativeTime, getStatusText, getStatusColor } from '@/utils/helpers';

const Home = () => {
  const navigate = useNavigate();
  const { apis, modules, changeRecords, getApiById } = useApiStore();
  const { members, getMemberName, getMemberById } = useUserStore();
  const { project } = useProjectStore();

  const favoriteApis = apis.filter((a) => a.isFavorite).slice(0, 5);
  const recentChanges = [...changeRecords].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const recentApis = [...apis].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);

  const countByStatus = {
    draft: apis.filter((a) => a.status === 'draft').length,
    developing: apis.filter((a) => a.status === 'developing').length,
    testing: apis.filter((a) => a.status === 'testing').length,
    completed: apis.filter((a) => a.status === 'completed').length,
  };

  const totalModules = modules.reduce((acc, m) => acc + 1 + (m.children?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
            <p className="text-blue-100">{project.description}</p>
            <div className="flex gap-4 mt-4">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/api')}>
                新建接口
              </Button>
              <Button ghost icon={<ImportOutlined />}>
                导入接口
              </Button>
            </div>
          </div>
          <div className="flex -space-x-2">
            {members.slice(0, 5).map((m) => (
              <Avatar key={m.id} src={m.avatar} size={40} className="border-2 border-blue-500">
                {m.name[0]}
              </Avatar>
            ))}
            {members.length > 5 && (
              <Avatar size={40} className="border-2 border-blue-500 bg-blue-700">
                +{members.length - 5}
              </Avatar>
            )}
          </div>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title="接口总数"
              value={apis.length}
              prefix={<ApiOutlined className="text-blue-500" />}
              styles={{ content: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title="模块数量"
              value={totalModules}
              prefix={<FolderOpenOutlined className="text-green-500" />}
              styles={{ content: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title="用例数量"
              value={24}
              prefix={<FileTextOutlined className="text-orange-500" />}
              styles={{ content: { color: '#fa8c16' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title="团队成员"
              value={members.length}
              prefix={<TeamOutlined className="text-purple-500" />}
              styles={{ content: { color: '#722ed1' } }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="接口状态概览"
            extra={<Button type="link" onClick={() => navigate('/api')}>查看全部 <ArrowRightOutlined /></Button>}
          >
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-400">{countByStatus.draft}</div>
                  <div className="text-gray-500 text-sm">草稿</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500">{countByStatus.developing}</div>
                  <div className="text-gray-500 text-sm">开发中</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500">{countByStatus.testing}</div>
                  <div className="text-gray-500 text-sm">测试中</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">{countByStatus.completed}</div>
                  <div className="text-gray-500 text-sm">已完成</div>
                </div>
              </Col>
            </Row>
            <div className="mt-4">
              <Progress
                percent={Math.round((countByStatus.completed / apis.length) * 100)}
                format={(percent) => `完成度 ${percent}%`}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title="快捷入口"
          >
            <Space orientation="vertical" className="w-full" size={8}>
              <Button block icon={<PlusOutlined />} onClick={() => navigate('/api')}>
                新建接口
              </Button>
              <Button block icon={<ImportOutlined />}>
                批量导入
              </Button>
              <Button block icon={<StarOutlined />} onClick={() => navigate('/api')}>
                我的收藏
              </Button>
              <Button block icon={<HistoryOutlined />} onClick={() => navigate('/changes')}>
                变更评审
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="最近更新"
            extra={<Button type="link" onClick={() => navigate('/api')}>更多 <ArrowRightOutlined /></Button>}
          >
            <List
              dataSource={recentApis}
              renderItem={(api) => (
                <List.Item
                  key={api.id}
                  className="cursor-pointer hover:bg-gray-50 -mx-4 px-4"
                  onClick={() => navigate(`/api/${api.id}`)}
                >
                  <List.Item.Meta
                    avatar={<ApiMethodTag method={api.method} />}
                    title={
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{api.name}</span>
                        <Tag color={getStatusColor(api.status) as any} style={{ margin: 0 }}>
                          {getStatusText(api.status)}
                        </Tag>
                      </div>
                    }
                    description={
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <code className="bg-gray-100 px-1 rounded">{api.path}</code>
                        <span>更新于 {formatRelativeTime(api.updatedAt)}</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="变更动态"
            extra={<Button type="link" onClick={() => navigate('/changes')}>更多 <ArrowRightOutlined /></Button>}
          >
            <Timeline
              items={recentChanges.map((cr) => {
                const api = getApiById(cr.apiId);
                const submitter = getMemberById(cr.submitter);
                return {
                  color: cr.status === 'approved' ? 'green' : cr.status === 'rejected' ? 'red' : 'blue',
                  content: (
                    <div className="pb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar src={submitter?.avatar} size={20} />
                        <span className="text-sm text-gray-600">{submitter?.name}</span>
                        <Tag color={cr.status === 'approved' ? 'green' : cr.status === 'rejected' ? 'red' : 'warning'} style={{ fontSize: 11, padding: '0 6px' }}>
                          {cr.status === 'approved' ? '已通过' : cr.status === 'rejected' ? '已拒绝' : '待评审'}
                        </Tag>
                      </div>
                      <div className="text-sm font-medium cursor-pointer hover:text-blue-500" onClick={() => navigate(`/api/${cr.apiId}`)}>
                        {api?.name} - {cr.title}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{formatRelativeTime(cr.createdAt)}</div>
                    </div>
                  ),
                };
              })}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="我的收藏"
        extra={<Button type="link" onClick={() => navigate('/api')}>查看全部 <ArrowRightOutlined /></Button>}
      >
        {favoriteApis.length > 0 ? (
          <Row gutter={[16, 16]}>
            {favoriteApis.map((api) => (
              <Col xs={24} sm={12} lg={8} key={api.id}>
                <Card
                  size="small"
                  className="cursor-pointer hover:shadow-md transition-shadow h-full"
                  onClick={() => navigate(`/api/${api.id}`)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <ApiMethodTag method={api.method} />
                    <span className="font-medium truncate">{api.name}</span>
                  </div>
                  <code className="text-xs text-gray-500 truncate block">{api.path}</code>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <Tag color={getStatusColor(api.status) as any} style={{ margin: 0 }}>
                      {getStatusText(api.status)}
                    </Tag>
                    <span>更新于 {formatRelativeTime(api.updatedAt)}</span>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="text-center text-gray-400 py-8">
            暂无收藏的接口
          </div>
        )}
      </Card>
    </div>
  );
};

export default Home;
