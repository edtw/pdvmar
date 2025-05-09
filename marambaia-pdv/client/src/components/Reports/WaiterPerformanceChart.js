// src/components/Reports/WaiterPerformanceChart.js
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
  Legend,
  Cell
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
        <p><strong>{data.name}</strong></p>
        <p>Vendas: {new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(data.sales)}</p>
        <p>Pedidos: {data.orderCount}</p>
        <p>Ticket Médio: {new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(data.averageTicket)}</p>
      </Box>
    );
  }

  return null;
};

// Cores para as barras
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BFF', '#FF6B8B'];

const WaiterPerformanceChart = ({ data }) => {
  // Preparar dados para o gráfico
  const chartData = data || [];
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name"
          textAnchor="end"
          angle={-40}
          height={80}
          interval={0}
        />
        <YAxis 
          tickFormatter={(value) => new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            notation: 'compact'
          }).format(value)}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          dataKey="sales" 
          name="Vendas"
          radius={[4, 4, 0, 0]}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default WaiterPerformanceChart;