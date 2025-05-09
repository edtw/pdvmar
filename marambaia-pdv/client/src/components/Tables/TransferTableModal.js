import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  Select,
  Text,
  useToast
} from '@chakra-ui/react';
import api from '../../services/api';

const TransferTableModal = ({ isOpen, onClose, table, tables = [], onSuccess }) => {
  const [targetTableId, setTargetTableId] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  
  // Reset ao abrir o modal
  React.useEffect(() => {
    if (isOpen) {
      setTargetTableId('');
    }
  }, [isOpen]);
  
  // Mesas livres disponíveis para transferência
  const availableTables = tables.filter(t => 
    t.status === 'free' && t._id !== (table?._id || '')
  );
  
  // Transferir mesa
  const handleTransfer = async () => {
    if (!table || !targetTableId) {
      toast({
        title: 'Seleção obrigatória',
        description: 'Selecione uma mesa de destino',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.post(`/tables/${table._id}/transfer`, {
        targetTableId
      });
      
      if (response.data.success) {
        toast({
          title: 'Mesa transferida',
          description: `Mesa ${table.number} transferida com sucesso`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Erro ao transferir mesa:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao transferir mesa',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Transferir Mesa {table?.number}</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {availableTables.length === 0 ? (
            <Text>Não há mesas livres disponíveis para transferência.</Text>
          ) : (
            <FormControl>
              <FormLabel>Mesa de Destino</FormLabel>
              <Select
                placeholder="Selecione uma mesa livre"
                value={targetTableId}
                onChange={(e) => setTargetTableId(e.target.value)}
              >
                {availableTables.map((t) => (
                  <option key={t._id} value={t._id}>
                    Mesa {t.number}
                  </option>
                ))}
              </Select>
              <FormHelperText>
                Todos os pedidos e informações serão transferidos para a mesa selecionada.
              </FormHelperText>
            </FormControl>
          )}
        </ModalBody>
        
        <ModalFooter>
          <Button mr={3} onClick={onClose} variant="ghost">
            Cancelar
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleTransfer}
            isLoading={loading}
            isDisabled={availableTables.length === 0 || !targetTableId}
          >
            Transferir
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TransferTableModal;