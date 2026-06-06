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
  Avatar,
  Tooltip,
  Popconfirm,
  Tabs,
  Switch,
} from 'antd';
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  LockOutlined,
  TeamOutlined,
  GlobalOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useUserStore } from '@/store/userStore';
import { useProjectStore } from '@/store/projectStore';
import { Member, UserRole } from '@/types';
import { formatDate, getRoleText } from '@/utils/helpers';

const { Option } = Select;

const Members = () => {
  const { members, addMember, updateMemberRole, removeMember, currentUser } = useUserStore();
  const { project, updateProject } = useProjectStore();
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [form] = Form.useForm();
  const [settingsForm] = Form.useForm();

  const columns: ColumnsType<Member> = [
    {
      title: '成员',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.avatar} size={36}>
            {text[0]}
          </Avatar>
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-xs text-gray-500">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: UserRole) => {
        const colorMap: Record<UserRole, string> = {
          admin: 'purple',
          developer: 'blue',
          viewer: 'default',
        };
        return <Tag color={colorMap[role]}>{getRoleText(role)}</Tag>;
      },
    },
    {
      title: '加入时间',
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      width: 160,
      render: (date) => formatDate(date),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {currentUser.role === 'admin' && record.id !== currentUser.id && (
            <>
              <Tooltip title="修改角色">
                <Select
                  size="small"
                  value={record.role}
                  style={{ width: 90 }}
                  onChange={(value) => {
                    updateMemberRole(record.id, value);
                    message.success('角色已更新');
                  }}
                >
                  <Option value="admin">管理员</Option>
                  <Option value="developer">开发者</Option>
                  <Option value="viewer">访客</Option>
                </Select>
              </Tooltip>
              <Tooltip title="移除">
                <Popconfirm
                  title="确认移除该成员？"
                  onConfirm={() => {
                    removeMember(record.id);
                    message.success('已移除');
                  }}
                >
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  const handleInvite = () => {
    form.validateFields().then((values) => {
      addMember({
        name: values.name,
        email: values.email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${values.name}`,
        role: values.role,
      });
      message.success('邀请已发送');
      setInviteModalVisible(false);
      form.resetFields();
    });
  };

  const handleSaveSettings = () => {
    settingsForm.validateFields().then((values) => {
      updateProject(values);
      message.success('设置已保存');
      setSettingsVisible(false);
    });
  };

  const permissionItems = [
    {
      key: 'members',
      label: '成员管理',
      children: (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium m-0">团队成员</h3>
              <p className="text-gray-500 text-sm m-0">管理项目成员和权限</p>
            </div>
            <Space>
              <Button icon={<SettingOutlined />} onClick={() => {
                settingsForm.setFieldsValue(project);
                setSettingsVisible(true);
              }}>
                项目设置
              </Button>
              <Button type="primary" icon={<UserAddOutlined />} onClick={() => setInviteModalVisible(true)}>
                邀请成员
              </Button>
            </Space>
          </div>
          <Table
            columns={columns}
            dataSource={members}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </div>
      ),
    },
    {
      key: 'roles',
      label: '角色权限',
      children: (
        <div className="space-y-4">
          {[
            { role: 'admin', name: '管理员', desc: '拥有项目所有权限', icon: <SafetyOutlined />, color: 'purple' },
            { role: 'developer', name: '开发者', desc: '可以编辑接口、调试、提交变更', icon: <TeamOutlined />, color: 'blue' },
            { role: 'viewer', name: '访客', desc: '只能浏览接口和文档', icon: <GlobalOutlined />, color: 'default' },
          ].map((item) => (
            <Card key={item.role} size="small">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${item.color}-100 text-${item.color}-500`}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-medium">
                      <Tag color={item.color as any}>{item.name}</Tag>
                    </div>
                    <div className="text-sm text-gray-500">{item.desc}</div>
                  </div>
                </div>
                <Button type="link">查看权限详情</Button>
              </div>
            </Card>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card size="small" bodyStyle={{ padding: 0 }}>
        <Tabs items={permissionItems} />
      </Card>

      <Modal
        title="邀请成员"
        open={inviteModalVisible}
        onCancel={() => setInviteModalVisible(false)}
        onOk={handleInvite}
        okText="发送邀请"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入成员姓名" />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, message: '请输入邮箱' }]}>
            <Input placeholder="请输入邮箱地址" />
          </Form.Item>
          <Form.Item name="role" label="角色" initialValue="developer" rules={[{ required: true }]}>
            <Select>
              <Option value="admin">管理员</Option>
              <Option value="developer">开发者</Option>
              <Option value="viewer">访客</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="项目设置"
        open={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        onOk={handleSaveSettings}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form form={settingsForm} layout="vertical">
          <Form.Item name="name" label="项目名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="visibility" label="可见范围" tooltip="设置项目的可见范围">
            <Select>
              <Option value="private">
                <div className="flex items-center gap-2">
                  <LockOutlined /> 私有 - 仅项目成员可见
                </div>
              </Option>
              <Option value="team">
                <div className="flex items-center gap-2">
                  <TeamOutlined /> 团队 - 团队内所有成员可见
                </div>
              </Option>
              <Option value="public">
                <div className="flex items-center gap-2">
                  <GlobalOutlined /> 公开 - 所有人可见
                </div>
              </Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Members;
