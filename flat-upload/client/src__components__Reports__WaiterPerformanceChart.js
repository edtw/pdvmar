// src/components/Reports/WaiterPerformanceChart.js
import React from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Cell,
  LabelList
} from 'recharts';

const WaiterPerformanceChart = ({ data }) => {
  // Todos os hooks no nível superior do componente
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const gridColor = useColorModeValue('#e2e8f0', '#2d3748');
  const textColor = useColorModeValue('#2D3748', '#CBD5E0');
  const axisColor = useColorModeValue('#718096', '#a0aec0');
  
  // CustomTooltip definido dentro do componente principal
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <Box
          bg={bgColor}
          p={3}
          boxShadow="md"
          borderRadius="md"
          border="1px solid"
          borderColor={borderColor}
          maxW="250px"
        >
          <Box fontWeight="bold" mb={2}>{data.name}</Box>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Box>Vendas:</Box>
            <Box fontWeight="semibold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(data.sales)}
            </Box>
          </Box>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Box>Pedidos:</Box>
            <Box fontWeight="semibold">{data.orderCount}</Box>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Box>Ticket Médio:</Box>
            <Box fontWeight="semibold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(data.averageTicket)}
            </Box>
          </Box>
        </Box>
      );
    }

    return null;
  };

  // Cores para as barras - paleta de cores da praia
  const COLORS = ['#0077be', '#ffac33', '#ff7f50', '#71eeb8', '#f7e6c7', '#4a74a9'];
  
  // Preparação segura de dados
  const chartData = !data ? [] : Array.isArray(data) ? data : [];
  
  // Obter valor máximo para melhor dimensionamento do gráfico
  const maxValue = Math.max(...chartData.map(item => item.sales || 0), 1);
  
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={250}>
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 70, // Espaço para rótulos em ângulo
        }}
        barSize={36}
        barGap={4}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis 
          dataKey="name"
          tick={{ 
            angle: -45, 
            textAnchor: 'end',
            fontSize: 12,
            fill: axisColor
          }}
          height={70}
          interval={0}
          stroke={axisColor}
          axisLine={{ stroke: gridColor }}
        />
        <YAxis 
          tickFormatter={(value) => new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            notation: 'compact',
            compactDisplay: 'short'
          }).format(value)}
          stroke={axisColor}
          tick={{ fontSize: 12 }}
          domain={[0, maxValue * 1.1]} // 10% acima do valor máximo
          axisLine={{ stroke: gridColor }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="top" 
          height={36} 
          iconType="circle"
          formatter={(value) => <span style={{ color: textColor, fontSize: 14 }}>{value}</span>}
        />
        <Bar 
          dataKey="sales" 
          name="Vendas"
          radius={[4, 4, 0, 0]}
          animationDuration={1500}
          animationEasing="ease-out"
          isAnimationActive={true}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
          <LabelList 
            dataKey="orderCount" 
            position="top" 
            formatter={(value) => `${value} pedidos`}
            fill={textColor}
            fontSize={11}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default WaiterPerformanceChart;