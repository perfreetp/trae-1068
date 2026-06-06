import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Select,
  Checkbox,
  message,
  Empty,
  Badge,
  Tooltip,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  BellOutlined,
  UserOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useApiStore } from '@/store/apiStore';
import { useUserStore } from '@/store/userStore';
import { Notification, NotificationType, ConfirmationStatus, ReviewStatus } from '@/types';
import { formatDate } from '@/utils/helpers';

const { Option } = Select;

const getNotificationTypeIcon = (type: NotificationType) => {
  switch (type) {
    case 'change_confirmation':
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    case 'review_result':
      return <BellOutlined style={{ color: '#1890ff' }} />;
    case 'mention':
      return <MessageOutlined style={{ color: '#722ed1' }} />;
    case 'review_request':
      return <ClockCircleOutlined style={{ color: '#faad14' }} />;
    default:
      return <BellOutlined />;
  }
};

const getNotificationTypeText = (type: NotificationType) => {
  switch (type) {
    case 'change_confirmation':
      return '变更确认';
    case 'review_result':
      return '评审结果';
    case 'mention':
      return '@我的';
    case 'review_request':
      return '待评审';
    default:
      return '通知';
  }
};

const getNotificationTypeColor = (type: NotificationType) => {
  switch (type) {
    case 'change_confirmation':
      return 'green';
    case 'review_result':
      return 'blue';
    case 'mention':
      return 'purple';
    case 'review_request':
      return 'gold';
    default:
      return 'default';
  }
};

