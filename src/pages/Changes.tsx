import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  DatePicker,
  Popconfirm,
  Badge,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  DiffOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  UserOutlined,
  BellOutlined,
  WarningOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useApiStore } from '@/store/apiStore';
import { useUserStore } from '@/store/userStore';
import { ChangeRecord, ConfirmationStatus, ReviewStatus, TimelineItemType } from '@/types';
import { formatDate, getReviewStatusText, getReviewStatusColor, getConfirmationStatusText, getConfirmationStatusColor } from '@/utils/helpers';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const getTimelineIcon = (type: TimelineItemType) => {
  switch (type) {
    case 'submit':
      return <PlusOutlined style={{ color: '#1890ff' }} />;
    case 'reviewer_assign':
    case 'confirmation_assign':
      return <UserOutlined style={{ color: '#722ed1' }} />;
    case 'confirm':
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    case 'question':
      return <QuestionCircleOutlined style={{ color: '#faad14' }} />;
    case 'approve':
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    case 'reject':
      return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
    case 'reminder':
      return <BellOutlined style={{ color: '#faad14' }} />;
    default:
      return <ClockCircleOutlined />;
  }
};

const getTimelineColor = (type: TimelineItemType) => {
  switch (type) {
    case 'submit':
      return 'blue';
    case 'reviewer_assign':
    case 'confirmation_assign':
      return 'purple';
    case 'confirm':
    case 'approve':
      return 'green';
    case 'question':
      return 'gold';
    case 'reject':
      return 'red';
    case 'reminder':
      return 'gold';
    default:
      return 'gray';
  }
};

const Changes = () => {
  const { changeRecords, apis, reviewChange, updateConfirmationStatus, addChangeRecord, sendReminder } = useApiStore();
  const { getMemberById, getMemberName, members, currentUser } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [detailVisible, setDetailVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ChangeRecord | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmComment, setConfirmComment] = useState('');
  const [confirmationId, setConfirmationId] = useState('');
  const [highlightChangeId, setHighlightChangeId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const changeId = params.get('changeId');
    if (changeId) {
      setHighlightChangeId(changeId);
      const record = changeRecords.find((r) => r.id === changeId);
      if (record) {
        setTimeout(() => {
          setSelectedRecord(record);
          setDetailVisible(true);
        }, 300);
      }
    }
  }, [location.search, changeRecords]);

  const handleView = (record: ChangeRecord) => {
    setSelectedRecord(record);
    setDetailVisible(true);
    setHighlightChangeId(null);
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
    const updated = changeRecords.find((r) => r.id === selectedRecord.id);
    if (updated) setSelectedRecord(updated);
  };

  const handleCreate = () => {
    setCreateVisible(true);
  };

  const handleSubmitCreate = () => {
    form.validateFields().then((values) => {
      const deadline = values.deadline ? values.deadline.toISOString() : undefined;
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
        deadline,
        confirmations: (values.confirmUserIds || []).map((userId: string, index: number) => ({
          id: 'conf-' + Date.now() + '-' + index,
          userId,
          status: 'pending' as ConfirmationStatus,
          confirmedAt: null,
          comment: '',
          deadline: values.confirmDeadline ? values.confirmDeadline.toISOString() : undefined,
        })),
      });
      setCreateVisible(false);
      form.resetFields();
      message.success('变更已提交');
    });
  };

  const handleSendReminder = (targetUserId: string) => {
    if (!selectedRecord || !currentUser) return;
    sendReminder(selectedRecord.id, targetUserId, currentUser.id);
    message.success('催办提醒已发送');
    const updated = changeRecords.find((r) => r.id === selectedRecord.id);
    if (updated) setSelectedRecord(updated);
  };

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
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
          <div className="flex items-center gap-2">
            {record.deadline && isOverdue(record.deadline) && (
              <Badge dot color="red" offset={[-2, 0]}>
                <WarningOutlined className="text-red-500" />
              </Badge>
            )}
            <span className="font-medium">{text}</span>
          </div>
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
      title: '截止时间',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 160,
      render: (date) =>
        date ? (
          <div className="flex items-center gap-1">
            <FieldTimeOutlined className={isOverdue(date) ? 'text-red-500' : 'text-gray-400'} />
            <span className={isOverdue(date) ? 'text-red-500 font-medium' : ''}>
              {formatDate(date)}
            </span>
            {isOverdue(date) && <Tag color="red" style={{ fontSize: 10 }}>已超时</Tag>}
          </div>
        ) : (
          '-'
        ),
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
      width: 240,
      fixed: 'right',
      render: (_, record) => {
        const myConfirmation = record.confirmations?.find((c) => c.userId === currentUser?.id);
        const isReviewer = record.reviewerId === currentUser?.id && record.status === 'pending';
        const isSubmitter = record.submitter === currentUser?.id;
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
            {isSubmitter && record.status === 'pending' && (
              <Tooltip title="催办">
                <Button
                  type="text"
                  size="small"
                  icon={<BellOutlined />}
                  onClick={() => {
                    setSelectedRecord(record);
                    if (record.reviewerId) handleSendReminder(record.reviewerId);
                  }}
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
      children: <Table columns={columns} dataSource={changeRecords} rowKey="id" pagination={{ pageSize: 10 }} rowClassName={(record) => record.id === highlightChangeId ? 'bg-yellow-50' : ''} />,
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
    <div className="space-y-4" ref={tableRef}>
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
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="deadline" label="评审截止时间">
              <DatePicker showTime style={{ width: '100%' }} placeholder="选择截止时间" />
            </Form.Item>
            <Form.Item name="confirmDeadline" label="确认截止时间">
              <DatePicker showTime style={{ width: '100%' }} placeholder="选择截止时间" />
            </Form.Item>
          </div>
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
        width={900}
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
              <Descriptions.Item label="截止时间">
                {selectedRecord.deadline ? (
                  <span className={isOverdue(selectedRecord.deadline) ? 'text-red-500' : ''}>
                    {formatDate(selectedRecord.deadline)}
                    {isOverdue(selectedRecord.deadline) && ' (已超时)'}
                  </span>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
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
                          {conf.deadline && (
                            <span className={`text-xs ${isOverdue(conf.deadline) ? 'text-red-500' : 'text-gray-400'}`}>
                              截止: {formatDate(conf.deadline)}
                            </span>
                          )}
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
                          {!isMine && conf.status === 'pending' && selectedRecord.submitter === currentUser?.id && (
                            <Tooltip title="催办">
                              <Button
                                size="small"
                                type="text"
                                icon={<BellOutlined />}
                                onClick={() => handleSendReminder(conf.userId)}
                              />
                            </Tooltip>
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

            <div>
              <h4 className="font-medium mb-2">协作时间线</h4>
              <Timeline
                items={selectedRecord.timeline
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .map((item) => {
                    const user = item.userId ? getMemberById(item.userId) : null;
                    const targetUser = item.targetUserId ? getMemberById(item.targetUserId) : null;
                    return {
                      dot: getTimelineIcon(item.type),
                      color: getTimelineColor(item.type),
                      children: (
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {user && (
                              <span className="flex items-center gap-1">
                                <Avatar src={user.avatar} size={20} />
                                <span className="font-medium">{user.name}</span>
                              </span>
                            )}
                            <span>{item.content}</span>
                            {targetUser && (
                              <span className="flex items-center gap-1 text-gray-500">
                                <UserOutlined />
                                {targetUser.name}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">{formatDate(item.createdAt)}</span>
                          </div>
                          {item.note && <p className="text-gray-500 text-sm mt-1">备注：{item.note}</p>}
                        </div>
                      ),
                    };
                  })}
              />
            </div>
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
