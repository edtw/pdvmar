// src/pages/Reports.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  Button,
  ButtonGroup,
  Select,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  FormControl,
  FormLabel,
  Input,
  HStack,
  useColorModeValue,
  useToast,
  Spinner
} from '@chakra-ui/react';
import { 
  FiPrinter, 
  FiDownload, 
  FiCalendar,
  FiRefreshCw
} from 'react-icons/fi';
import api from '../services/api';
import { format, parseISO, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Components
import SalesChart from '../components/Reports/SalesChart';
import TopProductsChart from '../components/Reports/TopProductsChart';
import WaiterPerformanceChart from '../components/Reports/WaiterPerformanceChart';
import ReportCard from '../components/Reports/ReportCard';
import DateRangePicker from '../components/ui/DateRangePicker';
import { useSocket } from '../contexts/SocketContext';

const Reports = () => {
  // States
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 7),
    endDate: new Date()
  });
  const [period, setPeriod] = useState('week');
  const [salesReport, setSalesReport] = useState(null);
  const [topProductsReport, setTopProductsReport] = useState(null);
  const [dailySalesReport, setDailySalesReport] = useState(null);
  const [waiterReport, setWaiterReport] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Socket connection
  const { socket, connected, joinReportsRoom } = useSocket();
  
  // Formatter for currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // CORREÇÃO: Nova função para obter timestamps ISO considerando o fuso horário local
  const getFullDayTimestamps = (date) => {
    // Criar data completa para início (00:00:00.000) e fim (23:59:59.999) do dia
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Retornar como strings ISO
    return {
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString()
    };
  };
  
  // CORREÇÃO: Função para gerar string de data formatada para API
  const getFormattedDateRange = () => {
    // Obter timestamps ISO para início e fim do período selecionado
    const startTimestamps = getFullDayTimestamps(dateRange.startDate);
    const endTimestamps = getFullDayTimestamps(dateRange.endDate);
    
    console.log('Reports: Intervalo de datas para API:', {
      startLocal: dateRange.startDate.toString(),
      endLocal: dateRange.endDate.toString(),
      startISO: startTimestamps.startDate,
      endISO: endTimestamps.endDate
    });
    
    return {
      startDate: startTimestamps.startDate,
      endDate: endTimestamps.endDate
    };
  };

  // Function to update date range based on period selection
  const updateDateRangeFromPeriod = useCallback((selectedPeriod) => {
    const today = new Date();
    let startDate, endDate;
    
    switch (selectedPeriod) {
      case 'today':
        startDate = today;
        endDate = today;
        break;
      case 'yesterday':
        startDate = subDays(today, 1);
        endDate = subDays(today, 1);
        break;
      case 'week':
        startDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        endDate = today;
        break;
      case 'month':
        startDate = startOfMonth(today);
        endDate = today;
        break;
      case 'last30':
        startDate = subDays(today, 30);
        endDate = today;
        break;
      default:
        startDate = subDays(today, 7);
        endDate = today;
    }
    
    setDateRange({ startDate, endDate });
  }, []);
  
  // Update date range when period changes
  useEffect(() => {
    updateDateRangeFromPeriod(period);
  }, [period, updateDateRangeFromPeriod]);
  
  // CORREÇÃO: fetchSalesReport atualizado para usar timestamps ISO
  const fetchSalesReport = useCallback(async () => {
    setLoading(true);
    
    try {
      // Adicionar timestamp para cache busting
      const timestamp = new Date().getTime();
      
      // CORREÇÃO: Usar os timestamps ISO para início e fim do período
      const { startDate, endDate } = getFormattedDateRange();
      
      // Construir params com URLSearchParams
      const params = new URLSearchParams({
        startDate,
        endDate,
        _t: timestamp.toString()
      });
      
      console.log('Reports: Buscando relatório de vendas com:', params.toString());
      
      const response = await api.get(`/reports/sales?${params.toString()}`);
      
      if (response.data.success) {
        setSalesReport(response.data.report);
        console.log('Reports: Relatório de vendas recebido:', response.data.report);
      }
    } catch (error) {
      console.error('Erro ao buscar relatório de vendas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o relatório de vendas',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange, toast]);
  
  // CORREÇÃO: fetchTopProductsReport atualizado para usar timestamps ISO
  const fetchTopProductsReport = useCallback(async () => {
    setLoading(true);
    
    try {
      // Adicionar timestamp para cache busting
      const timestamp = new Date().getTime();
      
      // CORREÇÃO: Usar os timestamps ISO para início e fim do período
      const { startDate, endDate } = getFormattedDateRange();
      
      // Construir params com URLSearchParams
      const params = new URLSearchParams({
        startDate,
        endDate,
        limit: '10',
        _t: timestamp.toString()
      });
      
      console.log('Reports: Buscando relatório de produtos com:', params.toString());
      
      const response = await api.get(`/reports/top-products?${params.toString()}`);
      
      if (response.data.success) {
        setTopProductsReport(response.data.report);
        console.log('Reports: Relatório de produtos recebido:', 
          response.data.report.topProducts?.length || 0, 'produtos');
      }
    } catch (error) {
      console.error('Erro ao buscar relatório de produtos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o relatório de produtos',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange, toast]);
  
  // Fetch daily sales report
  const fetchDailySalesReport = useCallback(async () => {
    setLoading(true);
    
    try {
      // Calculate number of days
      const diffTime = Math.abs(dateRange.endDate - dateRange.startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      // Adicionar timestamp para cache busting
      const timestamp = new Date().getTime();
      
      // Construir params com URLSearchParams
      const params = new URLSearchParams({
        days: diffDays.toString(),
        _t: timestamp.toString()
      });
      
      console.log('Reports: Buscando relatório de vendas diárias com:', params.toString());
      
      const response = await api.get(`/reports/daily-sales?${params.toString()}`);
      
      if (response.data.success) {
        setDailySalesReport(response.data.report);
        console.log('Reports: Relatório de vendas diárias recebido:', 
          response.data.report.dailySales?.length || 0, 'dias');
      }
    } catch (error) {
      console.error('Erro ao buscar relatório de vendas diárias:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o relatório de vendas diárias',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange, toast]);
  
  // CORREÇÃO: fetchWaiterReport atualizado para usar timestamps ISO
  const fetchWaiterReport = useCallback(async () => {
    setLoading(true);
    
    try {
      // Adicionar timestamp para cache busting
      const timestamp = new Date().getTime();
      
      // CORREÇÃO: Usar os timestamps ISO para início e fim do período
      const { startDate, endDate } = getFormattedDateRange();
      
      // Construir params com URLSearchParams
      const params = new URLSearchParams({
        startDate,
        endDate,
        _t: timestamp.toString()
      });
      
      console.log('Reports: Buscando relatório de garçons com:', params.toString());
      
      const response = await api.get(`/reports/waiter-performance?${params.toString()}`);
      
      if (response.data.success) {
        setWaiterReport(response.data.report);
        console.log('Reports: Relatório de garçons recebido:',
          response.data.report.waiterPerformance?.length || 0, 'garçons');
      }
    } catch (error) {
      console.error('Erro ao buscar relatório de garçons:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o relatório de garçons',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange, toast]);
  
  // Fetch all reports
  const fetchAllReports = useCallback(() => {
    console.log('Reports: Buscando todos os relatórios:', new Date().toLocaleTimeString());
    fetchSalesReport();
    fetchTopProductsReport();
    fetchDailySalesReport();
    fetchWaiterReport();
  }, [fetchSalesReport, fetchTopProductsReport, fetchDailySalesReport, fetchWaiterReport]);
  
  // Socket event listeners
  useEffect(() => {
    if (connected && socket) {
      console.log('Reports: Configurando listeners de socket');
      
      // Join the reports room
      joinReportsRoom();
      
      // Listen for data updates
      socket.on('dataUpdate', ({ timestamp }) => {
        console.log('Reports: Recebeu evento dataUpdate às', new Date(timestamp).toLocaleTimeString());
        fetchAllReports();
      });
      
      // Listen for order updates
      socket.on('orderUpdate', ({ orderId, status }) => {
        console.log('Reports: Recebeu evento orderUpdate:', orderId, status);
        if (status === 'closed') {
          fetchAllReports();
        }
      });
      
      // Listen for new orders
      socket.on('newOrder', () => {
        console.log('Reports: Recebeu evento newOrder');
        fetchAllReports();
      });
    }
    
    // Cleanup on unmount
    return () => {
      if (socket) {
        console.log('Reports: Removendo listeners de socket');
        socket.off('dataUpdate');
        socket.off('orderUpdate');
        socket.off('newOrder');
      }
    };
  }, [connected, socket, joinReportsRoom, fetchAllReports]);
  
  // Initial data loading
  useEffect(() => {
    fetchAllReports();
  }, [fetchAllReports]);
  
  // CORREÇÃO: Função para atualização forçada mais robusta
  const forceRefresh = async () => {
    console.log('Reports: Forçando atualização de todos os relatórios');
    setLoading(true);
    
    try {
      // Use timestamp for cache busting
      const timestamp = new Date().getTime();
      
      // Obter formato de data preciso em ISO
      const { startDate, endDate } = getFormattedDateRange();
      
      // Fetch reports in parallel with timestamp to prevent caching
      const salesParams = new URLSearchParams({
        startDate,
        endDate,
        _t: timestamp
      });
      
      const topProductsParams = new URLSearchParams({
        startDate,
        endDate,
        limit: '10',
        _t: timestamp
      });
      
      const diffDays = getDaysDifference(dateRange.startDate, dateRange.endDate);
      const dailySalesParams = new URLSearchParams({
        days: diffDays.toString(),
        _t: timestamp
      });
      
      const waiterParams = new URLSearchParams({
        startDate,
        endDate,
        _t: timestamp
      });
      
      // Fazer todas as requisições em paralelo
      const [salesResponse, topProductsResponse, dailySalesResponse, waiterResponse] = await Promise.all([
        api.get(`/reports/sales?${salesParams.toString()}`),
        api.get(`/reports/top-products?${topProductsParams.toString()}`),
        api.get(`/reports/daily-sales?${dailySalesParams.toString()}`),
        api.get(`/reports/waiter-performance?${waiterParams.toString()}`)
      ]);
      
      // Atualizar estados com os resultados
      if (salesResponse.data.success) {
        setSalesReport(salesResponse.data.report);
      }
      
      if (topProductsResponse.data.success) {
        setTopProductsReport(topProductsResponse.data.report);
      }
      
      if (dailySalesResponse.data.success) {
        setDailySalesReport(dailySalesResponse.data.report);
      }
      
      if (waiterResponse.data.success) {
        setWaiterReport(waiterResponse.data.report);
      }
      
      toast({
        title: 'Dados atualizados',
        description: 'Os relatórios foram atualizados com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erro ao atualizar relatórios:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar os relatórios',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate difference in days between two dates
  const getDaysDifference = (startDate, endDate) => {
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };
  
  // Print report
  const handlePrint = () => {
    window.print();
  };
  
  // Export report as CSV
  const handleExportCSV = () => {
    // Implementation for CSV export
    toast({
      title: 'Exportação CSV',
      description: 'Funcionalidade em desenvolvimento',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Handle tab change
  const handleTabChange = (index) => {
    setActiveTab(index);
  };
  
  return (
    <Box>
      {/* Header */}
      <Flex 
        justifyContent="space-between" 
        alignItems="center" 
        mb={6}
        flexDirection={{ base: 'column', md: 'row' }}
        gap={4}
      >
        <Box>
          <Heading size="lg">Relatórios</Heading>
          <Text color="gray.500">Análise de vendas e desempenho</Text>
        </Box>
        
        <HStack spacing={2}>
          <Button
            leftIcon={<FiPrinter />}
            onClick={handlePrint}
            variant="outline"
          >
            Imprimir
          </Button>
          <Button
            leftIcon={<FiDownload />}
            onClick={handleExportCSV}
            variant="outline"
          >
            Exportar CSV
          </Button>
        </HStack>
      </Flex>
      
      {/* Period controls */}
      <Box 
        p={4} 
        bg={bgColor} 
        borderRadius="md" 
        boxShadow="sm"
        mb={6}
      >
        <Flex 
          flexDirection={{ base: 'column', md: 'row' }} 
          gap={4}
          alignItems={{ md: 'center' }}
        >
          <ButtonGroup size="sm" isAttached variant="outline" flexGrow={1}>
            <Button 
              onClick={() => setPeriod('today')}
              colorScheme={period === 'today' ? 'blue' : 'gray'}
              variant={period === 'today' ? 'solid' : 'outline'}
            >
              Hoje
            </Button>
            <Button 
              onClick={() => setPeriod('yesterday')}
              colorScheme={period === 'yesterday' ? 'blue' : 'gray'}
              variant={period === 'yesterday' ? 'solid' : 'outline'}
            >
              Ontem
            </Button>
            <Button 
              onClick={() => setPeriod('week')}
              colorScheme={period === 'week' ? 'blue' : 'gray'}
              variant={period === 'week' ? 'solid' : 'outline'}
            >
              Última Semana
            </Button>
            <Button 
              onClick={() => setPeriod('month')}
              colorScheme={period === 'month' ? 'blue' : 'gray'}
              variant={period === 'month' ? 'solid' : 'outline'}
            >
              Este Mês
            </Button>
            <Button 
              onClick={() => setPeriod('last30')}
              colorScheme={period === 'last30' ? 'blue' : 'gray'}
              variant={period === 'last30' ? 'solid' : 'outline'}
            >
              Últimos 30 Dias
            </Button>
          </ButtonGroup>
          
          <Flex gap={2} alignItems="center">
            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onChange={setDateRange}
              maxDate={new Date()}
            />
            
            <Button
              leftIcon={<FiRefreshCw />}
              onClick={forceRefresh}
              isLoading={loading}
              colorScheme="blue"
            >
              Atualizar
            </Button>
          </Flex>
        </Flex>
        
        <Flex mt={4} justify="space-between" wrap="wrap" gap={2}>
          <Text fontWeight="medium">
            Período: {format(dateRange.startDate, 'dd/MM/yyyy', {locale: ptBR})} até {format(dateRange.endDate, 'dd/MM/yyyy', {locale: ptBR})}
          </Text>
          
          {salesReport && (
            <Text>
              Total de vendas: <strong>{formatCurrency(salesReport.totalSales)}</strong>
            </Text>
          )}
        </Flex>
      </Box>
      
      {/* Summary cards */}
      {salesReport && (
        <Grid 
          templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
          gap={4}
          mb={6}
        >
          <ReportCard
            title="Total de Vendas"
            value={formatCurrency(salesReport.totalSales)}
            icon={FiCalendar}
            colorScheme="blue"
          />
          
          <ReportCard
            title="Pedidos"
            value={salesReport.totalOrders}
            suffix="pedidos"
            icon={FiCalendar}
            colorScheme="green"
          />
          
          <ReportCard
            title="Ticket Médio"
            value={formatCurrency(salesReport.averageTicket)}
            icon={FiCalendar}
            colorScheme="purple"
          />
          
          <ReportCard
            title="Garçons"
            value={salesReport.salesByWaiter ? salesReport.salesByWaiter.length : 0}
            icon={FiCalendar}
            colorScheme="orange"
          />
        </Grid>
      )}
      
      {/* Tab content */}
      <Tabs variant="enclosed" colorScheme="blue" index={activeTab} onChange={handleTabChange}>
        <TabList>
          <Tab>Visão Geral</Tab>
          <Tab>Produtos</Tab>
          <Tab>Garçons</Tab>
          <Tab>Formas de Pagamento</Tab>
        </TabList>
        
        <TabPanels>
          {/* Overview */}
          <TabPanel p={0} pt={4}>
            {loading ? (
              <Flex justify="center" align="center" h="300px">
                <Spinner size="xl" color="blue.500" />
              </Flex>
            ) : (
              <Box>
                {dailySalesReport && (
                  <Box
                    p={4}
                    bg={bgColor}
                    borderRadius="md"
                    boxShadow="sm"
                    mb={6}
                    h="400px"
                  >
                    <Heading size="md" mb={4}>Vendas por Dia</Heading>
                    <SalesChart data={dailySalesReport.dailySales} />
                  </Box>
                )}
                
                {salesReport && salesReport.salesByWaiter && (
                  <Box>
                    <Heading size="md" mb={4}>Resumo de Vendas</Heading>
                    
                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Garçom</Th>
                            <Th isNumeric>Vendas</Th>
                            <Th isNumeric>Pedidos</Th>
                            <Th isNumeric>Ticket Médio</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {salesReport.salesByWaiter.map((waiter, index) => (
                            <Tr key={index}>
                              <Td>{waiter.name}</Td>
                              <Td isNumeric>{formatCurrency(waiter.total)}</Td>
                              <Td isNumeric>{waiter.count}</Td>
                              <Td isNumeric>{formatCurrency(waiter.total / waiter.count)}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Box>
            )}
          </TabPanel>
          
          {/* Products */}
          <TabPanel p={0} pt={4}>
            {loading ? (
              <Flex justify="center" align="center" h="300px">
                <Spinner size="xl" color="blue.500" />
              </Flex>
            ) : (
              <Box>
                {topProductsReport && topProductsReport.topProducts && (
                  <Box
                    p={4}
                    bg={bgColor}
                    borderRadius="md"
                    boxShadow="sm"
                    mb={6}
                    h="400px"
                  >
                    <Heading size="md" mb={4}>Produtos Mais Vendidos</Heading>
                    <TopProductsChart data={topProductsReport.topProducts} />
                  </Box>
                )}
                
                {topProductsReport && topProductsReport.topProducts && (
                  <Box>
                    <Heading size="md" mb={4}>Detalhes dos Produtos Mais Vendidos</Heading>
                    
                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Produto</Th>
                            <Th>Categoria</Th>
                            <Th isNumeric>Preço</Th>
                            <Th isNumeric>Quantidade</Th>
                            <Th isNumeric>Total</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {topProductsReport.topProducts.map((item, index) => (
                            <Tr key={index}>
                              <Td>{item.product?.name || 'N/A'}</Td>
                              <Td>{item.product?.category?.name || 'N/A'}</Td>
                              <Td isNumeric>{formatCurrency(item.product?.price || 0)}</Td>
                              <Td isNumeric>{item.quantity}</Td>
                              <Td isNumeric>{formatCurrency(item.total)}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Box>
            )}
          </TabPanel>
          
          {/* Waiters */}
          <TabPanel p={0} pt={4}>
            {loading ? (
              <Flex justify="center" align="center" h="300px">
                <Spinner size="xl" color="blue.500" />
              </Flex>
            ) : (
              <Box>
                {waiterReport && waiterReport.waiterPerformance && (
                  <Box
                    p={4}
                    bg={bgColor}
                    borderRadius="md"
                    boxShadow="sm"
                    mb={6}
                    h="400px"
                  >
                    <Heading size="md" mb={4}>Desempenho dos Garçons</Heading>
                    <WaiterPerformanceChart data={waiterReport.waiterPerformance} />
                  </Box>
                )}
                
                {waiterReport && waiterReport.waiterPerformance && (
                  <Box>
                    <Heading size="md" mb={4}>Detalhes dos Garçons</Heading>
                    
                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Garçom</Th>
                            <Th isNumeric>Vendas</Th>
                            <Th isNumeric>Pedidos</Th>
                            <Th isNumeric>Ticket Médio</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {waiterReport.waiterPerformance.map((waiter, index) => (
                            <Tr key={index}>
                              <Td>{waiter.name}</Td>
                              <Td isNumeric>{formatCurrency(waiter.sales)}</Td>
                              <Td isNumeric>{waiter.orderCount}</Td>
                              <Td isNumeric>{formatCurrency(waiter.averageTicket)}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Box>
            )}
          </TabPanel>
          
          {/* Payment Methods */}
          <TabPanel p={0} pt={4}>
            {loading ? (
              <Flex justify="center" align="center" h="300px">
                <Spinner size="xl" color="blue.500" />
              </Flex>
            ) : (
              <Box>
              {salesReport && salesReport.paymentMethods && (
                <Box
                  p={4}
                  bg={bgColor}
                  borderRadius="md"
                  boxShadow="sm"
                  mb={6}
                >
                  <Heading size="md" mb={4}>Vendas por Forma de Pagamento</Heading>
                  
                  <Grid 
                    templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
                    gap={4}
                  >
                    {Object.entries(salesReport.paymentMethods).map(([method, value]) => (
                      <Box
                        key={method}
                        px={2}
                        py={4}
                        borderWidth="1px"
                        borderRadius="lg"
                        borderColor={borderColor}
                      >
                        <Stat>
                          <StatLabel>
                            {method === 'cash' && 'Dinheiro'}
                            {method === 'credit' && 'Cartão de Crédito'}
                            {method === 'debit' && 'Cartão de Débito'}
                            {method === 'pix' && 'PIX'}
                            {method === 'other' && 'Outros'}
                          </StatLabel>
                          <StatNumber>{formatCurrency(value)}</StatNumber>
                          <StatHelpText>
                            {((value / salesReport.totalSales) * 100).toFixed(1)}% do total
                          </StatHelpText>
                        </Stat>
                      </Box>
                    ))}
                  </Grid>
                </Box>
              )}
              </Box>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default Reports;