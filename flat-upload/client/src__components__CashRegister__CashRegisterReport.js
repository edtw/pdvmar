// src/components/CashRegister/CashRegisterReport.js - VERSÃO CORRIGIDA
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { format, subDays, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../../services/api';
import DateRangePicker from '../ui/DateRangePicker';

const CashRegisterReport = ({ cashRegister, formatCurrency }) => {
  const [period, setPeriod] = useState('today');
  const [dateRange, setDateRange] = useState({
    startDate: startOfDay(new Date()),
    endDate: endOfDay(new Date())
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Refs para controlar requisições
  const isMountedRef = useRef(true);
  const fetchingRef = useRef(false);
  const initialFetchRef = useRef(false);
  const lastFetchParamsRef = useRef(null);
  
  const toast = useToast();
  
  // Função para obter timestamps ISO considerando o fuso horário local
  const getFullDayTimestamps = (date) => {
    // Criar data completa para início (00:00:00.000) e fim (23:59:59.999) do dia
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Retornar como strings ISO
    return {
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString()
    };
  };
  
  // Função para gerar string de data formatada para API
  const getFormattedDateRange = () => {
    // Obter timestamps ISO para início e fim do período selecionado
    const startTimestamps = getFullDayTimestamps(dateRange.startDate);
    const endTimestamps = getFullDayTimestamps(dateRange.endDate);
    
    console.log('CashRegisterReport: Intervalo de datas para API:', {
      startLocal: dateRange.startDate.toString(),
      endLocal: dateRange.endDate.toString(),
      startISO: startTimestamps.startDate,
      endISO: endTimestamps.endDate
    });
    
    return {
      startDate: startTimestamps.startDate,
      endDate: endTimestamps.endDate
    };
  };
  
  // Cleanup quando o componente for desmontado
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Atualizar intervalo de datas baseado no período
  useEffect(() => {
    const today = new Date();
    let startDate, endDate;
    
    switch (period) {
      case 'today':
        startDate = startOfDay(today);
        endDate = endOfDay(today);
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        startDate = startOfDay(yesterday);
        endDate = endOfDay(yesterday);
        break;
      case 'week':
        startDate = startOfDay(subDays(today, 7));
        endDate = endOfDay(today);
        break;
      case 'month':
        startDate = startOfDay(startOfMonth(today));
        endDate = endOfDay(today);
        break;
      case 'full-month':
        startDate = startOfDay(startOfMonth(today));
        endDate = endOfDay(endOfMonth(today));
        break;
      case 'last30':
        startDate = startOfDay(subDays(today, 30));
        endDate = endOfDay(today);
        break;
      default:
        startDate = startOfDay(today);
        endDate = endOfDay(today);
    }
    
    setDateRange({ startDate, endDate });
  }, [period]);
  
  // Buscar relatório
  const fetchReport = useCallback(async () => {
    if (!cashRegister) {
      return;
    }
    
    // Criar parâmetros da requisição
    const currentParams = {
      cashRegisterId: cashRegister._id,
      ...getFormattedDateRange()
    };
    
    // Verificar se os parâmetros são iguais aos últimos
    if (lastFetchParamsRef.current && 
        JSON.stringify(currentParams) === JSON.stringify(lastFetchParamsRef.current)) {
      return;
    }
    
    // Evitar múltiplas requisições simultâneas
    if (fetchingRef.current) {
      return;
    }
    fetchingRef.current = true;
    lastFetchParamsRef.current = currentParams;
    
    try {
      setLoading(true);
      
      // Verificar se o componente ainda está montado
      if (!isMountedRef.current) {
        return;
      }
      
      // Adicionar timestamp para garantir que não seja cacheado
      const timestamp = new Date().getTime();
      
      // Construir URL com parâmetros
      const params = new URLSearchParams({
        startDate: currentParams.startDate,
        endDate: currentParams.endDate,
        _t: timestamp.toString() // Parâmetro para evitar cache
      });
      
      const url = `/cash-registers/${cashRegister._id}/report?${params.toString()}`;
      console.log('CashRegisterReport: Buscando relatório:', url);
      
      const response = await api.get(url);
      
      // Verificar novamente se o componente ainda está montado
      if (!isMountedRef.current) {
        return;
      }
      
      if (response.data.success) {
        setReport(response.data.report);
      }
    } catch (error) {
      console.error('Erro ao buscar relatório do caixa:', error);
      
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
      if (isMountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, [cashRegister, dateRange, toast]);
  
  // Buscar relatório quando o caixa ou datas mudarem
  useEffect(() => {
    if (cashRegister && isMountedRef.current) {
      // Marcar que a busca inicial foi feita
      if (!initialFetchRef.current) {
        initialFetchRef.current = true;
      }
      
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
  
  // Forçar atualização manual
  const forceRefresh = () => {
    // Redefinir refs para permitir nova busca
    fetchingRef.current = false;
    lastFetchParamsRef.current = null;
    fetchReport();
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
            onClick={forceRefresh}
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
                    ({format(dateRange.startDate, "dd/MM/yyyy", { locale: ptBR })} até {format(dateRange.endDate, "dd/MM/yyyy", { locale: ptBR })})
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