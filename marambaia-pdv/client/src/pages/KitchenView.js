// src/pages/KitchenView.js - Vista da Cozinha (Mobile-First, Quadro Kanban)
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Badge,
  Card,
  CardBody,
  Grid,
  useToast,
  Spinner,
  Center,
  Icon,
  IconButton,
  Divider,
  SimpleGrid,
  Flex
} from '@chakra-ui/react';
import {
  FiRefreshCw,
  FiClock,
  FiCheckCircle,
  FiTruck,
  FiLogOut,
  FiAlertCircle
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';

const KitchenView = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { socket } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Verificar autenticação
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    if (!token || !['admin', 'manager', 'kitchen'].includes(userData.role)) {
      toast({
        title: 'Acesso Negado',
        description: 'Esta página é apenas para a cozinha',
        status: 'error',
        duration: 3000
      });
      navigate('/login');
      return;
    }

    setUser(userData);
    loadOrders();

    // WebSocket - entrar na sala da cozinha
    if (socket) {
      socket.emit('joinKitchenRoom');

      // Escutar novos pedidos (SOMENTE COMIDA)
      socket.on('newOrder', (data) => {
        console.log('[Kitchen] Novo pedido:', data);

        // Verificar se é comida
        if (data.item?.product?.productType === 'food') {
          // Som de notificação
          playNotificationSound();

          toast({
            title: '🍽️ Novo Pedido de Comida!',
            description: `Mesa ${data.tableId?.number || 'N/A'} - ${data.item?.product?.name}`,
            status: 'info',
            duration: 5000,
            isClosable: true,
            position: 'top'
          });

          loadOrders();
        }
      });

      // Escutar atualização de status
      socket.on('orderStatusChanged', (data) => {
        console.log('[Kitchen] Status changed:', data);
        loadOrders();
      });
    }

    return () => {
      if (socket) {
        socket.off('newOrder');
        socket.off('orderStatusChanged');
      }
    };
  }, [socket]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.play().catch(err => console.log('Sound play failed:', err));
    } catch (error) {
      console.log('Sound not available');
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tables');

      // Extrair todos os itens de pedidos que são COMIDA
      const allItems = [];
      response.data.tables.forEach(table => {
        if (table.currentOrder && table.currentOrder.items) {
          table.currentOrder.items.forEach(item => {
            // FILTRAR APENAS COMIDA
            if (item.product?.productType === 'food') {
              allItems.push({
                ...item,
                tableNumber: table.number,
                tableId: table._id,
                orderId: table.currentOrder._id,
                customerName: table.currentOrder.customer?.name || 'Cliente'
              });
            }
          });
        }
      });

      setOrders(allItems);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os pedidos',
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const updateItemStatus = async (itemId, newStatus) => {
    try {
      await api.put(`/orders/items/${itemId}/status`, { status: newStatus });

      toast({
        title: 'Status atualizado!',
        description: `Item marcado como ${getStatusLabel(newStatus)}`,
        status: 'success',
        duration: 2000
      });

      loadOrders();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao atualizar status',
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      preparing: 'blue',
      ready: 'green',
      delivered: 'gray',
      canceled: 'red'
    };
    return colors[status] || 'gray';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendente',
      preparing: 'Em Preparo',
      ready: 'Pronto',
      delivered: 'Entregue',
      canceled: 'Cancelado'
    };
    return labels[status] || status;
  };

  // Agrupar itens por status
  const pendingItems = orders.filter(item => item.status === 'pending');
  const preparingItems = orders.filter(item => item.status === 'preparing');
  const readyItems = orders.filter(item => item.status === 'ready');

  if (loading) {
    return (
      <Center h="100vh" bg="gray.50">
        <VStack spacing={4}>
          <Spinner size="xl" color="orange.500" thickness="4px" />
          <Text color="gray.600">Carregando pedidos...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50" pb={20}>
      {/* Header */}
      <Box
        bg="linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)"
        color="white"
        py={6}
        px={4}
        boxShadow="md"
      >
        <Container maxW="container.xl">
          <HStack justify="space-between">
            <VStack align="start" spacing={1}>
              <Heading size="lg">🍳 Cozinha</Heading>
              <Text fontSize="sm">{pendingItems.length + preparingItems.length + readyItems.length} pedidos ativos</Text>
            </VStack>
            <VStack spacing={2}>
              <IconButton
                icon={<FiRefreshCw />}
                onClick={loadOrders}
                colorScheme="whiteAlpha"
                variant="ghost"
                aria-label="Atualizar"
                size="lg"
              />
              <IconButton
                icon={<FiLogOut />}
                onClick={handleLogout}
                colorScheme="whiteAlpha"
                variant="ghost"
                aria-label="Sair"
                size="sm"
              />
            </VStack>
          </HStack>
        </Container>
      </Box>

      {/* Kanban Board */}
      <Container maxW="container.xl" py={6}>
        {orders.length === 0 ? (
          <Center h="400px">
            <VStack spacing={4}>
              <Icon as={FiAlertCircle} boxSize={16} color="gray.400" />
              <Text color="gray.600" fontSize="lg">
                Nenhum pedido pendente
              </Text>
              <Text color="gray.500" fontSize="sm">
                Aguardando novos pedidos de comida...
              </Text>
            </VStack>
          </Center>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            {/* PENDENTES */}
            <Box>
              <HStack mb={4} justify="space-between">
                <HStack>
                  <Icon as={FiClock} color="orange.500" />
                  <Heading size="md" color="orange.600">Pendentes</Heading>
                </HStack>
                <Badge colorScheme="orange" fontSize="lg" px={3} py={1} borderRadius="full">
                  {pendingItems.length}
                </Badge>
              </HStack>

              <VStack spacing={4} align="stretch">
                {pendingItems.map((item) => (
                  <OrderItemCard
                    key={item._id}
                    item={item}
                    onStatusChange={updateItemStatus}
                    nextStatus="preparing"
                    nextStatusLabel="Iniciar Preparo"
                    nextStatusColor="blue"
                  />
                ))}
              </VStack>
            </Box>

            {/* EM PREPARO */}
            <Box>
              <HStack mb={4} justify="space-between">
                <HStack>
                  <Icon as={FiClock} color="blue.500" />
                  <Heading size="md" color="blue.600">Em Preparo</Heading>
                </HStack>
                <Badge colorScheme="blue" fontSize="lg" px={3} py={1} borderRadius="full">
                  {preparingItems.length}
                </Badge>
              </HStack>

              <VStack spacing={4} align="stretch">
                {preparingItems.map((item) => (
                  <OrderItemCard
                    key={item._id}
                    item={item}
                    onStatusChange={updateItemStatus}
                    nextStatus="ready"
                    nextStatusLabel="Marcar Pronto"
                    nextStatusColor="green"
                  />
                ))}
              </VStack>
            </Box>

            {/* PRONTOS */}
            <Box>
              <HStack mb={4} justify="space-between">
                <HStack>
                  <Icon as={FiCheckCircle} color="green.500" />
                  <Heading size="md" color="green.600">Prontos</Heading>
                </HStack>
                <Badge colorScheme="green" fontSize="lg" px={3} py={1} borderRadius="full">
                  {readyItems.length}
                </Badge>
              </HStack>

              <VStack spacing={4} align="stretch">
                {readyItems.map((item) => (
                  <OrderItemCard
                    key={item._id}
                    item={item}
                    showTimer
                  />
                ))}
              </VStack>
            </Box>
          </SimpleGrid>
        )}
      </Container>
    </Box>
  );
};

