// src/pages/AdvancedAnalytics.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Grid,
  Card,
  CardHeader,
  CardBody,
  Text,
  Flex,
  Badge,
  useColorModeValue,
  Spinner,
  Select,
  Icon,
  VStack,
  HStack,
  Divider,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  FiTrendingUp,
  FiDollarSign,
  FiShoppingCart,
  FiUsers,
  FiAlertCircle,
  FiClock,
  FiActivity
} from 'react-icons/fi';
import api from '../services/api';
import { useSocket } from '../contexts/SocketContext';

const AdvancedAnalytics = () => {
  const { socket } = useSocket();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [peakHours, setPeakHours] = useState(null);
  const [delays, setDelays] = useState(null);
  const [productPerformance, setProductPerformance] = useState(null);
  const [revenueTimeline, setRevenueTimeline] = useState([]);
  const [customerInsights, setCustomerInsights] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');

  // Cores para Recharts (precisa ser hex/rgb, não nomes do Chakra)
  const chartAxisColor = useColorModeValue('#4A5568', '#CBD5E0'); // gray.600 light, gray.300 dark
  const chartGridColor = useColorModeValue('#E2E8F0', '#4A5568'); // gray.200 light, gray.600 dark

  // Cores para gráficos
  const COLORS = ['#6366F1', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 60000); // Atualizar a cada 1 minuto
    return () => clearInterval(interval);
  }, [timeRange]);

  // WebSocket: Escutar alertas de atraso em tempo real
  useEffect(() => {
    if (!socket) return;

    socket.on('delayAlert', (alert) => {
      console.log('[Analytics] Alerta de atraso recebido:', alert);

      toast({
        title: '⚠️ Item Atrasado!',
        description: `Mesa ${alert.tableNumber} - ${alert.productName} (${alert.severity})`,
        status: alert.severity === 'critical' ? 'error' : 'warning',
        duration: 8000,
        isClosable: true,
        position: 'top-right'
      });

      // Atualizar dados de atrasos
      fetchDelays();
    });

    return () => {
      if (socket) {
        socket.off('delayAlert');
      }
    };
  }, [socket, toast]);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const { startDate, endDate } = getDateRange(timeRange);

      const [
        overviewRes,
        peakHoursRes,
        delaysRes,
        productPerfRes,
        revenueTimelineRes,
        customerInsightsRes
      ] = await Promise.all([
        api.get('/analytics/overview', { params: { startDate, endDate } }),
        api.get('/analytics/peak-hours', { params: { startDate, endDate } }),
        api.get('/analytics/delays'),
        api.get('/analytics/products/performance', { params: { startDate, endDate, limit: 5 } }),
        api.get('/analytics/revenue-timeline', { params: { startDate, endDate, groupBy: 'day' } }),
        api.get('/analytics/customer-insights')
      ]);

      setOverview(overviewRes.data.data);
      setPeakHours(peakHoursRes.data.data);
      setDelays(delaysRes.data.data);
      setProductPerformance(productPerfRes.data.data);
      setRevenueTimeline(revenueTimelineRes.data.data);
      setCustomerInsights(customerInsightsRes.data.data);
    } catch (error) {
      console.error('[Analytics] Erro ao buscar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados de analytics',
        status: 'error',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDelays = async () => {
    try {
      const res = await api.get('/analytics/delays');
      setDelays(res.data.data);
    } catch (error) {
      console.error('[Analytics] Erro ao buscar atrasos:', error);
    }
  };

  const getDateRange = (range) => {
    const end = new Date();
    const start = new Date();

    switch (range) {
      case '24h':
        start.setHours(start.getHours() - 24);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      default:
        start.setDate(start.getDate() - 7);
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="100vh" bg={bgColor}>
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Flex>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.2xl">
        {/* Header */}
        <Flex justify="space-between" align="center" mb={8}>
          <VStack align="flex-start" spacing={1}>
            <Heading size="lg" color={textColor}>
              Analytics Avançado
            </Heading>
            <Text color={secondaryTextColor} fontSize="sm">
              Análise inteligente em tempo real do restaurante
            </Text>
          </VStack>

          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            w="200px"
            bg={cardBg}
            borderColor={borderColor}
          >
            <option value="24h">Últimas 24 horas</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </Select>
        </Flex>

        {/* Alertas de Atraso em Tempo Real */}
        {delays && delays.delayedItems && delays.delayedItems.length > 0 && (
          <Alert
            status="warning"
            mb={6}
            borderRadius="xl"
            bg={useColorModeValue('orange.50', 'orange.900')}
            borderColor={useColorModeValue('orange.200', 'orange.700')}
            borderWidth="1px"
          >
            <AlertIcon />
            <Box flex="1">
              <AlertTitle color={textColor}>⚠️ {delays.delayedItems.length} itens atrasados!</AlertTitle>
              <AlertDescription>
                {delays.delayedItems.slice(0, 3).map((item, idx) => (
                  <Text key={idx} fontSize="sm" color={secondaryTextColor}>
                    • Mesa {item.tableNumber}: {item.productName} ({item.itemAge} min)
                  </Text>
                ))}
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Cards de Métricas Principais */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6} mb={8}>
          <StatCard
            label="Receita Total"
            value={`R$ ${(overview?.revenue?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            change={overview?.revenue?.growth || 0}
            icon={FiDollarSign}
            color="blue"
          />
          <StatCard
            label="Total de Pedidos"
            value={overview?.orders?.total || 0}
            subtext={`${overview?.orders?.open || 0} abertos agora`}
            icon={FiShoppingCart}
            color="purple"
          />
          <StatCard
            label="Taxa de Ocupação"
            value={`${overview?.tables?.occupancyRate || 0}%`}
            subtext={`${overview?.tables?.occupied}/${overview?.tables?.total} mesas`}
            icon={FiActivity}
            color="green"
          />
          <StatCard
            label="Total de Clientes"
            value={customerInsights?.total || 0}
            subtext={`${customerInsights?.returnRate || 0}% taxa de retorno`}
            icon={FiUsers}
            color="orange"
          />
        </Grid>

        {/* Gráficos Principais */}
        <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6} mb={8}>
          {/* Receita ao Longo do Tempo */}
          <Card bg={cardBg} borderColor={borderColor} borderRadius="xl" shadow="lg">
            <CardHeader>
              <Heading size="md" color={textColor}>Evolução da Receita</Heading>
              <Text fontSize="sm" color={secondaryTextColor}>
                {overview?.revenue?.growth >= 0 ? '+' : ''}{overview?.revenue?.growth || 0}% vs período anterior
              </Text>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueTimeline}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} opacity={0.3} />
                  <XAxis
                    dataKey="date.day"
                    tick={{ fill: chartAxisColor, fontSize: 12 }}
                    stroke={chartGridColor}
                  />
                  <YAxis
                    tick={{ fill: chartAxisColor, fontSize: 12 }}
                    stroke={chartGridColor}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: cardBg,
                      border: `1px solid ${borderColor}`,
                      borderRadius: '8px',
                      color: textColor
                    }}
                    labelStyle={{ color: textColor }}
                    formatter={(value) => [`R$ ${value.toFixed(2)}`, 'Receita']}
                    labelFormatter={(label) => `Dia ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366F1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Receita"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          {/* Horários de Pico */}
          <Card bg={cardBg} borderColor={borderColor} borderRadius="xl" shadow="lg">
            <CardHeader>
              <Heading size="md" color={textColor}>Horários de Maior Movimento</Heading>
              <Text fontSize="sm" color={secondaryTextColor}>Distribuição de pedidos ao longo do dia</Text>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peakHours?.hourly || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} opacity={0.3} />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: chartAxisColor, fontSize: 12 }}
                    stroke={chartGridColor}
                  />
                  <YAxis
                    tick={{ fill: chartAxisColor, fontSize: 12 }}
                    stroke={chartGridColor}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: cardBg,
                      border: `1px solid ${borderColor}`,
                      borderRadius: '8px',
                      color: textColor
                    }}
                    labelStyle={{ color: textColor }}
                    formatter={(value) => [value, 'Pedidos']}
                    labelFormatter={(label) => `Horário: ${label}`}
                  />
                  <Bar
                    dataKey="orders"
                    fill="#3B82F6"
                    radius={[8, 8, 0, 0]}
                    name="Pedidos"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </Grid>

        {/* Análise de Atrasos e Produtos */}
        <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6} mb={8}>
          {/* Status do Restaurante */}
          <Card bg={cardBg} borderColor={borderColor} borderRadius="xl" shadow="lg">
            <CardHeader>
              <Flex justify="space-between" align="center">
                <VStack align="flex-start" spacing={0}>
                  <Heading size="md" color={textColor}>Fluxo do Restaurante</Heading>
                  <Text fontSize="sm" color={secondaryTextColor}>
                    Status: <Badge colorScheme={delays?.restaurantFlow?.status === 'rush_hour' ? 'red' : 'green'}>
                      {delays?.restaurantFlow?.status === 'rush_hour' ? 'Horário de Pico' : delays?.restaurantFlow?.status === 'busy' ? 'Ocupado' : 'Normal'}
                    </Badge>
                  </Text>
                </VStack>
                <Icon as={FiClock} boxSize={8} color="blue.500" />
              </Flex>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <FlowMetric
                  label="Mesas Abertas"
                  value={`${delays?.restaurantFlow?.openTables || 0}/${delays?.restaurantFlow?.totalTables || 0}`}
                  percentage={Math.round(((delays?.restaurantFlow?.openTables || 0) / (delays?.restaurantFlow?.totalTables || 1)) * 100)}
                  color="blue"
                />
                <FlowMetric
                  label="Itens Pendentes"
                  value={delays?.restaurantFlow?.pendingItems || 0}
                  color="purple"
                />
                <Divider />
                <Box>
                  <Heading size="sm" mb={3} color={textColor}>Status dos Pedidos</Heading>
                  <Grid templateColumns="repeat(3, 1fr)" gap={2}>
                    <StatusBox label="No Prazo" count={delays?.summary?.onTime || 0} color="green" />
                    <StatusBox label="Atenção" count={delays?.summary?.warnings || 0} color="yellow" />
                    <StatusBox label="Atrasados" count={delays?.summary?.delayed || 0} color="red" />
                  </Grid>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Top Produtos */}
          <Card bg={cardBg} borderColor={borderColor} borderRadius="xl" shadow="lg">
            <CardHeader>
              <Heading size="md" color={textColor}>Top Produtos</Heading>
              <Text fontSize="sm" color={secondaryTextColor}>Mais vendidos no período</Text>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                {productPerformance?.topSelling?.slice(0, 5).map((product, idx) => (
                  <Flex key={idx} justify="space-between" align="center" p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="lg">
                    <HStack spacing={3}>
                      <Badge colorScheme="blue" fontSize="md" px={2} py={1} borderRadius="md">
                        {idx + 1}
                      </Badge>
                      <VStack align="flex-start" spacing={0}>
                        <Text fontWeight="bold" fontSize="sm" color={textColor}>{product.name}</Text>
                        <Text fontSize="xs" color={secondaryTextColor}>{product.totalSold} vendidos</Text>
                      </VStack>
                    </HStack>
                    <Text fontWeight="bold" color="green.500">
                      R$ {product.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                  </Flex>
                ))}
              </VStack>
            </CardBody>
          </Card>
        </Grid>

        {/* Dias da Semana */}
        <Card bg={cardBg} borderColor={borderColor} borderRadius="xl" shadow="lg">
          <CardHeader>
            <Heading size="md" color={textColor}>Análise Semanal</Heading>
            <Text fontSize="sm" color={secondaryTextColor}>Comparativo de pedidos e faturamento por dia da semana</Text>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peakHours?.weekly || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} opacity={0.3} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: chartAxisColor, fontSize: 12 }}
                  stroke={chartGridColor}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: chartAxisColor, fontSize: 12 }}
                  stroke={chartGridColor}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: chartAxisColor, fontSize: 12 }}
                  stroke={chartGridColor}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: cardBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: '8px',
                    color: textColor
                  }}
                  labelStyle={{ color: textColor }}
                  formatter={(value, name) => {
                    if (name === 'Receita') {
                      return [`R$ ${value.toFixed(2)}`, name];
                    }
                    return [value, name];
                  }}
                />
                <Legend wrapperStyle={{ color: textColor }} />
                <Bar yAxisId="left" dataKey="orders" fill="#6366F1" name="Pedidos" radius={[8, 8, 0, 0]} />
                <Bar yAxisId="right" dataKey="revenue" fill="#10B981" name="Receita" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
};

