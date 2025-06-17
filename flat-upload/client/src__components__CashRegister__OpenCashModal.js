// src/components/CashRegister/OpenCashModal.js
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
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup,
  InputLeftAddon,
  Flex,
  Text,
  useToast
} from '@chakra-ui/react';
import api from '../../services/api';

const OpenCashModal = ({ isOpen, onClose, cashRegister, onSuccess }) => {
  const [openingBalance, setOpeningBalance] = useState('0.00');
  const [loading, setLoading] = useState(false);
  
  const toast = useToast();
  
  // Reset ao abrir o modal
  React.useEffect(() => {
    if (isOpen) {
      setOpeningBalance('0.00');
    }
  }, [isOpen]);
  
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const balance = parseFloat(openingBalance.replace(',', '.'));
      
      if (isNaN(balance) || balance < 0) {
        toast({
          title: 'Valor inválido',
          description: 'Por favor, informe um valor válido para a abertura do caixa',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setLoading(false);
        return;
      }
      
      const response = await api.post(`/cash-registers/${cashRegister._id}/open`, {
        openingBalance: balance
      });
      
      if (response.data.success) {
        toast({
          title: 'Caixa aberto',
          description: `O caixa ${cashRegister.identifier} foi aberto com sucesso`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Erro ao abrir caixa:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao abrir o caixa',
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
        <ModalHeader>Abrir Caixa {cashRegister?.identifier}</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <Text mb={4}>
            Informe o valor inicial em caixa para iniciar as operações.
          </Text>
          
          <FormControl isRequired>
            <FormLabel>Valor de Abertura</FormLabel>
            <NumberInput
              min={0}
              step={1}
              precision={2}
              value={openingBalance}
              onChange={(valueString) => setOpeningBalance(valueString)}
            >
              <InputGroup>
                <InputLeftAddon>R$</InputLeftAddon>
                <NumberInputField />
              </InputGroup>
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <FormHelperText>
              Informe o valor que está fisicamente disponível no caixa no momento da abertura.
            </FormHelperText>
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
            Abrir Caixa
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default OpenCashModal;