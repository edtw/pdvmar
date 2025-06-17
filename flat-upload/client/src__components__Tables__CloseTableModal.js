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
  useToast,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup,
  InputLeftAddon
} from '@chakra-ui/react';
import api from '../../services/api';

const CloseTableModal = ({ isOpen, onClose, table, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [cashReceived, setCashReceived] = useState('');
  const [change, setChange] = useState(0);
  const toast = useToast();
  
  // Reset ao abrir o modal
  React.useEffect(() => {
    if (isOpen) {
      setPaymentMethod('');
      setCashReceived('');
      setChange(0);
    }
  }, [isOpen]);
  
  // Obter o total do pedido
  const getOrderTotal = () => {
    return table?.currentOrder?.total || 0;
  };
  
  // Formatar moeda brasileira
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Atualizar o troco quando o valor recebido mudar
  const handleCashReceivedChange = (valueString) => {
    setCashReceived(valueString);
    
    const receivedValue = parseFloat(valueString) || 0;
    const orderTotal = getOrderTotal();
    
    if (receivedValue > orderTotal) {
      setChange(receivedValue - orderTotal);
    } else {
      setChange(0);
    }
  };

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
    
    // Verificar se é em dinheiro e o valor recebido é suficiente
    if (paymentMethod === 'cash') {
      const receivedValue = parseFloat(cashReceived) || 0;
      const orderTotal = getOrderTotal();
      
      if (receivedValue < orderTotal) {
        toast({
          title: 'Valor insuficiente',
          description: 'O valor recebido é menor que o total da conta',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }
    
    setLoading(true);
    
    try {
      // Incluir informações de troco no payload se for pagamento em dinheiro
      const payload = { 
        paymentMethod,
        ...(paymentMethod === 'cash' && {
          cashReceived: parseFloat(cashReceived),
          change: change
        })
      };
      
      const response = await api.post(`/tables/${table._id}/close`, payload);
      
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
                {formatCurrency(getOrderTotal())}
              </Text>
            </HStack>
          </Box>
          
          <FormControl isRequired mb={4}>
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
          
          {/* Campo para valor recebido e troco (apenas para dinheiro) */}
          {paymentMethod === 'cash' && (
            <Box>
              <FormControl mb={3}>
                <FormLabel>Valor Recebido</FormLabel>
                <NumberInput 
                  min={0} 
                  precision={2} 
                  step={1}
                  value={cashReceived}
                  onChange={handleCashReceivedChange}
                >
                  <InputGroup>
                    <InputLeftAddon>R$</InputLeftAddon>
                    <NumberInputField placeholder="0,00" />
                  </InputGroup>
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              
              <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md">
                <Text fontWeight="medium">Troco:</Text>
                <Text 
                  fontWeight="bold" 
                  color={change > 0 ? "green.500" : "gray.500"}
                >
                  {formatCurrency(change)}
                </Text>
              </HStack>
            </Box>
          )}
        </ModalBody>
        
        <ModalFooter>
          <Button mr={3} onClick={onClose} variant="ghost">
            Cancelar
          </Button>
          <Button 
            colorScheme="green" 
            onClick={handleSubmit}
            isLoading={loading}
            isDisabled={
              paymentMethod === 'cash' && 
              (parseFloat(cashReceived) || 0) < getOrderTotal()
            }
          >
            Confirmar Pagamento
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CloseTableModal;