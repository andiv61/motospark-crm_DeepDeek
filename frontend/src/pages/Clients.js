import React, { useState, useEffect } from 'react';
import { 
  Table, Card, Tabs, Form, Input, Button, 
  Select, DatePicker, Tag, notification 
} from 'antd';
import { 
  UserOutlined, ShoppingOutlined, 
  StarOutlined, HistoryOutlined 
} from '@ant-design/icons';
import api from '../utils/api';
import ClientActivityChart from '../components/ClientActivityChart';

const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [segments, setSegments] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [selectedClient, setSelectedClient] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/clients');
      setClients(response.data);
    } catch (error) {
      notification.error({ message: 'Failed to fetch clients' });
    } finally {
      setLoading(false);
    }
  };

  const handleSegmentSearch = async (values) => {
    try {
      setLoading(true);
      const response = await api.post('/api/clients/segment', {
        filters: values
      });
      setSegments(response.data.segments);
      setActiveTab('segments');
    } catch (error) {
      notification.error({ message: 'Segmentation failed' });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Button type="link" onClick={() => setSelectedClient(record)}>
          {text}
        </Button>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: type => (
        <Tag color={type === 'wholesale' ? 'blue' : 'green'}>
          {type.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Last Order',
      dataIndex: 'last_order_date',
      key: 'last_order_date',
      render: date => date ? new Date(date).toLocaleDateString() : 'Never'
    }
  ];

  return (
    <div className="clients-page">
      <Card title="Clients Management">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="All Clients" key="list">
            <Table 
              dataSource={clients} 
              columns={columns} 
              rowKey="id"
              loading={loading}
            />
          </TabPane>
          
          <TabPane tab="Segmentation" key="segments">
            <Card title="Segment Clients">
              <Form form={form} onFinish={handleSegmentSearch} layout="inline">
                <Form.Item name="type" label="Client Type">
                  <Select style={{ width: 120 }}>
                    <Option value="retail">Retail</Option>
                    <Option value="wholesale">Wholesale</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item name="activity" label="Activity">
                  <Select style={{ width: 180 }}>
                    <Option value="active">Active (ordered last 30 days)</Option>
                    <Option value="inactive">Inactive (no orders >90 days)</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item name="dateRange" label="Order Date">
                  <RangePicker />
                </Form.Item>
                
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Analyze
                  </Button>
                </Form.Item>
              </Form>
            </Card>
            
            {segments.vip && (
              <div style={{ marginTop: 24 }}>
                <h3><StarOutlined /> VIP Clients</h3>
                <Table 
                  dataSource={segments.vip} 
                  columns={columns} 
                  rowKey="id"
                />
              </div>
            )}
          </TabPane>
        </Tabs>
      </Card>
      
      {selectedClient && (
        <ClientDetailsModal 
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  );
};

export default ClientsPage;