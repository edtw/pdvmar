import React, { useState, useEffect } from 'react';
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
  Input,
  Select,
  useToast
} from '@chakra-ui/react';
import api from '../../services/api';

const TableFormModal = ({ isOpen, onClose, table = null, onSuccess }) => {
  // Estados
  const [formData, setFormData] = useState({
    number: '',
    section: 'main',
    position: { x: 0, y: 0 }
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  
  // Preencher formulário se for edição
  useEffect(() => {
    if (table && isOpen) {
      setFormData({
        number: table.number || '',
        section: table.section || 'main',
        position: table.position || { x: 0, y: 0 }
      });
    } else if (isOpen) {
      // Reset para nova mesa
      setFormData({
        number: '',
        section: 'main',
        position: { x: 0, y: 0 }
      });
    }
  }, [table, isOpen]);
  
  // Manipular alterações dos campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Enviar formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.number) {
      toast({
        title: 'Campo obrigatório',
        description: 'Número da mesa é obrigatório',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    
    try {
      let response;
      
      if (table) {
        // Atualizar mesa existente
        response = await api.put(`/tables/${table._id}`, formData);
      } else {
        // Criar nova mesa
        response = await api.post('/tables', formData);
      }
      
      if (response.data.success) {
        toast({
          title: table ? 'Mesa atualizada' : 'Mesa criada',
          description: table 
            ? `Mesa ${formData.number} atualizada com sucesso` 
            : `Mesa ${formData.number} criada com sucesso`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Callback de sucesso
        if (onSuccess) onSuccess();
        
        // Fechar modal
        onClose();
      }
    } catch (error) {
      console.error('Erro ao salvar mesa:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao salvar mesa',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{table ? 'Editar Mesa' : 'Nova Mesa'}</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <form id="table-form" onSubmit={handleSubmit}>
            <FormControl isRequired mb={4}>
              <FormLabel>Número da Mesa</FormLabel>
              <Input
                name="number"
                value={formData.number}
                onChange={handleChange}
                placeholder="Ex: 1, 2, A, VIP..."
              />
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Seção</FormLabel>
              <Select
                name="section"
                value={formData.section}
                onChange={handleChange}
              >
                <option value="main">Principal</option>
                <option value="deck">Deck</option>
                <option value="beach">Praia</option>
                <option value="vip">VIP</option>
              </Select>
            </FormControl>
          </form>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            colorScheme="blue"
            type="submit"
            form="table-form"
            isLoading={loading}
          >
            {table ? 'Atualizar' : 'Criar'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TableFormModal;