import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Card,
  Tag,
  Button,
  Space,
  Tabs,
  Descriptions,
  Avatar,
  Tooltip,
  Divider,
  message,
  Modal,
  Form,
  Input,
  Select,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  PlayCircleOutlined,
  ShareAltOutlined,
  StarOutlined,
  StarFilled,
  HistoryOutlined,
  FileTextOutlined,
  CodeOutlined,
  PlusOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { useApiStore } from '@/store/apiStore';
import { useUserStore } from '@/store/userStore';
import { ApiMethodTag } from '@/components/ApiMethodTag';
import ParamTable from '@/components/ParamTable';
import ResponseView from '@/components/ResponseView';
import CommentList from '@/components/CommentList';
import { getStatusText, getStatusColor, formatDate, copyToClipboard, getMethodBgColor, getMethodColor } from '@/utils/helpers';
import { ApiStatus, HttpMethod, Module } from '@/types';

const { Option } = Select;

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

const ApiDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getApiById, toggleFavorite, modules, updateApi, errorCodes, getChangeRecordsByApiId, getTestCasesByApiId } = useApiStore();
  const { getMemberById, getMemberName, members } = useUserStore();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [form] = Form.useForm();

  const api = useMemo(() => (id ? getApiById(id) : undefined), [id, getApiById]);
  const changes = useMemo(() => (id ? getChangeRecordsByApiId(id) : []), [id, getChangeRecordsByApiId]);
  const testCases = useMemo(() => (id ? getTestCasesByApiId(id) : []), [id, getTestCasesByApiId]);

  if (!api) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">接口不存在</p>
        <Button type="primary" onClick={() => navigate('/api')}>返回列表</Button>
      </div>
    );
  }

  const module = flattenModules(modules).find((m) => m.id === api.moduleId);
  const creator = getMemberById(api.creator);
  const owner = getMemberById(api.owner);

  const tabItems = [
    {
      key: 'doc',
      label: '接口文档',
      children: (
        <div className="space-y-6">
          <Card title="请求参数" size="small">
            <Tabs
              items={[
                { key: 'headers', label: `Headers (${api.request.headers.length})`, children: <ParamTable data={api.request.headers} /> },
                { key: 'query', label: `Query (${api.request.query.length})`, children: <ParamTable data={api.request.query} /> },
                { key: 'body', label: `Body (${api.request.body.length})`, children: <ParamTable data={api.request.body} /> },
              ]}
              size="small"
            />
          </Card>
          <Card title="返回示例" size="small">
            <ResponseView success={api.response.success} error={api.response.error} />
          </Card>
          <Card title="调用示例" size="small">
            <Tabs
              items={[
                {
                  key: 'curl',
                  label: 'cURL',
                  children: (
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                      <pre>
                        {`curl -X ${api.method} '${api.path}' \\
${api.request.headers.map((h) => `  -H '${h.name}: ${h.example}' \\`).join('\n')}
${api.request.body.length > 0 ? `  -d '${JSON.stringify(Object.fromEntries(api.request.body.map((p) => [p.name, p.example])))}'` : ''}`}
                      </pre>
                    </div>
                  ),
                },
                {
                  key: 'js',
                  label: 'JavaScript',
                  children: (
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                      <pre>
                        {`fetch('${api.path}', {
  method: '${api.method}',
  headers: {
${api.request.headers.map((h) => `    '${h.name}': '${h.example}'`).join(',\n')}
  },${api.request.body.length > 0 ? `
  body: JSON.stringify(${JSON.stringify(Object.fromEntries(api.request.body.map((p) => [p.name, p.example])), null, 2).split('\n').join('\n  ')})` : ''}
})
.then(res => res.json())
.then(data => console.log(data));`}
                      </pre>
                    </div>
                  ),
                },
              ]}
              size="small"
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'changes',
      label: `变更记录 (${changes.length})`,
      children: (
        <div className="space-y-4">
          {changes.length > 0 ? (
            changes.map((cr) => (
              <Card key={cr.id} size="small">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{cr.title}</div>
                    <div className="text-sm text-gray-500">
                      版本: {cr.version} | 提交人: {getMemberName(cr.submitter)} | {formatDate(cr.createdAt)}
                    </div>
                  </div>
                  <Tag color={cr.status === 'approved' ? 'green' : cr.status === 'rejected' ? 'red' : 'warning'}>
                    {cr.status === 'approved' ? '已通过' : cr.status === 'rejected' ? '已拒绝' : '待评审'}
                  </Tag>
                </div>
                <Divider style={{ margin: '12px 0' }} />
                <div className="text-sm text-gray-600">{cr.description}</div>
              </Card>
            ))
          ) : (
            <div className="text-center text-gray-400 py-8">暂无变更记录</div>
          )}
        </div>
      ),
    },
    {
      key: 'testcases',
      label: `测试用例 (${testCases.length})`,
      children: (
        <div className="space-y-4">
          {testCases.length > 0 ? (
            testCases.map((tc) => (
              <Card key={tc.id} size="small" extra={<Button type="link" size="small" onClick={() => navigate('/test-cases')}>查看</Button>}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{tc.name}</div>
                    <div className="text-sm text-gray-500">{tc.description}</div>
                  </div>
                  <Tag color={tc.lastRunResult === 'passed' ? 'green' : tc.lastRunResult === 'failed' ? 'red' : 'default'}>
                    {tc.lastRunResult === 'passed' ? '通过' : tc.lastRunResult === 'failed' ? '失败' : '未执行'}
                  </Tag>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">暂无测试用例</p>
              <Button icon={<PlusOutlined />} type="primary" onClick={() => navigate('/test-cases')}>生成用例</Button>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'comments',
      label: '评论讨论',
      children: id ? <CommentList apiId={id} /> : null,
    },
  ];

  const handleCopyPath = async () => {
    const success = await copyToClipboard(api.path);
    if (success) message.success('已复制接口路径');
  };

  const handleShare = () => {
    setShareModalVisible(true);
  };

  const handleEdit = () => {
    form.setFieldsValue({
      name: api.name,
      description: api.description,
      method: api.method,
      path: api.path,
      status: api.status,
      moduleId: api.moduleId,
      owner: api.owner,
      tags: api.tags,
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    form.validateFields().then((values) => {
      if (id) {
        updateApi(id, values);
        message.success('保存成功');
        setEditModalVisible(false);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/api')}>
            返回列表
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <ApiMethodTag method={api.method} />
              <h1 className="text-xl font-bold m-0">{api.name}</h1>
              <Tag color={getStatusColor(api.status) as any}>
                {getStatusText(api.status)}
              </Tag>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <code
                className="text-sm bg-gray-100 px-2 py-1 rounded cursor-pointer hover:bg-gray-200"
                onClick={handleCopyPath}
                title="点击复制"
              >
                {api.path}
                <CopyOutlined className="ml-2 text-gray-400" />
              </code>
              <span className="text-sm text-gray-500">模块: {module?.name || '-'}</span>
            </div>
          </div>
        </div>
        <Space>
          <Tooltip title={api.isFavorite ? '取消收藏' : '收藏'}>
            <Button
              icon={api.isFavorite ? <StarFilled style={{ color: '#fadb14' }} /> : <StarOutlined />}
              onClick={() => toggleFavorite(api.id)}
            />
          </Tooltip>
          <Button icon={<ShareAltOutlined />} onClick={handleShare}>分享</Button>
          <Button icon={<HistoryOutlined />} onClick={() => navigate('/changes')}>变更</Button>
          <Button icon={<EditOutlined />} onClick={handleEdit}>编辑</Button>
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => navigate(`/api/${api.id}/debug`)}>
            在线调试
          </Button>
        </Space>
      </div>

      <Card size="small">
        <Descriptions column={3} size="small">
          <Descriptions.Item label="接口描述">{api.description || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建人">
            {creator && (
              <span className="flex items-center gap-1">
                <Avatar src={creator.avatar} size={20} />
                {creator.name}
              </span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="负责人">
            {owner && (
              <span className="flex items-center gap-1">
                <Avatar src={owner.avatar} size={20} />
                {owner.name}
              </span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="标签">
            {api.tags.length > 0 ? (
              <Space size={[4, 4]} wrap>
                {api.tags.map((t) => (
                  <Tag key={t} color="blue">{t}</Tag>
                ))}
              </Space>
            ) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDate(api.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{formatDate(api.updatedAt)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card size="small" bodyStyle={{ padding: 0 }}>
        <Tabs items={tabItems} style={{ padding: '0 24px' }} />
      </Card>

      <Modal
        title="编辑接口"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleSaveEdit}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="接口名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="接口描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="method" label="请求方法" rules={[{ required: true }]}>
              <Select>
                {(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as HttpMethod[]).map((m) => (
                  <Option key={m} value={m}>{m}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="status" label="状态" rules={[{ required: true }]}>
              <Select>
                {(['draft', 'developing', 'testing', 'completed', 'deprecated'] as ApiStatus[]).map((s) => (
                  <Option key={s} value={s}>{getStatusText(s)}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="path" label="接口路径" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="moduleId" label="所属模块">
              <Select>
                {flattenModules(modules).map((m) => (
                  <Option key={m.id} value={m.id}>{m.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="owner" label="负责人">
              <Select>
                {members.map((m) => (
                  <Option key={m.id} value={m.id}>{m.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        title="分享文档"
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setShareModalVisible(false)}>关闭</Button>,
        ]}
      >
        <p className="text-gray-600 mb-3">复制以下链接分享给团队成员：</p>
        <Input.Search
          value={window.location.href}
          readOnly
          enterButton="复制"
          onSearch={async (value) => {
            await copyToClipboard(value);
            message.success('链接已复制');
          }}
        />
        <Divider />
        <p className="text-gray-600 mb-3">或导出为 JSON 文件：</p>
        <Button icon={<FileTextOutlined />}>导出接口文档</Button>
      </Modal>
    </div>
  );
};

export default ApiDetail;
