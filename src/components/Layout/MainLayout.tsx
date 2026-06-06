import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Breadcrumb, Button } from 'antd';
import {
  HomeOutlined,
  ApiOutlined,
  FileTextOutlined,
  HistoryOutlined,
  TeamOutlined,
  BugOutlined,
  BellOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CodeOutlined,
  RocketOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { useProjectStore } from '@/store/projectStore';
import { useApiStore } from '@/store/apiStore';
import NotificationDropdown from '@/components/NotificationDropdown';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, members } = useUserStore();
  const { project } = useProjectStore();
  const { getUnreadNotificationCount } = useApiStore();

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '项目首页' },
    { key: '/api', icon: <ApiOutlined />, label: '接口目录' },
    { key: '/debug', icon: <RocketOutlined />, label: '在线调试' },
    { key: '/test-cases', icon: <FileTextOutlined />, label: '用例管理' },
    { key: '/changes', icon: <HistoryOutlined />, label: '变更记录' },
    { key: '/notifications', icon: <InboxOutlined />, label: '通知中心' },
    { key: '/members', icon: <TeamOutlined />, label: '成员权限' },
    { key: '/error-codes', icon: <CodeOutlined />, label: '错误码' },
  ];

  const userMenuItems = [
    { key: 'profile', label: '个人资料' },
    { key: 'settings', label: '账号设置' },
    { type: 'divider' as const },
    { key: 'logout', label: '退出登录' },
  ];

  const getBreadcrumbItems = () => {
    const pathMap: Record<string, string> = {
      '/': '项目首页',
      '/api': '接口目录',
      '/debug': '在线调试',
      '/test-cases': '用例管理',
      '/changes': '变更记录',
      '/notifications': '通知中心',
      '/members': '成员权限',
      '/error-codes': '错误码',
    };
    const items: { title: React.ReactNode }[] = [{ title: <Link to="/">{project.name}</Link> }];
    if (location.pathname !== '/') {
      items.push({ title: pathMap[location.pathname] || location.pathname });
    }
    return items;
  };

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{
          background: '#001529',
          overflow: 'auto',
          height: '100vh',
          position: 'sticky',
          top: 0,
          left: 0,
        }}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-700">
          <div className="flex items-center gap-2 text-white">
            <ApiOutlined className="text-xl text-blue-400" />
            {!collapsed && <span className="font-bold text-lg">API Collab</span>}
          </div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ border: 'none', paddingTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          className="bg-white border-b flex items-center justify-between px-4"
          style={{ padding: '0 16px', background: '#fff', position: 'sticky', top: 0, zIndex: 100 }}
        >
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <Breadcrumb items={getBreadcrumbItems()} />
          </div>
          <div className="flex items-center gap-4">
            <NotificationDropdown>
              <Button type="text" icon={<BellOutlined />} style={{ fontSize: 18 }} />
            </NotificationDropdown>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                <Avatar src={currentUser.avatar} size={32}>
                  {currentUser.name[0]}
                </Avatar>
                <span className="hidden md:block text-gray-700">{currentUser.name}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
