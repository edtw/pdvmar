// src/components/Tables/CloseTableModal.js
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
  Select,
  HStack,
  Text,
  Divider,
  Box,
  useToast
} from '@chakra-ui/react';
import api from '../../services/api';

const CloseTableModal = ({ isOpen, onClose, table, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  
  // Reset ao abrir o modal
  React.useEffect(() => {
    if (isOpen) {
      setPaymentMethod('');
    }
  }, [isOpen]);
  
  const handleSubmit = async () => {
    if (!table) return;
    
    if (!paymentMethod) {
      toast({
        title: 'Campo obrigatório',
        description: 'Selecione a forma de pagamento',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.post(`/tables/${table._id}/close`, {
        paymentMethod
      });
      
      if (response.data.success) {
        toast({
          title: 'Mesa fechada',
          description: `Mesa ${table.number} fechada com sucesso`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Erro ao fechar mesa:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao fechar mesa',
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
        <ModalHeader>Fechar Mesa {table.number}</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {/* Resumo da mesa */}
          <Box mb={4}>
            <Text fontSize="sm" fontWeight="medium" color="gray.500">
              Resumo da mesa
            </Text>
            
            <HStack mt={2} justify="space-between">
              <Text>Ocupantes</Text>
              <Text fontWeight="medium">{table.occupants}</Text>
            </HStack>
            
            <Divider my={2} />
            
            <HStack justify="space-between">
              <Text fontWeight="bold">Total da conta</Text>
              <Text fontWeight="bold">
                R$ {table.currentOrder?.total?.toFixed(2) || '0.00'}
              </Text>
            </HStack>
          </Box>
          
          <FormControl isRequired>
            <FormLabel>Forma de Pagamento</FormLabel>
            <Select
              placeholder="Selecione a forma de pagamento"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="cash">Dinheiro</option>
              <option value="credit">Cartão de Crédito</option>
              <option value="debit">Cartão de Débito</option>
              <option value="pix">PIX</option>
              <option value="other">Outro</option>
            </Select>
          </FormControl>
        </ModalBody>
        
        <ModalFooter>
          <Button mr={3} onClick={onClose} variant="ghost">
            Cancelar
          </Button>
          <Button 
            colorScheme="green" 
            onClick={handleSubmit}
            isLoading={loading}
          >
            Confirmar Pagamento
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CloseTableModal;