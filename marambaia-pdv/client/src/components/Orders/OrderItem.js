import React from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  Image,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useColorModeValue,
  HStack,
  Button,
  SimpleGrid,
  Stack,
  VStack
} from '@chakra-ui/react';
import {
  FiMoreVertical,
  FiCheck,
  FiClock,
  FiX,
  FiEdit,
  FiTrash2
} from 'react-icons/fi';

const OrderItem = ({ 
  item, 
  orderStatus, 
  onStatusChange, 
  onRemove,
  userRole,
  isMobile = false
}) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Função para obter cor do status
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'preparing':
        return 'orange';
      case 'ready':
        return 'green';
      case 'delivered':
        return 'blue';
      case 'canceled':
        return 'red';
      default:
        return 'gray';
    }
  };
  
  // Função para obter texto do status
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'preparing':
        return 'Preparando';
      case 'ready':
        return 'Pronto';
      case 'delivered':
        return 'Entregue';
      case 'canceled':
        return 'Cancelado';
      default:
        return 'Desconhecido';
    }
  };
  
  // Formato de moeda brasileira
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Botões de ação rápida para telas pequenas
  const renderQuickActions = () => {
    if (orderStatus !== 'open') return null;
    
    return (
      <SimpleGrid columns={2} spacing={2} mt={3} w="full">
        {/* Ações para garçom */}
        {(userRole === 'waiter' || userRole === 'admin' || userRole === 'manager') && (
          <>
            {item.status === 'pending' && (
              <Button
                size="sm"
                leftIcon={<FiClock />}
                colorScheme="orange"
                variant="outline"
                onClick={() => onStatusChange(item._id, 'preparing')}
              >
                Preparando
              </Button>
            )}
            
            {item.status === 'ready' && (
              <Button
                size="sm"
                leftIcon={<FiCheck />}
                colorScheme="green"
                variant="outline"
                onClick={() => onStatusChange(item._id, 'delivered')}
              >
                Entregue
              </Button>
            )}
          </>
        )}
        
        {/* Ações para cozinha */}
        {(userRole === 'kitchen' || userRole === 'admin' || userRole === 'manager') && (
          <>
            {item.status === 'pending' && (
              <Button
                size="sm"
                leftIcon={<FiClock />}
                colorScheme="orange"
                variant="outline"
                onClick={() => onStatusChange(item._id, 'preparing')}
              >
                Preparar
              </Button>
            )}
            
            {item.status === 'preparing' && (
              <Button
                size="sm"
                leftIcon={<FiCheck />}
                colorScheme="green"
                variant="outline"
                onClick={() => onStatusChange(item._id, 'ready')}
              >
                Pronto
              </Button>
            )}
          </>
        )}
        
        {/* Cancelar item */}
        {(item.status === 'pending' || item.status === 'preparing') && (
          <Button
            size="sm"
            leftIcon={<FiX />}
            colorScheme="red"
            variant="outline"
            onClick={() => onStatusChange(item._id, 'canceled')}
          >
            Cancelar
          </Button>
        )}
        
        {/* Remover item */}
        {item.status === 'pending' && (
          <Button
            size="sm"
            leftIcon={<FiTrash2 />}
            colorScheme="red"
            variant="outline"
            onClick={() => onRemove(item._id)}
          >
            Remover
          </Button>
        )}
      </SimpleGrid>
    );
  };
  
  return (
    <Box
      p={3}
      borderWidth="1px"
      borderRadius="md"
      borderColor={borderColor}
      bg={bgColor}
      shadow="sm"
      transition="all 0.2s"
      _hover={{ shadow: 'md' }}
      opacity={item.status === 'canceled' ? 0.6 : 1}
    >
      <Flex 
        direction={isMobile ? "column" : "row"} 
        gap={isMobile ? 2 : 3} 
        alignItems={isMobile ? "flex-start" : "center"}
      >
        {/* Imagem do produto */}
        <Image
          src={item.product?.image || 'https://via.placeholder.com/80?text=Produto'}
          alt={item.product?.name}
          boxSize={isMobile ? "60px" : "80px"}
          objectFit="cover"
          borderRadius="md"
          fallbackSrc="https://via.placeholder.com/80?text=Produto"
          alignSelf={isMobile ? "center" : "flex-start"}
          display={isMobile ? { base: "none", sm: "block" } : "block"}
        />
        
        {/* Informações do produto */}
        <Flex flex="1" direction="column" gap={1} w={isMobile ? "full" : "auto"}>
          <Flex justifyContent="space-between" alignItems="center">
            <Text fontWeight="bold" fontSize={isMobile ? "md" : "lg"} noOfLines={1}>
              {item.product?.name || 'Produto'}
            </Text>
            
            <Badge colorScheme={getStatusColor(item.status)} ml={2} fontSize={isMobile ? "xs" : "sm"}>
              {getStatusText(item.status)}
            </Badge>
          </Flex>
          
          <Text fontSize={isMobile ? "xs" : "sm"} color="gray.500" noOfLines={2}>
            {item.notes || 'Sem observações'}
          </Text>
          
          <HStack mt={1}>
            <Text fontWeight="medium" fontSize={isMobile ? "sm" : "md"}>
              {item.quantity}x {formatCurrency(item.unitPrice)}
            </Text>
            <Text fontWeight="bold" ml="auto" fontSize={isMobile ? "sm" : "md"}>
              {formatCurrency(item.quantity * item.unitPrice)}
            </Text>
          </HStack>
          
          {/* Botões de ação rápida em mobile */}
          {isMobile && renderQuickActions()}
        </Flex>
        
        {/* Menu de ações em desktop */}
        {orderStatus === 'open' && !isMobile && (
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<FiMoreVertical />}
              variant="ghost"
              size="sm"
              aria-label="Ações"
            />
            <MenuList>
              {/* Itens para garçom */}
              {(userRole === 'waiter' || userRole === 'admin' || userRole === 'manager') && (
                <>
                  {item.status === 'pending' && (
                    <MenuItem 
                      icon={<FiClock />}
                      onClick={() => onStatusChange(item._id, 'preparing')}
                    >
                      Marcar como Preparando
                    </MenuItem>
                  )}
                  
                  {item.status === 'ready' && (
                    <MenuItem 
                      icon={<FiCheck />}
                      onClick={() => onStatusChange(item._id, 'delivered')}
                    >
                      Marcar como Entregue
                    </MenuItem>
                  )}
                  
                  {(item.status === 'pending' || item.status === 'preparing') && (
                    <MenuItem 
                      icon={<FiX />}
                      onClick={() => onStatusChange(item._id, 'canceled')}
                    >
                      Cancelar Item
                    </MenuItem>
                  )}
                </>
              )}
              
              {/* Itens para cozinha */}
              {(userRole === 'kitchen' || userRole === 'admin' || userRole === 'manager') && (
                <>
                  {item.status === 'pending' && (
                    <MenuItem 
                      icon={<FiClock />}
                      onClick={() => onStatusChange(item._id, 'preparing')}
                    >
                      Iniciar Preparo
                    </MenuItem>
                  )}
                  
                  {item.status === 'preparing' && (
                    <MenuItem 
                      icon={<FiCheck />}
                      onClick={() => onStatusChange(item._id, 'ready')}
                    >
                      Marcar como Pronto
                    </MenuItem>
                  )}
                </>
              )}
              
              {/* Remover item (apenas pendente) */}
              {item.status === 'pending' && (
                <MenuItem 
                  icon={<FiTrash2 />}
                  onClick={() => onRemove(item._id)}
                  color="red.500"
                >
                  Remover Item
                </MenuItem>
              )}
            </MenuList>
          </Menu>
        )}
      </Flex>
    </Box>
  );
};

export default OrderItem;