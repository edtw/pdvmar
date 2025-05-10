// src/components/CashRegister/WithdrawCashModal.js
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
  Input,
  Box,
  Text,
  useToast
} from '@chakra-ui/react';
import api from '../../services/api';

const WithdrawCashModal = ({ isOpen, onClose, cashRegister, onSuccess }) => {
  const [amount, setAmount] = useState('0.00');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  
  const toast = useToast();
  
  // Reset ao abrir o modal
  React.useEffect(() => {
    if (isOpen) {
      setAmount('0.00');
      setDescription('');
    }
  }, [isOpen]);
  
  // Formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const value = parseFloat(amount.replace(',', '.'));
      
      if (isNaN(value) || value <= 0) {
        toast({
          title: 'Valor inválido',
          description: 'Por favor, informe um valor válido maior que zero',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setLoading(false);
        return;
      }
      
      if (value > cashRegister.currentBalance) {
        toast({
          title: 'Saldo insuficiente',
          description: 'O valor da retirada não pode ser maior que o saldo atual',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setLoading(false);
        return;
      }
      
      const response = await api.post(`/cash-registers/${cashRegister._id}/withdraw`, {
        amount: value,
        description: description || 'Retirada de dinheiro do caixa'
      });
      
      if (response.data.success) {
        toast({
          title: 'Valor retirado',
          description: `Foi retirado ${formatCurrency(value)} do caixa ${cashRegister.identifier}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Erro ao retirar dinheiro:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao retirar dinheiro do caixa',
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
        <ModalHeader>Retirar Dinheiro - {cashRegister?.identifier}</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <Box mb={4}>
            <Text>Saldo disponível: <strong>{formatCurrency(cashRegister?.currentBalance || 0)}</strong></Text>
          </Box>
          
          <FormControl isRequired mb={4}>
            <FormLabel>Valor a retirar</FormLabel>
            <NumberInput
              min={0.01}
              max={cashRegister?.currentBalance || 0}
              step={1}
              precision={2}
              value={amount}
              onChange={(valueString) => setAmount(valueString)}
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
              Informe o valor a ser retirado do caixa
            </FormHelperText>
          </FormControl>
          
          <FormControl mb={4}>
            <FormLabel>Descrição/Motivo</FormLabel>
            <Input 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Motivo da retirada (opcional)"
            />
            <FormHelperText>
              Descreva o motivo da retirada para controle
            </FormHelperText>
          </FormControl>
        </ModalBody>
        
        <ModalFooter>
          <Button mr={3} onClick={onClose} variant="ghost">
            Cancelar
          </Button>
          <Button
            colorScheme="orange"
            onClick={handleSubmit}
            isLoading={loading}
          >
            Retirar Dinheiro
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default WithdrawCashModal;