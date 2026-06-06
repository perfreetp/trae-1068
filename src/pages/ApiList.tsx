import { useState, useMemo } from 'react';
import { Layout, Tree, Input, Select, Button, Table, Tag, Space, Tooltip, Modal, Form, message, Popconfirm } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  StarOutlined,
  StarFilled,
  ImportOutlined,
  ExportOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  ApiOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useApiStore } from '@/store/apiStore';
import { useUserStore } from '@/store/userStore';
import { ApiMethodTag } from '@/components/ApiMethodTag';
import { Api, ApiStatus, HttpMethod, Module } from '@/types';
import { formatDate, getStatusText, getStatusColor, downloadJSON } from '@/utils/helpers';

const { Sider, Content } = Layout;
const { Search } = Input;
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

const ApiList = () => {
  const navigate = useNavigate();
  const {
    modules,
    selectedModuleId,
    setSelectedModuleId,
    searchKeyword,
    setSearchKeyword,
    statusFilter,
    setStatusFilter,
    getFilteredApis,
    toggleFavorite,
    deleteApi,
    apis,
  } = useApiStore();
  const { getMemberName } = useUserStore();

  const [showFavorites, setShowFavorites] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  const treeData = useMemo(() => {
    const transform = (items: Module[]): any[] =>
      items.map((m) => ({
        key: m.id,
        title: (
          <span className="flex items-center gap-2">
            {m.children?.length ? <FolderOutlined /> : <ApiOutlined />}
            {m.name}
          </span>
        ),
        children: m.children ? transform(m.children) : undefined,
      }));
    return [{ key: 'all', title: <span className="flex items-center gap-2"><FolderOpenOutlined />全部接口</span>, children: transform(modules) }];
  }, [modules]);

  const filteredApis = useMemo(() => {
    let result = getFilteredApis();
    if (showFavorites) {
      result = result.filter((a) => a.isFavorite);
    }
    return result;
  }, [getFilteredApis, showFavorites]);

  const columns: ColumnsType<Api> = [
    {
      title: '接口名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <ApiMethodTag method={record.method} />
          <span
            className="cursor-pointer hover:text-blue-500 font-medium"
            onClick={() => navigate(`/api/${record.id}`)}
          >
            {text}
          </span>
        </div>
      ),
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
      ellipsis: true,
      render: (text) => <code className="text-gray-600 text-sm">{text}</code>,
    },
    {
      title: '模块',
      dataIndex: 'moduleId',
      key: 'moduleId',
      width: 120,
      render: (id) => {
        const mod = flattenModules(modules).find((m) => m.id === id);
        return mod?.name || '-';
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ApiStatus) => (
        <Tag color={getStatusColor(status) as any} style={{ margin: 0 }}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '负责人',
      dataIndex: 'owner',
      key: 'owner',
      width: 100,
      render: (id) => getMemberName(id),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/api/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="在线调试">
            <Button
              type="text"
              size="small"
              icon={<ApiOutlined />}
              onClick={() => navigate(`/api/${record.id}/debug`)}
            />
          </Tooltip>
          <Tooltip title={record.isFavorite ? '取消收藏' : '收藏'}>
            <Button
              type="text"
              size="small"
              icon={record.isFavorite ? <StarFilled style={{ color: '#fadb14' }} /> : <StarOutlined />}
              onClick={() => toggleFavorite(record.id)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确认删除该接口？"
              onConfirm={() => {
                deleteApi(record.id);
                message.success('删除成功');
              }}
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleCreate = () => {
    form.validateFields().then((values) => {
      message.success('接口创建成功');
      setCreateModalVisible(false);
      form.resetFields();
    });
  };

  const handleExport = () => {
    const data = filteredApis.map((a) => ({
      name: a.name,
      method: a.method,
      path: a.path,
      status: a.status,
      description: a.description,
      request: a.request,
      response: a.response,
    }));
    downloadJSON(data, `apis-${Date.now()}.json`);
    message.success('导出成功');
  };

  return (
    <Layout className="bg-white rounded-lg overflow-hidden" style={{ minHeight: 'calc(100vh - 180px)' }}>
      <Sider
        width={240}
        theme="light"
        style={{ borderRight: '1px solid #f0f0f0' }}
        className="overflow-auto"
      >
        <div className="p-3 border-b">
          <Search
            placeholder="搜索接口..."
            prefix={<SearchOutlined />}
            allowClear
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>
        <div className="p-3 border-b">
          <Button
            block
            type={showFavorites ? 'primary' : 'default'}
            icon={<StarOutlined />}
            onClick={() => setShowFavorites(!showFavorites)}
          >
            只看收藏
          </Button>
        </div>
        <Tree
          showLine
          defaultExpandAll
          treeData={treeData}
          selectedKeys={selectedModuleId ? [selectedModuleId] : ['all']}
          onSelect={(keys) => {
            if (keys[0] === 'all') {
              setSelectedModuleId(null);
            } else {
              setSelectedModuleId(keys[0] as string);
            }
          }}
          style={{ padding: '8px 0' }}
        />
      </Sider>
      <Layout>
        <Content className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <Select
                placeholder="按状态筛选"
                style={{ width: 140 }}
                allowClear
                value={statusFilter || undefined}
                onChange={setStatusFilter}
              >
                <Option value="draft">草稿</Option>
                <Option value="developing">开发中</Option>
                <Option value="testing">测试中</Option>
                <Option value="completed">已完成</Option>
                <Option value="deprecated">已废弃</Option>
              </Select>
              <Select placeholder="按方法筛选" style={{ width: 120 }} allowClear>
                {(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as HttpMethod[]).map((m) => (
                  <Option key={m} value={m}>{m}</Option>
                ))}
              </Select>
              <Button icon={<ReloadOutlined />}>重置</Button>
            </div>
            <Space>
              <Button icon={<ImportOutlined />}>导入</Button>
              <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
                新建接口
              </Button>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={filteredApis}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 个接口`,
            }}
            size="middle"
          />
        </Content>
      </Layout>

      <Modal
        title="新建接口"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={handleCreate}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="接口名称" rules={[{ required: true, message: '请输入接口名称' }]}>
            <Input placeholder="请输入接口名称" />
          </Form.Item>
          <Form.Item name="method" label="请求方法" rules={[{ required: true, message: '请选择请求方法' }]}>
            <Select placeholder="请选择请求方法">
              {(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as HttpMethod[]).map((m) => (
                <Option key={m} value={m}>{m}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="path" label="接口路径" rules={[{ required: true, message: '请输入接口路径' }]}>
            <Input placeholder="/api/xxx" prefix={<span className="text-gray-400">/</span>} />
          </Form.Item>
          <Form.Item name="moduleId" label="所属模块">
            <Select placeholder="请选择模块">
              {flattenModules(modules).map((m) => (
                <Option key={m.id} value={m.id}>{m.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="接口描述">
            <Input.TextArea rows={3} placeholder="请输入接口描述" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default ApiList;
