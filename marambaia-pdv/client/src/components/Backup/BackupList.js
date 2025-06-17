// src/components/Backup/BackupList.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  IconButton,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Text,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  HStack,
  useColorModeValue
} from '@chakra-ui/react';
import {
  FiDownload,
  FiRefreshCw,
  FiTrash2,
  FiRotateCcw,
  FiMoreVertical,
  FiClock
} from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../../services/api';

const BackupList = ({ onRefresh }) => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [selectedBackupId, setSelectedBackupId] = useState(null);
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  
  useEffect(() => {
    fetchBackups();
  }, []);
  
  const fetchBackups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/backups');
      
      if (response.data.success) {
        setBackups(response.data.backups);
      }
    } catch (error) {
      console.error('Erro ao carregar backups:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de backups',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownload = async (backupId) => {
    try {
      // Abrir em nova aba para download
      window.open(`${process.env.REACT_APP_API_URL}/backups/${backupId}/download`, '_blank');
    } catch (error) {
      console.error('Erro ao baixar backup:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível baixar o backup',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const handleDelete = async (backupId) => {
    try {
      const response = await api.delete(`/backups/${backupId}`);
      
      if (response.data.success) {
        toast({
          title: 'Backup excluído',
          description: 'O backup foi excluído com sucesso',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Atualizar lista
        fetchBackups();
      }
    } catch (error) {
      console.error('Erro ao excluir backup:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao excluir backup',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSyncBackups = async () => {
  try {
    setLoading(true);
    
    // Aqui você precisaria criar um endpoint para sincronização no backend
    const response = await api.post('/backups/sync');
    
    if (response.data.success) {
      toast({
        title: 'Sincronização concluída',
        description: 'A lista de backups foi sincronizada com os arquivos do servidor',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Atualizar lista
      fetchBackups();
    }
  } catch (error) {
    console.error('Erro ao sincronizar backups:', error);
    toast({
      title: 'Erro',
      description: 'Não foi possível sincronizar a lista de backups',
      status: 'error',
      duration: 3000,
      isClosable: true,
    });
  } finally {
    setLoading(false);
  }
};
  
  const handleRestore = async (backupId) => {
    try {
      setRestoring(true);
      setSelectedBackupId(backupId);
      
      const response = await api.post(`/backups/${backupId}/restore`);
      
      if (response.data.success) {
        toast({
          title: 'Backup restaurado',
          description: 'O backup foi restaurado com sucesso. A página será recarregada.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Notificar o componente pai
        if (onRefresh) onRefresh();
        
        // Recarregar a página após 2 segundos
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao restaurar backup',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setRestoring(false);
      setSelectedBackupId(null);
    }
  };
  
  // Formatar data
  const formatDate = (dateString) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };
  
  if (loading) {
    return (
      <Flex justify="center" align="center" p={8}>
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }
  
  if (backups.length === 0) {
    return (
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Text>
          Nenhum backup encontrado. Clique em "Fazer Backup" para criar o primeiro backup.
        </Text>
      </Alert>
    );
  }
  
  return (
    <Box overflowX="auto">
      <Table variant="simple" bg={bgColor} shadow="sm" borderRadius="md">
        <Thead>
          <Tr>
            <Th>Nome</Th>
            <Th>Data de Criação</Th>
            <Th>Criado por</Th>
            <Th>Tamanho</Th>
            <Th>Status</Th>
            <Th width="100px">Ações</Th>
          </Tr>
        </Thead>
        <Tbody>
          {backups.map((backup) => (
            <Tr key={backup.id}>
              <Td fontWeight="medium">{backup.filename}</Td>
              <Td>{formatDate(backup.createdAt)}</Td>
              <Td>{backup.createdBy}</Td>
              <Td>{backup.sizeFormatted}</Td>
              <Td>
                {backup.lastRestored ? (
                  <HStack>
                    <Badge colorScheme="green">Restaurado</Badge>
                    <Text fontSize="xs" color="gray.500">
                      {formatDate(backup.lastRestored)}
                    </Text>
                  </HStack>
                ) : (
                  <Badge>Disponível</Badge>
                )}
              </Td>
              <Td>
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<FiMoreVertical />}
                    variant="ghost"
                    size="sm"
                  />
                  <Button
                leftIcon={<FiRefreshCw />}
                variant="outline"
                size="sm"
                onClick={handleSyncBackups}
                isLoading={loading}
                >
                Sincronizar Backups
                </Button>
                  <MenuList>
                    <MenuItem 
                      icon={<FiDownload />} 
                      onClick={() => handleDownload(backup.id)}
                    >
                      Download
                    </MenuItem>
                    <MenuItem 
                      icon={<FiRotateCcw />} 
                      onClick={() => handleRestore(backup.id)}
                      isDisabled={restoring}
                    >
                      Restaurar
                    </MenuItem>
                    <MenuItem 
                      icon={<FiTrash2 />} 
                      onClick={() => handleDelete(backup.id)}
                      color="red.500"
                    >
                      Excluir
                    </MenuItem>
                  </MenuList>
                </Menu>
                {restoring && selectedBackupId === backup.id && (
                  <Spinner size="sm" ml={2} color="blue.500" />
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default BackupList;