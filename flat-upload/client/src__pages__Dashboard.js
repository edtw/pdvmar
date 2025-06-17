// src/pages/Dashboard.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Badge,
  useColorModeValue,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Skeleton
} from '@chakra-ui/react';
import {
  FiUsers,
  FiClock,
  FiShoppingBag,
  FiActivity,
  FiCheck,
  FiChevronRight,
  FiDollarSign,
  FiAward,
  FiBarChart2,
  FiRefreshCw
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';
import SalesChart from '../components/Reports/SalesChart';

const Dashboard = () => {
  const { user } = useAuth();
  const { tables, fetchTables } = useData();
  const { socket, connected, joinTableRoom } = useSocket();
  const [stats, setStats] = useState({
    totalSales: 0,
    occupiedTables: 0,
    pendingOrders: 0,
    averageTicket: 0
  });
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Refs para controle de estado e prevenção de loops
  const socketSetupRef = useRef(false);
  const initialLoadRef = useRef(false);
  const isUpdatingStatsRef = useRef(false);
  const isUpdatingSalesDataRef = useRef(false);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const iconBgColor = useColorModeValue(`blue.50`, `blue.800`);
  const iconColor = useColorModeValue(`blue.500`, `blue.200`);
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  
  // CORREÇÃO: Nova função que retorna intervalos de tempo completos para o dia atual
  const getTodayTimestamps = () => {
    // Obter a data atual no fuso horário local
    const now = new Date();
    
    // Criar data de início (00:00:00.000) e fim (23:59:59.999) para o dia atual no horário local
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    // Converter para strings ISO para envio à API
    const startISO = startOfDay.toISOString();
    const endISO = endOfDay.toISOString();
    
    console.log('Dashboard: Intervalo do dia (fuso horário local):', {
      start: startOfDay.toString(),
      end: endOfDay.toString()
    });
    
    console.log('Dashboard: Intervalo do dia (ISO para API):', {
      startISO,
      endISO
    });
    
    return {
      startDate: startISO,
      endDate: endISO
    };
  };
  
  // CORREÇÃO: Função fetchStats atualizada para usar timestamps ISO completos
  const fetchStats = useCallback(async () => {
    // Evitar chamadas duplicadas
    if (isUpdatingStatsRef.current) return;
    
    try {
      isUpdatingStatsRef.current = true;
      setLoading(prevLoading => ({ ...prevLoading, stats: true }));
      
      // Obter timestamps completos para o dia atual
      const { startDate, endDate } = getTodayTimestamps();
      
      // Adicionar timestamp para evitar cache
      const timestamp = new Date().getTime();
      
      // Construir params com URLSearchParams para garantir codificação correta
      const params = new URLSearchParams({
        startDate,
        endDate,
        _t: timestamp.toString()
      });
      
      console.log('Dashboard: Buscando estatísticas com:', params.toString());
      
      // Fazer requisição com os parâmetros corretos
      const response = await api.get(`/reports/sales?${params.toString()}`);
      
      if (response.data.success) {
        // Atualizar o estado com os valores mais recentes
        const newStats = {
          totalSales: response.data.report.totalSales || 0,
          occupiedTables: tables.filter(t => t.status !== 'free').length,
          pendingOrders: 0,
          averageTicket: response.data.report.averageTicket || 0
        };
        
        console.log('Dashboard: Atualizando estatísticas:', newStats);
        setStats(newStats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas de vendas:', error);
    } finally {
      setLoading(prevLoading => ({ ...prevLoading, stats: false }));
      isUpdatingStatsRef.current = false;
    }
  }, [tables]);
  
  // CORREÇÃO: Função fetchSalesData atualizada para usar timestamp para evitar cache
  const fetchSalesData = useCallback(async () => {
    // Evitar chamadas duplicadas
    if (isUpdatingSalesDataRef.current) return;
    
    try {
      isUpdatingSalesDataRef.current = true;
      setLoading(prevLoading => ({ ...prevLoading, salesData: true }));
      
      // Adicionar timestamp para evitar cache
      const timestamp = new Date().getTime();
      
      console.log('Dashboard: Buscando dados de vendas diárias e produtos mais vendidos');
      
      // Buscar dados dos últimos 7 dias
      const dailyParams = new URLSearchParams({
        days: '7',
        _t: timestamp.toString()
      });
      
      console.log('Dashboard: Parâmetros de vendas diárias:', dailyParams.toString());
      
      const salesResponse = await api.get(`/reports/daily-sales?${dailyParams.toString()}`);
      
      if (salesResponse.data.success && salesResponse.data.report) {
        console.log('Dashboard: Dados de vendas diárias recebidos:', salesResponse.data.report.dailySales?.length || 0, 'dias');
        setSalesData(salesResponse.data.report.dailySales || []);
      } else {
        console.warn('Dashboard: Resposta da API de vendas diárias sem dados ou com falha:', salesResponse.data);
      }
      
      // Buscar produtos mais vendidos
      const productsParams = new URLSearchParams({
        limit: '5',
        _t: timestamp.toString()
      });
      
      console.log('Dashboard: Parâmetros de produtos mais vendidos:', productsParams.toString());
      
      const topProductsResponse = await api.get(`/reports/top-products?${productsParams.toString()}`);
      
      if (topProductsResponse.data.success && topProductsResponse.data.report) {
        console.log('Dashboard: Dados de produtos mais vendidos recebidos:', 
          topProductsResponse.data.report.topProducts?.length || 0, 'produtos');
        setTopProducts(topProductsResponse.data.report.topProducts || []);
      } else {
        console.warn('Dashboard: Resposta da API de produtos mais vendidos sem dados ou com falha:', topProductsResponse.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(prevLoading => ({ ...prevLoading, salesData: false }));
      isUpdatingSalesDataRef.current = false;
    }
  }, []);
  
  // CORREÇÃO: Função centralizada para buscar todos os dados - ajustada para executar sequencialmente
  const fetchAllDashboardData = useCallback(async () => {
    console.log('Dashboard: Buscando todos os dados do dashboard:', new Date().toLocaleTimeString());
    
    try {
      // Resetamos as flags aqui para garantir que as chamadas possam acontecer
      isUpdatingStatsRef.current = false;
      isUpdatingSalesDataRef.current = false;
      
      setLoading(true);
      
      // Chamar cada função sequencialmente para evitar condições de corrida
      await fetchStats();
      await fetchTables();
      await fetchSalesData();
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchTables, fetchSalesData]);
  
  // CORREÇÃO: Função para forçar atualização manual
  const forceRefresh = useCallback(() => {
    console.log('Dashboard: Forçando atualização manual às', new Date().toLocaleTimeString());
    fetchAllDashboardData();
  }, [fetchAllDashboardData]);
  
  // CORREÇÃO: Efeito para conectar à sala de mesas - separado do efeito de socket
  useEffect(() => {
    if (connected) {
      joinTableRoom();
    }
  }, [connected, joinTableRoom]);
  
  // CORREÇÃO: Configuração de socket atualizada para usar socketSetupRef para evitar loops
  useEffect(() => {
    // Evitar configuração duplicada dos listeners
    if (socketSetupRef.current || !socket || !connected) return;
    
    console.log('Dashboard: Configurando listeners de socket (PRIMEIRA VEZ)');
    socketSetupRef.current = true;
    
    // Ouvir atualizações de dados
    socket.on('dataUpdate', ({ timestamp }) => {
      console.log('Dashboard: Recebeu evento dataUpdate às', new Date(timestamp).toLocaleTimeString());
      fetchAllDashboardData();
    });
    
    // Ouvir atualizações de pedidos
    socket.on('orderUpdate', ({ orderId, status }) => {
      console.log('Dashboard: Recebeu evento orderUpdate:', orderId, status);
      if (status === 'closed') {
        fetchAllDashboardData();
      }
    });
    
    // Ouvir novos pedidos
    socket.on('newOrder', () => {
      console.log('Dashboard: Recebeu evento newOrder');
      fetchAllDashboardData();
    });
    
    // Limpeza ao desmontar componente
    return () => {
      console.log('Dashboard: Removendo listeners de socket');
      socket.off('dataUpdate');
      socket.off('orderUpdate');
      socket.off('newOrder');
      socketSetupRef.current = false;
    };
  }, [socket, connected, fetchAllDashboardData]);
  
  // CORREÇÃO: Carga inicial de dados - usando initialLoadRef para evitar múltiplas chamadas
  useEffect(() => {
    if (initialLoadRef.current) return;
    
    console.log('Dashboard: Carregando dados iniciais (PRIMEIRA VEZ)');
    initialLoadRef.current = true;
    
    fetchAllDashboardData();
  }, [fetchAllDashboardData]);
  
  // Formatar valores monetários
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  return (
    <Box>
      {/* Cabeçalho */}
      <Flex 
        justifyContent="space-between" 
        alignItems="center" 
        mb={6}
      >
        <Box>
          <Heading size="lg">Dashboard</Heading>
          <Text color="gray.500">Bem-vindo, {user?.name}</Text>
        </Box>
        
        <Flex>
          <Button 
            colorScheme="blue" 
            onClick={() => navigate('/tables')}
            rightIcon={<FiChevronRight />}
          >
            Ir para Mesas
          </Button>
          
          {/* CORREÇÃO: Botão para atualização manual */}
          <Button 
            colorScheme="green" 
            leftIcon={<FiRefreshCw />}
            onClick={forceRefresh}
            ml={2}
            isLoading={loading}
          >
            Atualizar
          </Button>
        </Flex>
      </Flex>
      
      {/* Cards de estatísticas */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5} mb={8}>
        <Card bg={bgColor} shadow="sm" transition="all 0.3s" _hover={{ shadow: "md" }}>
          <CardBody>
            <Flex justify="space-between">
              <Stat>
                <StatLabel>Vendas Hoje</StatLabel>
                <StatNumber>
                  {loading ? (
                    <Skeleton height="1.5rem" width="120px" />
                  ) : (
                    formatCurrency(stats.totalSales)
                  )}
                </StatNumber>
                <StatHelpText>
                  <Badge colorScheme="green">
                    Atualizado às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </Badge>
                </StatHelpText>
              </Stat>
              <Flex
                w="12"
                h="12"
                align="center"
                justify="center"
                rounded="full"
                bg={iconBgColor}
              >
                <Icon as={FiDollarSign} color={iconColor} boxSize="6" />
              </Flex>
            </Flex>
          </CardBody>
        </Card>
        
        <Card bg={bgColor} shadow="sm" transition="all 0.3s" _hover={{ shadow: "md" }}>
          <CardBody>
            <Flex justify="space-between">
              <Stat>
                <StatLabel>Mesas Ocupadas</StatLabel>
                <StatNumber>
                  {loading ? (
                    <Skeleton height="1.5rem" width="80px" />
                  ) : (
                    stats.occupiedTables
                  )}
                </StatNumber>
                <StatHelpText>
                  <Badge colorScheme="yellow">
                    {((stats.occupiedTables / (tables.length || 1)) * 100).toFixed(0)}% de ocupação
                  </Badge>
                </StatHelpText>
              </Stat>
              <Flex
                w="12"
                h="12"
                align="center"
                justify="center"
                rounded="full"
                bg="orange.50"
              >
                <Icon as={FiUsers} color="orange.500" boxSize="6" />
              </Flex>
            </Flex>
          </CardBody>
        </Card>
        
        <Card bg={bgColor} shadow="sm" transition="all 0.3s" _hover={{ shadow: "md" }}>
          <CardBody>
            <Flex justify="space-between">
              <Stat>
                <StatLabel>Pedidos Pendentes</StatLabel>
                <StatNumber>
                  {loading ? (
                    <Skeleton height="1.5rem" width="80px" />
                  ) : (
                    stats.pendingOrders
                  )}
                </StatNumber>
                <StatHelpText>
                  <Badge colorScheme={stats.pendingOrders > 0 ? "orange" : "green"}>
                    {stats.pendingOrders > 0 ? `${stats.pendingOrders} aguardando` : "Tudo em dia"}
                  </Badge>
                </StatHelpText>
              </Stat>
              <Flex
                w="12"
                h="12"
                align="center"
                justify="center"
                rounded="full"
                bg="purple.50"
              >
                <Icon as={FiClock} color="purple.500" boxSize="6" />
              </Flex>
            </Flex>
          </CardBody>
        </Card>
        
        <Card bg={bgColor} shadow="sm" transition="all 0.3s" _hover={{ shadow: "md" }}>
          <CardBody>
            <Flex justify="space-between">
              <Stat>
                <StatLabel>Ticket Médio</StatLabel>
                <StatNumber>
                  {loading ? (
                    <Skeleton height="1.5rem" width="120px" />
                  ) : (
                    formatCurrency(stats.averageTicket)
                  )}
                </StatNumber>
                <StatHelpText>
                  <Badge colorScheme="blue">
                    Hoje
                  </Badge>
                </StatHelpText>
              </Stat>
              <Flex
                w="12"
                h="12"
                align="center"
                justify="center"
                rounded="full"
                bg="green.50"
              >
                <Icon as={FiActivity} color="green.500" boxSize="6" />
              </Flex>
            </Flex>
          </CardBody>
        </Card>
      </SimpleGrid>
      
      {/* Gráfico de Vendas e Produtos Mais Vendidos - Layout em Grid */}
      <Grid templateColumns={{ base: "1fr", lg: "1fr 400px" }} gap={6} mb={8}>
        {/* Gráfico de Vendas */}
        <Card bg={bgColor} shadow="sm">
          <CardHeader pb={0}>
            <Heading size="md">Vendas dos Últimos 7 Dias</Heading>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Skeleton height="300px" />
            ) : (
              <Box h="300px">
                {salesData && salesData.length > 0 ? (
                  <SalesChart data={salesData} />
                ) : (
                  <Flex direction="column" align="center" justify="center" height="100%">
                    <Icon as={FiBarChart2} boxSize={10} color="gray.300" mb={2} />
                    <Text color="gray.500">Nenhum dado disponível</Text>
                    <Text color="gray.400" fontSize="sm">Clique em "Atualizar" para tentar novamente</Text>
                  </Flex>
                )}
              </Box>
            )}
          </CardBody>
        </Card>
        
        {/* Produtos Mais Vendidos */}
        <Card bg={bgColor} shadow="sm">
          <CardHeader pb={0} display="flex" alignItems="center">
            <Icon as={FiAward} mr={2} color="beach.ocean" />
            <Heading size="md">Produtos Mais Vendidos</Heading>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Skeleton height="300px" />
            ) : (
              <>
                {topProducts && topProducts.length > 0 ? (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Produto</Th>
                        <Th isNumeric>Qtd</Th>
                        <Th isNumeric>Total</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {topProducts.map((product, index) => (
                        <Tr key={index}>
                          <Td fontWeight={index === 0 ? "bold" : "normal"}>
                            {product.product?.name || "Produto"}
                          </Td>
                          <Td isNumeric>{product.quantity}</Td>
                          <Td isNumeric fontWeight="medium">
                            {formatCurrency(product.total)}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                ) : (
                  <Flex direction="column" align="center" justify="center" height="100%">
                    <Icon as={FiBarChart2} boxSize={10} color="gray.300" mb={2} />
                    <Text color="gray.500">Nenhum dado disponível</Text>
                    <Text color="gray.400" fontSize="sm">Clique em "Atualizar" para tentar novamente</Text>
                  </Flex>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </Grid>
      
      {/* Resumo de mesas */}
      <Card bg={bgColor} shadow="sm">
        <CardHeader pb={0}>
          <Heading size="md">Resumo de Mesas</Heading>
        </CardHeader>
        <CardBody>
          {loading ? (
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
              <Skeleton height="80px" />
              <Skeleton height="80px" />
              <Skeleton height="80px" />
            </SimpleGrid>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
              <Box p={4} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
                <Flex align="center" mb={2}>
                  <Icon as={FiShoppingBag} mr={2} color="gray.500" />
                  <Text fontWeight="medium">Total de Mesas</Text>
                </Flex>
                <Text fontSize="2xl" fontWeight="bold">{tables.length}</Text>
              </Box>
              
              <Box p={4} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
                <Flex align="center" mb={2}>
                  <Icon as={FiCheck} mr={2} color="green.500" />
                  <Text fontWeight="medium">Mesas Livres</Text>
                </Flex>
                <Text fontSize="2xl" fontWeight="bold">{tables.filter(t => t.status === 'free').length}</Text>
                <Badge colorScheme="green">Disponíveis</Badge>
              </Box>
              
              <Box p={4} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
                <Flex align="center" mb={2}>
                  <Icon as={FiUsers} mr={2} color="yellow.500" />
                  <Text fontWeight="medium">Mesas Ocupadas</Text>
                </Flex>
                <Text fontSize="2xl" fontWeight="bold">{tables.filter(t => t.status !== 'free').length}</Text>
                <Badge colorScheme="yellow">Em Uso</Badge>
              </Box>
            </SimpleGrid>
          )}
            
          {/* Barra de progresso visual de ocupação */}
          {!loading && (
            <Box mt={6}>
              <Flex justify="space-between" mb={1}>
                <Text fontSize="sm" fontWeight="medium">Taxa de Ocupação</Text>
                <Text fontSize="sm" fontWeight="bold">
                  {((tables.filter(t => t.status !== 'free').length / (tables.length || 1)) * 100).toFixed(0)}%
                </Text>
              </Flex>
              <Progress 
                value={(tables.filter(t => t.status !== 'free').length / (tables.length || 1)) * 100} 
                size="sm" 
                colorScheme="blue" 
                borderRadius="full" 
              />
            </Box>
          )}
        </CardBody>
      </Card>
    </Box>
  );
};

export default Dashboard;