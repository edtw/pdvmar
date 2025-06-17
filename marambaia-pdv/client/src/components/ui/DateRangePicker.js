import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  Stack,
  HStack,
  Input,
  Text,
  useDisclosure
} from '@chakra-ui/react';
import { FiCalendar } from 'react-icons/fi';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DateRangePicker = ({ 
  startDate, 
  endDate, 
  onChange, 
  maxDate = new Date() 
}) => {
  const { isOpen, onToggle, onClose } = useDisclosure();
  
  // CORREÇÃO: Garantir que as datas sejam formatadas corretamente para o input HTML
  const [localStartDate, setLocalStartDate] = useState(format(startDate, 'yyyy-MM-dd'));
  const [localEndDate, setLocalEndDate] = useState(format(endDate, 'yyyy-MM-dd'));
  
  // Atualizar datas locais quando as props mudarem
  useEffect(() => {
    setLocalStartDate(format(startDate, 'yyyy-MM-dd'));
    setLocalEndDate(format(endDate, 'yyyy-MM-dd'));
  }, [startDate, endDate]);
  
  // Formatar data para exibição (formato brasileiro)
  const formatDisplayDate = (date) => {
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };
  
  // Manipular mudança de data inicial
  const handleStartDateChange = (e) => {
    setLocalStartDate(e.target.value);
  };
  
  // Manipular mudança de data final
  const handleEndDateChange = (e) => {
    setLocalEndDate(e.target.value);
  };
  
  // Aplicar datas
  const handleApply = () => {
    try {
      // O formato yyyy-MM-dd é o padrão do input HTML, então podemos usar diretamente
      const newStartDate = new Date(localStartDate);
      const newEndDate = new Date(localEndDate);
      
      console.log('[DateRangePicker] Datas selecionadas:', {
        startInput: localStartDate,
        endInput: localEndDate,
        startObj: newStartDate.toString(),
        endObj: newEndDate.toString()
      });
      
      // Verificar se as datas são válidas
      if (isNaN(newStartDate.getTime()) || isNaN(newEndDate.getTime())) {
        console.error('[DateRangePicker] Datas inválidas detectadas');
        onClose();
        return;
      }
      
      // Validar datas
      if (newStartDate > newEndDate) {
        // Data inicial maior que a final, inverter
        onChange({ startDate: newEndDate, endDate: newStartDate });
      } else {
        onChange({ startDate: newStartDate, endDate: newEndDate });
      }
    } catch (error) {
      console.error('[DateRangePicker] Erro ao processar datas:', error);
    }
    
    onClose();
  };
  
  return (
    <Popover
      isOpen={isOpen}
      onClose={onClose}
      placement="bottom-start"
      closeOnBlur={false}
    >
      <PopoverTrigger>
        <Button 
          rightIcon={<FiCalendar />} 
          onClick={onToggle} 
          variant="outline"
          size="md"
        >
          {formatDisplayDate(startDate)} - {formatDisplayDate(endDate)}
        </Button>
      </PopoverTrigger>
      <PopoverContent width="300px">
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverBody p={4}>
          <Stack spacing={4}>
            <Box>
              <Text mb={1} fontSize="sm" fontWeight="medium">Data Inicial</Text>
              <Input
                type="date"
                value={localStartDate}
                onChange={handleStartDateChange}
                max={format(maxDate, 'yyyy-MM-dd')}
              />
            </Box>
            
            <Box>
              <Text mb={1} fontSize="sm" fontWeight="medium">Data Final</Text>
              <Input
                type="date"
                value={localEndDate}
                onChange={handleEndDateChange}
                max={format(maxDate, 'yyyy-MM-dd')}
              />
            </Box>
            
            <HStack justify="flex-end">
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button colorScheme="blue" onClick={handleApply}>
                Aplicar
              </Button>
            </HStack>
          </Stack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;