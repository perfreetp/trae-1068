import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Space,
  Select,
  DatePicker,
  Avatar,
  Tooltip,
  List,
  Badge,
  Empty,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  BellOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons';
import { useApiStore } from '@/store/apiStore';
import { useUserStore } from '@/store/userStore';
import { TodoType, TodoStatus } from '@/types';
import { formatDate } from '@/utils/helpers';

const { Option } = Select;
const { RangePicker } = DatePicker;

const getTodoTypeIcon = (type: TodoType) => {
  switch (type) {
    case 'confirmation':
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    case 'review':
      return <BellOutlined style={{ color: '#faad14' }} />;
    case 'mention':
      return <MessageOutlined style={{ color: '#722ed1' }} />;
    case 'my_review_pending':
      return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
    default:
      return <BellOutlined />;
  }
};

const getTodoTypeText = (type: TodoType) => {
  switch (type) {
    case 'confirmation':
      return '待确认';
    case 'review':
      return '待评审';
    case 'mention':
      return '@我的';
    case 'my_review_pending':
      return '等待中';
    default:
      return '待办';
  }
};

const getTodoTypeColor = (type: TodoType) => {
  switch (type) {
    case 'confirmation':
      return 'green';
    case 'review':
      return 'gold';
    case 'mention':
      return 'purple';
    case 'my_review_pending':
      return 'blue';
    default:
      return 'default';
  }
};

const TodoBoard = () => {
  const { todos, changeRecords, apis } = useApiStore();
  const { currentUser, members, getMemberById, getMemberName } = useUserStore();
  const navigate = useNavigate();
  
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMember, setFilterMember] = useState<string>('');
  const [filterModule, setFilterModule] = useState<string>('');

  const myTodos = useMemo(
    () =>
      todos.filter((t) => t.assigneeId === currentUser?.id).sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [todos, currentUser]
  );

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const getTodoStatusColor = (todo: any) => {
    if (todo.status === 'completed') return 'success';
    if (isOverdue(todo.deadline)) return 'error';
    if (todo.status === 'overdue') return 'error';
    return 'warning';
  };

  const getTodoStatusText = (todo: any) => {
    if (todo.status === 'completed') return '已完成';
    if (isOverdue(todo.deadline)) return '已超时';
    return '待处理';
  };

  const handleTodoClick = (todo: any) => {
    if (todo.relatedType === 'change') {
      navigate(`/changes?changeId=${todo.relatedId}`);
    } else if (todo.relatedType === 'api') {
      navigate(`/api/${todo.relatedId}#comments-section`);
    }
  };

  const groupedTodos = useMemo(() => {
    const groups: Record<string, typeof myTodos> = {
      confirmation: myTodos.filter((t) => t.type === 'confirmation'),
      review: myTodos.filter((t) => t.type === 'review'),
      mention: myTodos.filter((t) => t.type === 'mention'),
      my_review_pending: myTodos.filter((t) => t.type === 'my_review_pending'),
    };
    return groups;
  }, [myTodos]);

  const TodoCard = ({ todos, title, type }: { todos: typeof myTodos; title: string; type: TodoType }) => (
    <Card
      size="small"
      title={
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {getTodoTypeIcon(type)}
            {title}
          </span>
          <Badge count={todos.length} style={{ backgroundColor: getTodoTypeColor(type) }} />
        </div>
      }
      className="h-full"
      bodyStyle={{ padding: 8 }}
    >
      {todos.length > 0 ? (
        <List
          size="small"
          dataSource={todos}
          renderItem={(todo) => (
            <List.Item
              className="cursor-pointer hover:bg-gray-50 rounded p-2"
              onClick={() => handleTodoClick(todo)}
              style={{ marginBottom: 8, border: '1px solid #f0f0f0', borderRadius: 8 }}
            >
              <div className="w-full">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Tag color={getTodoTypeColor(todo.type)} style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                      {getTodoTypeText(todo.type)}
                    </Tag>
                    {todo.priority === 'high' && (
                      <Tooltip title="高优先级">
                        <ExclamationCircleOutlined className="text-red-500" />
                      </Tooltip>
                    )}
                    {isOverdue(todo.deadline) && (
                      <Tag color="red" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                        已超时
                      </Tag>
                    )}
                  </div>
                  <Tag color={getTodoStatusColor(todo)} style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                    {getTodoStatusText(todo)}
                  </Tag>
                </div>
                <div className="font-medium text-sm mb-1">{todo.title}</div>
                <div className="text-gray-500 text-xs mb-2">{todo.description}</div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Avatar src={getMemberById(todo.creatorId)?.avatar} size={16} icon={<UserOutlined />} />
                    <span>{getMemberName(todo.creatorId)}</span>
                  </div>
                  {todo.deadline && (
                    <div className={`flex items-center gap-1 ${isOverdue(todo.deadline) ? 'text-red-500' : ''}`}>
                      <FieldTimeOutlined />
                      <span>{formatDate(todo.deadline)}</span>
                    </div>
                  )}
                </div>
              </div>
            </List.Item>
          )}
        />
      ) : (
        <Empty description="暂无待办" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Card>
  );

  return (
    <div className="space-y-4">
      <Card size="small" title="协作待办看板">
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <Space wrap>
            <span className="text-gray-500 text-sm">类型:</span>
            <Select value={filterType} onChange={setFilterType} style={{ width: 140 }} size="small" allowClear>
              <Option value="all">全部</Option>
              <Option value="confirmation">待确认</Option>
              <Option value="review">待评审</Option>
              <Option value="mention">@我的</Option>
              <Option value="my_review_pending">等待中</Option>
            </Select>
          </Space>
          <Space wrap>
            <span className="text-gray-500 text-sm">成员:</span>
            <Select value={filterMember} onChange={setFilterMember} style={{ width: 140 }} size="small" allowClear showSearch>
              {members.map((m) => (
                <Option key={m.id} value={m.id}>
                  <span className="flex items-center gap-2">
                    <Avatar size={16} src={m.avatar} icon={<UserOutlined />} />
                    {m.name}
                  </span>
                </Option>
              ))}
            </Select>
          </Space>
          <Space wrap>
            <span className="text-gray-500 text-sm">模块:</span>
            <Select value={filterModule} onChange={setFilterModule} style={{ width: 140 }} size="small" allowClear showSearch>
              <Option value="mod-1">用户模块</Option>
              <Option value="mod-2">订单模块</Option>
              <Option value="mod-3">商品模块</Option>
              <Option value="mod-4">支付模块</Option>
            </Select>
          </Space>
          <Space wrap>
            <span className="text-gray-500 text-sm">截止时间:</span>
            <RangePicker size="small" />
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <TodoCard todos={groupedTodos.confirmation} title="待我确认" type="confirmation" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <TodoCard todos={groupedTodos.review} title="待我评审" type="review" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <TodoCard todos={groupedTodos.mention} title="@我的评论" type="mention" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <TodoCard todos={groupedTodos.my_review_pending} title="等待处理" type="my_review_pending" />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default TodoBoard;
