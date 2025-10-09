// src/pages/WaiterView.js - Vista do Garçom (Mobile-Optimized com Algoritmos Inteligentes)
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
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  List,
  ListItem,
  Flex,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import {
  FiRefreshCw,
  FiShoppingBag,
  FiClock,
  FiCheck,
  FiAlertCircle,
  FiUser,
  FiLogOut,
  FiBell,
  FiFilter
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';
import SmartNotifications from '../components/SmartNotifications';

const WaiterView = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { socket } = useSocket();

  // States
  const [tables, setTables] = useState([]);
  const [forgottenTables, setForgottenTables] = useState([]);
  const [waiterCalls, setWaiterCalls] = useState([]); // Chamadas de garçom pendentes
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedCall, setSelectedCall] = useState(null); // Chamada selecionada
  const [user, setUser] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isMobile, setIsMobile] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isCallModalOpen, onOpen: onCallModalOpen, onClose: onCallModalClose } = useDisclosure();

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Verificar autenticação
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    if (!token || userData.role !== 'waiter') {
      toast({
        title: 'Acesso Negado',
        description: 'Esta página é apenas para garçons',
        status: 'error',
        duration: 3000
      });
      navigate('/login');
      return;
    }

    setUser(userData);
    loadData();

    // WebSocket - entrar na sala de garçons
    if (socket) {
      socket.emit('joinWaitersRoom');

      // Escutar novos pedidos
      socket.on('newOrder', (data) => {
        console.log('[Waiter] Novo pedido:', data);
        toast({
          title: '🔔 Novo Pedido!',
          description: `Mesa ${data.tableId?.number || 'N/A'} - ${data.item?.product?.name}`,
          status: 'info',
          duration: 4000,
          isClosable: true,
          position: 'top'
        });
        loadData();
      });

      // Escutar quando item fica pronto
      socket.on('itemStatusChanged', (data) => {
        if (data.status === 'ready') {
          console.log('[Waiter] Item pronto:', data);
          toast({
            title: '✅ Item Pronto!',
            description: `Mesa ${data.tableId?.number || 'N/A'} - Item pronto para entrega`,
            status: 'success',
            duration: 5000,
            isClosable: true,
            position: 'top'
          });
          loadData();
        }
      });

      // Escutar solicitações de conta
      socket.on('billRequested', (data) => {
        console.log('[Waiter] Conta solicitada:', data);
        toast({
          title: '💳 Conta Solicitada!',
          description: `Mesa ${data.tableId?.number || 'N/A'} - ${data.customer?.name}`,
          status: 'warning',
          duration: 6000,
          isClosable: true,
          position: 'top'
        });
        loadData();
      });

      // Escutar chamadas de garçom
      socket.on('waiterCalled', (data) => {
        console.log('[Waiter] Garçom chamado:', data);
        toast({
          title: '🔔 Cliente Chamando!',
          description: `Mesa ${data.tableId?.number || 'N/A'} - ${data.customer?.name}`,
          status: 'info',
          duration: 8000,
          isClosable: true,
          position: 'top',
          variant: 'left-accent'
        });
        loadData(); // Recarrega mesas e chamadas
      });
    }

    // Atualizar mesas esquecidas a cada 2 minutos
    const interval = setInterval(() => {
      loadForgottenTables();
    }, 2 * 60 * 1000);

    return () => {
      if (socket) {
        socket.off('newOrder');
        socket.off('itemStatusChanged');
        socket.off('billRequested');
        socket.off('waiterCalled');
      }
      clearInterval(interval);
    };
  }, [socket]);

  const loadData = async () => {
    await Promise.all([loadMyTables(), loadForgottenTables(), loadWaiterCalls()]);
  };

  const loadMyTables = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tables');

      // CORRIGIDO: Mostrar TODAS as mesas (garçom pode assumir mesas livres)
      const allTables = response.data.tables;

      setTables(allTables);
    } catch (error) {
      console.error('Erro ao carregar mesas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as mesas',
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const loadForgottenTables = async () => {
    try {
      const response = await api.get('/intelligence/forgotten-tables');
      setForgottenTables(response.data.tables || []);

      // Notificar se houver mesas esquecidas
      if (response.data.tables && response.data.tables.length > 0) {
        response.data.tables.forEach(forgotten => {
          if (forgotten.waiter?._id === user?.id || forgotten.waiter === user?.id) {
            toast({
              title: '⚠️ Mesa Esquecida!',
              description: `Mesa ${forgotten.table.number} há ${forgotten.openDuration}min sem atividade`,
              status: 'warning',
              duration: 8000,
              isClosable: true,
              position: 'top-right'
            });
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar mesas esquecidas:', error);
    }
  };

  const loadWaiterCalls = async () => {
    try {
      // Buscar todas as chamadas pendentes (para todos os garçons)
      const response = await api.get('/waiter-calls?status=pending');
      setWaiterCalls(response.data.calls || []);
    } catch (error) {
      console.error('Erro ao carregar chamadas de garçom:', error);
    }
  };

  const handleTableClick = (table) => {
    setSelectedTable(table);
    onOpen();
  };

  const handleMarkAsDelivered = async (itemId) => {
    try {
      await api.put(`/orders/items/${itemId}/deliver`);
      toast({
        title: 'Item entregue!',
        description: 'Item marcado como entregue com sucesso',
        status: 'success',
        duration: 2000
      });
      loadData();
      if (selectedTable) {
        const response = await api.get(`/tables/${selectedTable._id}`);
        setSelectedTable(response.data.table);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao marcar item',
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleAssignTable = async (tableId) => {
    try {
      await api.patch(`/tables/${tableId}/assign-waiter`, { waiterId: user.id });
      toast({
        title: 'Mesa assumida!',
        description: 'Você agora é responsável por esta mesa',
        status: 'success',
        duration: 2000
      });
      loadData();
      onClose();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao assumir mesa',
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleAttendCall = async (call) => {
    try {
      // 1. Atribuir garçom à mesa se ainda não tiver
      if (!call.table.waiter) {
        await api.patch(`/tables/${call.table._id}/assign-waiter`, { waiterId: user.id });
      }

      // 2. Marcar chamada como "attending"
      await api.put(`/waiter-calls/${call._id}/status`, {
        status: 'attending'
      });

      toast({
        title: '✅ Atendendo!',
        description: `Mesa ${call.table?.number} - Você está atendendo esta chamada`,
        status: 'success',
        duration: 3000
      });

      loadData();
      onCallModalClose();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao atender chamada',
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleResolveCall = async (call) => {
    try {
      await api.put(`/waiter-calls/${call._id}/status`, {
        status: 'resolved',
        notes: 'Atendimento concluído'
      });

      toast({
        title: '✅ Chamada Resolvida!',
        description: `Mesa ${call.table?.number} - Atendimento concluído`,
        status: 'success',
        duration: 2000
      });

      loadData();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao resolver chamada',
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
      free: 'gray',
      occupied: 'green',
      waiting_payment: 'orange',
      reserved: 'blue'
    };
    return colors[status] || 'gray';
  };

  const getStatusLabel = (status) => {
    const labels = {
      free: 'Livre',
      occupied: 'Ocupada',
      waiting_payment: 'Aguardando Pagamento',
      reserved: 'Reservada'
    };
    return labels[status] || status;
  };

  const getItemStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      preparing: 'blue',
      ready: 'purple',
      delivered: 'green',
      canceled: 'red'
    };
    return colors[status] || 'gray';
  };

  const getItemStatusLabel = (status) => {
    const labels = {
      pending: 'Pendente',
      preparing: 'Preparando',
      ready: 'Pronto',
      delivered: 'Entregue',
      canceled: 'Cancelado'
    };
    return labels[status] || status;
  };

  // Filtrar mesas
  const filteredTables = tables.filter(table => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'mine') {
      return table.waiter?._id === user?.id || table.waiter === user?.id;
    }
    if (filterStatus === 'free') return table.status === 'free';
    if (filterStatus === 'occupied') return table.status === 'occupied';
    if (filterStatus === 'payment') return table.status === 'waiting_payment';
    return true;
  });

  // Estatísticas rápidas
  const stats = {
    myTables: tables.filter(t => t.waiter?._id === user?.id || t.waiter === user?.id).length,
    freeTables: tables.filter(t => t.status === 'free').length,
    waitingPayment: tables.filter(t => t.status === 'waiting_payment').length,
    readyItems: tables.reduce((sum, t) => {
      if (t.currentOrder && (t.waiter?._id === user?.id || t.waiter === user?.id)) {
        return sum + (t.currentOrder.items?.filter(i => i.status === 'ready').length || 0);
      }
      return sum;
    }, 0)
  };

  if (loading) {
    return (
      <Center h="100vh" bg="gray.50">
        <VStack spacing={4}>
          <Spinner size="xl" color="cyan.500" thickness="4px" />
          <Text color="gray.600">Carregando suas mesas...</Text>
        </VStack>
      </Center>
    );
  }

  // UI MOBILE OTIMIZADA
  if (isMobile) {
    return (
      <Box minH="100vh" bg="gray.50" pb={20}>
        {/* Header Móvel Compacto */}
        <Box
          bg="linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)"
          color="white"
          py={3}
          px={3}
          boxShadow="md"
          position="sticky"
          top={0}
          zIndex={10}
        >
          <HStack justify="space-between" mb={2}>
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold">Garçom</Text>
              <Text fontSize="xs" opacity={0.9}>{user?.name}</Text>
            </VStack>
            <HStack spacing={2}>
              <SmartNotifications userId={user?.id} userRole={user?.role} />
              <Box position="relative">
                <IconButton
                  icon={<FiBell />}
                  onClick={onCallModalOpen}
                  size="sm"
                  variant="ghost"
                  colorScheme="whiteAlpha"
                  aria-label="Chamadas"
                />
                {waiterCalls.length > 0 && (
                  <Badge
                    position="absolute"
                    top="-1"
                    right="-1"
                    borderRadius="full"
                    bg="red.500"
                    color="white"
                    fontSize="xs"
                    minW="18px"
                    h="18px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {waiterCalls.length}
                  </Badge>
                )}
              </Box>
              <IconButton
                icon={<FiRefreshCw />}
                onClick={loadData}
                size="sm"
                variant="ghost"
                colorScheme="whiteAlpha"
                aria-label="Atualizar"
              />
              <IconButton
                icon={<FiLogOut />}
                onClick={handleLogout}
                size="sm"
                variant="ghost"
                colorScheme="whiteAlpha"
                aria-label="Sair"
              />
            </HStack>
          </HStack>

          {/* Stats Compactas */}
          <Grid templateColumns="repeat(4, 1fr)" gap={2}>
            <Box bg="whiteAlpha.300" borderRadius="md" p={2} textAlign="center">
              <Text fontSize="lg" fontWeight="bold">{stats.myTables}</Text>
              <Text fontSize="10px">Minhas</Text>
            </Box>
            <Box bg="whiteAlpha.300" borderRadius="md" p={2} textAlign="center">
              <Text fontSize="lg" fontWeight="bold">{stats.freeTables}</Text>
              <Text fontSize="10px">Livres</Text>
            </Box>
            <Box bg="whiteAlpha.300" borderRadius="md" p={2} textAlign="center">
              <Text fontSize="lg" fontWeight="bold">{stats.waitingPayment}</Text>
              <Text fontSize="10px">Pagamento</Text>
            </Box>
            <Box bg="whiteAlpha.300" borderRadius="md" p={2} textAlign="center">
              <Text fontSize="lg" fontWeight="bold">{stats.readyItems}</Text>
              <Text fontSize="10px">Prontos</Text>
            </Box>
          </Grid>
        </Box>

        {/* Alertas de Mesas Esquecidas */}
        {forgottenTables.length > 0 && (
          <Box px={3} py={2}>
            <Alert status="warning" borderRadius="md" fontSize="sm">
              <AlertIcon />
              <Box flex="1">
                <AlertTitle fontSize="sm">Atenção!</AlertTitle>
                <AlertDescription fontSize="xs">
                  {forgottenTables.length} mesa(s) sem atividade há muito tempo
                </AlertDescription>
              </Box>
            </Alert>
          </Box>
        )}

        {/* Filtros Móveis */}
        <Box px={3} py={2} overflowX="auto">
          <Flex gap={2} flexWrap="nowrap">
            <Button
              size="sm"
              colorScheme={filterStatus === 'all' ? 'cyan' : 'gray'}
              variant={filterStatus === 'all' ? 'solid' : 'outline'}
              onClick={() => setFilterStatus('all')}
              flexShrink={0}
            >
              Todas
            </Button>
            <Button
              size="sm"
              colorScheme={filterStatus === 'mine' ? 'cyan' : 'gray'}
              variant={filterStatus === 'mine' ? 'solid' : 'outline'}
              onClick={() => setFilterStatus('mine')}
              flexShrink={0}
            >
              Minhas
            </Button>
            <Button
              size="sm"
              colorScheme={filterStatus === 'free' ? 'cyan' : 'gray'}
              variant={filterStatus === 'free' ? 'solid' : 'outline'}
              onClick={() => setFilterStatus('free')}
              flexShrink={0}
            >
              Livres
            </Button>
            <Button
              size="sm"
              colorScheme={filterStatus === 'occupied' ? 'cyan' : 'gray'}
              variant={filterStatus === 'occupied' ? 'solid' : 'outline'}
              onClick={() => setFilterStatus('occupied')}
              flexShrink={0}
            >
              Ocupadas
            </Button>
          </Flex>
        </Box>

        {/* Lista de Mesas - Layout Móvel Compacto */}
        <Box px={3} pb={20}>
          <VStack spacing={3} align="stretch">
            {filteredTables.map((table) => {
              const isForgotten = forgottenTables.some(f => f.table._id === table._id);
              const isMyTable = table.waiter?._id === user?.id || table.waiter === user?.id;
              const hasPendingCall = waiterCalls.some(call => call.table?._id === table._id);

              return (
                <Card
                  key={table._id}
                  onClick={() => handleTableClick(table)}
                  cursor="pointer"
                  boxShadow="md"
                  borderLeft="4px solid"
                  borderColor={
                    hasPendingCall ? 'orange.500' :
                    isForgotten ? 'red.500' :
                    table.status === 'free' ? 'gray.300' :
                    table.status === 'waiting_payment' ? 'orange.500' :
                    'green.500'
                  }
                  bg={hasPendingCall ? 'orange.50' : isForgotten ? 'red.50' : 'white'}
                >
                  <CardBody p={3}>
                    <Flex justify="space-between" align="start">
                      <VStack align="start" spacing={1} flex={1}>
                        <HStack>
                          <Heading size="md" color={hasPendingCall ? "orange.600" : "cyan.600"}>
                            Mesa {table.number}
                          </Heading>
                          {isMyTable && (
                            <Badge colorScheme="blue" fontSize="10px">MINHA</Badge>
                          )}
                          {hasPendingCall && (
                            <Badge colorScheme="orange" fontSize="10px">🔔 CHAMANDO</Badge>
                          )}
                          {isForgotten && !hasPendingCall && (
                            <Badge colorScheme="red" fontSize="10px">⚠️</Badge>
                          )}
                        </HStack>

                        <Badge colorScheme={getStatusColor(table.status)} fontSize="xs">
                          {getStatusLabel(table.status)}
                        </Badge>

                        {hasPendingCall && (
                          <Button
                            size="xs"
                            colorScheme="orange"
                            onClick={(e) => {
                              e.stopPropagation();
                              const call = waiterCalls.find(c => c.table?._id === table._id);
                              if (call) handleAttendCall(call);
                            }}
                            mt={1}
                            leftIcon={<Icon as={FiBell} />}
                          >
                            Atender Chamada
                          </Button>
                        )}

                        {table.status === 'free' && !table.waiter && !hasPendingCall && (
                          <Button
                            size="xs"
                            colorScheme="green"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAssignTable(table._id);
                            }}
                            mt={1}
                          >
                            Assumir
                          </Button>
                        )}

                        {table.currentOrder && (
                          <VStack align="start" spacing={0.5} fontSize="xs" color="gray.600" mt={1}>
                            <Text>
                              <Icon as={FiUser} mr={1} />
                              {table.currentOrder.customer?.name || 'Cliente'}
                            </Text>
                            <Text>
                              <Icon as={FiShoppingBag} mr={1} />
                              {table.currentOrder.items?.length || 0} itens
                            </Text>
                            {table.currentOrder.items?.filter(i => i.status === 'ready').length > 0 && (
                              <Badge colorScheme="purple" fontSize="10px" mt={1}>
                                ✅ {table.currentOrder.items.filter(i => i.status === 'ready').length} pronto(s)
                              </Badge>
                            )}
                          </VStack>
                        )}
                      </VStack>

                      {table.currentOrder && (
                        <VStack align="end" spacing={0}>
                          <Text fontSize="lg" fontWeight="bold" color="cyan.600">
                            R$ {table.currentOrder.total?.toFixed(2) || '0.00'}
                          </Text>
                          {isForgotten && (
                            <Text fontSize="10px" color="red.600" fontWeight="bold">
                              {forgottenTables.find(f => f.table._id === table._id)?.openDuration}min
                            </Text>
                          )}
                        </VStack>
                      )}
                    </Flex>
                  </CardBody>
                </Card>
              );
            })}
          </VStack>

          {filteredTables.length === 0 && (
            <Center py={20}>
              <VStack spacing={3}>
                <Icon as={FiAlertCircle} boxSize={12} color="gray.400" />
                <Text color="gray.600">Nenhuma mesa encontrada</Text>
              </VStack>
            </Center>
          )}
        </Box>

        {/* Modal de Detalhes - Mobile Otimizado */}
        <Modal isOpen={isOpen} onClose={onClose} size="full">
          <ModalOverlay />
          <ModalContent m={0} borderRadius={0}>
            <ModalHeader bg="cyan.500" color="white">
              Mesa {selectedTable?.number}
              <Badge ml={3} colorScheme={getStatusColor(selectedTable?.status)}>
                {getStatusLabel(selectedTable?.status)}
              </Badge>
            </ModalHeader>
            <ModalCloseButton color="white" />

            <ModalBody p={3}>
              {selectedTable?.currentOrder ? (
                <VStack align="stretch" spacing={3}>
                  {/* Info do Cliente */}
                  <Box p={3} bg="cyan.50" borderRadius="md">
                    <Text fontSize="xs" color="gray.600" mb={1}>Cliente</Text>
                    <Text fontSize="md" fontWeight="bold">{selectedTable.currentOrder.customer?.name}</Text>
                    <Text fontSize="xs" color="gray.600">CPF: {selectedTable.currentOrder.customer?.cpf}</Text>
                  </Box>

                  {/* Lista de Itens */}
                  <Box>
                    <Heading size="sm" mb={2}>Itens ({selectedTable.currentOrder.items?.length || 0})</Heading>
                    <VStack spacing={2} align="stretch">
                      {selectedTable.currentOrder.items?.map((item) => (
                        <Box
                          key={item._id}
                          p={3}
                          bg="white"
                          borderRadius="md"
                          borderLeft="4px solid"
                          borderColor={`${getItemStatusColor(item.status)}.500`}
                          boxShadow="sm"
                        >
                          <Flex justify="space-between" align="start">
                            <VStack align="start" flex={1} spacing={1}>
                              <Text fontWeight="bold" fontSize="sm">
                                {item.quantity}x {item.product?.name}
                              </Text>
                              <Badge colorScheme={getItemStatusColor(item.status)} fontSize="10px">
                                {getItemStatusLabel(item.status)}
                              </Badge>
                              {item.notes && (
                                <Text fontSize="10px" color="gray.600" fontStyle="italic">
                                  Obs: {item.notes}
                                </Text>
                              )}
                            </VStack>
                            <VStack align="end" spacing={1}>
                              <Text fontSize="sm" fontWeight="bold">
                                R$ {(item.quantity * item.unitPrice).toFixed(2)}
                              </Text>
                              {item.status === 'ready' && (
                                <Button
                                  size="xs"
                                  colorScheme="green"
                                  leftIcon={<FiCheck />}
                                  onClick={() => handleMarkAsDelivered(item._id)}
                                >
                                  Entregar
                                </Button>
                              )}
                            </VStack>
                          </Flex>
                        </Box>
                      ))}
                    </VStack>
                  </Box>

                  {/* Total */}
                  <Box p={3} bg="gray.100" borderRadius="md">
                    <Flex justify="space-between" align="center">
                      <Text fontSize="md" fontWeight="bold">Total:</Text>
                      <Text fontSize="xl" fontWeight="bold" color="cyan.600">
                        R$ {selectedTable.currentOrder.total?.toFixed(2) || '0.00'}
                      </Text>
                    </Flex>
                  </Box>
                </VStack>
              ) : (
                <Center py={10}>
                  <Text color="gray.500">Nenhum pedido ativo</Text>
                </Center>
              )}
            </ModalBody>

            <ModalFooter>
              <Button onClick={onClose} w="full" colorScheme="cyan">Fechar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    );
  }

  // UI DESKTOP (código original mantido...)
  return (
    <Box minH="100vh" bg="gray.50" pb={20}>
      {/* Header Desktop */}
      <Box
        bg="linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)"
        color="white"
        py={6}
        px={4}
        boxShadow="md"
      >
        <Container maxW="container.xl">
          <HStack justify="space-between" mb={4}>
            <VStack align="start" spacing={1}>
              <Heading size="lg">Minhas Mesas</Heading>
              <HStack>
                <Icon as={FiUser} />
                <Text fontSize="sm">{user?.name}</Text>
              </HStack>
            </VStack>
            <HStack spacing={3}>
              <SmartNotifications userId={user?.id} userRole={user?.role} />
              <Box position="relative">
                <IconButton
                  icon={<FiBell />}
                  onClick={onCallModalOpen}
                  colorScheme="whiteAlpha"
                  variant="ghost"
                  aria-label="Chamadas"
                  size="lg"
                />
                {waiterCalls.length > 0 && (
                  <Badge
                    position="absolute"
                    top="-1"
                    right="-1"
                    borderRadius="full"
                    bg="red.500"
                    color="white"
                    fontSize="sm"
                    minW="24px"
                    h="24px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {waiterCalls.length}
                  </Badge>
                )}
              </Box>
              <IconButton
                icon={<FiRefreshCw />}
                onClick={loadData}
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
              />
            </HStack>
          </HStack>

          {/* Stats Desktop */}
          <Grid templateColumns="repeat(4, 1fr)" gap={4}>
            <Box bg="whiteAlpha.300" borderRadius="md" p={3}>
              <Text fontSize="2xl" fontWeight="bold">{stats.myTables}</Text>
              <Text fontSize="sm">Minhas Mesas</Text>
            </Box>
            <Box bg="whiteAlpha.300" borderRadius="md" p={3}>
              <Text fontSize="2xl" fontWeight="bold">{stats.freeTables}</Text>
              <Text fontSize="sm">Mesas Livres</Text>
            </Box>
            <Box bg="whiteAlpha.300" borderRadius="md" p={3}>
              <Text fontSize="2xl" fontWeight="bold">{stats.waitingPayment}</Text>
              <Text fontSize="sm">Aguardando Pag.</Text>
            </Box>
            <Box bg="whiteAlpha.300" borderRadius="md" p={3}>
              <Text fontSize="2xl" fontWeight="bold">{stats.readyItems}</Text>
              <Text fontSize="sm">Itens Prontos</Text>
            </Box>
          </Grid>
        </Container>
      </Box>

      <Container maxW="container.xl" py={6}>
        {/* Alertas Desktop */}
        {forgottenTables.length > 0 && (
          <Alert status="warning" borderRadius="md" mb={4}>
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Mesas Esquecidas!</AlertTitle>
              <AlertDescription>
                {forgottenTables.length} mesa(s) sem atividade há muito tempo
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Filtros Desktop */}
        <Wrap spacing={3} mb={6}>
          <WrapItem>
            <Button
              leftIcon={<FiFilter />}
              colorScheme={filterStatus === 'all' ? 'cyan' : 'gray'}
              variant={filterStatus === 'all' ? 'solid' : 'outline'}
              onClick={() => setFilterStatus('all')}
            >
              Todas ({tables.length})
            </Button>
          </WrapItem>
          <WrapItem>
            <Button
              colorScheme={filterStatus === 'mine' ? 'cyan' : 'gray'}
              variant={filterStatus === 'mine' ? 'solid' : 'outline'}
              onClick={() => setFilterStatus('mine')}
            >
              Minhas ({stats.myTables})
            </Button>
          </WrapItem>
          <WrapItem>
            <Button
              colorScheme={filterStatus === 'free' ? 'cyan' : 'gray'}
              variant={filterStatus === 'free' ? 'solid' : 'outline'}
              onClick={() => setFilterStatus('free')}
            >
              Livres ({stats.freeTables})
            </Button>
          </WrapItem>
          <WrapItem>
            <Button
              colorScheme={filterStatus === 'occupied' ? 'cyan' : 'gray'}
              variant={filterStatus === 'occupied' ? 'solid' : 'outline'}
              onClick={() => setFilterStatus('occupied')}
            >
              Ocupadas
            </Button>
          </WrapItem>
          <WrapItem>
            <Button
              colorScheme={filterStatus === 'payment' ? 'cyan' : 'gray'}
              variant={filterStatus === 'payment' ? 'solid' : 'outline'}
              onClick={() => setFilterStatus('payment')}
            >
              Aguardando Pag. ({stats.waitingPayment})
            </Button>
          </WrapItem>
        </Wrap>

        {/* Grid de Mesas Desktop */}
        {filteredTables.length === 0 ? (
          <Center h="400px">
            <VStack spacing={4}>
              <Icon as={FiAlertCircle} boxSize={16} color="gray.400" />
              <Text color="gray.600" fontSize="lg">
                Nenhuma mesa encontrada
              </Text>
            </VStack>
          </Center>
        ) : (
          <Grid
            templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
            gap={6}
          >
            {filteredTables.map((table) => {
              const isForgotten = forgottenTables.some(f => f.table._id === table._id);
              const isMyTable = table.waiter?._id === user?.id || table.waiter === user?.id;
              const hasPendingCall = waiterCalls.some(call => call.table?._id === table._id);

              return (
                <Card
                  key={table._id}
                  cursor="pointer"
                  onClick={() => handleTableClick(table)}
                  _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
                  transition="all 0.3s"
                  boxShadow="lg"
                  borderTop="4px solid"
                  borderColor={
                    hasPendingCall ? 'orange.500' :
                    isForgotten ? 'red.500' :
                    table.status === 'free' ? 'gray.300' :
                    table.status === 'waiting_payment' ? 'orange.500' :
                    'green.500'
                  }
                  bg={hasPendingCall ? 'orange.50' : isForgotten ? 'red.50' : 'white'}
                >
                  <CardBody>
                    {hasPendingCall && (
                      <Badge
                        position="absolute"
                        top={2}
                        right={2}
                        colorScheme="orange"
                        fontSize="xs"
                        px={2}
                        py={1}
                        borderRadius="full"
                      >
                        🔔 CHAMANDO
                      </Badge>
                    )}
                    {isForgotten && !hasPendingCall && (
                      <Badge
                        position="absolute"
                        top={2}
                        right={2}
                        colorScheme="red"
                        fontSize="xs"
                        px={2}
                        py={1}
                        borderRadius="full"
                      >
                        ⚠️ {forgottenTables.find(f => f.table._id === table._id)?.openDuration}min
                      </Badge>
                    )}

                    <VStack align="start" spacing={3}>
                      <HStack justify="space-between" w="full">
                        <Heading size="md" color={hasPendingCall ? "orange.600" : "cyan.600"}>
                          Mesa {table.number}
                        </Heading>
                        <VStack spacing={1} align="end">
                          <Badge colorScheme={getStatusColor(table.status)} fontSize="sm">
                            {getStatusLabel(table.status)}
                          </Badge>
                          {isMyTable && (
                            <Badge colorScheme="blue" fontSize="xs">MINHA</Badge>
                          )}
                        </VStack>
                      </HStack>

                      {/* Chamada pendente - botão para atender */}
                      {hasPendingCall && (
                        <Button
                          size="sm"
                          colorScheme="orange"
                          leftIcon={<Icon as={FiBell} />}
                          width="full"
                          onClick={(e) => {
                            e.stopPropagation();
                            const call = waiterCalls.find(c => c.table?._id === table._id);
                            if (call) handleAttendCall(call);
                          }}
                        >
                          Atender Chamada
                        </Button>
                      )}

                      {/* Mesa livre - botão para assumir */}
                      {table.status === 'free' && !table.waiter && !hasPendingCall && (
                        <Button
                          size="sm"
                          colorScheme="green"
                          w="full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignTable(table._id);
                          }}
                        >
                          Assumir Mesa
                        </Button>
                      )}

                      {table.currentOrder && (
                        <>
                          <Divider />
                          <VStack align="start" spacing={2} w="full">
                            <HStack>
                              <Icon as={FiUser} color="gray.500" />
                              <Text fontSize="sm" color="gray.700">
                                {table.currentOrder.customer?.name || 'Cliente'}
                              </Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiShoppingBag} color="gray.500" />
                              <Text fontSize="sm" color="gray.700">
                                {table.currentOrder.items?.length || 0} itens
                              </Text>
                            </HStack>
                            <HStack justify="space-between" w="full">
                              <Text fontSize="sm" color="gray.600">Total:</Text>
                              <Text fontSize="lg" fontWeight="bold" color="cyan.600">
                                R$ {table.currentOrder.total?.toFixed(2) || '0.00'}
                              </Text>
                            </HStack>

                            {/* Contador de itens prontos */}
                            {table.currentOrder.items?.filter(item => item.status === 'ready').length > 0 && (
                              <Badge colorScheme="purple" fontSize="sm" w="full" textAlign="center" py={1}>
                                ✅ {table.currentOrder.items.filter(item => item.status === 'ready').length} item(s) pronto(s)
                              </Badge>
                            )}
                          </VStack>
                        </>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              );
            })}
          </Grid>
        )}
      </Container>

      {/* Modal de Chamadas de Garçom */}
      <Modal isOpen={isCallModalOpen} onClose={onCallModalClose} size="lg" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Icon as={FiBell} color="cyan.500" />
              <Text>Chamadas de Clientes</Text>
              {waiterCalls.length > 0 && (
                <Badge colorScheme="red" borderRadius="full">{waiterCalls.length}</Badge>
              )}
            </HStack>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            {waiterCalls.length === 0 ? (
              <Center py={10}>
                <VStack spacing={3}>
                  <Icon as={FiCheck} fontSize="4xl" color="green.500" />
                  <Text color="gray.500" fontSize="lg">Sem chamadas pendentes!</Text>
                  <Text color="gray.400" fontSize="sm">Você está em dia 👍</Text>
                </VStack>
              </Center>
            ) : (
              <VStack spacing={3} align="stretch">
                {waiterCalls.map((call) => (
                  <Card
                    key={call._id}
                    borderLeft="4px solid"
                    borderColor="orange.500"
                    bg="orange.50"
                  >
                    <CardBody>
                      <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between">
                          <VStack align="start" spacing={0}>
                            <Heading size="md" color="orange.600">
                              Mesa {call.table?.number}
                            </Heading>
                            <Text fontSize="sm" color="gray.600">
                              {call.customer?.name}
                            </Text>
                          </VStack>
                          <Badge colorScheme="orange" fontSize="sm">
                            {call.reason === 'assistance' && '🤝 Assistência'}
                            {call.reason === 'order' && '📋 Pedido'}
                            {call.reason === 'bill' && '💳 Conta'}
                            {call.reason === 'complaint' && '⚠️ Reclamação'}
                            {call.reason === 'question' && '❓ Dúvida'}
                            {call.reason === 'other' && '📌 Outro'}
                          </Badge>
                        </HStack>

                        {call.customReason && (
                          <Text fontSize="sm" color="gray.700" fontStyle="italic">
                            "{call.customReason}"
                          </Text>
                        )}

                        <HStack fontSize="xs" color="gray.500">
                          <Icon as={FiClock} />
                          <Text>
                            Há {Math.floor((Date.now() - new Date(call.createdAt).getTime()) / 60000)} min
                          </Text>
                        </HStack>

                        <Divider />

                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            colorScheme="green"
                            leftIcon={<FiCheck />}
                            onClick={() => handleAttendCall(call)}
                            flex={1}
                          >
                            Atender Agora
                          </Button>
                          {call.waiter?._id === user?.id && (
                            <Button
                              size="sm"
                              colorScheme="blue"
                              onClick={() => handleResolveCall(call)}
                            >
                              Resolver
                            </Button>
                          )}
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button onClick={onCallModalClose}>Fechar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Desktop (mesmo código anterior) */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Mesa {selectedTable?.number}
            <Badge ml={3} colorScheme={getStatusColor(selectedTable?.status)}>
              {getStatusLabel(selectedTable?.status)}
            </Badge>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            {selectedTable?.currentOrder ? (
              <VStack align="stretch" spacing={4}>
                <Box p={4} bg="cyan.50" borderRadius="md">
                  <Text fontSize="sm" color="gray.600" mb={1}>Cliente</Text>
                  <Text fontSize="lg" fontWeight="bold">{selectedTable.currentOrder.customer?.name}</Text>
                  <Text fontSize="sm" color="gray.600">CPF: {selectedTable.currentOrder.customer?.cpf}</Text>
                </Box>

                <Box>
                  <Heading size="sm" mb={3}>Itens do Pedido</Heading>
                  <List spacing={3}>
                    {selectedTable.currentOrder.items?.map((item) => (
                      <ListItem key={item._id}>
                        <HStack
                          p={3}
                          bg="white"
                          borderRadius="md"
                          borderLeft="4px solid"
                          borderColor={`${getItemStatusColor(item.status)}.500`}
                          justify="space-between"
                          align="start"
                        >
                          <VStack align="start" flex={1} spacing={1}>
                            <Text fontWeight="bold">{item.quantity}x {item.product?.name}</Text>
                            <Badge colorScheme={getItemStatusColor(item.status)} fontSize="xs">
                              {getItemStatusLabel(item.status)}
                            </Badge>
                            {item.notes && (
                              <Text fontSize="xs" color="gray.600" fontStyle="italic">
                                Obs: {item.notes}
                              </Text>
                            )}
                          </VStack>
                          <VStack align="end" spacing={2}>
                            <Text fontSize="sm" fontWeight="bold">
                              R$ {(item.quantity * item.unitPrice).toFixed(2)}
                            </Text>
                            {item.status === 'ready' && (
                              <Button
                                size="sm"
                                colorScheme="green"
                                leftIcon={<FiCheck />}
                                onClick={() => handleMarkAsDelivered(item._id)}
                              >
                                Entregar
                              </Button>
                            )}
                          </VStack>
                        </HStack>
                      </ListItem>
                    ))}
                  </List>
                </Box>

                <Divider />
                <HStack justify="space-between" p={4} bg="gray.50" borderRadius="md">
                  <Text fontSize="lg" fontWeight="bold">Total:</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="cyan.600">
                    R$ {selectedTable.currentOrder.total?.toFixed(2) || '0.00'}
                  </Text>
                </HStack>
              </VStack>
            ) : (
              <Center py={10}>
                <Text color="gray.500">Nenhum pedido ativo</Text>
              </Center>
            )}
          </ModalBody>

          <ModalFooter>
            <Button onClick={onClose}>Fechar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default WaiterView;
