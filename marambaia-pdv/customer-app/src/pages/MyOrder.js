// pages/MyOrder.js - Enhanced with World-Class UI/UX
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, VStack, HStack, Heading, Text, Button, Divider,
  IconButton, Alert, AlertIcon, useToast, Flex, Badge, ScaleFade, Skeleton, SkeletonText
} from '@chakra-ui/react';
import { ArrowBackIcon, DeleteIcon, AddIcon, CheckCircleIcon } from '@chakra-ui/icons';
import { publicAPI } from '../services/api';
import { useSocket } from '../contexts/SocketContext';

const MyOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { joinOrderRoom, leaveOrderRoom, onOrderUpdate, onItemStatusChange } = useSocket();

  // Move useColorModeValue to top level (before any conditions)
  const bgGradient = 'linear(to-br, brand.50, tropical.50)';

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [requestingBill, setRequestingBill] = useState(false);
  const [callingWaiter, setCallingWaiter] = useState(false);

  useEffect(() => {
    loadOrder();

    // Join order room for real-time updates
    if (orderId) {
      joinOrderRoom(orderId);
    }

    // Listen for order updates
    const unsubscribeOrderUpdate = onOrderUpdate?.((data) => {
      console.log('[MyOrder] Order update received:', data);
      loadOrder(); // Reload order when updated
    });

    // Listen for item status changes
    const unsubscribeItemStatus = onItemStatusChange?.((data) => {
      console.log('[MyOrder] Item status changed:', data);

      // Show notification based on status
      const statusMessages = {
        preparing: { title: 'Em preparo!', description: 'Seu item está sendo preparado.', status: 'info' },
        ready: { title: 'Pedido pronto!', description: 'Seu item está pronto para ser servido.', status: 'success' },
        delivered: { title: 'Entregue!', description: 'Seu item foi entregue na mesa.', status: 'success' }
      };

      const message = statusMessages[data.status];
      if (message) {
        toast({
          title: message.title,
          description: message.description,
          status: message.status,
          duration: 4000,
          position: 'top',
          isClosable: true
        });
      }

      loadOrder(); // Reload order to show updated status
    });

    // Cleanup
    return () => {
      if (orderId) {
        leaveOrderRoom(orderId);
      }
      if (unsubscribeOrderUpdate) {
        unsubscribeOrderUpdate();
      }
      if (unsubscribeItemStatus) {
        unsubscribeItemStatus();
      }
    };
    // eslint-disable-next-line
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await publicAPI.getOrder(orderId);
      setOrder(response.data.order);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar pedido:', err);
      toast({
        title: 'Erro ao carregar pedido',
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await publicAPI.removeItem(orderId, itemId);
      toast({
        title: 'Item removido',
        status: 'success',
        duration: 2000
      });
      loadOrder();
    } catch (err) {
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Não foi possível remover o item',
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleRequestBill = async () => {
    try {
      setRequestingBill(true);
      await publicAPI.requestBill(orderId);
      toast({
        title: 'Conta solicitada!',
        description: 'Um garçom virá atendê-lo em breve.',
        status: 'success',
        duration: 5000,
        position: 'top',
      });
      loadOrder();
      setRequestingBill(false);
    } catch (err) {
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Erro ao solicitar conta',
        status: 'error',
        duration: 3000
      });
      setRequestingBill(false);
    }
  };

  const handleCallWaiter = async () => {
    try {
      setCallingWaiter(true);
      await publicAPI.callWaiter(orderId, { reason: 'assistance' });
      toast({
        title: '🔔 Garçom chamado!',
        description: 'O garçom foi notificado e virá atendê-lo em breve.',
        status: 'success',
        duration: 5000,
        position: 'top',
        isClosable: true
      });
      setCallingWaiter(false);
    } catch (err) {
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Erro ao chamar garçom',
        status: 'error',
        duration: 3000
      });
      setCallingWaiter(false);
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bgGradient={bgGradient} pb={8}>
        <Container maxW="container.sm" py={6}>
          <VStack spacing={6} align="stretch">
            {/* Header Skeleton */}
            <Skeleton height="120px" borderRadius="xl" startColor="brand.100" endColor="brand.200" />

            {/* Order Items Skeleton */}
            <Box bg="white" p={6} borderRadius="2xl" boxShadow="xl">
              <VStack align="stretch" spacing={5} divider={<Divider />}>
                {[...Array(3)].map((_, i) => (
                  <HStack key={i} justify="space-between" align="start" spacing={4}>
                    <VStack align="start" flex={1} spacing={2}>
                      <Skeleton height="24px" width="60%" />
                      <HStack spacing={3}>
                        <Skeleton height="24px" width="40px" borderRadius="md" />
                        <Skeleton height="20px" width="80px" />
                      </HStack>
                      <Skeleton height="28px" width="100px" borderRadius="full" />
                    </VStack>
                    <VStack align="end" spacing={2}>
                      <Skeleton height="28px" width="100px" />
                      <Skeleton height="32px" width="32px" borderRadius="full" />
                    </VStack>
                  </HStack>
                ))}
              </VStack>

              {/* Total Skeleton */}
              <Box mt={6} pt={6}>
                <Flex justify="space-between" align="center">
                  <VStack align="start" spacing={1}>
                    <Skeleton height="16px" width="100px" />
                    <Skeleton height="32px" width="140px" />
                  </VStack>
                  <Skeleton height="40px" width="40px" borderRadius="full" />
                </Flex>
              </Box>
            </Box>

            {/* Button Skeletons */}
            <VStack spacing={4}>
              <Skeleton height="60px" width="100%" borderRadius="full" />
              <Skeleton height="60px" width="100%" borderRadius="full" />
            </VStack>
          </VStack>
        </Container>
      </Box>
    );
  }

  const total = order?.total || 0;
  const isEmpty = !order?.items || order.items.length === 0;

  return (
    <Box minH="100vh" bgGradient={bgGradient} pb={8}>
      <Container maxW="container.sm" py={6}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <ScaleFade initialScale={0.9} in={true}>
            <Flex
              align="center"
              gap={4}
              bg="white"
              p={4}
              borderRadius="xl"
              boxShadow="lg"
            >
              <IconButton
                icon={<ArrowBackIcon />}
                onClick={() => navigate(`/menu/${orderId}`)}
                aria-label="Voltar"
                borderRadius="full"
                size="lg"
                colorScheme="brand"
                variant="ghost"
              />
              <Box flex={1}>
                <Heading size="lg" color="brand.600">Meu Pedido</Heading>
                <HStack mt={1}>
                  <Badge colorScheme="brand" fontSize="md" px={3} py={1} borderRadius="full">
                    Mesa {order?.table?.number}
                  </Badge>
                  <Badge colorScheme="purple" fontSize="md" px={3} py={1} borderRadius="full">
                    {order?.items?.length || 0} {order?.items?.length === 1 ? 'item' : 'itens'}
                  </Badge>
                </HStack>
              </Box>
            </Flex>
          </ScaleFade>

          {isEmpty ? (
            <ScaleFade initialScale={0.9} in={true} delay={0.1}>
              <Box
                bg="white"
                borderRadius="3xl"
                boxShadow="2xl"
                p={8}
                textAlign="center"
              >
                <VStack spacing={5} w="full">
                  {/* Empty State Illustration */}
                  <Box
                    w="120px"
                    h="120px"
                    borderRadius="full"
                    bg="brand.100"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    mb={2}
                  >
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#0891B2' }}>
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                  </Box>

                  <Heading size="lg" color="brand.600">
                    Seu carrinho está vazio
                  </Heading>

                  <Text fontSize="md" color="gray.600" maxW="300px" lineHeight="1.6">
                    Explore nosso delicioso cardápio e adicione seus pratos favoritos!
                  </Text>

                  <Button
                    colorScheme="brand"
                    leftIcon={<AddIcon />}
                    onClick={() => navigate(`/menu/${orderId}`)}
                    mt={4}
                    size="lg"
                    minH="56px"
                    px={8}
                    borderRadius="full"
                    fontSize="lg"
                    fontWeight="600"
                    boxShadow="lg"
                    _hover={{
                      transform: 'translateY(-2px)',
                      boxShadow: 'xl',
                    }}
                    transition="all 0.2s"
                  >
                    Ver Cardápio
                  </Button>
                </VStack>
              </Box>
            </ScaleFade>
          ) : (
            <>
              {/* Order Items */}
              <ScaleFade initialScale={0.9} in={true} delay={0.1}>
                <Box bg="white" p={6} borderRadius="2xl" boxShadow="xl">
                  <VStack align="stretch" spacing={5} divider={<Divider />}>
                    {order.items.map((item, index) => (
                      <ScaleFade key={item._id} initialScale={0.9} in={true} delay={index * 0.05}>
                        <HStack justify="space-between" align="start" spacing={4} py={2}>
                          <VStack align="start" flex={1} spacing={3}>
                            <Text fontWeight="bold" fontSize="lg" color="gray.800" lineHeight="1.3">
                              {item.product?.name}
                            </Text>
                            <HStack spacing={3} flexWrap="wrap">
                              <Badge
                                colorScheme="brand"
                                fontSize="md"
                                px={3}
                                py={1}
                                borderRadius="full"
                                fontWeight="600"
                              >
                                {item.quantity}x
                              </Badge>
                              <Text fontSize="md" color="gray.600" fontWeight="500">
                                R$ {item.unitPrice?.toFixed(2)} cada
                              </Text>
                            </HStack>
                            <Badge
                              colorScheme={getStatusColor(item.status)}
                              fontSize="sm"
                              px={3}
                              py={1.5}
                              borderRadius="full"
                              textTransform="uppercase"
                              letterSpacing="wide"
                              fontWeight="600"
                            >
                              {getStatusLabel(item.status)}
                            </Badge>
                          </VStack>

                          <VStack align="end" spacing={3}>
                            <Text fontWeight="bold" fontSize="2xl" color="brand.600" lineHeight="1">
                              R$ {(item.quantity * item.unitPrice).toFixed(2)}
                            </Text>
                            {item.status === 'pending' && (
                              <IconButton
                                icon={<DeleteIcon />}
                                size="md"
                                minW="44px"
                                minH="44px"
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => handleRemoveItem(item._id)}
                                aria-label="Remover item"
                                borderRadius="full"
                                _hover={{
                                  transform: 'scale(1.1)',
                                  bg: 'red.50',
                                }}
                                transition="all 0.2s"
                              />
                            )}
                          </VStack>
                        </HStack>
                      </ScaleFade>
                    ))}
                  </VStack>

                  {/* Total */}
                  <Box
                    mt={6}
                    pt={6}
                    borderTop="3px solid"
                    borderColor="brand.100"
                    bg="linear-gradient(135deg, #E6F7FF 0%, #F0FDF9 100%)"
                    mx={-6}
                    px={6}
                    py={6}
                    borderBottomRadius="2xl"
                  >
                    <Flex justify="space-between" align="center">
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm" color="gray.600" fontWeight="600" textTransform="uppercase" letterSpacing="wide">
                          Total do Pedido
                        </Text>
                        <Heading size="2xl" color="brand.600" lineHeight="1">
                          R$ {total.toFixed(2)}
                        </Heading>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                        </Text>
                      </VStack>
                      <Box
                        bg="green.500"
                        p={3}
                        borderRadius="full"
                        boxShadow="0 4px 12px rgba(34, 197, 94, 0.3)"
                      >
                        <CheckCircleIcon boxSize={8} color="white" />
                      </Box>
                    </Flex>
                  </Box>
                </Box>
              </ScaleFade>

              {/* Action Buttons */}
              <ScaleFade initialScale={0.9} in={true} delay={0.2}>
                <VStack spacing={4}>
                  <Button
                    leftIcon={<AddIcon />}
                    colorScheme="brand"
                    size="lg"
                    width="full"
                    onClick={() => navigate(`/menu/${orderId}`)}
                    borderRadius="full"
                    boxShadow="lg"
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                    transition="all 0.2s"
                    minH="60px"
                    fontSize="lg"
                    fontWeight="600"
                  >
                    Adicionar Mais Itens
                  </Button>

                  <Button
                    colorScheme="purple"
                    size="lg"
                    width="full"
                    onClick={handleCallWaiter}
                    isLoading={callingWaiter}
                    loadingText="Chamando..."
                    borderRadius="full"
                    boxShadow="lg"
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                    transition="all 0.2s"
                    minH="60px"
                    fontSize="lg"
                    fontWeight="600"
                  >
                    🔔 Chamar Garçom
                  </Button>

                  <Button
                    leftIcon={<CheckCircleIcon />}
                    colorScheme="green"
                    size="lg"
                    width="full"
                    onClick={handleRequestBill}
                    isLoading={requestingBill}
                    loadingText="Solicitando..."
                    borderRadius="full"
                    boxShadow="lg"
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                    transition="all 0.2s"
                    minH="60px"
                    fontSize="lg"
                    fontWeight="600"
                  >
                    Solicitar Conta
                  </Button>
                </VStack>
              </ScaleFade>
            </>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

const getStatusColor = (status) => {
  const colors = {
    pending: 'orange',
    preparing: 'blue',
    ready: 'purple',
    delivered: 'green',
    canceled: 'red'
  };
  return colors[status] || 'gray';
};

const getStatusIcon = (status) => {
  // Return empty string - no emojis for professional look
  return '';
};

const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pendente',
    preparing: 'Preparando',
    ready: 'Pronto',
    delivered: 'Entregue',
    canceled: 'Cancelado'
  };
  return labels[status] || status;
};

export default MyOrder;
