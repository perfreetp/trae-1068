import { useState } from 'react';
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
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  DiffOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useApiStore } from '@/store/apiStore';
import { useUserStore } from '@/store/userStore';
import { ChangeRecord } from '@/types';
import { formatDate, getReviewStatusText, getReviewStatusColor } from '@/utils/helpers';

const Changes = () => {
  const { changeRecords, apis } = useApiStore();
  const { getMemberById, getMemberName, members } = useUserStore();
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ChangeRecord | null>(null);

  const handleView = (record: ChangeRecord) => {
    setSelectedRecord(record);
    setDetailVisible(true);
  };

  const handleApprove = (record: ChangeRecord) => {
    message.success('已通过评审');
  };

  const handleReject = (record: ChangeRecord) => {
    message.error('已拒绝评审');
  };

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
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
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
            <span className="flex items-center gap-1"><CheckCircleOutlined /> {getReviewStatusText(status)}</span>
          ) : status === 'rejected' ? (
            <span className="flex items-center gap-1"><CloseCircleOutlined /> {getReviewStatusText(status)}</span>
          ) : (
            <span className="flex items-center gap-1"><ClockCircleOutlined /> {getReviewStatusText(status)}</span>
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
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="版本对比">
            <Button type="text" size="small" icon={<DiffOutlined />} />
          </Tooltip>
          {record.status === 'pending' && (
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
              <Tooltip title="拒绝">
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
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'all',
      label: '全部',
      children: (
        <Table
          columns={columns}
          dataSource={changeRecords}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
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
          <Button type="primary" icon={<PlusOutlined />}>
            提交变更
          </Button>
        }
      >
        <Tabs items={tabItems} />
      </Card>

      <Modal
        title="变更详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
          selectedRecord?.status === 'pending' && (
            <>
              <Button key="reject" danger onClick={() => { handleReject(selectedRecord); setDetailVisible(false); }}>
                拒绝
              </Button>
              <Button key="approve" type="primary" onClick={() => { handleApprove(selectedRecord); setDetailVisible(false); }}>
                通过
              </Button>
            </>
          ),
        ]}
        width={700}
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
                  ) : '-';
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="提交时间">{formatDate(selectedRecord.createdAt)}</Descriptions.Item>
            </Descriptions>

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

            {selectedRecord.reviewComments && selectedRecord.reviewComments.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">评审意见</h4>
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
    </div>
  );
};

export default Changes;
