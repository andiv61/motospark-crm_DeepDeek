import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Descriptions, Table, Spin, message } from 'antd';
import api from '../utils/api';

const { TabPane } = Tabs;

const ClientDetailsModal = ({ client, onClose }) => {
  const [clientData, setClientData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (client) {
      fetchClientDetails();
    }
  }, [client]);

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      
      const [detailsRes, ordersRes, activityRes] = await Promise.all([
        api.get(`/api/clients/${client.id}`),
        api.get(`/api/clients/${client.id}/orders`),
        api.get(`/api/clients/${client.id}/activity`)
      ]);
      
      setClientData(detailsRes.data);
      setOrders(ordersRes.data);
      setActivity(activityRes.data);
    } catch (error) {
      message.error('Failed to load client details');
    } finally {
      setLoading(false);
    }
  };

  const orderColumns = [
    { title: 'Order ID', dataIndex: 'id', key: 'id' },
    { title: 'Date', dataIndex: 'created_at', key: 'date' },
    { title: 'Amount', dataIndex: 'total_amount', key: 'amount' },
    { title: 'Status', dataIndex: 'status', key: 'status' }
  ];

  return (
    <Modal
      title={`Client: ${client.name}`}
      visible={!!client}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <Spin spinning={loading}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Details" key="details">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Email">{clientData?.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{clientData?.phone}</Descriptions.Item>
              <Descriptions.Item label="Type">{clientData?.type}</Descriptions.Item>
              <Descriptions.Item label="Registration Date">
                {new Date(clientData?.created_at).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Total Orders" span={2}>
                {activity?.order_count || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Total Spent" span={2}>
                ${activity?.total_spent?.toFixed(2) || '0.00'}
              </Descriptions.Item>
            </Descriptions>
          </TabPane>
          
          <TabPane tab="Orders" key="orders">
            <Table 
              dataSource={orders} 
              columns={orderColumns} 
              rowKey="id"
              pagination={false}
            />
          </TabPane>
          
          <TabPane tab="Activity" key="activity">
            {activity && (
              <div style={{ marginTop: 16 }}>
                <h4>Order History (Last 6 Months)</h4>
                <ClientActivityChart data={activity.monthly_stats} />
              </div>
            )}
          </TabPane>
        </Tabs>
      </Spin>
    </Modal>
  );
};

export default ClientDetailsModal;