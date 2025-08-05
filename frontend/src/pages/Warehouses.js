import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message } from 'antd';
import api from '../utils/api';

const { Option } = Select;

const WarehousesPage = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/api/warehouses');
      setWarehouses(response.data);
    } catch (error) {
      message.error('Failed to fetch warehouses');
    }
  };

  const handleAddWarehouse = async () => {
    try {
      const values = await form.validateFields();
      await api.post('/api/warehouses', values);
      message.success('Warehouse added successfully');
      setIsModalVisible(false);
      form.resetFields();
      fetchWarehouses();
    } catch (error) {
      message.error('Failed to add warehouse');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    { title: 'Location', dataIndex: 'location', key: 'location' },
    { title: 'Delivery Time', dataIndex: 'delivery_time', key: 'delivery_time' },
  ];

  return (
    <div>
      <Button 
        type="primary" 
        onClick={() => setIsModalVisible(true)}
        style={{ marginBottom: 16 }}
      >
        Add Warehouse
      </Button>

      <Table 
        dataSource={warehouses} 
        columns={columns} 
        rowKey="id" 
      />

      <Modal
        title="Add New Warehouse"
        visible={isModalVisible}
        onOk={handleAddWarehouse}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select>
              <Option value="own">Own</Option>
              <Option value="partner">Partner</Option>
            </Select>
          </Form.Item>
          <Form.Item name="location" label="Location" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="delivery_time" label="Delivery Time (days)" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="contacts" label="Contacts">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WarehousesPage;