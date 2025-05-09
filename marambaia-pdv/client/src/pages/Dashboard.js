// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
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
  SimpleGrid,
  Badge,
  useColorModeValue,
  Icon
} from '@chakra-ui/react';
import {
  FiUsers,
  FiClock,
  FiShoppingBag,
  FiActivity,
  FiCheck,
  FiAlertTriangle,
  FiChevronRight,
  FiDollarSign
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';
import SalesChart from '../components/Reports/SalesChart';

const Dashboard = () => {
  const { user } = useAuth();
  const { tables, fetchTables } = useData();
  const { connected, joinTableRoom } = useSocket();
  const [stats, setStats] = useState({
    totalSales: 0,
    occupiedTables: 0,
    pendingOrders: 0,
    averageTicket: 0
  });
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  
  // Conectar à sala de mesas via socket
  useEffect(() => {
    if (connected) {
      joinTableRoom();
    }
  }, [connected, joinTableRoom]);
  
  // Carregar mesas e estatísticas
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        // Carregar mesas
        await fetchTables();
        
        // Carregar estatísticas do dia
        const today = new Date().toISOString().split('T')[0];
        const response = await api.get(`/reports/sales?startDate=${today}&endDate=${today}`);
        
        if (response.data.success) {
          setStats({
            totalSales: response.data.report.totalSales || 0,
            occupiedTables: tables.filter(t => t.status !== 'free').length,
            pendingOrders: 0, // Precisaria de endpoint específico
            averageTicket: response.data.report.averageTicket || 0
          });
        }
        
        // Carregar dados de vendas dos últimos 7 dias
        const salesResponse = await api.get('/reports/daily-sales?days=7');
        if (salesResponse.data.success) {
          setSalesData(salesResponse.data.report.dailySales || []);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [fetchTables]);
  
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
        
        <Button 
          colorScheme="blue" 
          onClick={() => navigate('/tables')}
          rightIcon={<FiChevronRight />}
        >
          Ir para Mesas
        </Button>
      </Flex>
      
      {/* Cards de estatísticas */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5} mb={8}>
        <Card bg={bgColor}>
          <CardBody>
            <Flex justify="space-between">
              <Stat>
                <StatLabel>Vendas Hoje</StatLabel>
                <StatNumber>{formatCurrency(stats.totalSales)}</StatNumber>
                <StatHelpText>
                  <Badge colorScheme="green">
                    Atualizado
                  </Badge>
                </StatHelpText>
              </Stat>
              <Flex
                w="12"
                h="12"
                align="center"
                justify="center"
                rounded="full"
                bg="blue.50"
              >
                <Icon as={FiDollarSign} color="blue.500" boxSize="6" />
              </Flex>
            </Flex>
          </CardBody>
        </Card>
        
        <Card bg={bgColor}>
          <CardBody>
            <Flex justify="space-between">
              <Stat>
                <StatLabel>Mesas Ocupadas</StatLabel>
                <StatNumber>{stats.occupiedTables}</StatNumber>
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
        
        <Card bg={bgColor}>
          <CardBody>
            <Flex justify="space-between">
              <Stat>
                <StatLabel>Pedidos Pendentes</StatLabel>
                <StatNumber>{stats.pendingOrders}</StatNumber>
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
        
        <Card bg={bgColor}>
          <CardBody>
            <Flex justify="space-between">
              <Stat>
                <StatLabel>Ticket Médio</StatLabel>
                <StatNumber>{formatCurrency(stats.averageTicket)}</StatNumber>
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
      
      {/* Gráfico de Vendas */}
      <Card bg={bgColor} mb={8}>
        <CardBody>
          <Heading size="md" mb={4}>Vendas dos Últimos 7 Dias</Heading>
          <Box h="300px">
            <SalesChart data={salesData} />
          </Box>
        </CardBody>
      </Card>
      
      {/* Resumo de mesas */}
      <Card bg={bgColor}>
        <CardBody>
          <Heading size="md" mb={4}>Resumo de Mesas</Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
            <Stat>
              <StatLabel>Total de Mesas</StatLabel>
              <StatNumber>{tables.length}</StatNumber>
            </Stat>
            
            <Stat>
              <StatLabel>Mesas Livres</StatLabel>
              <StatNumber>{tables.filter(t => t.status === 'free').length}</StatNumber>
              <StatHelpText>
                <Badge colorScheme="green">Disponíveis</Badge>
              </StatHelpText>
            </Stat>
            
            <Stat>
              <StatLabel>Mesas Ocupadas</StatLabel>
              <StatNumber>{tables.filter(t => t.status !== 'free').length}</StatNumber>
              <StatHelpText>
                <Badge colorScheme="yellow">Em Uso</Badge>
              </StatHelpText>
            </Stat>
          </SimpleGrid>
        </CardBody>
      </Card>
    </Box>
  );
};

export default Dashboard;