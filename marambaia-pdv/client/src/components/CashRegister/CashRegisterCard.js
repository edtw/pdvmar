// src/components/CashRegister/CashRegisterCard.js
import React from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue
} from '@chakra-ui/react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CashRegisterCard = ({ cashRegister, isSelected, onClick, formatCurrency }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const selectedBorderColor = useColorModeValue('blue.500', 'blue.300');
  
  // Função para formatar a data
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM HH:mm", { locale: ptBR });
    } catch (e) {
      console.error("Erro ao formatar data:", e);
      return '';
    }
  };
  
  // Função para calcular tempo desde a abertura
  const getTimeFromOpening = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { locale: ptBR, addSuffix: true });
    } catch (e) {
      console.error("Erro ao calcular tempo:", e);
      return '';
    }
  };
  
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      borderColor={isSelected ? selectedBorderColor : borderColor}
      boxShadow={isSelected ? 'md' : 'sm'}
      bg={bgColor}
      p={4}
      cursor="pointer"
      onClick={onClick}
      transition="all 0.2s"
      _hover={{ boxShadow: 'md', borderColor: selectedBorderColor }}
      position="relative"
      overflow="hidden"
    >
      {isSelected && (
        <Box 
          position="absolute" 
          top="0" 
          left="0" 
          right="0" 
          height="4px" 
          bg="blue.500" 
        />
      )}
      
      <Flex justify="space-between" mb={2}>
        <Text fontWeight="bold" fontSize="lg">
          {cashRegister.identifier}
        </Text>
        <Badge colorScheme={cashRegister.status === 'open' ? 'green' : 'gray'}>
          {cashRegister.status === 'open' ? 'Aberto' : 'Fechado'}
        </Badge>
      </Flex>
      
      <Stat>
        <StatLabel>Saldo</StatLabel>
        <StatNumber>{formatCurrency(cashRegister.currentBalance)}</StatNumber>
        <StatHelpText>
          {cashRegister.status === 'open' && cashRegister.openedAt ? (
            <>Aberto {getTimeFromOpening(cashRegister.openedAt)}</>
          ) : (
            cashRegister.closedAt ? (
              <>Fechado em {formatDate(cashRegister.closedAt)}</>
            ) : 'Fechado'
          )}
        </StatHelpText>
      </Stat>
      
      {cashRegister.status === 'open' && cashRegister.currentOperator && (
        <Text fontSize="sm" mt={2}>
          Operador: {cashRegister.currentOperator.name}
        </Text>
      )}
    </Box>
  );
};

export default CashRegisterCard;