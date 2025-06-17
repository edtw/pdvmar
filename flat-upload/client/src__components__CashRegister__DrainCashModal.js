// src/components/CashRegister/DrainCashModal.js
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
  Select,
  Box,
  Text,
  useToast
} from '@chakra-ui/react';
import api from '../../services/api';

const DrainCashModal = ({ isOpen, onClose, cashRegister, onSuccess }) => {
  const [amount, setAmount] = useState('0.00');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  
  const toast = useToast();
  
  // Reset ao abrir o modal
  React.useEffect(() => {
    if (isOpen) {
      setAmount('0.00');
      setDestination('');
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
      
      if (!destination) {
        toast({
          title: 'Destino obrigatório',
          description: 'Por favor, informe o destino da sangria',
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
          description: 'O valor da sangria não pode ser maior que o saldo atual',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setLoading(false);
        return;
      }
      
      const response = await api.post(`/cash-registers/${cashRegister._id}/drain`, {
        amount: value,
        destination
      });
      
      if (response.data.success) {
        toast({
          title: 'Sangria realizada',
          description: `Foi feita uma sangria de ${formatCurrency(value)} do caixa ${cashRegister.identifier}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Erro ao realizar sangria:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao realizar sangria do caixa',
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
        <ModalHeader>Sangria de Caixa - {cashRegister?.identifier}</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <Text mb={4}>
            A sangria é a retirada de valores do caixa para transferência para outro local.
          </Text>
          
          <Box mb={4}>
            <Text>Saldo disponível: <strong>{formatCurrency(cashRegister?.currentBalance || 0)}</strong></Text>
          </Box>
          
          <FormControl isRequired mb={4}>
            <FormLabel>Valor da sangria</FormLabel>
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
          
          <FormControl isRequired mb={4}>
            <FormLabel>Destino</FormLabel>
            <Select
              placeholder="Selecione o destino"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              <option value="Caixa central">Caixa central</option>
              <option value="Cofre">Cofre</option>
              <option value="Banco">Banco</option>
              <option value="Administração">Administração</option>
              <option value="Gerência">Gerência</option>
            </Select>
            <FormHelperText>
              Selecione para onde o dinheiro será transferido
            </FormHelperText>
          </FormControl>
          
          {destination === '' && (
            <FormControl mb={4}>
              <Input 
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Especifique o destino da sangria"
              />
            </FormControl>
          )}
        </ModalBody>
        
        <ModalFooter>
          <Button mr={3} onClick={onClose} variant="ghost">
            Cancelar
          </Button>
          <Button
            colorScheme="red"
            onClick={handleSubmit}
            isLoading={loading}
            isDisabled={!destination}
          >
            Realizar Sangria
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DrainCashModal;