// src/components/Reports/SalesChart.js
import React from 'react';
import { Box } from '@chakra-ui/react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
        <p><strong>{format(new Date(data.day), 'dd/MM/yyyy')}</strong></p>
        <p>Total: {new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(data.total)}</p>
        <p>Pedidos: {data.count}</p>
      </Box>
    );
  }

  return null;
};

// Componente para formatar datas no eixo X
const formatXAxis = (dateString) => {
  const date = new Date(dateString);
  return format(date, 'dd/MM');
};

const SalesChart = ({ data }) => {
  // Preparar dados para o gráfico
  const chartData = data || [];
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="day" 
          tickFormatter={formatXAxis}
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
        <Line 
          type="monotone" 
          dataKey="total" 
          name="Vendas" 
          stroke="#3182CE" 
          activeDot={{ r: 8 }} 
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SalesChart;