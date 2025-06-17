// src/components/CashRegister/TransactionList.js - VERSÃO CORRIGIDA
import React, { useState } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Flex,
  Spinner,
  IconButton,
  Tooltip,
  HStack,
  useColorModeValue
} from '@chakra-ui/react';
import { FiSearch, FiFilter, FiInfo } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TransactionList = ({ transactions, loading, formatCurrency }) => {
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Função auxiliar para formatar data considerando fuso horário local
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    
    try {
      // Fazer parse da data mantendo fuso horário
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (e) {
      console.error("Erro ao formatar data:", e, dateString);
      return dateString;
    }
  };
  
  // Filtrar transações
  const filteredTransactions = transactions.filter(transaction => {
    // Filtro de texto
    const matchesSearch = !filter || 
      (transaction.description && transaction.description.toLowerCase().includes(filter.toLowerCase())) ||
      (transaction.user && transaction.user.name && transaction.user.name.toLowerCase().includes(filter.toLowerCase()));
    
    // Filtro de tipo
    const matchesType = !typeFilter || transaction.type === typeFilter;
    
    return matchesSearch && matchesType;
  });
  
  // Obter texto do tipo
  const getTypeText = (type) => {
    switch (type) {
      case 'open':
        return 'Abertura';
      case 'close':
        return 'Fechamento';
      case 'deposit':
        return 'Entrada';
      case 'withdraw':
        return 'Retirada';
      case 'drain':
        return 'Sangria';
      default:
        return 'Desconhecido';
    }
  };
  
  // Obter cor do tipo
  const getTypeColor = (type) => {
    switch (type) {
      case 'open':
        return 'blue';
      case 'close':
        return 'purple';
      case 'deposit':
        return 'green';
      case 'withdraw':
        return 'orange';
      case 'drain':
        return 'red';
      default:
        return 'gray';
    }
  };
  
  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="blue.500" />
      </Box>
    );
  }
  
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text>Nenhuma transação encontrada no período selecionado.</Text>
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Filtros */}
      <Flex mb={4} gap={4} flexWrap={{ base: 'wrap', md: 'nowrap' }}>
        <InputGroup maxW={{ base: '100%', md: '320px' }}>
          <InputLeftElement>
            <FiSearch color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Buscar transações..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </InputGroup>
        
        <Select
          placeholder="Todos os tipos"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          maxW={{ base: '100%', md: '200px' }}
        >
          <option value="open">Abertura</option>
          <option value="close">Fechamento</option>
          <option value="deposit">Entrada</option>
          <option value="withdraw">Retirada</option>
          <option value="drain">Sangria</option>
        </Select>
      </Flex>
      
      {/* Tabela de transações */}
      <Box overflowX="auto">
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Data</Th>
              <Th>Tipo</Th>
              <Th>Descrição</Th>
              <Th>Operador</Th>
              <Th isNumeric>Valor</Th>
              <Th isNumeric>Saldo Anterior</Th>
              <Th isNumeric>Novo Saldo</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredTransactions.map(transaction => (
              <Tr key={transaction._id}>
                <Td whiteSpace="nowrap">
                  {formatDateTime(transaction.createdAt)}
                </Td>
                <Td>
                  <Badge colorScheme={getTypeColor(transaction.type)}>
                    {getTypeText(transaction.type)}
                  </Badge>
                </Td>
                <Td maxW="200px" isTruncated>
                  <HStack>
                    <Text>{transaction.description}</Text>
                    {transaction.destination && (
                      <Tooltip label={`Destino: ${transaction.destination}`}>
                        <IconButton
                          icon={<FiInfo />}
                          variant="ghost"
                          size="xs"
                          aria-label="Informações"
                        />
                      </Tooltip>
                    )}
                  </HStack>
                </Td>
                <Td>{transaction.user?.name || 'N/A'}</Td>
                <Td isNumeric fontWeight="bold">
                  {transaction.type === 'withdraw' || transaction.type === 'drain' 
                    ? `-${formatCurrency(transaction.amount)}` 
                    : formatCurrency(transaction.amount)}
                </Td>
                <Td isNumeric>{formatCurrency(transaction.previousBalance)}</Td>
                <Td isNumeric>{formatCurrency(transaction.newBalance)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default TransactionList;