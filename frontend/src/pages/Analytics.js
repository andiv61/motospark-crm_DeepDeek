import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Alert, Spin } from 'antd';
import { 
  ArrowUpOutlined, 
  WarningOutlined, 
  CheckOutlined 
} from '@ant-design/icons';
import api from '../utils/api';

const urgencyColors = {
  high: 'red',
  medium: 'orange',
  low: 'green'
};

const urgencyIcons = {
  high: <WarningOutlined />,
  medium: <ArrowUpOutlined />,
  low: <CheckOutlined />
};

const AnalyticsPage = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/analytics/recommendations');
      setRecommendations(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: 'product_name',
      key: 'product_name'
    },
    {
      title: 'Current Stock',
      dataIndex: 'current_stock',
      key: 'current_stock'
    },
    {
      title: 'Predicted Sales',
      dataIndex: 'predicted_sales',
      key: 'predicted_sales'
    },
    {
      title: 'Recommended',
      dataIndex: 'recommended_quantity',
      key: 'recommended_quantity'
    },
    {
      title: 'Urgency',
      dataIndex: 'urgency',
      key: 'urgency',
      render: urgency => (
        <Tag 
          icon={urgencyIcons[urgency]} 
          color={urgencyColors[urgency]}
        >
          {urgency.toUpperCase()}
        </Tag>
      )
    }
  ];

  return (
    <div>
      <Card 
        title="Purchase Recommendations" 
        extra={
          <Button 
            onClick={fetchRecommendations}
            loading={loading}
          >
            Refresh
          </Button>
        }
      >
        {error && (
          <Alert 
            message="Error" 
            description={error} 
            type="error" 
            showIcon
            closable
            onClose={() => setError(null)}
          />
        )}

        <Spin spinning={loading}>
          <Table 
            dataSource={recommendations} 
            columns={columns} 
            rowKey="product_id"
            pagination={false}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default AnalyticsPage;