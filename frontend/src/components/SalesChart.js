import React from 'react';
import { Line } from '@ant-design/charts';

const SalesChart = ({ data }) => {
  const config = {
    data,
    xField: 'date',
    yField: 'value',
    seriesField: 'category',
    xAxis: {
      type: 'time',
    },
    yAxis: {
      label: {
        formatter: (v) => `${v}`.replace(/\d{1,3}(?=(\d{3})+$)/g, (s) => `${s},`),
      },
    },
    tooltip: {
      showMarkers: false,
    },
    interactions: [
      {
        type: 'brush-x',
      },
    ],
    legend: {
      position: 'top',
    },
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
  };

  return <Line {...config} />;
};

export default SalesChart;