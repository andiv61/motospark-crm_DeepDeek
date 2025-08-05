import React, { useState, useEffect } from 'react';
import { Table, notification } from 'antd';
import api from '../utils/api';
import wsClient from '../utils/wsClient';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  
  useEffect(() => {
    fetchOrders();
    
    // Подписываемся на WebSocket события
    wsClient.on('order_updated', handleOrderUpdate);
    wsClient.on('new_order', handleNewOrder);
    
    return () => {
      wsClient.disconnect();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    }
  };

  const handleOrderUpdate = (updatedOrder) => {
    setOrders(prev => prev.map(order => 
      order.id === updatedOrder.id ? updatedOrder : order
    ));
    
    notification.info({
      message: 'Order Updated',
      description: `Order #${updatedOrder.id} status changed to ${updatedOrder.status}`,
    });
  };

  const handleNewOrder = (newOrder) => {
    setOrders(prev => [newOrder, ...prev]);
    
    notification.info({
      message: 'New Order',
      description: `New order #${newOrder.id} received`,
    });
  };
import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Modal, Select, Input, Button } from 'antd';
import api from '../utils/api';

const { Option } = Select;

const statusColors = {
  new: 'blue',
  processing: 'orange',
  shipped: 'purple',
  delivered: 'green',
  cancelled: 'red'
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [status, setStatus] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    }
  };

  const showStatusModal = (order) => {
    setCurrentOrder(order);
    setStatus(order.status);
    setIsModalVisible(true);
  };

  const handleStatusUpdate = async () => {
    try {
      await api.put(`/api/orders/${currentOrder.id}/status`, {
        status,
        comment
      });
      setIsModalVisible(false);
      fetchOrders();
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: 'Client',
      dataIndex: ['client', 'name'],
      key: 'client'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => (
        <Tag color={statusColors[status]}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: date => new Date(date).toLocaleString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button onClick={() => showStatusModal(record)}>
            Change Status
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Table 
        dataSource={orders} 
        columns={columns} 
        rowKey="id"
        expandable={{
          expandedRowRender: record => (
            <div>
              <h4>Items:</h4>
              <ul>
                {record.items.map(item => (
                  <li key={item.id}>
                    {item.product.name} - {item.quantity} x {item.price}
                  </li>
                ))}
              </ul>
              <h4>Delivery:</h4>
              <p>{record.delivery_info}</p>
            </div>
          )
        }}
      />

      <Modal
        title="Change Order Status"
        visible={isModalVisible}
        onOk={handleStatusUpdate}
        onCancel={() => setIsModalVisible(false)}
      >
        <Select
          style={{ width: '100%', marginBottom: 16 }}
          value={status}
          onChange={setStatus}
        >
          <Option value="new">New</Option>
          <Option value="processing">Processing</Option>
          <Option value="shipped">Shipped</Option>
          <Option value="delivered">Delivered</Option>
          <Option value="cancelled">Cancelled</Option>
        </Select>
        <Input
          placeholder="Comment"
          value={comment}
          onChange={e => setComment(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default OrdersPage;
  // ... остальной код компонента
};