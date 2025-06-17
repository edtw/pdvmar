// src/components/Tables/OpenTableModal.js
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
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast
} from '@chakra-ui/react';
import api from '../../services/api';

const OpenTableModal = ({ isOpen, onClose, table, onSuccess }) => {
  const [occupants, setOccupants] = useState(1);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  
  // Reset ao abrir o modal
  React.useEffect(() => {
    if (isOpen) {
      setOccupants(1);
    }
  }, [isOpen]);
  
  const handleSubmit = async () => {
    if (!table) return;
    
    setLoading(true);
    
    try {
      const response = await api.post(`/tables/${table._id}/open`, {
        occupants
      });
      
      if (response.data.success) {
        toast({
          title: 'Mesa aberta',
          description: `Mesa ${table.number} aberta com sucesso`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Erro ao abrir mesa:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao abrir mesa',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (!table) return null;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Abrir Mesa {table.number}</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <FormControl>
            <FormLabel>Número de ocupantes</FormLabel>
            <NumberInput 
              min={1} 
              max={20} 
              value={occupants}
              onChange={(_, value) => setOccupants(value)}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </ModalBody>
        
        <ModalFooter>
          <Button mr={3} onClick={onClose} variant="ghost">
            Cancelar
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSubmit}
            isLoading={loading}
          >
            Abrir Mesa
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default OpenTableModal;