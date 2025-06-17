// TableComponent.js

import React from 'react';
import {
  Box,
  Text,
  Badge,
  Flex,
  useColorModeValue,
  Tooltip,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import {
  FiMoreVertical,
  FiUserPlus,
  FiCreditCard,
  FiClipboard,
  FiArrowRight,
} from 'react-icons/fi';
import { formatDistanceStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TableComponent = ({ 
  table, 
  onClick,
  onOpen, 
  onClose, 
  onTransfer, 
  onViewOrder, 
  isDragging, 
  isEditing,
  ...rest 
}) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Obter cor com base no status
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
  
  // Obter texto do status
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
      position={isEditing ? 'absolute' : 'relative'}
      left={isEditing ? `${table.position?.x * 150}px` : undefined}
      top={isEditing ? `${table.position?.y * 150}px` : undefined}
      w="120px"
      h="120px"
      m={isEditing ? '0' : '2'}
      borderRadius="md"
      borderWidth="2px"
      borderColor={borderColor}
      bg={bgColor}
      boxShadow="md"
      cursor={isDragging ? 'grabbing' : 'pointer'}
      onClick={onClick && !isDragging ? () => onClick(table) : undefined}
      transition="transform 0.2s, box-shadow 0.2s"
      _hover={{ transform: 'scale(1.02)', boxShadow: 'lg' }}
      {...rest}
    >
      <Flex
        direction="column"
        justify="space-between"
        align="center"
        h="100%"
        p={2}
        position="relative"
      >
        {/* Status Badge */}
        <Badge
          position="absolute"
          top="2"
          right="2"
          colorScheme={getStatusColor()}
          variant="solid"
          borderRadius="full"
          px={2}
          fontSize="xs"
        >
          {getStatusText()}
        </Badge>
        
        {/* Número da Mesa */}
        <Text
          fontSize="xl"
          fontWeight="bold"
          mt={2}
        >
          Mesa {table.number}
        </Text>
        
        {/* Informações adicionais */}
        {table.status !== 'free' && (
          <Box textAlign="center" fontSize="xs">
            <Text>{table.occupants || '-'} pessoas</Text>
            <Text>{getOccupationTime()}</Text>
          </Box>
        )}
        
        {/* Menu de Ações */}
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<FiMoreVertical />}
            variant="ghost"
            size="sm"
            aria-label="Ações"
            position="absolute"
            bottom="2"
            right="2"
            onClick={(e) => e.stopPropagation()}
          />
          <MenuList>
            {table.status === 'free' && (
              <MenuItem 
                icon={<FiUserPlus />}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen(table);
                }}
              >
                Abrir mesa
              </MenuItem>
            )}
            
            {table.status === 'occupied' && (
              <>
                <MenuItem 
                  icon={<FiClipboard />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewOrder(table);
                  }}
                >
                  Ver pedido
                </MenuItem>
                <MenuItem 
                  icon={<FiCreditCard />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(table);
                  }}
                >
                  Fechar mesa
                </MenuItem>
                <MenuItem 
                  icon={<FiArrowRight />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTransfer(table);
                  }}
                >
                  Transferir
                </MenuItem>
              </>
            )}
            
            {table.status === 'waiting_payment' && (
              <>
                <MenuItem 
                  icon={<FiClipboard />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewOrder(table);
                  }}
                >
                  Ver pedido
                </MenuItem>
                <MenuItem 
                  icon={<FiCreditCard />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(table);
                  }}
                >
                  Finalizar pagamento
                </MenuItem>
              </>
            )}
          </MenuList>
        </Menu>
      </Flex>
    </Box>
  );
};

export default TableComponent;