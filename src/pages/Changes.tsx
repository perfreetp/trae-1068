import { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Tabs,
  Timeline,
  Avatar,
  message,
  Tooltip,
  Descriptions,
  List,
  Select,
  Input,
  Form,
  Popconfirm,
} from 'antd';

const { TextArea } = Input;
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  DiffOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useApiStore } from '@/store/apiStore';
import { useUserStore } from '@/store/userStore';
import { ChangeRecord, ConfirmationStatus, ReviewStatus } from '@/types';
import { formatDate, getReviewStatusText, getReviewStatusColor, getConfirmationStatusText, getConfirmationStatusColor } from '@/utils/helpers';

const { Option } = Select;

const Changes = () => {
  const { changeRecords, apis, reviewChange, updateConfirmationStatus, addChangeRecord } = useApiStore();
  const { getMemberById, getMemberName, members, currentUser } = useUserStore();
  const [detailVisible, setDetailVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ChangeRecord | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmComment, setConfirmComment] = useState('');
  const [confirmationId, setConfirmationId] = useState('');
  const [form] = Form.useForm();

  const handleView = (record: ChangeRecord) => {
    setSelectedRecord(record);
    setDetailVisible(true);
  };

  const handleApprove = (record: ChangeRecord) => {
    setSelectedRecord(record);
    setReviewModalVisible(true);
  };

  const handleReject = (record: ChangeRecord) => {
    setSelectedRecord(record);
    setReviewModalVisible(true);
  };

  const handleSubmitReview = (status: ReviewStatus) => {
    if (!selectedRecord || !currentUser) return;
    reviewChange(selectedRecord.id, status, currentUser.id, reviewNote);
    setReviewModalVisible(false);
    setReviewNote('');
    message.success(status === 'approved' ? '已通过评审' : '已驳回评审');
    // 刷新详情
    const updated = changeRecords.find((r) => r.id === selectedRecord.id);
    if (updated) setSelectedRecord(updated);
  };

  const handleConfirm = (record: ChangeRecord, confId: string) => {
    setSelectedRecord(record);
    setConfirmationId(confId);
    setConfirmModalVisible(true);
  };

  const handleSubmitConfirm = (status: ConfirmationStatus) => {
    if (!selectedRecord || !confirmationId) return;
    updateConfirmationStatus(selectedRecord.id, confirmationId, status, confirmComment);
    setConfirmModalVisible(false);
    setConfirmComment('');
    message.success(status === 'confirmed' ? '已确认' : '已标记有疑问');
    // 刷新详情
    const updated = changeRecords.find((r) => r.id === selectedRecord.id);
    if (updated) setSelectedRecord(updated);
  };

  const handleCreate = () => {
    setCreateVisible(true);
  };

  const handleSubmitCreate = () => {
    form.validateFields().then((values) => {
      addChangeRecord({
        apiId: values.apiId,
        title: values.title,
        description: values.description,
        version: 'v' + Date.now().toString().slice(-6),
        submitter: currentUser?.id || 'user-1',
        status: 'pending',
        changes: [
          { field: values.description, type: 'modify', oldValue: '旧值', newValue: values.description },
        ],
        reviewComments: [],
        changeReason: values.changeReason,
        reviewerId: values.reviewerId,
        confirmations: (values.confirmUserIds || []).map((userId: string) => ({
          id: 'conf-' + Date.now() + '-' + userId,
          userId,
          status: 'pending' as ConfirmationStatus,
          confirmedAt: null,
          comment: '',
        })),
      });
      setCreateVisible(false);
      form.resetFields();
      message.success('变更已提交');
    });
  };

  const pendingMyReview = useMemo(
    () => changeRecords.filter((c) => c.status === 'pending' && c.reviewerId === currentUser?.id),
    [changeRecords, currentUser]
  );

  const pendingMyConfirm = useMemo(
    () =>
      changeRecords.filter((c) =>
        c.confirmations?.some((conf) => conf.userId === currentUser?.id && conf.status === 'pending')
      ),
    [changeRecords, currentUser]
  );

  const columns: ColumnsType<ChangeRecord> = [
    {
      title: '变更标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">版本: {record.version}</div>
        </div>
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
      title: '变更原因',
      dataIndex: 'changeReason',
      key: 'changeReason',
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: '提交人',
      dataIndex: 'submitter',
      key: 'submitter',
      width: 100,
      render: (id) => getMemberName(id),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getReviewStatusColor(status) as any}>
          {status === 'approved' ? (
            <span className="flex items-center gap-1">
              <CheckCircleOutlined /> {getReviewStatusText(status)}
            </span>
          ) : status === 'rejected' ? (
            <span className="flex items-center gap-1">
              <CloseCircleOutlined /> {getReviewStatusText(status)}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <ClockCircleOutlined /> {getReviewStatusText(status)}
            </span>
          )}
        </Tag>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_, record) => {
        const myConfirmation = record.confirmations?.find((c) => c.userId === currentUser?.id);
        const isReviewer = record.reviewerId === currentUser?.id && record.status === 'pending';
        return (
          <Space size="small">
            <Tooltip title="查看详情">
              <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)} />
            </Tooltip>
            <Tooltip title="版本对比">
              <Button type="text" size="small" icon={<DiffOutlined />} />
            </Tooltip>
            {isReviewer && (
              <>
                <Tooltip title="通过">
                  <Button
                    type="text"
                    size="small"
                    style={{ color: '#52c41a' }}
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleApprove(record)}
                  />
                </Tooltip>
                <Tooltip title="驳回">
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => handleReject(record)}
                  />
                </Tooltip>
              </>
            )}
            {myConfirmation && myConfirmation.status === 'pending' && !isReviewer && (
              <Tooltip title="确认变更">
                <Button
                  type="text"
                  size="small"
                  style={{ color: '#1890ff' }}
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleConfirm(record, myConfirmation.id)}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  const tabItems = [
    {
      key: 'all',
      label: '全部',
      children: <Table columns={columns} dataSource={changeRecords} rowKey="id" pagination={{ pageSize: 10 }} />,
    },
    {
      key: 'my-review',
      label: `待我评审 (${pendingMyReview.length})`,
      children: <Table columns={columns} dataSource={pendingMyReview} rowKey="id" pagination={{ pageSize: 10 }} />,
    },
    {
      key: 'my-confirm',
      label: `待我确认 (${pendingMyConfirm.length})`,
      children: <Table columns={columns} dataSource={pendingMyConfirm} rowKey="id" pagination={{ pageSize: 10 }} />,
    },
    {
      key: 'pending',
      label: '待评审',
      children: (
        <Table
          columns={columns}
          dataSource={changeRecords.filter((c) => c.status === 'pending')}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'approved',
      label: '已通过',
      children: (
        <Table
          columns={columns}
          dataSource={changeRecords.filter((c) => c.status === 'approved')}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'rejected',
      label: '已拒绝',
      children: (
        <Table
          columns={columns}
          dataSource={changeRecords.filter((c) => c.status === 'rejected')}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card
        size="small"
        title="变更记录"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            提交变更
          </Button>
        }
      >
        <Tabs items={tabItems} />
      </Card>

      <Modal
        title="提交变更"
        open={createVisible}
        onCancel={() => setCreateVisible(false)}
        onOk={handleSubmitCreate}
        width={600}
        okText="提交"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="apiId" label="关联接口" rules={[{ required: true, message: '请选择接口' }]}>
            <Select placeholder="请选择接口">
              {apis.map((api) => (
                <Option key={api.id} value={api.id}>
                  {api.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="title" label="变更标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="简要描述变更内容" />
          </Form.Item>
          <Form.Item name="changeReason" label="变更原因" rules={[{ required: true, message: '请输入变更原因' }]}>
            <TextArea rows={3} placeholder="说明本次变更的原因和背景" />
          </Form.Item>
          <Form.Item name="description" label="变更描述">
            <TextArea rows={3} placeholder="详细描述变更内容" />
          </Form.Item>
          <Form.Item name="reviewerId" label="评审人" rules={[{ required: true, message: '请选择评审人' }]}>
            <Select placeholder="请选择评审人" showSearch optionFilterProp="children">
              {members.map((m) => (
                <Option key={m.id} value={m.id}>
                  <span className="flex items-center gap-2">
                    <Avatar size={20} src={m.avatar} icon={<UserOutlined />} />
                    {m.name} ({m.role})
                  </span>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="confirmUserIds" label="需确认人员">
            <Select mode="multiple" placeholder="选择需要确认变更的人员" showSearch optionFilterProp="children">
              {members.map((m) => (
                <Option key={m.id} value={m.id}>
                  <span className="flex items-center gap-2">
                    <Avatar size={20} src={m.avatar} icon={<UserOutlined />} />
                    {m.name} ({m.role})
                  </span>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="变更详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedRecord && (
          <div className="space-y-4">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="变更标题">{selectedRecord.title}</Descriptions.Item>
              <Descriptions.Item label="版本">{selectedRecord.version}</Descriptions.Item>
              <Descriptions.Item label="关联接口">
                {apis.find((a) => a.id === selectedRecord.apiId)?.name}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getReviewStatusColor(selectedRecord.status) as any}>
                  {getReviewStatusText(selectedRecord.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="提交人">
                {(() => {
                  const submitter = getMemberById(selectedRecord.submitter);
                  return submitter ? (
                    <span className="flex items-center gap-1">
                      <Avatar src={submitter.avatar} size={20} />
                      {submitter.name}
                    </span>
                  ) : (
                    '-'
                  );
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="评审人">
                {(() => {
                  const reviewer = selectedRecord.reviewerId ? getMemberById(selectedRecord.reviewerId) : null;
                  return reviewer ? (
                    <span className="flex items-center gap-1">
                      <Avatar src={reviewer.avatar} size={20} />
                      {reviewer.name}
                    </span>
                  ) : (
                    '-'
                  );
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="提交时间">{formatDate(selectedRecord.createdAt)}</Descriptions.Item>
            </Descriptions>

            <div>
              <h4 className="font-medium mb-2">变更原因</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded">
                {selectedRecord.changeReason || '未填写'}
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">变更描述</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded">{selectedRecord.description}</p>
            </div>

            <div>
              <h4 className="font-medium mb-2">变更内容</h4>
              <List
                size="small"
                dataSource={selectedRecord.changes}
                renderItem={(item) => (
                  <List.Item>
                    <div className="flex items-center gap-2">
                      <Tag
                        color={
                          item.type === 'add' ? 'green' : item.type === 'remove' ? 'red' : 'blue'
                        }
                      >
                        {item.type === 'add' ? '新增' : item.type === 'remove' ? '删除' : '修改'}
                      </Tag>
                      <span className="font-medium">{item.field}</span>
                      {item.type === 'modify' && (
                        <span className="text-sm text-gray-500">
                          <span className="line-through">{item.oldValue}</span>
                          <span className="mx-2">→</span>
                          <span className="text-blue-600">{item.newValue}</span>
                        </span>
                      )}
                    </div>
                  </List.Item>
                )}
              />
            </div>

            {selectedRecord.confirmations && selectedRecord.confirmations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">确认状态</h4>
                <div className="space-y-2">
                  {selectedRecord.confirmations.map((conf) => {
                    const user = getMemberById(conf.userId);
                    const isMine = conf.userId === currentUser?.id;
                    return (
                      <div
                        key={conf.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar src={user?.avatar} size={24} icon={<UserOutlined />} />
                          <span>{user?.name}</span>
                          {isMine && <Tag color="blue" style={{ fontSize: 10 }}>我</Tag>}
                        </div>
                        <Space>
                          <Tag color={getConfirmationStatusColor(conf.status)}>
                            {getConfirmationStatusText(conf.status)}
                          </Tag>
                          {isMine && conf.status === 'pending' && (
                            <Button
                              size="small"
                              type="primary"
                              onClick={() => handleConfirm(selectedRecord, conf.id)}
                            >
                              去确认
                            </Button>
                          )}
                          {conf.comment && (
                            <Tooltip title={conf.comment}>
                              <QuestionCircleOutlined className="text-gray-400" />
                            </Tooltip>
                          )}
                          {conf.confirmedAt && (
                            <span className="text-xs text-gray-400">
                              {formatDate(conf.confirmedAt)}
                            </span>
                          )}
                        </Space>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedRecord.reviewNote && (
              <div>
                <h4 className="font-medium mb-2">评审意见</h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded">{selectedRecord.reviewNote}</p>
              </div>
            )}

            {selectedRecord.reviewComments && selectedRecord.reviewComments.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">评审记录</h4>
                <Timeline
                  items={selectedRecord.reviewComments.map((rc) => {
                    const author = getMemberById(rc.author);
                    return {
                      content: (
                        <div>
                          <div className="flex items-center gap-2">
                            <Avatar src={author?.avatar} size={20} />
                            <span className="font-medium">{author?.name}</span>
                            <span className="text-xs text-gray-400">{formatDate(rc.createdAt)}</span>
                          </div>
                          <p className="text-gray-600 mt-1">{rc.content}</p>
                        </div>
                      ),
                    };
                  })}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="评审变更"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setReviewModalVisible(false)}>
            取消
          </Button>,
          <Button key="reject" danger onClick={() => handleSubmitReview('rejected')}>
            驳回
          </Button>,
          <Button key="approve" type="primary" onClick={() => handleSubmitReview('approved')}>
            通过
          </Button>,
        ]}
      >
        <p className="mb-3">请填写评审意见：</p>
        <TextArea
          rows={4}
          value={reviewNote}
          onChange={(e) => setReviewNote(e.target.value)}
          placeholder="请输入评审意见（可选）"
        />
      </Modal>

      <Modal
        title="确认变更"
        open={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setConfirmModalVisible(false)}>
            取消
          </Button>,
          <Button key="question" onClick={() => handleSubmitConfirm('questioned')}>
            有疑问
          </Button>,
          <Button key="confirm" type="primary" onClick={() => handleSubmitConfirm('confirmed')}>
            已确认
          </Button>,
        ]}
      >
        <p className="mb-3">请填写备注信息：</p>
        <TextArea
          rows={3}
          value={confirmComment}
          onChange={(e) => setConfirmComment(e.target.value)}
          placeholder="如有疑问或补充说明请填写（可选）"
        />
      </Modal>
    </div>
  );
};

export default Changes;