// Componente de Card de Item
const OrderItemCard = ({ item, onStatusChange, nextStatus, nextStatusLabel, nextStatusColor, showTimer }) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (showTimer && item.preparationStartTime) {
      const interval = setInterval(() => {
        const start = new Date(item.preparationStartTime);
        const now = new Date();
        const diff = Math.floor((now - start) / 1000); // segundos
        setElapsedTime(diff);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [showTimer, item.preparationStartTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card
      boxShadow="lg"
      borderLeft="4px solid"
      borderColor={`${getStatusColor(item.status)}.500`}
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
      transition="all 0.3s"
    >
      <CardBody>
        <VStack align="stretch" spacing={3}>
          {/* Cabeçalho */}
          <HStack justify="space-between">
            <Badge colorScheme="purple" fontSize="sm">Mesa {item.tableNumber}</Badge>
            <Badge colorScheme={getStatusColor(item.status)} fontSize="xs">
              {getStatusLabel(item.status)}
            </Badge>
          </HStack>

          {/* Nome do Produto */}
          <Heading size="sm" color="gray.800">
            {item.quantity}x {item.product?.name}
          </Heading>

          {/* Observações */}
          {item.notes && (
            <Text
              fontSize="sm"
              color="gray.600"
              bg="yellow.50"
              p={2}
              borderRadius="md"
              fontStyle="italic"
            >
              📝 {item.notes}
            </Text>
          )}

          {/* Cliente */}
          <Text fontSize="xs" color="gray.500">
            Cliente: {item.customerName}
          </Text>

          {/* Timer */}
          {showTimer && elapsedTime > 0 && (
            <HStack justify="center" p={2} bg="green.50" borderRadius="md">
              <Icon as={FiClock} color="green.600" />
              <Text fontSize="lg" fontWeight="bold" color="green.600">
                {formatTime(elapsedTime)}
              </Text>
            </HStack>
          )}

          {/* Botão de Ação */}
          {onStatusChange && (
            <>
              <Divider />
              <Button
                colorScheme={nextStatusColor}
                size="md"
                onClick={() => onStatusChange(item._id, nextStatus)}
                w="full"
              >
                {nextStatusLabel}
              </Button>
            </>
          )}

          {!onStatusChange && (
            <HStack justify="center" p={2} bg="gray.50" borderRadius="md">
              <Icon as={FiTruck} color="gray.500" />
              <Text fontSize="sm" color="gray.600">Aguardando garçom</Text>
            </HStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

const getStatusColor = (status) => {
  const colors = {
    pending: 'orange',
    preparing: 'blue',
    ready: 'green',
    delivered: 'gray',
    canceled: 'red'
  };
  return colors[status] || 'gray';
};

const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pendente',
    preparing: 'Em Preparo',
    ready: 'Pronto',
    delivered: 'Entregue',
    canceled: 'Cancelado'
  };
  return labels[status] || status;
};

export default KitchenView;
