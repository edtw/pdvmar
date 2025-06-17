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
  HStack
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
  userRole
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
      <Flex gap={3} alignItems="center">
        {/* Imagem do produto */}
        <Image
          src={item.product?.image || 'https://via.placeholder.com/80?text=Produto'}
          alt={item.product?.name}
          boxSize="80px"
          objectFit="cover"
          borderRadius="md"
          fallbackSrc="https://via.placeholder.com/80?text=Produto"
        />
        
        {/* Informações do produto */}
        <Flex flex="1" direction="column" gap={1}>
          <Flex justifyContent="space-between" alignItems="center">
            <Text fontWeight="bold" fontSize="lg" noOfLines={1}>
              {item.product?.name || 'Produto'}
            </Text>
            
            <Badge colorScheme={getStatusColor(item.status)} ml={2}>
              {getStatusText(item.status)}
            </Badge>
          </Flex>
          
          <Text fontSize="sm" color="gray.500" noOfLines={2}>
            {item.notes || 'Sem observações'}
          </Text>
          
          <HStack mt={1}>
            <Text fontWeight="medium">
              {item.quantity}x {formatCurrency(item.unitPrice)}
            </Text>
            <Text fontWeight="bold" ml="auto">
              {formatCurrency(item.quantity * item.unitPrice)}
            </Text>
          </HStack>
        </Flex>
        
        {/* Menu de ações */}
        {orderStatus === 'open' && (
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