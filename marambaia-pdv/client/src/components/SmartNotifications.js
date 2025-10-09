// components/SmartNotifications.js - Sistema de Notificações Inteligentes
import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  IconButton,
  useToast,
  Collapse,
  Slide,
  ScaleFade,
  Button,
  Divider
} from '@chakra-ui/react';
import {
  FiBell,
  FiAlertCircle,
  FiClock,
  FiTrendingUp,
  FiX,
  FiCheck
} from 'react-icons/fi';
import api from '../services/api';

const SmartNotifications = ({ userId, userRole }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const toast = useToast();

  useEffect(() => {
    loadNotifications();

    // Atualizar notificações a cada 3 minutos
    const interval = setInterval(() => {
      loadNotifications();
    }, 3 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userId, userRole]);

  const loadNotifications = async () => {
    try {
      const alerts = [];

      // 1. Mesas Esquecidas (apenas para garçons e managers)
      if (userRole === 'waiter' || userRole === 'manager' || userRole === 'admin') {
        try {
          const response = await api.get('/intelligence/forgotten-tables');
          const forgotten = response.data.tables || [];

          forgotten.forEach(f => {
            // Se for garçom, mostrar apenas suas mesas
            if (userRole === 'waiter') {
              if (f.waiter?._id === userId || f.waiter === userId) {
                alerts.push({
                  id: `forgotten-${f.table._id}`,
                  type: 'warning',
                  icon: FiClock,
                  title: 'Mesa Esquecida',
                  message: `Mesa ${f.table.number} há ${f.openDuration}min sem atividade`,
                  priority: 'high',
                  action: () => {
                    toast({
                      title: 'Alerta',
                      description: `Verificar mesa ${f.table.number}`,
                      status: 'info',
                      duration: 3000
                    });
                  }
                });
              }
            } else {
              // Manager/Admin veem todas
              alerts.push({
                id: `forgotten-${f.table._id}`,
                type: 'warning',
                icon: FiClock,
                title: 'Mesa Esquecida',
                message: `Mesa ${f.table.number} (${f.waiter?.name || 'Sem garçom'}) - ${f.openDuration}min`,
                priority: 'high',
                action: null
              });
            }
          });
        } catch (err) {
          console.error('Erro ao carregar mesas esquecidas:', err);
        }
      }

      // 2. Análise de Fraude (apenas admin/manager)
      if (userRole === 'admin' || userRole === 'manager') {
        // Verificar pedidos recentes com alto risco
        // (implementação simplificada - na produção faria uma chamada à API)
      }

      // 3. Previsão de Demanda (apenas admin/manager)
      if (userRole === 'admin' || userRole === 'manager') {
        try {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(19, 0, 0, 0); // 19h de amanhã

          const response = await api.get('/intelligence/demand-forecast', {
            params: { date: tomorrow.toISOString() }
          });

          const forecast = response.data.forecast;

          if (forecast && forecast.predictedOrders > 20) {
            alerts.push({
              id: 'demand-forecast',
              type: 'info',
              icon: FiTrendingUp,
              title: 'Previsão de Alta Demanda',
              message: `Amanhã às 19h: ${forecast.predictedOrders} pedidos previstos`,
              priority: 'medium',
              action: null
            });
          }
        } catch (err) {
          console.error('Erro ao carregar previsão:', err);
        }
      }

      setNotifications(alerts);
      setUnreadCount(alerts.length);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const dismissNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const dismissAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    setIsOpen(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'blue';
      default: return 'gray';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'warning': return 'orange';
      case 'error': return 'red';
      case 'success': return 'green';
      case 'info': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <Box position="relative">
      {/* Notification Bell Button */}
      <IconButton
        icon={<FiBell />}
        onClick={() => setIsOpen(!isOpen)}
        position="relative"
        variant="ghost"
        colorScheme="whiteAlpha"
        aria-label="Notificações"
      >
        {unreadCount > 0 && (
          <Badge
            colorScheme="red"
            borderRadius="full"
            position="absolute"
            top="0"
            right="0"
            fontSize="xs"
            minW="20px"
            h="20px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {unreadCount}
          </Badge>
        )}
      </IconButton>

      {/* Notification Panel */}
      <Slide direction="top" in={isOpen} style={{ zIndex: 1000 }}>
        <Box
          position="fixed"
          top="80px"
          right={{ base: '10px', md: '20px' }}
          w={{ base: 'calc(100vw - 20px)', md: '400px' }}
          maxH="500px"
          bg="white"
          borderRadius="xl"
          boxShadow="2xl"
          overflow="hidden"
          zIndex={1001}
        >
          {/* Header */}
          <HStack
            justify="space-between"
            p={4}
            bg="cyan.500"
            color="white"
          >
            <HStack>
              <Icon as={FiBell} boxSize={5} />
              <Text fontWeight="bold">Alertas Inteligentes</Text>
              {unreadCount > 0 && (
                <Badge colorScheme="red" borderRadius="full">
                  {unreadCount}
                </Badge>
              )}
            </HStack>
            <HStack spacing={2}>
              {notifications.length > 0 && (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={dismissAll}
                  leftIcon={<FiCheck />}
                  color="white"
                  _hover={{ bg: 'whiteAlpha.300' }}
                >
                  Limpar
                </Button>
              )}
              <IconButton
                icon={<FiX />}
                onClick={() => setIsOpen(false)}
                size="sm"
                variant="ghost"
                color="white"
                aria-label="Fechar"
                _hover={{ bg: 'whiteAlpha.300' }}
              />
            </HStack>
          </HStack>

          {/* Notifications List */}
          <Box maxH="400px" overflowY="auto">
            {notifications.length === 0 ? (
              <Box p={8} textAlign="center">
                <Icon as={FiCheck} boxSize={12} color="green.500" mb={3} />
                <Text color="gray.600" fontWeight="medium">
                  Nenhum alerta no momento
                </Text>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Tudo está funcionando bem!
                </Text>
              </Box>
            ) : (
              <VStack spacing={0} align="stretch">
                {notifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <ScaleFade in={true} delay={index * 0.05}>
                      <Box
                        p={4}
                        _hover={{ bg: 'gray.50' }}
                        transition="all 0.2s"
                        cursor="pointer"
                        onClick={notification.action}
                      >
                        <HStack align="start" spacing={3}>
                          {/* Icon */}
                          <Box
                            p={2}
                            bg={`${getTypeColor(notification.type)}.100`}
                            borderRadius="md"
                          >
                            <Icon
                              as={notification.icon}
                              color={`${getTypeColor(notification.type)}.600`}
                              boxSize={5}
                            />
                          </Box>

                          {/* Content */}
                          <VStack align="start" flex={1} spacing={1}>
                            <HStack justify="space-between" w="full">
                              <Text fontWeight="bold" fontSize="sm" color="gray.800">
                                {notification.title}
                              </Text>
                              <Badge
                                colorScheme={getPriorityColor(notification.priority)}
                                fontSize="xs"
                                textTransform="uppercase"
                              >
                                {notification.priority}
                              </Badge>
                            </HStack>
                            <Text fontSize="sm" color="gray.600">
                              {notification.message}
                            </Text>
                          </VStack>

                          {/* Dismiss Button */}
                          <IconButton
                            icon={<FiX />}
                            size="xs"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotification(notification.id);
                            }}
                            aria-label="Dispensar"
                          />
                        </HStack>
                      </Box>
                    </ScaleFade>
                    {index < notifications.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </VStack>
            )}
          </Box>
        </Box>
      </Slide>

      {/* Backdrop */}
      {isOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.300"
          zIndex={999}
          onClick={() => setIsOpen(false)}
        />
      )}
    </Box>
  );
};

export default SmartNotifications;
