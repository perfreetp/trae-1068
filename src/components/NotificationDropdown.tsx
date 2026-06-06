import { useState } from 'react';
import { Popover, List, Badge, Button, Space, Tabs, Empty, Tag, Avatar, message } from 'antd';
import { BellOutlined, CheckOutlined, InboxOutlined, MessageOutlined, CheckCircleOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useApiStore } from '@/store/apiStore';
import { useUserStore } from '@/store/userStore';
import { Notification, NotificationType } from '@/types';
import { formatRelativeTime } from '@/utils/helpers';

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

interface NotificationDropdownProps {
  children: React.ReactNode;
}

const NotificationDropdown = ({ children }: NotificationDropdownProps) => {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const { getNotificationsByUserId, markNotificationRead, markAllNotificationsRead } = useApiStore();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const notifications = getNotificationsByUserId(currentUser.id);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    markNotificationRead(notification.id);
    
    if (notification.relatedType === 'change') {
      navigate(`/changes?changeId=${notification.relatedId}`);
    } else if (notification.relatedType === 'api') {
      if (notification.type === 'mention') {
        navigate(`/api/${notification.relatedId}#comments-section`);
      } else {
        navigate(`/api/${notification.relatedId}`);
      }
    }
    
    setOpen(false);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead(currentUser.id);
    message.success('已全部标记为已读');
  };

  const handleGoToNotificationCenter = () => {
    navigate('/notifications');
    setOpen(false);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.read;
    return n.type === activeTab;
  });

  const tabItems = [
    { key: 'all', label: `全部 (${notifications.length})` },
    { key: 'unread', label: `未读 (${unreadCount})` },
    { key: 'change_confirmation', label: '变更确认' },
    { key: 'review_result', label: '评审结果' },
    { key: 'mention', label: '@我的' },
  ];

  const content = (
    <div className="w-80">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="font-medium">通知</span>
        <Space size="small">
          <Button type="text" size="small" onClick={handleMarkAllRead}>
            全部已读
          </Button>
          <Button type="text" size="small" onClick={handleGoToNotificationCenter}>
            通知中心
          </Button>
        </Space>
      </div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} size="small" items={tabItems} />
      <div className="max-h-96 overflow-auto">
        {filteredNotifications.length > 0 ? (
          <List
            size="small"
            dataSource={filteredNotifications}
            renderItem={(item) => (
              <List.Item
                className={`px-3 cursor-pointer hover:bg-gray-50 ${!item.read ? 'bg-blue-50/30' : ''}`}
                onClick={() => handleNotificationClick(item)}
              >
                <div className="flex gap-3 w-full py-1">
                  <div className="flex-shrink-0 mt-0.5">
                    <Badge dot={!item.read} offset={[2, 0]}>
                      <Avatar size={32} icon={getNotificationIcon(item.type)} className="bg-gray-100" />
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${!item.read ? 'text-gray-900' : 'text-gray-600'}`}>
                        {item.title}
                      </span>
                      <Tag color="default" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                        {getNotificationTypeText(item.type)}
                      </Tag>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">{item.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(item.createdAt)}</p>
                  </div>
                  {!item.read && (
                    <div className="flex-shrink-0">
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          markNotificationRead(item.id);
                        }}
                      />
                    </div>
                  )}
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无通知" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-8" />
        )}
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      overlayInnerStyle={{ padding: 0 }}
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        {children}
      </Badge>
    </Popover>
  );
};

export default NotificationDropdown;
