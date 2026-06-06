import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Checkbox,
  Select,
  Avatar,
  message,
  Empty,
  Tooltip,
} from 'antd';
import {
  CheckOutlined,
  InboxOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  UserOutlined,
  BellOutlined,
  DeleteOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useApiStore } from '@/store/apiStore';
import { useUserStore } from '@/store/userStore';
import { Notification, NotificationType, NotificationFilterType } from '@/types';
import { formatDate, formatRelativeTime } from '@/utils/helpers';

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'change_confirmation':
      return <InboxOutlined className="text-orange-500" />;
    case 'review_result':
      return <CheckCircleOutlined className="text-green-500" />;
    case 'mention':
      return <MessageOutlined className="text-blue-500" />;
    case 'review_request':
      return <UserOutlined className="text-purple-500" />;
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
      return 'orange';
    case 'review_result':
      return 'green';
    case 'mention':
      return 'blue';
    case 'review_request':
      return 'purple';
    default:
      return 'default';
  }
};

const Notifications = () => {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const { getNotificationsByUserId, markNotificationRead, markAllNotificationsRead } = useApiStore();
  
  const [filterType, setFilterType] = useState<NotificationFilterType>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const notifications = useMemo(
    () => getNotificationsByUserId(currentUser.id),
    [currentUser.id, getNotificationsByUserId]
  );

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      switch (filterType) {
        case 'unread':
          return !n.read;
        case 'read':
          return n.read;
        case 'change_confirmation':
        case 'mention':
        case 'review_result':
          return n.type === filterType;
        default:
          return true;
      }
    });
  }, [notifications, filterType]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleRowClick = (record: Notification) => {
    markNotificationRead(record.id);
    
    if (record.relatedType === 'change') {
      navigate('/changes');
    } else if (record.relatedType === 'api') {
      if (record.type === 'mention') {
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
    message.success(`已将 ${selectedRowKeys.length} 条通知标记为已读`);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead(currentUser.id);
    message.success('已全部标记为已读');
  };

  const columns: ColumnsType<Notification> = [
    {
      title: '状态',
      dataIndex: 'read',
      key: 'read',
      width: 60,
      render: (read) => (
        <div className="flex justify-center">
          {!read && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: NotificationType) => (
        <Tag color={getNotificationTypeColor(type)}>
          {getNotificationTypeText(type)}
        </Tag>
      ),
    },
    {
      title: '通知内容',
      key: 'content',
      render: (_, record) => (
        <div className="flex gap-3">
          <Avatar size={40} icon={getNotificationIcon(record.type)} className="bg-gray-100 flex-shrink-0" />
          <div className="min-w-0">
            <div className={`font-medium ${!record.read ? 'text-gray-900' : 'text-gray-600'}`}>
              {record.title}
            </div>
            <p className="text-sm text-gray-500 mt-1 truncate">{record.content}</p>
          </div>
        </div>
      ),
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => (
        <Tooltip title={formatDate(date)}>
          <span className="text-gray-500">{formatRelativeTime(date)}</span>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {!record.read && (
            <Button
              type="text"
              size="small"
              icon={<CheckOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                markNotificationRead(record.id);
              }}
            >
              标记已读
            </Button>
          )}
          <Button
            type="text"
            size="small"
            icon={<ArrowRightOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(record);
            }}
          >
            查看
          </Button>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  const filterOptions = [
    { value: 'all', label: '全部通知' },
    { value: 'unread', label: '未读通知' },
    { value: 'read', label: '已读通知' },
    { value: 'change_confirmation', label: '变更确认' },
    { value: 'review_result', label: '评审结果' },
    { value: 'mention', label: '@我的' },
  ];

  return (
    <div className="space-y-4">
      <Card
        size="small"
        title={
          <div className="flex items-center gap-2">
            <InboxOutlined />
            <span>通知中心</span>
            {unreadCount > 0 && (
              <Tag color="red" style={{ margin: 0 }}>
                {unreadCount} 条未读
              </Tag>
            )}
          </div>
        }
        extra={
          <Space>
            <Select
              value={filterType}
              onChange={setFilterType as any}
              style={{ width: 140 }}
              size="small"
              options={filterOptions}
            />
            {selectedRowKeys.length > 0 && (
              <Button size="small" icon={<CheckOutlined />} onClick={handleMarkSelectedRead}>
                标记已读 ({selectedRowKeys.length})
              </Button>
            )}
            <Button size="small" icon={<CheckOutlined />} onClick={handleMarkAllRead}>
              全部已读
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredNotifications}
          rowKey="id"
          rowSelection={rowSelection}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' },
          })}
          locale={{
            emptyText: <Empty description="暂无通知" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
          }}
        />
      </Card>
    </div>
  );
};

export default Notifications;
