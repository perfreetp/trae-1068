import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  message,
  Tooltip,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  DownloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useApiStore } from '@/store/apiStore';
import { ErrorCode } from '@/types';
import { copyToClipboard } from '@/utils/helpers';

const { Option } = Select;

const ErrorCodes = () => {
  const { errorCodes } = useApiStore();
  const [searchText, setSearchText] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ErrorCode | null>(null);
  const [form] = Form.useForm();

  const modules = [...new Set(errorCodes.map((e) => e.module))];

  const filteredData = errorCodes.filter((e) => {
    const matchSearch =
      !searchText ||
      e.code.includes(searchText) ||
      e.message.toLowerCase().includes(searchText.toLowerCase()) ||
      e.description.toLowerCase().includes(searchText.toLowerCase());
    const matchModule = !moduleFilter || e.module === moduleFilter;
    return matchSearch && matchModule;
  });

  const columns: ColumnsType<ErrorCode> = [
    {
      title: '错误码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (text) => (
        <code
          className="bg-blue-50 text-blue-600 px-2 py-1 rounded cursor-pointer hover:bg-blue-100"
          onClick={async () => {
            await copyToClipboard(text);
            message.success('已复制');
          }}
        >
          {text}
        </code>
      ),
    },
    {
      title: '错误信息',
      dataIndex: 'message',
      key: 'message',
      width: 200,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '所属模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingItem(record);
                form.setFieldsValue(record);
                setModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm title="确认删除该错误码？">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then(() => {
      message.success(editingItem ? '更新成功' : '创建成功');
      setModalVisible(false);
    });
  };

  return (
    <div className="space-y-4">
      <Card
        size="small"
        title="错误码管理"
        extra={
          <Space>
            <Button icon={<UploadOutlined />}>导入</Button>
            <Button icon={<DownloadOutlined />}>导出</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增错误码
            </Button>
          </Space>
        }
      >
        <div className="flex gap-3 mb-4">
          <Input
            placeholder="搜索错误码、信息或描述"
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            placeholder="按模块筛选"
            allowClear
            style={{ width: 180 }}
            value={moduleFilter || undefined}
            onChange={setModuleFilter}
          >
            {modules.map((m) => (
              <Option key={m} value={m}>{m}</Option>
            ))}
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="code"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个错误码`,
          }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑错误码' : '新增错误码'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="错误码" rules={[{ required: true, message: '请输入错误码' }]}>
            <Input placeholder="例如: 10001" />
          </Form.Item>
          <Form.Item name="message" label="错误信息" rules={[{ required: true, message: '请输入错误信息' }]}>
            <Input placeholder="例如: 参数错误" />
          </Form.Item>
          <Form.Item name="module" label="所属模块" rules={[{ required: true, message: '请选择模块' }]}>
            <Select placeholder="请选择模块">
              {modules.map((m) => (
                <Option key={m} value={m}>{m}</Option>
              ))}
              <Option value="custom">自定义模块...</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="详细描述">
            <Input.TextArea rows={3} placeholder="请输入详细描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ErrorCodes;
