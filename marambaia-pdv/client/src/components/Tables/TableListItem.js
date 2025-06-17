// TableListItem.js

import React from 'react';
import {
  Flex,
  Text,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Portal,
  Button
} from '@chakra-ui/react';
import {
  FiMoreVertical,
  FiUserPlus,
  FiCreditCard,
  FiClipboard,
  FiArrowRight,
  FiTrash2,
  FiUser
} from 'react-icons/fi';
import { formatDistanceStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TableListItem = ({
  table,
  onOpen,
  onClose,
  onTransfer,
  onViewOrder,
  onDelete,
  onAssignWaiter,
  isWaiter,
  isAdmin
}) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Status da mesa
  const getStatusColor = () => {
    switch (table.status) {
      case 'free':
        return 'green';
      case 'occupied':
        return 'yellow';
      case 'waiting_payment':
        return 'red';
      default:
        return 'gray';
    }
  };
  
  // Tradução do status
  const getStatusText = () => {
    switch (table.status) {
      case 'free':
        return 'Livre';
      case 'occupied':
        return 'Ocupada';
      case 'waiting_payment':
        return 'Aguardando Pagamento';
      default:
        return 'Desconhecido';
    }
  };
  
  // Calcular tempo de ocupação
  const getOccupationTime = () => {
    if (!table.openTime) return '';
    
    return formatDistanceStrict(new Date(table.openTime), new Date(), {
      locale: ptBR
    });
  };
  
  return (
    <Flex
      p={4}
      bg={bgColor}
      borderBottomWidth="1px"
      borderColor={borderColor}
      justify="space-between"
      align="center"
      transition="background-color 0.2s"
      _hover={{ bg: 'gray.50' }}
      position="relative"
      overflow="visible"
    >
      {/* Informações da mesa */}
      <Flex direction="column">
        <Flex align="center" gap={2}>
          <Text fontWeight="bold" fontSize="lg">Mesa {table.number}</Text>
          <Badge colorScheme={getStatusColor()}>{getStatusText()}</Badge>
        </Flex>
        
        {table.status !== 'free' && (
          <Flex fontSize="sm" color="gray.600" gap={4} mt={1}>
            <Text>{table.occupants || '-'} pessoas</Text>
            <Text>•</Text>
            <Text>{getOccupationTime()}</Text>
            {table.waiter && (
              <>
                <Text>•</Text>
                <Text>Garçom: {table.waiter.name}</Text>
              </>
            )}
          </Flex>
        )}
      </Flex>
      
      {/* Ações */}
      <Menu placement="bottom-end" gutter={0} closeOnSelect={true}>
        <MenuButton
          as={IconButton}
          icon={<FiMoreVertical />}
          variant="ghost"
          aria-label="Ações da mesa"
          zIndex={1}
        />
        <Portal>
          <MenuList zIndex={100}>
            {table.status === 'free' && (
              <>
                <Button
                  size="sm"
                  leftIcon={<FiUserPlus />}
                  onClick={onOpen}
                  colorScheme="blue"
                >
                  Abrir mesa
                </Button>
                
                {isAdmin && (
                  <>
                    <Button
                      size="sm"
                      leftIcon={<FiUser />}
                      onClick={onAssignWaiter}
                      colorScheme="teal"
                    >
                      Atribuir Garçom
                    </Button>

                    {onDelete && (
                      <Button
                        size="sm"
                        leftIcon={<FiTrash2 />}
                        onClick={onDelete}
                        colorScheme="red"
                      >
                        Excluir
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
            
            {table.status === 'occupied' && (
              <>
                <Button
                  size="sm"
                  leftIcon={<FiClipboard />}
                  onClick={onViewOrder}
                  colorScheme="blue"
                >
                  Ver pedido
                </Button>
                
                <Button
                  size="sm"
                  leftIcon={<FiCreditCard />}
                  onClick={onClose}
                  colorScheme="yellow"
                >
                  Fechar mesa
                </Button>
                
                <Button
                  size="sm"
                  leftIcon={<FiArrowRight />}
                  onClick={onTransfer}
                  colorScheme="purple"
                >
                  Transferir
                </Button>

                {isAdmin && (
                  <Button
                    size="sm"
                    leftIcon={<FiUser />}
                    onClick={onAssignWaiter}
                    colorScheme="teal"
                  >
                    Atribuir Garçom
                  </Button>
                )}
              </>
            )}
            
            {table.status === 'waiting_payment' && (
              <>
                <Button
                  size="sm"
                  leftIcon={<FiClipboard />}
                  onClick={onViewOrder}
                  colorScheme="blue"
                >
                  Ver pedido
                </Button>
                
                <Button
                  size="sm"
                  leftIcon={<FiCreditCard />}
                  onClick={onClose}
                  colorScheme="green"
                >
                  Finalizar
                </Button>

                {isAdmin && (
                  <Button
                    size="sm"
                    leftIcon={<FiUser />}
                    onClick={onAssignWaiter}
                    colorScheme="teal"
                  >
                    Atribuir Garçom
                  </Button>
                )}
              </>
            )}
          </MenuList>
        </Portal>
      </Menu>
    </Flex>
  );
};

export default TableListItem;