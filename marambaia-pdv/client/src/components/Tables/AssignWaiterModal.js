// src/components/Tables/AssignWaiterModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Select,
  useToast,
  Box,
  Text
} from '@chakra-ui/react';
import api from '../../services/api';

const AssignWaiterModal = ({ isOpen, onClose, table, onSuccess }) => {
  const [waiters, setWaiters] = useState([]);
  const [selectedWaiter, setSelectedWaiter] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingWaiters, setFetchingWaiters] = useState(false);
  const toast = useToast();

  // Buscar todos os garçons disponíveis
  const fetchWaiters = async () => {
    setFetchingWaiters(true);
    try {
      const response = await api.get('/users?role=waiter');
      if (response.data.success) {
        setWaiters(response.data.users.filter(user => user.active));
        
        // Pré-selecionar o garçom atual da mesa, se houver
        if (table && table.waiter && table.waiter._id) {
          setSelectedWaiter(table.waiter._id);
        } else {
          setSelectedWaiter('');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar garçons:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de garçons',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setFetchingWaiters(false);
    }
  };

  // Buscar garçons quando o modal for aberto
  useEffect(() => {
    if (isOpen && table) {
      fetchWaiters();
    }
  }, [isOpen, table]);

  // Atribuir garçom à mesa
  const handleAssignWaiter = async () => {
    setLoading(true);
    
    try {
      const response = await api.patch(`/tables/${table._id}/assign-waiter`, {
        waiterId: selectedWaiter || null // null para remover o garçom
      });
      
      if (response.data.success) {
        toast({
          title: 'Garçom atribuído',
          description: selectedWaiter 
            ? 'Garçom atribuído com sucesso à mesa' 
            : 'Garçom removido da mesa',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
        
        // Fechamento e callback
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Erro ao atribuir garçom:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Não foi possível atribuir o garçom',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  if (!table) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Atribuir Garçom</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <Box mb={4}>
            <Text>Mesa: <strong>{table.number}</strong></Text>
            {table.status !== 'free' && table.currentOrder && (
              <Text mt={2}>
                Esta mesa está {table.status === 'occupied' ? 'ocupada' : 'aguardando pagamento'} 
                e possui um pedido em andamento.
              </Text>
            )}
          </Box>

          <FormControl>
            <FormLabel>Garçom</FormLabel>
            <Select
              placeholder="Selecione um garçom"
              value={selectedWaiter}
              onChange={(e) => setSelectedWaiter(e.target.value)}
              isDisabled={fetchingWaiters || loading}
            >
              <option value="">Sem garçom atribuído</option>
              {waiters.map(waiter => (
                <option key={waiter._id} value={waiter._id}>
                  {waiter.name}
                </option>
              ))}
            </Select>
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button 
            variant="ghost" 
            mr={3} 
            onClick={onClose}
            isDisabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleAssignWaiter}
            isLoading={loading}
            loadingText="Atribuindo..."
          >
            Confirmar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AssignWaiterModal;