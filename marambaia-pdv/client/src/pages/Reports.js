// src/pages/Reports.js - FIXED
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
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componentes
import SalesChart from '../components/Reports/SalesChart';
import TopProductsChart from '../components/Reports/TopProductsChart';
import WaiterPerformanceChart from '../components/Reports/WaiterPerformanceChart';
import ReportCard from '../components/Reports/ReportCard';
import DateRangePicker from '../components/ui/DateRangePicker';

const Reports = () => {
  // Estados
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
  
  // Função para formatar valores monetários
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Atualizar período de data com base na seleção
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
        startDate = startOfWeek(today, { weekStartsOn: 1 }); // Segunda-feira
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
  
  // Quando mudar o período, atualizar o intervalo de datas
  useEffect(() => {
    updateDateRangeFromPeriod(period);
  }, [period, updateDateRangeFromPeriod]);
  
  // Buscar relatório de vendas
  const fetchSalesReport = useCallback(async () => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
        endDate: format(dateRange.endDate, 'yyyy-MM-dd')
      });
      
      const response = await api.get(`/reports/sales?${params}`);
      
      if (response.data.success) {
        setSalesReport(response.data.report);
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
  
  // Buscar relatório de produtos mais vendidos
  const fetchTopProductsReport = useCallback(async () => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
        endDate: format(dateRange.endDate, 'yyyy-MM-dd'),
        limit: 10
      });
      
      const response = await api.get(`/reports/top-products?${params}`);
      
      if (response.data.success) {
        setTopProductsReport(response.data.report);
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
  
  // Buscar relatório de vendas diárias
  const fetchDailySalesReport = useCallback(async () => {
    setLoading(true);
    
    try {
      // Calcular número de dias
      const diffTime = Math.abs(dateRange.endDate - dateRange.startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      const params = new URLSearchParams({
        days: diffDays
      });
      
      const response = await api.get(`/reports/daily-sales?${params}`);
      
      if (response.data.success) {
        setDailySalesReport(response.data.report);
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
  
  // Buscar relatório de desempenho dos garçons
  const fetchWaiterReport = useCallback(async () => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
        endDate: format(dateRange.endDate, 'yyyy-MM-dd')
      });
      
      const response = await api.get(`/reports/waiter-performance?${params}`);
      
      if (response.data.success) {
        setWaiterReport(response.data.report);
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
  
  // Buscar todos os relatórios
  const fetchAllReports = useCallback(() => {
    fetchSalesReport();
    fetchTopProductsReport();
    fetchDailySalesReport();
    fetchWaiterReport();
  }, [fetchSalesReport, fetchTopProductsReport, fetchDailySalesReport, fetchWaiterReport]);
  
  // Ao montar o componente ou alterar datas
  useEffect(() => {
    fetchAllReports();
  }, [fetchAllReports]);
  
  // Imprimir relatório
  const handlePrint = () => {
    window.print();
  };
  
  // Exportar relatório em CSV
  const handleExportCSV = () => {
    // Implementação de exportação para CSV
    toast({
      title: 'Exportação CSV',
      description: 'Funcionalidade em desenvolvimento',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Navegar para outra aba
  const handleTabChange = (index) => {
    setActiveTab(index);
  };
  
  return (
    <Box>
      {/* Cabeçalho */}
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
      
      {/* Controles do período */}
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
              onClick={fetchAllReports}
              isLoading={loading}
              colorScheme="blue"
            >
              Atualizar
            </Button>
          </Flex>
        </Flex>
        
        <Flex mt={4} justify="space-between" wrap="wrap" gap={2}>
          <Text fontWeight="medium">
            Período: {format(dateRange.startDate, 'dd/MM/yyyy')} até {format(dateRange.endDate, 'dd/MM/yyyy')}
          </Text>
          
          {salesReport && (
            <Text>
              Total de vendas: <strong>{formatCurrency(salesReport.totalSales)}</strong>
            </Text>
          )}
        </Flex>
      </Box>
      
      {/* Cards de resumo */}
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
      
      {/* Conteúdo das abas */}
      <Tabs variant="enclosed" colorScheme="blue" index={activeTab} onChange={handleTabChange}>
        <TabList>
          <Tab>Visão Geral</Tab>
          <Tab>Produtos</Tab>
          <Tab>Garçons</Tab>
          <Tab>Formas de Pagamento</Tab>
        </TabList>
        
        <TabPanels>
          {/* Visão Geral */}
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
          
          {/* Produtos */}
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
          
          {/* Garçons */}
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
          
          {/* Formas de Pagamento */}
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