// src/components/CashRegister/CloseCashModal.js
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
  Box,
  Divider,
  HStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  SimpleGrid,
  useToast
} from '@chakra-ui/react';
import api from '../../services/api';

const CloseCashModal = ({ isOpen, onClose, cashRegister, onSuccess }) => {
  const [cashCount, setCashCount] = useState({
    notes: {
      200: 0,
      100: 0,
      50: 0,
      20: 0,
      10: 0,
      5: 0,
      2: 0
    },
    coins: {
      1: 0,
      0.5: 0,
      0.25: 0,
      0.1: 0,
      0.05: 0,
      0.01: 0
    }
  });
  
  const [closingBalance, setClosingBalance] = useState('0.00');
  const [loading, setLoading] = useState(false);
  const [showCashCount, setShowCashCount] = useState(false);
  
  const toast = useToast();
  
  // Reset ao abrir o modal
  React.useEffect(() => {
    if (isOpen && cashRegister) {
      setClosingBalance(cashRegister.currentBalance.toFixed(2));
      setCashCount({
        notes: {
          200: 0,
          100: 0,
          50: 0,
          20: 0,
          10: 0,
          5: 0,
          2: 0
        },
        coins: {
          1: 0,
          0.5: 0,
          0.25: 0,
          0.1: 0,
          0.05: 0,
          0.01: 0
        }
      });
    }
  }, [isOpen, cashRegister]);
  
  // Calcular total da contagem de cédulas e moedas
  const calculateCashCountTotal = () => {
    let total = 0;
    
    // Somar cédulas
    Object.entries(cashCount.notes).forEach(([note, count]) => {
      total += parseFloat(note) * count;
    });
    
    // Somar moedas
    Object.entries(cashCount.coins).forEach(([coin, count]) => {
      total += parseFloat(coin) * count;
    });
    
    return total;
  };
  
  // Atualizar contagem de cédulas
  const handleNoteChange = (value, denomination) => {
    const count = parseInt(value) || 0;
    setCashCount(prev => ({
      ...prev,
      notes: {
        ...prev.notes,
        [denomination]: count
      }
    }));
    
    // Atualizar valor total automaticamente se contagem estiver ativa
    if (showCashCount) {
      const updatedCashCount = {
        ...cashCount,
        notes: {
          ...cashCount.notes,
          [denomination]: count
        }
      };
      
      let total = 0;
      
      // Somar cédulas
      Object.entries(updatedCashCount.notes).forEach(([note, noteCount]) => {
        total += parseFloat(note) * noteCount;
      });
      
      // Somar moedas
      Object.entries(updatedCashCount.coins).forEach(([coin, coinCount]) => {
        total += parseFloat(coin) * coinCount;
      });
      
      setClosingBalance(total.toFixed(2));
    }
  };
  
  // Atualizar contagem de moedas
  const handleCoinChange = (value, denomination) => {
    const count = parseInt(value) || 0;
    setCashCount(prev => ({
      ...prev,
      coins: {
        ...prev.coins,
        [denomination]: count
      }
    }));
    
    // Atualizar valor total automaticamente se contagem estiver ativa
    if (showCashCount) {
      const updatedCashCount = {
        ...cashCount,
        coins: {
          ...cashCount.coins,
          [denomination]: count
        }
      };
      
      let total = 0;
      
      // Somar cédulas
      Object.entries(updatedCashCount.notes).forEach(([note, noteCount]) => {
        total += parseFloat(note) * noteCount;
      });
      
      // Somar moedas
      Object.entries(updatedCashCount.coins).forEach(([coin, coinCount]) => {
        total += parseFloat(coin) * coinCount;
      });
      
      setClosingBalance(total.toFixed(2));
    }
  };
  
  // Formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Calcular diferença
  const calculateDifference = () => {
    const expected = cashRegister?.expectedBalance || 0;
    const actual = parseFloat(closingBalance.replace(',', '.')) || 0;
    return actual - expected;
  };
  
  // Submeter fechamento
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const balance = parseFloat(closingBalance.replace(',', '.'));
      
      if (isNaN(balance) || balance < 0) {
        toast({
          title: 'Valor inválido',
          description: 'Por favor, informe um valor válido para o fechamento do caixa',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setLoading(false);
        return;
      }
      
      const response = await api.post(`/cash-registers/${cashRegister._id}/close`, {
        closingBalance: balance,
        cashCount: showCashCount ? cashCount : null,
        paymentDetails: {
          cash: balance,
          credit: 0,
          debit: 0,
          pix: 0,
          other: 0
        }
      });
      
      if (response.data.success) {
        toast({
          title: 'Caixa fechado',
          description: `O caixa ${cashRegister.identifier} foi fechado com sucesso`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Erro ao fechar caixa:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao fechar o caixa',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Fechar Caixa {cashRegister?.identifier}</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <Text mb={4}>
            Realize a contagem de dinheiro físico em caixa para finalizar as operações.
          </Text>
          
          <SimpleGrid columns={2} spacing={4} mb={4}>
            <Box>
              <Text fontWeight="medium">Operador</Text>
              <Text>{cashRegister?.currentOperator?.name || 'N/A'}</Text>
            </Box>
            
            <Box>
              <Text fontWeight="medium">Saldo Esperado</Text>
              <Text fontWeight="bold">
                {formatCurrency(cashRegister?.expectedBalance || 0)}
              </Text>
            </Box>
          </SimpleGrid>
          
          <Divider my={4} />
          
          <FormControl isRequired mb={4}>
            <FormLabel>Valor em Caixa (Contagem Física)</FormLabel>
            <NumberInput
              min={0}
              step={1}
              precision={2}
              value={closingBalance}
              onChange={(valueString) => setClosingBalance(valueString)}
              isDisabled={showCashCount}
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
              Informe o valor total em dinheiro contado fisicamente no caixa
            </FormHelperText>
          </FormControl>
          
          <Flex justify="space-between" mb={4}>
            <Text>Diferença:</Text>
            <Text 
              fontWeight="bold"
              color={calculateDifference() >= 0 ? 'green.500' : 'red.500'}
            >
              {formatCurrency(calculateDifference())}
            </Text>
          </Flex>
          
          <Accordion allowToggle>
            <AccordionItem>
              <h2>
                <AccordionButton 
                  onClick={() => setShowCashCount(!showCashCount)}
                  _expanded={{ bg: 'blue.50', color: 'blue.700' }}
                >
                  <Box flex="1" textAlign="left">
                    Contagem de Cédulas e Moedas
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <HStack mb={2}>
                  <Button 
                    size="xs" 
                    colorScheme={showCashCount ? "blue" : "gray"}
                    onClick={() => setShowCashCount(!showCashCount)}
                  >
                    {showCashCount ? "Contagem ativa" : "Ativar contagem"}
                  </Button>
                  <Text fontSize="xs" color="gray.500">
                    {showCashCount 
                      ? "O valor total será calculado automaticamente" 
                      : "Ative para calcular o valor automaticamente"}
                  </Text>
                </HStack>
                
                <Text fontWeight="medium" mb={2}>Cédulas</Text>
                <SimpleGrid columns={2} spacing={2} mb={4}>
                  {Object.keys(cashCount.notes).sort((a, b) => b - a).map(note => (
                    <HStack key={`note-${note}`}>
                      <Text flex="1">{formatCurrency(parseFloat(note))}</Text>
                      <NumberInput
                        min={0}
                        size="sm"
                        maxW={20}
                        value={cashCount.notes[note]}
                        onChange={(value) => handleNoteChange(value, note)}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      <Text>= {formatCurrency(parseFloat(note) * cashCount.notes[note])}</Text>
                    </HStack>
                  ))}
                </SimpleGrid>
                
                <Text fontWeight="medium" mb={2}>Moedas</Text>
                <SimpleGrid columns={2} spacing={2} mb={4}>
                  {Object.keys(cashCount.coins).sort((a, b) => b - a).map(coin => (
                    <HStack key={`coin-${coin}`}>
                      <Text flex="1">{formatCurrency(parseFloat(coin))}</Text>
                      <NumberInput
                        min={0}
                        size="sm"
                        maxW={20}
                        value={cashCount.coins[coin]}
                        onChange={(value) => handleCoinChange(value, coin)}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      <Text>= {formatCurrency(parseFloat(coin) * cashCount.coins[coin])}</Text>
                    </HStack>
                  ))}
                </SimpleGrid>
                
                <Flex justify="space-between" fontWeight="bold">
                  <Text>Total contado:</Text>
                  <Text>{formatCurrency(calculateCashCountTotal())}</Text>
                </Flex>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
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
            Fechar Caixa
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CloseCashModal;