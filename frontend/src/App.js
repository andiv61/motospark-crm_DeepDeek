import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  ShopOutlined,
  InboxOutlined,
  MailOutlined,
  LineChartOutlined,
  ImportOutlined
} from '@ant-design/icons';
import './App.css';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Products from './pages/Products';
import Warehouses from './pages/Warehouses';
import Orders from './pages/Orders';
import Emails from './pages/Emails';
import Analytics from './pages/Analytics';
import Import from './pages/Import';

const { Header, Content, Sider } = Layout;

function App() {
  const isAuthenticated = !!localStorage.getItem('authToken');

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider collapsible>
          <div className="logo">Motospark CRM</div>
          <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
            <Menu.Item key="1" icon={<DashboardOutlined />}>
              <a href="/dashboard">Dashboard</a>
            </Menu.Item>
            <Menu.Item key="2" icon={<UserOutlined />}>
              <a href="/clients">Clients</a>
            </Menu.Item>
            <Menu.Item key="3" icon={<ShopOutlined />}>
              <a href="/products">Products</a>
            </Menu.Item>
            <Menu.Item key="4" icon={<InboxOutlined />}>
              <a href="/warehouses">Warehouses</a>
            </Menu.Item>
            <Menu.Item key="5" icon={<InboxOutlined />}>
              <a href="/orders">Orders</a>
            </Menu.Item>
            <Menu.Item key="6" icon={<MailOutlined />}>
              <a href="/emails">Email Campaigns</a>
            </Menu.Item>
            <Menu.Item key="7" icon={<LineChartOutlined />}>
              <a href="/analytics">Analytics</a>
            </Menu.Item>
            <Menu.Item key="8" icon={<ImportOutlined />}>
              <a href="/import">Import</a>
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout className="site-layout">
          <Header className="site-layout-background" style={{ padding: 0 }} />
          <Content style={{ margin: '16px' }}>
            <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
              <Switch>
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/clients" component={Clients} />
                <Route path="/products" component={Products} />
                <Route path="/warehouses" component={Warehouses} />
                <Route path="/orders" component={Orders} />
                <Route path="/emails" component={Emails} />
                <Route path="/analytics" component={Analytics} />
                <Route path="/import" component={Import} />
                <Redirect from="/" to="/dashboard" />
              </Switch>
            </div>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
}

export default App;