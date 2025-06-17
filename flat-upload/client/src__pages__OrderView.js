// src/pages/OrderView.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Button,
  IconButton,
  Badge,
  Divider,
  HStack,
  VStack,
  useDisclosure,
  useToast,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react';
import {
  FiPlus,
  FiRefreshCw,
  FiArrowLeft,
  FiPrinter,
  FiEdit,
  FiTrash2,
  FiClock,
  FiMoreVertical,
  FiCheck,
  FiCoffee,
  FiShoppingBag
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatDistanceStrict, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componentes
import LoadingOverlay from '../components/ui/LoadingOverlay';
import EmptyState from '../components/ui/EmptyState';
import OrderItem from '../components/Orders/OrderItem';
import AddItemModal from '../components/Orders/AddItemModal';

// Socket
import { io } from 'socket.io-client';

const OrderView = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  
  // Estado
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  
  // Modais
  const {
    isOpen: isAddItemOpen,
    onOpen: onAddItemOpen,
    onClose: onAddItemClose
  } = useDisclosure();
  
  // Carregar pedido e itens
  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);

      if (!id || id === '[object Object]') {
        throw new Error('ID de pedido inválido');
      }
      // Buscar items do pedido
      const itemsResponse = await api.get(`/orders/${id}/items`);
      if (itemsResponse.data.success) {
        setItems(itemsResponse.data.items);
        setOrder(itemsResponse.data.order);
        
        // Buscar mesa
        if (itemsResponse.data.order.table) {
          const tableResponse = await api.get(`/tables/${itemsResponse.data.order.table}`);
          if (tableResponse.data.success) {
            setTable(tableResponse.data.table);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o pedido',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);
  
  // Inicializar Socket.io
  useEffect(() => {
    // Configurar socket
    const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    setSocket(socketInstance);
    
    // Entrar na sala do pedido
    socketInstance.emit('joinSpecificTable', order?.table);
    
    // Ouvir atualizações do pedido
    socketInstance.on('orderUpdate', ({ orderId, status }) => {
      console.log('Atualização de pedido recebida:', orderId, status);
      if (orderId === id) {
        fetchOrder();
      }
    });
    
    // Limpeza ao desmontar componente
    return () => {
      socketInstance.off('orderUpdate');
      socketInstance.disconnect();
    };
  }, [fetchOrder, id, order?.table]);
  
  // Carregar pedido ao montar componente
  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);
  
  // Agrupar itens por status
  const itemsByStatus = {
    pending: items.filter(item => item.status === 'pending'),
    preparing: items.filter(item => item.status === 'preparing'),
    ready: items.filter(item => item.status === 'ready'),
    delivered: items.filter(item => item.status === 'delivered'),
    canceled: items.filter(item => item.status === 'canceled')
  };
  
  // Atualizar status do item
  const handleUpdateItemStatus = async (itemId, newStatus) => {
    try {
      const response = await api.put(`/orders/items/${itemId}/status`, {
        status: newStatus
      });
      
      if (response.data.success) {
        toast({
          title: 'Status atualizado',
          description: 'Status do item atualizado com sucesso',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
        
        // Atualizar localmente
        setItems(prevItems => 
          prevItems.map(item => 
            item._id === itemId 
              ? { ...item, status: newStatus } 
              : item
          )
        );
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Remover item
  const handleRemoveItem = async (itemId) => {
    try {
      const response = await api.delete(`/orders/items/${itemId}`);
      
      if (response.data.success) {
        toast({
          title: 'Item removido',
          description: 'Item removido com sucesso',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
        
        // Atualizar localmente
        setItems(prevItems => prevItems.filter(item => item._id !== itemId));
        
        // Atualizar pedido (total)
        fetchOrder();
      }
    } catch (error) {
      console.error('Erro ao remover item:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o item',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Imprimir pedido/comanda
  const handlePrintOrder = () => {
    toast({
      title: 'Impressão',
      description: 'Funcionalidade de impressão em desenvolvimento',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };
  
  if (loading) {
    return <LoadingOverlay />;
  }
  
  if (!order) {
    return (
      <EmptyState
        title="Pedido não encontrado"
        description="O pedido que você está procurando não existe ou foi removido"
        button={{
          text: 'Voltar para Mesas',
          onClick: () => navigate('/tables')
        }}
      />
    );
  }
  
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
        <HStack>
          <IconButton
            icon={<FiArrowLeft />}
            aria-label="Voltar"
            variant="ghost"
            onClick={() => navigate('/tables')}
          />
          <Box>
            <Heading size="lg">Pedido da Mesa {table?.number}</Heading>
            <Text color="gray.500">
              {order.status === 'open' ? 'Em andamento' : order.status === 'closed' ? 'Finalizado' : 'Cancelado'}
              {order.status === 'open' && table?.openTime && ` • ${formatDistanceStrict(
                new Date(table.openTime),
                new Date(),
                { locale: ptBR }
              )}`}
            </Text>
          </Box>
        </HStack>
        
        <HStack>
          <IconButton
            icon={<FiRefreshCw />}
            aria-label="Atualizar"
            onClick={fetchOrder}
          />
          
          <IconButton
            icon={<FiPrinter />}
            aria-label="Imprimir comanda"
            onClick={handlePrintOrder}
          />
          
          {order.status === 'open' && (
            <Button
              leftIcon={<FiPlus />}
              colorScheme="blue"
              onClick={onAddItemOpen}
            >
              Adicionar Item
            </Button>
          )}
        </HStack>
      </Flex>
      
      {/* Conteúdo principal */}
      <Grid templateColumns={{ base: '1fr', lg: '1fr 300px' }} gap={6}>
        {/* Painel principal - Items */}
        <Box>
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>Todos ({items.length})</Tab>
              <Tab>Pendentes ({itemsByStatus.pending.length})</Tab>
              <Tab>Preparando ({itemsByStatus.preparing.length})</Tab>
              <Tab>Prontos ({itemsByStatus.ready.length})</Tab>
              <Tab>Entregues ({itemsByStatus.delivered.length})</Tab>
              {itemsByStatus.canceled.length > 0 && (
                <Tab>Cancelados ({itemsByStatus.canceled.length})</Tab>
              )}
            </TabList>
            
            <TabPanels>
              {/* Todos os items */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  {items.length === 0 ? (
                    <Box textAlign="center" py={8}>
                      <Text color="gray.500">Nenhum item adicionado ao pedido</Text>
                      {order.status === 'open' && (
                        <Button
                          mt={4}
                          leftIcon={<FiPlus />}
                          onClick={onAddItemOpen}
                          size="sm"
                        >
                          Adicionar Item
                        </Button>
                      )}
                    </Box>
                  ) : (
                    items.map(item => (
                      <OrderItem
                        key={item._id}
                        item={item}
                        orderStatus={order.status}
                        onStatusChange={handleUpdateItemStatus}
                        onRemove={handleRemoveItem}
                        userRole={user.role}
                      />
                    ))
                  )}
                </VStack>
              </TabPanel>
              
              {/* Pendentes */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  {itemsByStatus.pending.length === 0 ? (
                    <Box textAlign="center" py={8}>
                      <Text color="gray.500">Nenhum item pendente</Text>
                    </Box>
                  ) : (
                    itemsByStatus.pending.map(item => (
                      <OrderItem
                        key={item._id}
                        item={item}
                        orderStatus={order.status}
                        onStatusChange={handleUpdateItemStatus}
                        onRemove={handleRemoveItem}
                        userRole={user.role}
                      />
                    ))
                  )}
                </VStack>
              </TabPanel>
              
              {/* Preparando */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  {itemsByStatus.preparing.length === 0 ? (
                    <Box textAlign="center" py={8}>
                      <Text color="gray.500">Nenhum item em preparação</Text>
                    </Box>
                  ) : (
                    itemsByStatus.preparing.map(item => (
                      <OrderItem
                        key={item._id}
                        item={item}
                        orderStatus={order.status}
                        onStatusChange={handleUpdateItemStatus}
                        onRemove={handleRemoveItem}
                        userRole={user.role}
                      />
                    ))
                  )}
                </VStack>
              </TabPanel>
              
              {/* Prontos */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  {itemsByStatus.ready.length === 0 ? (
                    <Box textAlign="center" py={8}>
                      <Text color="gray.500">Nenhum item pronto para entrega</Text>
                    </Box>
                  ) : (
                    itemsByStatus.ready.map(item => (
                      <OrderItem
                        key={item._id}
                        item={item}
                        orderStatus={order.status}
                        onStatusChange={handleUpdateItemStatus}
                        onRemove={handleRemoveItem}
                        userRole={user.role}
                      />
                    ))
                  )}
                </VStack>
              </TabPanel>
              
              {/* Entregues */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  {itemsByStatus.delivered.length === 0 ? (
                    <Box textAlign="center" py={8}>
                      <Text color="gray.500">Nenhum item entregue</Text>
                    </Box>
                  ) : (
                    itemsByStatus.delivered.map(item => (
                      <OrderItem
                        key={item._id}
                        item={item}
                        orderStatus={order.status}
                        onStatusChange={handleUpdateItemStatus}
                        onRemove={handleRemoveItem}
                        userRole={user.role}
                      />
                    ))
                  )}
                </VStack>
              </TabPanel>
              
              {/* Cancelados */}
              {itemsByStatus.canceled.length > 0 && (
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    {itemsByStatus.canceled.map(item => (
                      <OrderItem
                        key={item._id}
                        item={item}
                        orderStatus={order.status}
                        onStatusChange={handleUpdateItemStatus}
                        onRemove={handleRemoveItem}
                        userRole={user.role}
                      />
                    ))}
                  </VStack>
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
        </Box>
        
        {/* Painel lateral - Resumo */}
        <Box>
          <Box
            bg={bgColor}
            borderRadius="md"
            boxShadow="sm"
            p={4}
          >
            <Heading size="md" mb={4}>Resumo do Pedido</Heading>
            
            {/* Informações da mesa */}
            <VStack align="stretch" spacing={2} mb={4}>
              <HStack justify="space-between">
                <Text fontWeight="medium">Mesa</Text>
                <Text>{table?.number || '-'}</Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="medium">Garçom</Text>
                <Text>{order.waiter?.name || '-'}</Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="medium">Abertura</Text>
                <Text>
                  {table?.openTime
                    ? format(new Date(table.openTime), 'dd/MM/yy HH:mm')
                    : '-'}
                </Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="medium">Status</Text>
                <Badge colorScheme={order.status === 'open' ? 'green' : 'gray'}>
                  {order.status === 'open' ? 'Aberto' : 'Fechado'}
                </Badge>
              </HStack>
            </VStack>
            
            <Divider my={4} />
            
            {/* Resumo financeiro */}
            <VStack align="stretch" spacing={3}>
              <HStack justify="space-between">
                <Text>Subtotal</Text>
                <Text>R$ {order.total?.toFixed(2) || '0.00'}</Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text>Taxa de serviço (10%)</Text>
                <Text>R$ {(order.total * 0.1)?.toFixed(2) || '0.00'}</Text>
              </HStack>
              
              <Divider />
              
              <HStack justify="space-between" fontWeight="bold">
                <Text>Total</Text>
                <Text>R$ {(order.total * 1.1)?.toFixed(2) || '0.00'}</Text>
              </HStack>
            </VStack>
            
            {/* Botões de ação */}
            {order.status === 'open' && (
              <VStack mt={6} spacing={3}>
                <Button
                  leftIcon={<FiPlus />}
                  colorScheme="blue"
                  w="full"
                  onClick={onAddItemOpen}
                >
                  Adicionar Item
                </Button>
                
                <Button
                  leftIcon={<FiCheck />}
                  colorScheme="green"
                  variant="outline"
                  w="full"
                  onClick={() => navigate(`/tables`)}
                >
                  Voltar para Mesas
                </Button>
              </VStack>
            )}
          </Box>
        </Box>
      </Grid>
      
      {/* Modais */}
      <AddItemModal
        isOpen={isAddItemOpen}
        onClose={onAddItemClose}
        orderId={id}
        onSuccess={fetchOrder}
      />
    </Box>
  );
};

export default OrderView;