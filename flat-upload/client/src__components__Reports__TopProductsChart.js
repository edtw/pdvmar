// src/components/Reports/TopProductsChart.js
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

const TopProductsChart = ({ data }) => {
  // Todos os hooks no nível superior do componente
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const gridColor = useColorModeValue('#e2e8f0', '#2d3748');
  const textColor = useColorModeValue('#2D3748', '#CBD5E0');
  const axisColor = useColorModeValue('#718096', '#a0aec0');
  
  // Componente CustomTooltip definido dentro do componente principal
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
          maxW="280px"
        >
          <Box fontWeight="bold" mb={2}>
            {data.product?.name || 'Produto'}
          </Box>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Box>Quantidade:</Box>
            <Box fontWeight="semibold">{data.quantity}</Box>
          </Box>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Box>Total:</Box>
            <Box fontWeight="semibold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(data.total)}
            </Box>
          </Box>
          {data.product?.category?.name && (
            <Box display="flex" justifyContent="space-between">
              <Box>Categoria:</Box>
              <Box fontWeight="semibold">{data.product.category.name}</Box>
            </Box>
          )}
        </Box>
      );
    }
    return null;
  };

  // Cores para as barras
  const COLORS = [
    '#0077be', // Beach ocean - tom principal
    '#1d8ece',
    '#389cda',
    '#54aae5',
    '#6fb7ef',
    '#8ac5f8',
    '#a5d2ff'
  ];
  
  // Preparação segura de dados
  const chartData = !data ? [] : Array.isArray(data) ? data : [];
  
  // Preparar dados para o gráfico com tratamento seguro
  const processedData = chartData.map((item, index) => ({
    ...item,
    name: (item.product?.name ? 
          (item.product.name.length > 20 ? item.product.name.substring(0, 18) + '...' : item.product.name) 
          : `Produto ${index+1}`),
    // Adicionar um valor mínimo para visualização
    quantity: Math.max(item.quantity || 0, 0.1)
  })).slice(0, 10); // Limitar a 10 itens
  
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={250}>
      <BarChart
        data={processedData}
        layout="vertical"
        margin={{
          top: 15,
          right: 50, // Mais espaço para labels
          left: 80,
          bottom: 5,
        }}
        barSize={20}
        barGap={4}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={true} vertical={false} />
        <XAxis
          type="number"
          tickFormatter={(value) => new Intl.NumberFormat('pt-BR').format(value)}
          domain={[0, 'dataMax + 1']}
          stroke={axisColor}
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: gridColor }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={80}
          stroke={axisColor}
          tick={{ fontSize: 12 }}
          tickMargin={10}
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
          dataKey="quantity"
          name="Quantidade"
          radius={[0, 4, 4, 0]}
          animationDuration={1500}
          animationEasing="ease-out"
          isAnimationActive={true}
        >
          {processedData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[index % COLORS.length]} 
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={1}
            />
          ))}
          <LabelList 
            dataKey="quantity" 
            position="right" 
            formatter={(value) => value.toLocaleString('pt-BR')}
            fill={textColor}
            fontSize={12}
            fontWeight="bold"
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TopProductsChart;