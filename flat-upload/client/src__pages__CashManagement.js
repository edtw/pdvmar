// src/pages/CashManagement.js - VERSÃO COM LOGS DETALHADOS
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  SimpleGrid,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useDisclosure,
  useToast,
  useColorModeValue,
  HStack,
  IconButton,
  Card,
  CardBody,
  CardHeader,
  Divider,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiMinus,
  FiDollarSign,
  FiRefreshCw,
  FiPower,
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';
import { format, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componentes
import OpenCashModal from '../components/CashRegister/OpenCashModal';
import CloseCashModal from '../components/CashRegister/CloseCashModal';
import AddCashModal from '../components/CashRegister/AddCashModal';
import WithdrawCashModal from '../components/CashRegister/WithdrawCashModal';
import DrainCashModal from '../components/CashRegister/DrainCashModal';
import TransactionList from '../components/CashRegister/TransactionList';
import CashRegisterReport from '../components/CashRegister/CashRegisterReport';
import CashRegisterCard from '../components/CashRegister/CashRegisterCard';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import DateRangePicker from '../components/ui/DateRangePicker';

const CashManagement = () => {
  console.log('🔵 CashManagement: Renderizando componente');
  
  const { user } = useAuth();
  const { socket, connected, joinCashRoom } = useSocket();
  const [cashRegisters, setCashRegisters] = useState([]);
  const [selectedCashRegister, setSelectedCashRegister] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 7),
    endDate: new Date()
  });
  
  // Logs para os estados
  console.log('🔷 CashManagement: Estado atual - loading:', loading);
  console.log('🔷 CashManagement: Estado atual - cashRegisters:', cashRegisters);
  console.log('🔷 CashManagement: Estado atual - selectedCashRegister:', selectedCashRegister);
  
  // Refs para controlar requisições
  const isMountedRef = useRef(true);
  const fetchCashRegistersRef = useRef(false);
  const fetchTransactionsRef = useRef(false);
  const initialFetchRef = useRef(false);
  const socketSetupRef = useRef(false);
  
  // Modais
  const {
    isOpen: isOpenCashOpen,
    onOpen: onOpenCashOpen,
    onClose: onOpenCashClose
  } = useDisclosure();
  
  const {
    isOpen: isCloseCashOpen,
    onOpen: onCloseCashOpen,
    onClose: onCloseCashClose
  } = useDisclosure();
  
  const {
    isOpen: isAddCashOpen,
    onOpen: onAddCashOpen,
    onClose: onAddCashClose
  } = useDisclosure();
  
  const {
    isOpen: isWithdrawCashOpen,
    onOpen: onWithdrawCashOpen,
    onClose: onWithdrawCashClose
  } = useDisclosure();
  
  const {
    isOpen: isDrainCashOpen,
    onOpen: onDrainCashOpen,
    onClose: onDrainCashClose
  } = useDisclosure();
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  
  // Buscar caixas
  const fetchCashRegisters = useCallback(async () => {
    console.log('🟡 fetchCashRegisters: Iniciando busca de caixas');
    console.log('🟡 fetchCashRegisters: fetchCashRegistersRef.current:', fetchCashRegistersRef.current);
    console.log('🟡 fetchCashRegisters: isMountedRef.current:', isMountedRef.current);
    
    // Evitar múltiplas requisições simultâneas
    if (fetchCashRegistersRef.current) {
      console.log('⚠️ fetchCashRegisters: Requisição já em andamento, abortando');
      return;
    }
    fetchCashRegistersRef.current = true;
    
    try {
      setLoading(true);
      console.log('🟡 fetchCashRegisters: Chamando API /cash-registers');
      
      // Verificar se o componente ainda está montado
      if (!isMountedRef.current) {
        console.log('⚠️ fetchCashRegisters: Componente desmontado, abortando');
        return;
      }
      
      const response = await api.get('/cash-registers');
      console.log('🟡 fetchCashRegisters: Resposta da API:', response.data);
      
      // Verificar novamente se o componente ainda está montado
      if (!isMountedRef.current) {
        console.log('⚠️ fetchCashRegisters: Componente desmontado após resposta, abortando');
        return;
      }
      
      if (response.data.success) {
        console.log('✅ fetchCashRegisters: Sucesso, atualizando cashRegisters');
        setCashRegisters(response.data.cashRegisters);
        
        // Selecionar o primeiro caixa por padrão se não houver seleção
        if (!selectedCashRegister && response.data.cashRegisters.length > 0) {
          console.log('🟡 fetchCashRegisters: Selecionando primeiro caixa por padrão');
          setSelectedCashRegister(response.data.cashRegisters[0]);
        } else if (selectedCashRegister) {
          // Atualizar o caixa selecionado com os dados mais recentes
          const updated = response.data.cashRegisters.find(
            cr => cr._id === selectedCashRegister._id
          );
          if (updated) {
            console.log('🟡 fetchCashRegisters: Atualizando caixa selecionado');
            setSelectedCashRegister(updated);
          }
        }
      }
    } catch (error) {
      console.error('❌ fetchCashRegisters: Erro ao buscar caixas:', error);
      
      // Verificar se o erro é de aborto de requisição
      if (error.code === 'ECONNABORTED' || error.name === 'CanceledError') {
        console.log('⚠️ fetchCashRegisters: Requisição cancelada');
        return;
      }
      
      if (isMountedRef.current) {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os caixas',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } finally {
      console.log('🟡 fetchCashRegisters: Finalizando, setando loading false');
      if (isMountedRef.current) {
        setLoading(false);
      }
      fetchCashRegistersRef.current = false;
    }
  }, [selectedCashRegister, toast]);
  
  // Buscar transações do caixa selecionado
const fetchTransactions = useCallback(async () => {
  if (!selectedCashRegister) {
    return;
  }
  
  // Evitar múltiplas requisições simultâneas
  if (fetchTransactionsRef.current) {
    return;
  }
  fetchTransactionsRef.current = true;
  
  try {
    setTransactionsLoading(true);
    
    // Verificar se o componente ainda está montado
    if (!isMountedRef.current) {
      return;
    }
    
    // Obter timestamps ISO para início e fim do período
    const startTimestamps = getFullDayTimestamps(dateRange.startDate);
    const endTimestamps = getFullDayTimestamps(dateRange.endDate);
    
    // Adicionar timestamp para evitar cache
    const timestamp = new Date().getTime();
    
    // Construir parâmetros com URLSearchParams
    const params = new URLSearchParams({
      startDate: startTimestamps.startDate,
      endDate: endTimestamps.endDate,
      _t: timestamp.toString()
    });
    
    const url = `/cash-registers/${selectedCashRegister._id}/transactions?${params.toString()}`;
    console.log('CashManagement: Buscando transações com URL:', url);
    
    const response = await api.get(url);
    
    // Verificar novamente se o componente ainda está montado
    if (!isMountedRef.current) {
      return;
    }
    
    if (response.data.success) {
      console.log('CashManagement: Transações recebidas:', response.data.transactions.length);
      setTransactions(response.data.transactions);
    }
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    
    // Verificar se o erro é de aborto de requisição
    if (error.code === 'ECONNABORTED' || error.name === 'CanceledError') {
      return;
    }
    
    if (isMountedRef.current) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as transações',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  } finally {
    if (isMountedRef.current) {
      setTransactionsLoading(false);
    }
    fetchTransactionsRef.current = false;
  }
}, [selectedCashRegister, dateRange, toast]);

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
  
  // Cleanup quando o componente for desmontado
  useEffect(() => {
    console.log('🔸 useEffect [Mount/Unmount]: Componente montado');
    isMountedRef.current = true;
    
    return () => {
      console.log('🔸 useEffect [Mount/Unmount]: Componente desmontado');
      isMountedRef.current = false;
    };
  }, []);
  
  // Efeito inicial
  useEffect(() => {
    console.log('🔸 useEffect [Initial]: Verificando se deve buscar dados iniciais');
    console.log('🔸 useEffect [Initial]: initialFetchRef.current:', initialFetchRef.current);
    
    if (!initialFetchRef.current && isMountedRef.current) {
      console.log('🔸 useEffect [Initial]: Buscando dados iniciais');
      initialFetchRef.current = true;
      fetchCashRegisters();
    } else {
      console.log('🔸 useEffect [Initial]: Dados iniciais já buscados ou componente desmontado');
    }
  }, [fetchCashRegisters]);
  
  // Efeito quando o caixa selecionado muda
  useEffect(() => {
    console.log('🔸 useEffect [selectedCashRegister]: selectedCashRegister mudou:', selectedCashRegister);
    
    if (selectedCashRegister && isMountedRef.current) {
      console.log('🔸 useEffect [selectedCashRegister]: Buscando transações');
      fetchTransactions();
    } else {
      console.log('🔸 useEffect [selectedCashRegister]: Não buscando transações (sem caixa selecionado ou componente desmontado)');
    }
  }, [selectedCashRegister, fetchTransactions]);
  
  // Setup de socket
  useEffect(() => {
    console.log('🔸 useEffect [Socket]: Configurando socket');
    console.log('🔸 useEffect [Socket]: connected:', connected);
    console.log('🔸 useEffect [Socket]: socket:', socket);
    console.log('🔸 useEffect [Socket]: socketSetupRef.current:', socketSetupRef.current);
    
    if (connected && socket && isMountedRef.current && !socketSetupRef.current) {
      console.log('🔸 useEffect [Socket]: Configurando listeners');
      socketSetupRef.current = true;
      
      joinCashRoom();
      
      const handleCashRegisterUpdate = ({ cashRegisterId, timestamp }) => {
        console.log('📡 Socket: Recebeu cashRegisterUpdate:', cashRegisterId, timestamp);
        
        if (!isMountedRef.current) {
          console.log('📡 Socket: Componente desmontado, ignorando evento');
          return;
        }
        
        console.log('📡 Socket: Atualizando dados devido a cashRegisterUpdate');
        fetchCashRegisters();
        
        if (selectedCashRegister && selectedCashRegister._id === cashRegisterId) {
          console.log('📡 Socket: Atualizando transações do caixa selecionado');
          fetchTransactions();
        }
      };
      
      const handleDataUpdate = ({ timestamp }) => {
        console.log('📡 Socket: Recebeu dataUpdate:', timestamp);
        
        if (!isMountedRef.current) {
          console.log('📡 Socket: Componente desmontado, ignorando evento');
          return;
        }
        
        console.log('📡 Socket: Atualizando dados devido a dataUpdate');
        fetchCashRegisters();
        
        if (selectedCashRegister) {
          console.log('📡 Socket: Atualizando transações do caixa selecionado');
          fetchTransactions();
        }
      };
      
      socket.on('cashRegisterUpdate', handleCashRegisterUpdate);
      socket.on('dataUpdate', handleDataUpdate);
      
      return () => {
        console.log('🔸 useEffect [Socket]: Removendo listeners');
        if (socket) {
          socket.off('cashRegisterUpdate', handleCashRegisterUpdate);
          socket.off('dataUpdate', handleDataUpdate);
        }
        socketSetupRef.current = false;
      };
    } else {
      console.log('🔸 useEffect [Socket]: Não configurando socket (condições não atendidas)');
    }
  }, [connected, socket, fetchCashRegisters, fetchTransactions, selectedCashRegister]);
  
  // Formatar moeda
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Selecionar caixa
  const handleSelectCashRegister = (cashRegister) => {
    console.log('🔹 handleSelectCashRegister: Selecionando caixa:', cashRegister);
    setSelectedCashRegister(cashRegister);
  };
  
  // Ações do caixa
  const handleOpenCash = () => {
    if (!selectedCashRegister) return;
    onOpenCashOpen();
  };
  
  const handleCloseCash = () => {
    if (!selectedCashRegister) return;
    onCloseCashOpen();
  };
  
  const handleAddCash = () => {
    if (!selectedCashRegister) return;
    onAddCashOpen();
  };
  
  const handleWithdrawCash = () => {
    if (!selectedCashRegister) return;
    onWithdrawCashOpen();
  };
  
  const handleDrainCash = () => {
    if (!selectedCashRegister) return;
    onDrainCashOpen();
  };
  
  // Callback para quando uma operação é concluída
  const handleOperationSuccess = () => {
    console.log('🔹 handleOperationSuccess: Operação concluída, atualizando dados');
    fetchCashRegisters();
    fetchTransactions();
  };
  
  // Renderizar lista de caixas
  const renderCashRegisters = () => {
    console.log('🔹 renderCashRegisters: Renderizando lista de caixas');
    console.log('🔹 renderCashRegisters: loading:', loading);
    console.log('🔹 renderCashRegisters: cashRegisters:', cashRegisters);
    
    if (loading) {
      return <LoadingOverlay />;
    }
    
    if (cashRegisters.length === 0) {
      return (
        <Box p={4} textAlign="center">
          <Text fontSize="lg" mb={4}>
            Nenhum caixa cadastrado
          </Text>
          {(user.role === 'admin' || user.role === 'manager') && (
            <Button
              leftIcon={<FiPlus />}
              colorScheme="blue"
              onClick={() => {
                toast({
                  title: 'Funcionalidade em desenvolvimento',
                  status: 'info',
                  duration: 3000,
                  isClosable: true,
                });
              }}
            >
              Criar Caixa
            </Button>
          )}
        </Box>
      );
    }
    
    return (
      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
        {cashRegisters.map((cashRegister) => (
          <CashRegisterCard
            key={cashRegister._id}
            cashRegister={cashRegister}
            isSelected={selectedCashRegister?._id === cashRegister._id}
            onClick={() => handleSelectCashRegister(cashRegister)}
            formatCurrency={formatCurrency}
          />
        ))}
      </SimpleGrid>
    );
  };
  
  return (
    <Box>
      {/* Cabeçalho */}
      <Flex 
        justifyContent="space-between" 
        alignItems="center" 
        mb={6}
        flexDirection={{ base: 'column', md: 'row' }}
        gap={4}
      >
        <Box>
          <Heading size="lg">Gestão de Caixa</Heading>
          <Text color="gray.500">Controle de movimentações financeiras</Text>
        </Box>
        
        <HStack spacing={2}>
          <IconButton
            icon={<FiRefreshCw />}
            aria-label="Atualizar"
            onClick={() => {
              console.log('🔹 Botão Atualizar: Atualizando dados manualmente');
              fetchCashRegisters();
              fetchTransactions();
            }}
            isLoading={loading}
          />
          
          {(user.role === 'admin' || user.role === 'manager') && (
            <Button
              leftIcon={<FiPlus />}
              colorScheme="blue"
              onClick={() => {
                toast({
                  title: 'Funcionalidade em desenvolvimento',
                  status: 'info',
                  duration: 3000,
                  isClosable: true,
                });
              }}
            >
              Novo Caixa
            </Button>
          )}
        </HStack>
      </Flex>
      
      {/* Lista de Caixas */}
      <Box mb={6}>
        <Heading size="md" mb={4}>Caixas Disponíveis</Heading>
        {renderCashRegisters()}
      </Box>
      
      {/* Detalhes do Caixa Selecionado */}
      {selectedCashRegister && (
        <Box>
          <Flex 
            justify="space-between" 
            align="center" 
            mb={4}
            flexDirection={{ base: 'column', md: 'row' }}
            gap={2}
          >
            <Heading size="md">
              Caixa {selectedCashRegister.identifier}
              <Badge 
                ml={2} 
                colorScheme={selectedCashRegister.status === 'open' ? 'green' : 'gray'}
              >
                {selectedCashRegister.status === 'open' ? 'Aberto' : 'Fechado'}
              </Badge>
            </Heading>
            
            <HStack>
              {selectedCashRegister.status === 'open' ? (
                <>
                  <Button
                    leftIcon={<FiPlus />}
                    colorScheme="green"
                    size="sm"
                    onClick={handleAddCash}
                  >
                    Inserir
                  </Button>
                  <Button
                    leftIcon={<FiMinus />}
                    colorScheme="red"
                    size="sm"
                    onClick={handleWithdrawCash}
                  >
                    Retirar
                  </Button>
                  <Button
                    leftIcon={<FiDollarSign />}
                    colorScheme="orange"
                    size="sm"
                    onClick={handleDrainCash}
                  >
                    Sangria
                  </Button>
                  <Button
                    leftIcon={<FiPower />}
                    size="sm"
                    onClick={handleCloseCash}
                  >
                    Fechar Caixa
                  </Button>
                </>
              ) : (
                <Button
                  leftIcon={<FiPower />}
                  colorScheme="blue"
                  onClick={handleOpenCash}
                >
                  Abrir Caixa
                </Button>
              )}
            </HStack>
          </Flex>
          
          {/* Status do Caixa */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Saldo Atual</StatLabel>
                  <StatNumber>{formatCurrency(selectedCashRegister.currentBalance)}</StatNumber>
                  {selectedCashRegister.status === 'open' && selectedCashRegister.openedAt && (
                    <StatHelpText>
                      Desde {format(new Date(selectedCashRegister.openedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </StatHelpText>
                  )}
                </Stat>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Operador</StatLabel>
                  <StatNumber>
                    {selectedCashRegister.currentOperator 
                      ? selectedCashRegister.currentOperator.name 
                      : 'Nenhum operador'}
                  </StatNumber>
                  <StatHelpText>
                    {selectedCashRegister.status === 'open' 
                      ? 'Caixa em operação' 
                      : 'Caixa fechado'}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>
                    {selectedCashRegister.status === 'open' 
                      ? 'Saldo Inicial' 
                      : 'Último Fechamento'}
                  </StatLabel>
                  <StatNumber>
                    {selectedCashRegister.status === 'open' 
                      ? formatCurrency(selectedCashRegister.openingBalance)
                      : formatCurrency(selectedCashRegister.closingBalance || 0)}
                  </StatNumber>
                  <StatHelpText>
                    {selectedCashRegister.status === 'open'
                      ? 'Valor de abertura'
                      : selectedCashRegister.closedAt 
                        ? `Fechado em ${format(new Date(selectedCashRegister.closedAt), "dd/MM/yyyy", { locale: ptBR })}`
                        : 'Nunca utilizado'}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
          
          {/* Tabs para Transações e Relatórios */}
          <Tabs colorScheme="blue" variant="enclosed">
            <TabList>
              <Tab>Transações</Tab>
              <Tab>Relatórios</Tab>
            </TabList>
            
            <TabPanels>
              {/* Transações */}
              <TabPanel px={0}>
                <Flex justify="space-between" align="center" mb={4}>
                  <Heading size="sm">Histórico de Transações</Heading>
                  
                  <HStack>
                    <DateRangePicker
                      startDate={dateRange.startDate}
                      endDate={dateRange.endDate}
                      onChange={setDateRange}
                      maxDate={new Date()}
                    />
                    
                    <Button
                      leftIcon={<FiRefreshCw />}
                      size="sm"
                      onClick={fetchTransactions}
                      isLoading={transactionsLoading}
                    >
                      Atualizar
                    </Button>
                  </HStack>
                </Flex>
                
                <TransactionList
                  transactions={transactions}
                  loading={transactionsLoading}
                  formatCurrency={formatCurrency}
                />
              </TabPanel>
              
              {/* Relatórios */}
              <TabPanel px={0}>
                <CashRegisterReport
                  cashRegister={selectedCashRegister}
                  formatCurrency={formatCurrency}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      )}
      
      {/* Modais */}
      {selectedCashRegister && (
        <>
          <OpenCashModal
            isOpen={isOpenCashOpen}
            onClose={onOpenCashClose}
            cashRegister={selectedCashRegister}
            onSuccess={handleOperationSuccess}
          />
          
          <CloseCashModal
            isOpen={isCloseCashOpen}
            onClose={onCloseCashClose}
            cashRegister={selectedCashRegister}
            onSuccess={handleOperationSuccess}
          />
          
          <AddCashModal
            isOpen={isAddCashOpen}
            onClose={onAddCashClose}
            cashRegister={selectedCashRegister}
            onSuccess={handleOperationSuccess}
          />
          
          <WithdrawCashModal
            isOpen={isWithdrawCashOpen}
            onClose={onWithdrawCashClose}
            cashRegister={selectedCashRegister}
            onSuccess={handleOperationSuccess}
          />
          
          <DrainCashModal
            isOpen={isDrainCashOpen}
            onClose={onDrainCashClose}
            cashRegister={selectedCashRegister}
            onSuccess={handleOperationSuccess}
          />
        </>
      )}
    </Box>
  );
};

export default CashManagement;