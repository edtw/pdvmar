import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  IconButton,
  Badge,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';
import {
  FiSearch,
  FiEye,
  FiRefreshCw,
  FiFilter,
  FiCalendar
} from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../services/api';
import EmptyState from '../components/ui/EmptyState';
import LoadingOverlay from '../components/ui/LoadingOverlay';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  
  // Carregar pedidos
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Construir parâmetros de busca (seria necessário implementar este endpoint no backend)
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await api.get(`/orders?${params.toString()}`);
      
      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os pedidos',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Carregar dados iniciais
  useEffect(() => {
    fetchOrders();
  }, []);
  
  // Formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Formatar data
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };
  
  // Obter texto do status
  const getStatusText = (status) => {
    switch (status) {
      case 'open':
        return 'Aberto';
      case 'closed':
        return 'Fechado';
      case 'canceled':
        return 'Cancelado';
      default:
        return 'Desconhecido';
    }
  };
  
  // Obter cor do status
  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'green';
      case 'closed':
        return 'blue';
      case 'canceled':
        return 'red';
      default:
        return 'gray';
    }
  };
  
  // Ver detalhes do pedido
  const handleViewOrder = (orderId) => {
    navigate(`/orders/${orderId}`);
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
          <Heading size="lg">Pedidos</Heading>
          <Text color="gray.500">Histórico de pedidos do restaurante</Text>
        </Box>
        
        <Button 
          leftIcon={<FiCalendar />}
          colorScheme="blue"
          onClick={() => navigate('/tables')}
        >
          Ver Mesas
        </Button>
      </Flex>
      
      {/* Filtros */}
      <Flex 
        mb={6} 
        gap={4} 
        flexDirection={{ base: 'column', md: 'row' }}
      >
        <InputGroup maxW={{ md: '320px' }}>
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Buscar pedidos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchOrders()}
          />
        </InputGroup>
        
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          maxW={{ md: '200px' }}
        >
          <option value="all">Todos os pedidos</option>
          <option value="open">Abertos</option>
          <option value="closed">Fechados</option>
          <option value="canceled">Cancelados</option>
        </Select>
        
        <IconButton
          icon={<FiRefreshCw />}
          aria-label="Atualizar"
          onClick={fetchOrders}
          isLoading={loading}
        />
      </Flex>
      
      {/* Lista de pedidos */}
      {loading ? (
        <LoadingOverlay />
      ) : (
        <>
          {orders.length === 0 ? (
            <EmptyState
              title="Nenhum pedido encontrado"
              description="Não há pedidos que correspondam aos filtros selecionados."
              icon={FiFilter}
            />
          ) : (
            <Box
              bg={bgColor}
              borderRadius="md"
              overflow="auto"
              boxShadow="sm"
            >
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th>Mesa</Th>
                    <Th>Data</Th>
                    <Th>Garçom</Th>
                    <Th>Total</Th>
                    <Th>Status</Th>
                    <Th width="100px">Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {orders.map(order => (
                    <Tr key={order._id}>
                      <Td fontWeight="medium">{order._id.substring(0, 8)}</Td>
                      <Td>Mesa {order.table?.number || '-'}</Td>
                      <Td>{formatDate(order.createdAt)}</Td>
                      <Td>{order.waiter?.name || '-'}</Td>
                      <Td>{formatCurrency(order.total)}</Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                      </Td>
                      <Td>
                        <IconButton
                          icon={<FiEye />}
                          aria-label="Ver pedido"
                          variant="ghost"
                          colorScheme="blue"
                          onClick={() => handleViewOrder(order._id)}
                        />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default Orders;