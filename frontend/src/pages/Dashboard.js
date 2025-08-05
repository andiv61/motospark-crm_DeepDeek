import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, Select, DatePicker } from 'antd';
import { 
  ShoppingCartOutlined, 
  UserOutlined, 
  DollarOutlined,
  StockOutlined 
} from '@ant-design/icons';
import api from '../utils/api';
import SalesChart from '../components/SalesChart';

const { Option } = Select;
const { RangePicker } = DatePicker;

const DashboardPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, [timeRange, dateRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      let params = { period: timeRange };
      
      if (dateRange) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }
      
      const response = await api.get('/api/analytics/metrics', { params });
      setMetrics(response.data);
    } catch (error) {
      console.error('Failed to fetch metrics', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Clients"
              value={metrics?.total_clients || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="New Orders"
              value={metrics?.new_orders || 0}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Revenue"
              value={metrics?.revenue || 0}
              prefix={<DollarOutlined />}
              precision={2}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Avg. Order"
              value={metrics?.avg_order || 0}
              prefix={<DollarOutlined />}
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title="Sales Analytics"
        extra={
          <div style={{ display: 'flex', gap: 8 }}>
            <Select
              value={timeRange}
              onChange={setTimeRange}
              style={{ width: 120 }}
            >
              <Option value="day">Day</Option>
              <Option value="week">Week</Option>
              <Option value="month">Month</Option>
              <Option value="year">Year</Option>
              <Option value="custom">Custom</Option>
            </Select>
            
            {timeRange === 'custom' && (
              <RangePicker 
                onChange={dates => setDateRange(dates)}
                style={{ width: 240 }}
              />
            )}
          </div>
        }
      >
        <Spin spinning={loading}>
          <SalesChart data={metrics?.sales_data || []} />
        </Spin>
      </Card>
    </div>
  );
};

export default DashboardPage;