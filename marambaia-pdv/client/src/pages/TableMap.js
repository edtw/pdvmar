// src/pages/TableMap.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Heading,
  HStack,
  Flex,
  Text,
  Badge,
  Button,
  useDisclosure,
  useToast,
  IconButton,
  Select,
  useColorModeValue
} from '@chakra-ui/react';
import {
  FiPlus,
  FiRefreshCw,
  FiGrid,
  FiList
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// Modais
import TableFormModal from '../components/Tables/TableFormModal';
import OpenTableModal from '../components/Tables/OpenTableModal';
import CloseTableModal from '../components/Tables/CloseTableModal';
import TransferTableModal from '../components/Tables/TransferTableModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

// Componentes
import TableCard from '../components/Tables/TableCard';
import TableListItem from '../components/Tables/TableListItem';
import LoadingOverlay from '../components/ui/LoadingOverlay';

// Socket
import { io } from 'socket.io-client';

const TableMap = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  
  // Estado
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  const [filterStatus, setFilterStatus] = useState('all');
  const [socket, setSocket] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Modais
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose
  } = useDisclosure();
  
  const {
    isOpen: isOpenTableOpen,
    onOpen: onOpenTableOpen,
    onClose: onOpenTableClose
  } = useDisclosure();
  
  const {
    isOpen: isCloseTableOpen,
    onOpen: onCloseTableOpen,
    onClose: onCloseTableClose
  } = useDisclosure();
  
  const {
    isOpen: isTransferTableOpen,
    onOpen: onTransferTableOpen,
    onClose: onTransferTableClose
  } = useDisclosure();
  
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose
  } = useDisclosure();
  
  // Carregar mesas
  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/tables');
      if (response.data.success) {
        setTables(response.data.tables);
      }
    } catch (error) {
      console.error('Erro ao carregar mesas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as mesas',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  // Inicializar Socket.io
  useEffect(() => {
    // Configurar socket
    const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    setSocket(socketInstance);
    
    // Entrar na sala de mesas
    socketInstance.emit('joinTableRoom');
    
    // Ouvir atualizações de mesas
    socketInstance.on('tableUpdate', ({ tableId }) => {
      console.log('Atualização de mesa recebida:', tableId);
      fetchTables();
    });
    
    // Limpeza ao desmontar componente
    return () => {
      socketInstance.off('tableUpdate');
      socketInstance.disconnect();
    };
  }, [fetchTables]);
  
  // Carregar mesas ao montar componente
  useEffect(() => {
    fetchTables();
  }, [fetchTables]);
  
  // Abrir modal de mesa
  const handleOpenTable = (table) => {
    setSelectedTable(table);
    onOpenTableOpen();
  };
  
  // Fechar mesa
  const handleCloseTable = (table) => {
    setSelectedTable(table);
    onCloseTableOpen();
  };
  
  // Transferir mesa
  const handleTransferTable = (table) => {
    setSelectedTable(table);
    onTransferTableOpen();
  };
  
  // Ver detalhes / pedido da mesa
  const handleViewOrder = (table) => {
    if (table.currentOrder && typeof table.currentOrder === 'string') {
      navigate(`/orders/${table.currentOrder}`);
    } else if (table.currentOrder && table.currentOrder._id) {
      navigate(`/orders/${table.currentOrder._id}`);
    } else {
      toast({
        title: 'Sem pedido',
        description: 'Esta mesa não possui um pedido em aberto',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Abrir diálogo de exclusão da mesa
  const handleDeleteTable = (table) => {
    if (table.status !== 'free') {
      toast({
        title: 'Mesa ocupada',
        description: 'Não é possível excluir uma mesa ocupada',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setSelectedTable(table);
    onDeleteOpen();
  };
  
  // Confirmar exclusão da mesa
  const confirmDeleteTable = async () => {
    try {
      setIsDeleting(true);
      const response = await api.delete(`/tables/${selectedTable._id}`);
      
      if (response.data.success) {
        toast({
          title: 'Mesa excluída',
          description: `Mesa ${selectedTable.number} excluída com sucesso`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        fetchTables();
        onDeleteClose();
      }
    } catch (error) {
      console.error('Erro ao excluir mesa:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao excluir mesa',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Filtrar mesas por status
  const filteredTables = tables.filter(table => {
    if (filterStatus === 'all') return true;
    return table.status === filterStatus;
  });
  
  // Ordenar mesas
  const sortedTables = [...filteredTables].sort((a, b) => {
    // Primeiro por número (assumindo que é numérico)
    const numA = parseInt(a.number);
    const numB = parseInt(b.number);
    return isNaN(numA) || isNaN(numB) ? a.number.localeCompare(b.number) : numA - numB;
  });
  
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';
  const isWaiter = user?.role === 'waiter';
  
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
          <Heading size="lg">Mesas</Heading>
          <Text color="gray.500">Gerenciamento de mesas e pedidos</Text>
        </Box>
        
        <HStack spacing={2}>
          {/* Filtro de status */}
          <Select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            size="sm"
            maxW="200px"
          >
            <option value="all">Todas as mesas</option>
            <option value="free">Livres</option>
            <option value="occupied">Ocupadas</option>
            <option value="waiting_payment">Aguardando pagamento</option>
          </Select>
          
          {/* Botões de visualização */}
          <IconButton
            icon={<FiGrid />}
            aria-label="Visualização em grade"
            variant={viewMode === 'grid' ? 'solid' : 'outline'}
            colorScheme="blue"
            onClick={() => setViewMode('grid')}
            size="sm"
          />
          <IconButton
            icon={<FiList />}
            aria-label="Visualização em lista"
            variant={viewMode === 'list' ? 'solid' : 'outline'}
            colorScheme="blue"
            onClick={() => setViewMode('list')}
            size="sm"
          />
          
          {/* Reload */}
          <IconButton
            icon={<FiRefreshCw />}
            aria-label="Atualizar"
            onClick={fetchTables}
            isLoading={loading}
            size="sm"
          />
          
          {/* Adicionar mesa (apenas admin/gerente) */}
          {isAdmin && (
            <Button
              leftIcon={<FiPlus />}
              colorScheme="blue"
              onClick={onCreateOpen}
              size="sm"
            >
              Nova Mesa
            </Button>
          )}
        </HStack>
      </Flex>
      
      {/* Lista/Grade de Mesas */}
      {loading ? (
        <LoadingOverlay />
      ) : (
        <>
          {/* Legenda */}
          <Flex mb={4} gap={4} wrap="wrap">
            <HStack>
              <Badge colorScheme="green" p={1} borderRadius="md">
                Livre
              </Badge>
              <Text fontSize="sm">Mesa disponível</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="yellow" p={1} borderRadius="md">
                Ocupada
              </Badge>
              <Text fontSize="sm">Mesa com clientes</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="red" p={1} borderRadius="md">
                Pagamento
              </Badge>
              <Text fontSize="sm">Aguardando pagamento</Text>
            </HStack>
          </Flex>
          
          {viewMode === 'grid' ? (
            <Grid 
              templateColumns={{ 
                base: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
                xl: 'repeat(5, 1fr)'
              }}
              gap={4}
            >
              {sortedTables.map(table => (
                <TableCard
                  key={table._id}
                  table={table}
                  onOpen={() => handleOpenTable(table)}
                  onClose={() => handleCloseTable(table)}
                  onTransfer={() => handleTransferTable(table)}
                  onViewOrder={() => handleViewOrder(table)}
                  onDelete={() => handleDeleteTable(table)}
                  isWaiter={isWaiter}
                  isAdmin={isAdmin}
                />
              ))}
            </Grid>
          ) : (
            <Box 
              borderRadius="md" 
              overflow="hidden" 
              boxShadow="sm"
              bg={bgColor}
            >
              {sortedTables.map(table => (
                <TableListItem
                  key={table._id}
                  table={table}
                  onOpen={() => handleOpenTable(table)}
                  onClose={() => handleCloseTable(table)}
                  onTransfer={() => handleTransferTable(table)}
                  onViewOrder={() => handleViewOrder(table)}
                  onDelete={() => handleDeleteTable(table)}
                  isWaiter={isWaiter}
                  isAdmin={isAdmin}
                />
              ))}
              
              {sortedTables.length === 0 && (
                <Box p={4} textAlign="center">
                  <Text color="gray.500">Nenhuma mesa encontrada</Text>
                </Box>
              )}
            </Box>
          )}
        </>
      )}
      
      {/* Modais */}
      <TableFormModal 
        isOpen={isCreateOpen} 
        onClose={onCreateClose} 
        onSuccess={fetchTables} 
      />
      
      <OpenTableModal 
        isOpen={isOpenTableOpen} 
        onClose={onOpenTableClose} 
        table={selectedTable}
        onSuccess={fetchTables}
      />
      
      <CloseTableModal 
        isOpen={isCloseTableOpen} 
        onClose={onCloseTableClose} 
        table={selectedTable}
        onSuccess={fetchTables}
      />
      
      <TransferTableModal 
        isOpen={isTransferTableOpen} 
        onClose={onTransferTableClose} 
        table={selectedTable}
        tables={tables.filter(t => t.status === 'free')}
        onSuccess={fetchTables}
      />
      
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={confirmDeleteTable}
        title="Excluir Mesa"
        message={`Tem certeza que deseja excluir a mesa ${selectedTable?.number}? Esta ação não pode ser desfeita.`}
        isLoading={isDeleting}
      />
    </Box>
  );
};

export default TableMap;