// Componente de Card de Estatística
const StatCard = ({ label, value, change, subtext, icon, color }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const labelColor = useColorModeValue('gray.600', 'gray.400');
  const valueColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.500', 'gray.500');

  return (
    <Card bg={cardBg} borderColor={borderColor} borderRadius="xl" shadow="lg" borderWidth="1px">
      <CardBody>
        <Flex justify="space-between" align="flex-start">
          <Box flex="1">
            <Text fontSize="sm" color={labelColor} mb={2} fontWeight="medium">{label}</Text>
            <Text fontSize="2xl" fontWeight="bold" mb={1} color={valueColor}>{value}</Text>
            {change !== undefined && (
              <HStack spacing={1}>
                <Icon
                  as={change >= 0 ? FiTrendingUp : FiTrendingUp}
                  transform={change >= 0 ? 'none' : 'rotate(180deg)'}
                  color={change >= 0 ? 'green.500' : 'red.500'}
                  boxSize={4}
                />
                <Text fontSize="sm" fontWeight="semibold" color={change >= 0 ? 'green.500' : 'red.500'}>
                  {Math.abs(change)}%
                </Text>
              </HStack>
            )}
            {subtext && (
              <Text fontSize="xs" color={subtextColor} mt={2}>{subtext}</Text>
            )}
          </Box>
          <Flex
            bg={useColorModeValue(`${color}.50`, `${color}.900`)}
            p={3}
            borderRadius="lg"
            align="center"
            justify="center"
          >
            <Icon as={icon} boxSize={6} color={`${color}.500`} />
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  );
};

// Componente de Métrica de Fluxo
const FlowMetric = ({ label, value, percentage, color }) => {
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const progressBg = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box>
      <Flex justify="space-between" mb={2}>
        <Text fontSize="sm" color={secondaryTextColor}>{label}</Text>
        <Text fontSize="sm" fontWeight="bold" color={textColor}>{value}</Text>
      </Flex>
      {percentage !== undefined && (
        <Box h="8px" bg={progressBg} borderRadius="full" overflow="hidden">
          <Box h="100%" w={`${percentage}%`} bg={`${color}.500`} transition="all 0.3s" />
        </Box>
      )}
    </Box>
  );
};

// Componente de Status Box
const StatusBox = ({ label, count, color }) => {
  const bgColor = useColorModeValue(`${color}.50`, `${color}.900`);
  const textColor = useColorModeValue(`${color}.700`, `${color}.200`);

  return (
    <Box bg={bgColor} p={3} borderRadius="lg" textAlign="center">
      <Text fontSize="2xl" fontWeight="bold" color={textColor}>{count}</Text>
      <Text fontSize="xs" color={textColor}>{label}</Text>
    </Box>
  );
};

export default AdvancedAnalytics;