const Notifications = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead, changeRecords } = useApiStore();
  const { currentUser } = useUserStore();
  const navigate = useNavigate();
  
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const myNotifications = useMemo(
    () =>
      notifications
        .filter((n) => n.userId === currentUser?.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notifications, currentUser]
  );

  const getConfirmationStatus = (n: Notification): ConfirmationStatus | null => {
    if (n.type !== 'change_confirmation') return null;
    const change = changeRecords.find((c) => c.id === n.relatedId);
    if (!change) return null;
    const myConf = change.confirmations.find((c) => c.userId === currentUser?.id);
    return myConf?.status || null;
  };

  const getReviewStatus = (n: Notification): ReviewStatus | null => {
    if (n.type === 'review_request') {
      const change = changeRecords.find((c) => c.id === n.relatedId);
      return change?.status || null;
    }
    if (n.type === 'review_result') {
      const change = changeRecords.find((c) => c.id === n.relatedId);
      return change?.status || null;
    }
    return null;
  };

  const filteredNotifications = useMemo(() => {
    let result = myNotifications;
    
    switch (filterType) {
      case 'unread':
        result = result.filter((n) => !n.read);
        break;
      case 'read':
        result = result.filter((n) => n.read);
        break;
      case 'change_confirmation':
        result = result.filter((n) => n.type === 'change_confirmation');
        break;
      case 'change_confirmation_pending':
        result = result.filter((n) => n.type === 'change_confirmation' && getConfirmationStatus(n) === 'pending');
        break;
      case 'change_confirmation_confirmed':
        result = result.filter((n) => n.type === 'change_confirmation' && getConfirmationStatus(n) === 'confirmed');
        break;
      case 'change_confirmation_questioned':
        result = result.filter((n) => n.type === 'change_confirmation' && getConfirmationStatus(n) === 'questioned');
        break;
      case 'review_result':
        result = result.filter((n) => n.type === 'review_result');
        break;
      case 'review_request':
        result = result.filter((n) => n.type === 'review_request');
        break;
      case 'review_mine':
        result = result.filter((n) => n.type === 'review_request' && getReviewStatus(n) === 'pending');
        break;
      case 'review_processed':
        result = result.filter((n) => n.type === 'review_request' && getReviewStatus(n) !== 'pending');
        break;
      case 'mention':
        result = result.filter((n) => n.type === 'mention');
        break;
      default:
        break;
    }
    
    return result;
  }, [myNotifications, filterType, changeRecords, currentUser]);

  const handleRowClick = (record: Notification) => {
    markNotificationRead(record.id);
    
    if (record.relatedType === 'change') {
      navigate(`/changes?changeId=${record.relatedId}`);
    } else if (record.relatedType === 'api') {
      if (record.type === 'mention' && record.commentId) {
        navigate(`/api/${record.relatedId}?commentId=${record.commentId}&notificationId=${record.id}#comments-section`);
      } else if (record.type === 'mention') {
        navigate(`/api/${record.relatedId}#comments-section`);
      } else {
        navigate(`/api/${record.relatedId}`);
      }
    }
  };

  const handleMarkSelectedRead = () => {
    selectedRowKeys.forEach((key) => {
      markNotificationRead(key as string);
    });
    setSelectedRowKeys([]);
    message.success(`已标记 ${selectedRowKeys.length} 条通知为已读`);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead(currentUser?.id || '');
    message.success('已全部标记为已读');
  };

  const columns: ColumnsType<Notification> = [
    {
      title: '状态',
      dataIndex: 'read',
      key: 'read',
      width: 80,
      render: (read) =>
        read ? (
          <Tag color="default" style={{ fontSize: 11 }}>已读</Tag>
        ) : (
          <Badge dot color="blue" offset={[-2, 0]}>
            <Tag color="blue" style={{ fontSize: 11 }}>未读</Tag>
          </Badge>
        ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: NotificationType, record) => {
        const status = getConfirmationStatus(record) || getReviewStatus(record);
        return (
          <div className="flex flex-col gap-1">
            <Tag icon={getNotificationTypeIcon(type)} color={getNotificationTypeColor(type)}>
              {getNotificationTypeText(type)}
            </Tag>
            {status && (
              <Tag
                color={
                  status === 'pending'
                    ? 'warning'
                    : status === 'confirmed' || status === 'approved'
                    ? 'success'
                    : 'error'
                }
                style={{ fontSize: 10, margin: 0 }}
              >
                {status === 'pending'
                  ? '待处理'
                  : status === 'confirmed'
                  ? '已确认'
                  : status === 'approved'
                  ? '已通过'
                  : status === 'questioned'
                  ? '有疑问'
                  : '已拒绝'}
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: '通知内容',
      dataIndex: 'content',
      key: 'content',
      render: (text, record) => (
        <div>
          <div className="font-medium">{record.title}</div>
          <div className="text-gray-500 text-sm">{text}</div>
        </div>
      ),
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date) => formatDate(date),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleRowClick(record)}
            />
          </Tooltip>
          {!record.read && (
            <Tooltip title="标记已读">
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => markNotificationRead(record.id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const filterOptions = [
    { value: 'all', label: '全部通知' },
    { value: 'unread', label: '未读' },
    { value: 'read', label: '已读' },
    { value: 'divider1', label: '--- 变更确认 ---', disabled: true },
    { value: 'change_confirmation', label: '全部变更确认' },
    { value: 'change_confirmation_pending', label: '待我确认' },
    { value: 'change_confirmation_confirmed', label: '已确认' },
    { value: 'change_confirmation_questioned', label: '有疑问' },
    { value: 'divider2', label: '--- 评审 ---', disabled: true },
    { value: 'review_request', label: '全部评审通知' },
    { value: 'review_mine', label: '待我评审' },
    { value: 'review_processed', label: '我已处理' },
    { value: 'review_result', label: '评审结果通知' },
    { value: 'divider3', label: '--- 评论 ---', disabled: true },
    { value: 'mention', label: '@我的评论' },
  ];

  return (
    <div className="space-y-4">
      <Card
        size="small"
        title="通知中心"
        extra={
          <Space>
            <span className="text-gray-500">
              共 {filteredNotifications.length} 条，未读 {filteredNotifications.filter((n) => !n.read).length} 条
            </span>
          </Space>
        }
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <Space wrap>
            <Select
              value={filterType}
              onChange={setFilterType}
              style={{ width: 180 }}
              size="small"
            >
              {filterOptions.map((opt) =>
                opt.disabled ? (
                  <Option key={opt.value} disabled value={opt.value}>
                    <span className="text-gray-400 text-xs">{opt.label}</span>
                  </Option>
                ) : (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                )
              )}
            </Select>
          </Space>
          <Space>
            {selectedRowKeys.length > 0 && (
              <Button size="small" onClick={handleMarkSelectedRead}>
                标记已读 ({selectedRowKeys.length})
              </Button>
            )}
            <Button size="small" onClick={handleMarkAllRead}>
              全部已读
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredNotifications}
          rowKey="id"
          pagination={{ pageSize: 20 }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' },
          })}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            hideSelectAll: false,
          }}
          locale={{
            emptyText: <Empty description="暂无通知" />,
          }}
          rowClassName={(record) => (!record.read ? 'bg-blue-50/30' : '')}
        />
      </Card>
    </div>
  );
};

export default Notifications;
