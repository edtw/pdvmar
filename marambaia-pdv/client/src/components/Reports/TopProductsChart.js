// src/components/Reports/TopProductsChart.js
import React from 'react';
import { Box } from '@chakra-ui/react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

// Componente para formatar valores no tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <Box
        bg="white"
        p={3}
        boxShadow="md"
        borderRadius="md"
        border="1px solid"
        borderColor="gray.200"
      >
        <p><strong>{data.product?.name}</strong></p>
        <p>Quantidade: {data.quantity}</p>
        <p>Total: {new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(data.total)}</p>
      </Box>
    );
  }

  return null;
};

const TopProductsChart = ({ data }) => {
  // Preparar dados para o gráfico
  const chartData = data?.map(item => ({
    ...item,
    name: item.product?.name?.substring(0, 15) + (item.product?.name?.length > 15 ? '...' : '') || 'Produto',
  })) || [];
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{
          top: 5,
          right: 30,
          left: 80,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          type="number"
          tickFormatter={(value) => new Intl.NumberFormat('pt-BR').format(value)}
        />
        <YAxis 
          type="category"
          dataKey="name"
          width={80}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          dataKey="quantity" 
          name="Quantidade" 
          fill="#8884d8" 
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TopProductsChart;