import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tooltip,
  Popconfirm,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  PlayCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useApiStore } from '@/store/apiStore';
import { useUserStore } from '@/store/userStore';
import { TestCase } from '@/types';
import { formatDate, getRunResultText, getRunResultColor, getTestCaseStatusText } from '@/utils/helpers';

const { Option } = Select;

const TestCases = () => {
  const { testCases, addTestCase, updateTestCase, deleteTestCase, runTestCase, apis } = useApiStore();
  const { getMemberName, members } = useUserStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<TestCase | null>(null);
  const [form] = Form.useForm();

  const passedCount = testCases.filter((tc) => tc.lastRunResult === 'passed').length;
  const failedCount = testCases.filter((tc) => tc.lastRunResult === 'failed').length;

  const columns: ColumnsType<TestCase> = [
    {
      title: '用例名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <span className="font-medium">{text}</span>
      ),
    },
    {
      title: '关联接口',
      dataIndex: 'apiId',
      key: 'apiId',
      width: 180,
      render: (id) => {
        const api = apis.find((a) => a.id === id);
        return api ? api.name : '-';
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {getTestCaseStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '执行结果',
      dataIndex: 'lastRunResult',
      key: 'lastRunResult',
      width: 100,
      render: (result) => (
        <Tag color={getRunResultColor(result) as any}>
          {result === 'passed' ? (
            <span className="flex items-center gap-1"><CheckCircleOutlined /> {getRunResultText(result)}</span>
          ) : result === 'failed' ? (
            <span className="flex items-center gap-1"><CloseCircleOutlined /> {getRunResultText(result)}</span>
          ) : (
            getRunResultText(result)
          )}
        </Tag>
      ),
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 100,
      render: (id) => getMemberName(id),
    },
    {
      title: '最近执行',
      dataIndex: 'lastRunAt',
      key: 'lastRunAt',
      width: 160,
      render: (date) => (date ? formatDate(date) : '-'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="执行用例">
            <Button
              type="text"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => {
                runTestCase(record.id);
                message.success('用例执行完成');
              }}
            />
          </Tooltip>
          <Tooltip title="查看详情">
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Tooltip>
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
            <Popconfirm
              title="确认删除该用例？"
              onConfirm={() => {
                deleteTestCase(record.id);
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

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (editingItem) {
        updateTestCase(editingItem.id, values);
        message.success('更新成功');
      } else {
        addTestCase({
          ...values,
          creator: members[0].id,
        });
        message.success('创建成功');
      }
      setModalVisible(false);
    });
  };

  const handleRunAll = () => {
    testCases.forEach((tc) => runTestCase(tc.id));
    message.success('所有用例执行完成');
  };

  return (
    <div className="space-y-4">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="用例总数"
              value={testCases.length}
              prefix={<FileTextOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="通过用例"
              value={passedCount}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="失败用例"
              value={failedCount}
              styles={{ content: { color: '#ff4d4f' } }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        size="small"
        title="测试用例"
        extra={
          <Space>
            <Button icon={<PlayCircleOutlined />} onClick={handleRunAll}>
              全部执行
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新建用例
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={testCases}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条用例`,
          }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑用例' : '新建用例'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="用例名称" rules={[{ required: true, message: '请输入用例名称' }]}>
            <Input placeholder="请输入用例名称" />
          </Form.Item>
          <Form.Item name="apiId" label="关联接口" rules={[{ required: true, message: '请选择关联接口' }]}>
            <Select placeholder="请选择关联接口">
              {apis.map((api) => (
                <Option key={api.id} value={api.id}>
                  {api.method} - {api.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="用例描述">
            <Input.TextArea rows={3} placeholder="请输入用例描述" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="active">
            <Select>
              <Option value="active">启用</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TestCases;
