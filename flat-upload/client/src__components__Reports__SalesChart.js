// src/components/Reports/SalesChart.js - CORREÇÃO DO EIXO X
import React from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SalesChart = ({ data }) => {
  // Hooks no nível superior do componente
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const lineColor = useColorModeValue('#0077be', '#3182ce'); // Beach ocean blue
  const gridColor = useColorModeValue('#e2e8f0', '#2d3748');
  const axisTickColor = useColorModeValue('#718096', '#a0aec0');
  const legendTextColor = useColorModeValue('#2D3748', '#CBD5E0');
  const referenceLineColor = useColorModeValue('#805AD5', '#B794F4');

  // Função melhorada para formatar data considerando o fuso horário corretamente
  const formatLocalDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      // Verificar se a data já está no formato ISO
      let date;
      if (typeof dateString === 'string' && dateString.includes('T')) {
        // É uma string ISO
        date = new Date(dateString);
      } else if (dateString instanceof Date) {
        // É um objeto Date
        date = dateString;
      } else {
        // Tentar converter de string para date
        date = new Date(dateString);
      }
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        console.error('Data inválida:', dateString);
        return dateString;
      }
      
      // Formatar para dia/mês usando date-fns com locale pt-BR
      return format(date, 'dd/MM', { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error, dateString);
      return dateString;
    }
  };
  
  // Componente CustomTooltip melhorado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      // Determinar como mostrar a data no tooltip
      let dateDisplay;
      try {
        // Tentar obter uma data formatada legível
        if (data.date) {
          // Se tiver campo date, usar ele
          const date = new Date(data.date);
          dateDisplay = format(date, 'dd/MM/yyyy (EEEE)', { locale: ptBR });
        } else if (data.day && typeof data.day === 'string' && data.day.includes('T')) {
          // Se tiver day no formato ISO
          const date = new Date(data.day);
          dateDisplay = format(date, 'dd/MM/yyyy (EEEE)', { locale: ptBR });
        } else if (data.day) {
          // Se tiver day em outro formato
          const date = new Date(data.day);
          dateDisplay = format(date, 'dd/MM/yyyy (EEEE)', { locale: ptBR });
        } else {
          // Fallback para o label
          dateDisplay = label;
        }
      } catch (error) {
        console.error("Erro no tooltip:", error);
        dateDisplay = label || "Data não disponível";
      }
      
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
          <Box fontWeight="bold" mb={2}>
            {dateDisplay}
          </Box>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Box>Total:</Box>
            <Box fontWeight="semibold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(data.total || 0)}
            </Box>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Box>Pedidos:</Box>
            <Box fontWeight="semibold">{data.count || 0}</Box>
          </Box>
        </Box>
      );
    }

    return null;
  };
  
  // Processamento de dados para garantir formato consistente e formatação do eixo X
  const processedData = React.useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    
    console.log("Dados originais recebidos:", data);
    
    // Processar os dados para garantir que estão em formato consistente
    const processed = data.map(item => {
      // Garantir que temos uma data válida para trabalhar
      let dayDate;
      
      if (item.date) {
        dayDate = new Date(item.date);
      } else if (item.day) {
        if (typeof item.day === 'string' && item.day.includes('T')) {
          dayDate = new Date(item.day);
        } else if (item.day instanceof Date) {
          dayDate = item.day;
        } else {
          dayDate = new Date(item.day);
        }
      } else {
        console.warn("Item sem data detectado:", item);
        dayDate = new Date(); // Fallback para data atual
      }
      
      // Garantir que a data é válida
      if (isNaN(dayDate.getTime())) {
        console.error("Data inválida após processamento:", dayDate, "Item original:", item);
        dayDate = new Date(); // Fallback para data atual
      }
      
      // Criar string ISO consistente
      const isoString = dayDate.toISOString();
      
      // Formatar para display no eixo X
      const displayDay = formatLocalDate(dayDate);
      
      // Manter campos originais, mas garantir consistência
      return {
        ...item,
        date: dayDate,           // Data como objeto Date
        day: isoString,          // Garantir string ISO consistente
        dayFormatted: displayDay // Versão formatada para exibição no eixo X
      };
    });
    
    console.log("Dados processados:", processed);
    
    return processed;
  }, [data]);
  
  // Calcular média para linha de referência
  const average = processedData.length > 0 
    ? processedData.reduce((sum, item) => sum + (item.total || 0), 0) / processedData.length 
    : 0;

  // Ponto máximo para melhor visualização
  const maxValue = Math.max(...processedData.map(item => item.total || 0), 1);
  
  // Função customizada para formatar os labels do eixo X
  const formatXAxis = (value, index) => {
    // Encontrar o item correspondente a esse índice
    const item = processedData[index];
    if (!item) return value;
    
    // Usar a versão formatada se disponível
    return item.dayFormatted || formatLocalDate(item.day) || value;
  };
  
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={250}>
      <LineChart
        data={processedData}
        margin={{
          top: 15,
          right: 30,
          left: 20,
          bottom: 10,
        }}
      >
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={lineColor} stopOpacity={0.1}/>
            <stop offset="95%" stopColor={lineColor} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis 
          dataKey="day"
          tickFormatter={formatXAxis}
          stroke={axisTickColor}
          tick={{ fontSize: 12 }}
          tickMargin={10}
          axisLine={{ stroke: gridColor }}
          interval={0}
        />
        <YAxis 
          tickFormatter={(value) => new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            notation: 'compact',
            compactDisplay: 'short'
          }).format(value)}
          stroke={axisTickColor}
          tick={{ fontSize: 12 }}
          tickMargin={10}
          domain={[0, maxValue * 1.1]} // 10% acima do valor máximo
          axisLine={{ stroke: gridColor }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="top" 
          height={36} 
          iconType="circle"
          formatter={(value) => <span style={{ color: legendTextColor, fontSize: 14 }}>{value}</span>}
        />
        <ReferenceLine 
          y={average} 
          stroke={referenceLineColor}
          strokeDasharray="3 3" 
          label={{ 
            value: "Média", 
            position: "insideBottomRight",
            fill: referenceLineColor,
            fontSize: 12,
            fontWeight: 'bold'
          }} 
        />
        <Line
          type="monotone"
          dataKey="total"
          name="Vendas"
          stroke={lineColor}
          activeDot={{ r: 8, strokeWidth: 2, stroke: bgColor }}
          strokeWidth={3}
          dot={{ stroke: lineColor, strokeWidth: 2, fill: bgColor, r: 4 }}
          fillOpacity={1}
          fill="url(#colorTotal)"
          isAnimationActive={true}
          animationDuration={1000}
          animationEasing="ease-in-out"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SalesChart;