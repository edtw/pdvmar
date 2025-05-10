// src/components/CashRegister/CashRegisterReport.js - VERSÃO CORRIGIDA
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Heading,
  Button,
  Flex,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Select,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { FiPrinter, FiDownload, FiRefreshCw } from 'react-icons/fi';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../../services/api';
import DateRangePicker from '../ui/DateRangePicker';

const CashRegisterReport = ({ cashRegister, formatCurrency }) => {
  console.log('🟣 CashRegisterReport: Renderizando componente');
  console.log('🟣 CashRegisterReport: cashRegister:', cashRegister);
  
  const [period, setPeriod] = useState('week');
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 7),
    endDate: new Date()
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Refs para controlar requisições
  const isMountedRef = useRef(true);
  const fetchingRef = useRef(false);
  const initialFetchRef = useRef(false);
  const lastFetchParamsRef = useRef(null);
  
  const toast = useToast();
  
  // Logs de estado
  console.log('🟣 CashRegisterReport: period:', period);
  console.log('🟣 CashRegisterReport: dateRange:', dateRange);
  console.log('🟣 CashRegisterReport: loading:', loading);
  
  // Cleanup quando o componente for desmontado
  useEffect(() => {
    console.log('🟣 CashRegisterReport: Montando componente');
    isMountedRef.current = true;
    
    return () => {
      console.log('🟣 CashRegisterReport: Desmontando componente');
      isMountedRef.current = false;
    };
  }, []);
  
  // Atualizar intervalo de datas baseado no período
  useEffect(() => {
    console.log('🟣 CashRegisterReport: Atualizando período:', period);
    
    const today = new Date();
    let startDate, endDate;
    
    switch (period) {
      case 'today':
        startDate = today;
        endDate = today;
        break;
      case 'yesterday':
        startDate = subDays(today, 1);
        endDate = subDays(today, 1);
        break;
      case 'week':
        startDate = subDays(today, 7);
        endDate = today;
        break;
      case 'month':
        startDate = startOfMonth(today);
        endDate = today;
        break;
      case 'full-month':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case 'last30':
        startDate = subDays(today, 30);
        endDate = today;
        break;
      default:
        startDate = subDays(today, 7);
        endDate = today;
    }
    
    console.log('🟣 CashRegisterReport: Novo dateRange:', { startDate, endDate });
    setDateRange({ startDate, endDate });
  }, [period]);
  
  // Buscar relatório
  const fetchReport = async () => {
    console.log('🟣 fetchReport: Iniciando busca de relatório');
    console.log('🟣 fetchReport: cashRegister:', cashRegister);
    console.log('🟣 fetchReport: fetchingRef.current:', fetchingRef.current);
    
    if (!cashRegister) {
      console.log('🟣 fetchReport: Sem cashRegister, abortando');
      return;
    }
    
    // Criar parâmetros da requisição
    const currentParams = {
      cashRegisterId: cashRegister._id,
      startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
      endDate: format(dateRange.endDate, 'yyyy-MM-dd')
    };
    
    // Verificar se os parâmetros são iguais aos últimos
    if (lastFetchParamsRef.current && 
        JSON.stringify(currentParams) === JSON.stringify(lastFetchParamsRef.current)) {
      console.log('🟣 fetchReport: Parâmetros idênticos aos últimos, abortando');
      return;
    }
    
    // Evitar múltiplas requisições simultâneas
    if (fetchingRef.current) {
      console.log('🟣 fetchReport: Requisição já em andamento, abortando');
      return;
    }
    fetchingRef.current = true;
    lastFetchParamsRef.current = currentParams;
    
    try {
      setLoading(true);
      
      // Verificar se o componente ainda está montado
      if (!isMountedRef.current) {
        console.log('🟣 fetchReport: Componente desmontado, abortando');
        return;
      }
      
      const url = `/cash-registers/${cashRegister._id}/report?startDate=${currentParams.startDate}&endDate=${currentParams.endDate}`;
      console.log('🟣 fetchReport: Chamando API:', url);
      
      const response = await api.get(url);
      console.log('🟣 fetchReport: Resposta da API:', response.data);
      
      // Verificar novamente se o componente ainda está montado
      if (!isMountedRef.current) {
        console.log('🟣 fetchReport: Componente desmontado após resposta, abortando');
        return;
      }
      
      if (response.data.success) {
        console.log('🟣 fetchReport: Sucesso, atualizando report');
        setReport(response.data.report);
      }
    } catch (error) {
      console.error('🟣 fetchReport: Erro ao buscar relatório:', error);
      
      // Verificar se o erro é de aborto de requisição
      if (error.code === 'ECONNABORTED' || error.name === 'CanceledError') {
        console.log('🟣 fetchReport: Requisição cancelada');
        return;
      }
      
      if (isMountedRef.current) {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o relatório',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } finally {
      console.log('🟣 fetchReport: Finalizando, setando loading false');
      if (isMountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  };
  
  // Buscar relatório quando o caixa ou datas mudarem
  useEffect(() => {
    console.log('🟣 useEffect [cashRegister, dateRange]: Verificando se deve buscar relatório');
    console.log('🟣 useEffect: cashRegister:', cashRegister);
    console.log('🟣 useEffect: dateRange:', dateRange);
    console.log('🟣 useEffect: initialFetchRef.current:', initialFetchRef.current);
    
    if (cashRegister && isMountedRef.current) {
      // Marcar que a busca inicial foi feita
      if (!initialFetchRef.current) {
        console.log('🟣 useEffect: Marcando busca inicial como feita');
        initialFetchRef.current = true;
      }
      
      console.log('🟣 useEffect: Buscando relatório');
      fetchReport();
    }
  }, [cashRegister, dateRange]); // Removido fetchReport das dependências para evitar loops
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleExportCSV = () => {
    // Implementação de exportação em CSV
    toast({
      title: 'Exportação',
      description: 'Funcionalidade em desenvolvimento',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Calcular totais
  const getTotals = () => {
    if (!report) return { in: 0, out: 0, balance: 0 };
    
    const totalIn = report.totals.openings + report.totals.deposits;
    const totalOut = report.totals.withdraws + report.totals.drains;
    const balance = totalIn - totalOut;
    
    return { in: totalIn, out: totalOut, balance };
  };
  
  return (
    <Box>
      {/* Filtros de período */}
      <Flex mb={6} gap={4} flexDirection={{ base: 'column', md: 'row' }} align="center">
        <HStack>
          <Button
            size="sm"
            colorScheme={period === 'today' ? 'blue' : 'gray'}
            variant={period === 'today' ? 'solid' : 'outline'}
            onClick={() => setPeriod('today')}
          >
            Hoje
          </Button>
          <Button
            size="sm"
            colorScheme={period === 'yesterday' ? 'blue' : 'gray'}
            variant={period === 'yesterday' ? 'solid' : 'outline'}
            onClick={() => setPeriod('yesterday')}
          >
            Ontem
          </Button>
          <Button
            size="sm"
            colorScheme={period === 'week' ? 'blue' : 'gray'}
            variant={period === 'week' ? 'solid' : 'outline'}
            onClick={() => setPeriod('week')}
          >
            Últimos 7 dias
          </Button>
          <Button
            size="sm"
            colorScheme={period === 'month' ? 'blue' : 'gray'}
            variant={period === 'month' ? 'solid' : 'outline'}
            onClick={() => setPeriod('month')}
          >
            Mês Atual
          </Button>
          <Button
            size="sm"
            colorScheme={period === 'last30' ? 'blue' : 'gray'}
            variant={period === 'last30' ? 'solid' : 'outline'}
            onClick={() => setPeriod('last30')}
          >
            Últimos 30 dias
          </Button>
        </HStack>
        
        <Flex ml="auto" gap={2}>
          <DateRangePicker
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={setDateRange}
            maxDate={new Date()}
          />
          
          <Button
            leftIcon={<FiRefreshCw />}
            size="sm"
            onClick={fetchReport}
            isLoading={loading}
          >
            Atualizar
          </Button>
        </Flex>
      </Flex>
      
      {/* Exibir relatório */}
      {loading ? (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" color="blue.500" />
        </Box>
      ) : (
        <>
          {report ? (
            <Box>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md">
                  Relatório - {cashRegister.identifier} 
                 <Text as="span" fontWeight="normal" ml={2} fontSize="sm" color="gray.500">
                    ({format(new Date(dateRange.startDate), "dd/MM/yyyy", { locale: ptBR })} até {format(new Date(dateRange.endDate), "dd/MM/yyyy", { locale: ptBR })})
                  </Text>
                </Heading>
                
                <HStack>
                  <Button
                    leftIcon={<FiPrinter />}
                    size="sm"
                    onClick={handlePrint}
                  >
                    Imprimir
                  </Button>
                  <Button
                    leftIcon={<FiDownload />}
                    size="sm"
                    onClick={handleExportCSV}
                  >
                    Exportar CSV
                  </Button>
                </HStack>
              </Flex>
              
              {/* Cards com totais */}
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>Entradas</StatLabel>
                      <StatNumber color="green.500">
                        {formatCurrency(getTotals().in)}
                      </StatNumber>
                      <StatHelpText>
                        {report.transactions.filter(t => 
                          t.type === 'open' || t.type === 'deposit'
                        ).length} operações
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
                
                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>Saídas</StatLabel>
                      <StatNumber color="red.500">
                        {formatCurrency(getTotals().out)}
                      </StatNumber>
                      <StatHelpText>
                        {report.transactions.filter(t => 
                          t.type === 'withdraw' || t.type === 'drain'
                        ).length} operações
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
                
                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>Balanço</StatLabel>
                      <StatNumber 
                        color={getTotals().balance >= 0 ? "blue.500" : "red.500"}
                      >
                        {formatCurrency(getTotals().balance)}
                      </StatNumber>
                      <StatHelpText>
                        {report.transactions.length} operações totais
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </SimpleGrid>
              
              {/* Detalhes por tipo de operação */}
              <Card mb={6}>
                <CardHeader>
                  <Heading size="sm">Detalhes por Tipo de Operação</Heading>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={4}>
                    <Box>
                      <Text fontWeight="medium">Abertura</Text>
                      <Text fontSize="xl" fontWeight="bold">
                        {formatCurrency(report.totals.openings)}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {report.transactions.filter(t => t.type === 'open').length} operações
                      </Text>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="medium">Fechamentos</Text>
                      <Text fontSize="xl" fontWeight="bold">
                        {formatCurrency(report.totals.closings)}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {report.transactions.filter(t => t.type === 'close').length} operações
                      </Text>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="medium">Entradas</Text>
                      <Text fontSize="xl" fontWeight="bold" color="green.500">
                        {formatCurrency(report.totals.deposits)}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {report.transactions.filter(t => t.type === 'deposit').length} operações
                      </Text>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="medium">Retiradas</Text>
                      <Text fontSize="xl" fontWeight="bold" color="orange.500">
                        {formatCurrency(report.totals.withdraws)}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {report.transactions.filter(t => t.type === 'withdraw').length} operações
                      </Text>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="medium">Sangrias</Text>
                      <Text fontSize="xl" fontWeight="bold" color="red.500">
                        {formatCurrency(report.totals.drains)}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {report.transactions.filter(t => t.type === 'drain').length} operações
                      </Text>
                    </Box>
                  </SimpleGrid>
                </CardBody>
              </Card>
            </Box>
          ) : (
            <Box textAlign="center" py={10}>
              <Text>Nenhum dado disponível para o período selecionado.</Text>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default CashRegisterReport;