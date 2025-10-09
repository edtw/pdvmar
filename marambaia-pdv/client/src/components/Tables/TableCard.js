// src/components/Tables/TableCard.js
import React from 'react';
import {
  Box,
  Text,
  Flex,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  HStack,
  useColorModeValue,
  Portal,
  Divider
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
import { MdQrCode2 } from 'react-icons/md';
import { formatDistanceStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TableCard = ({
  table,
  onOpen,
  onClose,
  onTransfer,
  onViewOrder,
  onDelete,
  onAssignWaiter,
  onQRCode,
  isWaiter,
  isAdmin
}) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

    // Formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
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
    <Box
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      overflow="visible"
      shadow="sm"
      bg={bgColor}
      transition="all 0.2s"
      _hover={{ shadow: 'md' }}
      position="relative"
    >
      {/* Cabeçalho com número da mesa e status */}
      <Flex direction="column" justify="space-between" p={4} height="100%">
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontSize="xl" fontWeight="bold">
            Mesa {table.number}
          </Text>
          <Badge colorScheme={getStatusColor()} p={1} borderRadius="md">
            {getStatusText()}
          </Badge>
        </Flex>
        
        {/* Informações adicionais */}
        <Box>
          {table.status !== 'free' && (
            <>
              {/* Customer Information */}
              {table.currentOrder?.customer && (
                <>
                  <Box bg="blue.50" p={2} borderRadius="md" mb={2}>
                    <HStack fontSize="sm" mb={1}>
                      <Text fontWeight="bold" color="blue.700">Cliente:</Text>
                      <Text color="blue.900">{table.currentOrder.customer.name}</Text>
                    </HStack>
                    {table.currentOrder.customer.cpf && (
                      <HStack fontSize="xs">
                        <Text fontWeight="medium" color="blue.600">CPF:</Text>
                        <Text color="blue.800">
                          {table.currentOrder.customer.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                        </Text>
                      </HStack>
                    )}
                    {table.currentOrder.customer.phone && (
                      <HStack fontSize="xs" mt={0.5}>
                        <Text fontWeight="medium" color="blue.600">Tel:</Text>
                        <Text color="blue.800">{table.currentOrder.customer.phone}</Text>
                      </HStack>
                    )}
                  </Box>
                </>
              )}

              <HStack mt={1} fontSize="sm">
                <Text fontWeight="medium">Ocupantes:</Text>
                <Text>{table.occupants || '-'}</Text>
              </HStack>

              <HStack mt={1} fontSize="sm">
                <Text fontWeight="medium">Tempo:</Text>
                <Text>{getOccupationTime()}</Text>
              </HStack>

              <HStack mt={1} fontSize="sm">
                <Text fontWeight="medium">Garçom:</Text>
                <Text>{table.waiter?.name || '-'}</Text>
              </HStack>

              <Divider my={2} />

              <HStack justify="space-between">
                <Text fontWeight="bold">Total:</Text>
                <Text fontWeight="bold" color="green.600">
                  {formatCurrency(table.currentOrder?.total || 0)}
                </Text>
              </HStack>
            </>
          )}
        </Box>
        
        {/* Ações da mesa */}
        <Flex mt={4} justify="flex-end">
          <Menu placement="bottom-end" gutter={0} closeOnSelect={true}>
            <MenuButton
              as={IconButton}
              icon={<FiMoreVertical />}
              variant="ghost"
              size="sm"
              aria-label="Ações da mesa"
              zIndex={1}
            />
            <Portal>
              <MenuList zIndex={100}>
                {table.status === 'free' && (
                  <>
                    <MenuItem icon={<FiUserPlus />} onClick={onOpen}>
                      Abrir mesa
                    </MenuItem>
                    {isAdmin && (
                      <>
                        <MenuItem icon={<MdQrCode2 />} onClick={onQRCode}>
                          QR Code
                        </MenuItem>
                        <MenuItem icon={<FiUser />} onClick={onAssignWaiter}>
                          Atribuir Garçom
                        </MenuItem>
                        {onDelete && (
                          <MenuItem icon={<FiTrash2 />} onClick={onDelete} color="red.500">
                            Excluir mesa
                          </MenuItem>
                        )}
                      </>
                    )}
                  </>
                )}
                
                {table.status === 'occupied' && (
                  <>
                    <MenuItem icon={<FiClipboard />} onClick={onViewOrder}>
                      Ver pedido
                    </MenuItem>
                    <MenuItem icon={<FiCreditCard />} onClick={onClose}>
                      Fechar mesa
                    </MenuItem>
                    <MenuItem icon={<FiArrowRight />} onClick={onTransfer}>
                      Transferir
                    </MenuItem>
                    {isAdmin && (
                      <>
                        <MenuItem icon={<MdQrCode2 />} onClick={onQRCode}>
                          QR Code
                        </MenuItem>
                        <MenuItem icon={<FiUser />} onClick={onAssignWaiter}>
                          Atribuir Garçom
                        </MenuItem>
                      </>
                    )}
                  </>
                )}
                
                {table.status === 'waiting_payment' && (
                  <>
                    <MenuItem icon={<FiClipboard />} onClick={onViewOrder}>
                      Ver pedido
                    </MenuItem>
                    <MenuItem icon={<FiCreditCard />} onClick={onClose}>
                      Finalizar pagamento
                    </MenuItem>
                    {isAdmin && (
                      <MenuItem icon={<FiUser />} onClick={onAssignWaiter}>
                        Atribuir Garçom
                      </MenuItem>
                    )}
                  </>
                )}
              </MenuList>
            </Portal>
          </Menu>
        </Flex>
      </Flex>
    </Box>
  );
};

export default TableCard; 