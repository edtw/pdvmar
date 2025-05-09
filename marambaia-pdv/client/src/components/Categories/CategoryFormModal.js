// src/components/Categories/CategoryFormModal.js
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
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  FormHelperText,
  useToast
} from '@chakra-ui/react';
import api from '../../services/api';

const CategoryFormModal = ({ isOpen, onClose, category = null, onSuccess }) => {
  // Estados do formulário
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order: 0,
    active: true
  });
  
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  
  // Preencher formulário com dados da categoria (edição)
  useEffect(() => {
    if (category && isOpen) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        order: category.order || 0,
        active: category.active !== undefined ? category.active : true
      });
    } else if (isOpen) {
      // Reset para nova categoria
      setFormData({
        name: '',
        description: '',
        order: 0,
        active: true
      });
    }
  }, [category, isOpen]);
  
  // Manipular alterações dos campos
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Manipular alteração da ordem
  const handleOrderChange = (value) => {
    setFormData({
      ...formData,
      order: value
    });
  };
  
  // Enviar formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name) {
      toast({
        title: 'Campo obrigatório',
        description: 'Nome da categoria é obrigatório',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Dados para enviar à API
      const categoryData = {
        ...formData,
        order: parseInt(formData.order)
      };
      
      let response;
      
      if (category) {
        // Atualizar categoria existente
        response = await api.put(`/categories/${category._id}`, categoryData);
      } else {
        // Criar nova categoria
        response = await api.post('/categories', categoryData);
      }
      
      if (response.data.success) {
        toast({
          title: category ? 'Categoria atualizada' : 'Categoria criada',
          description: category 
            ? 'Categoria atualizada com sucesso' 
            : 'Categoria criada com sucesso',
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
      console.error('Erro ao salvar categoria:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao salvar categoria',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="md"
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {category ? 'Editar Categoria' : 'Nova Categoria'}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <form id="category-form" onSubmit={handleSubmit}>
            <FormControl mb={4} isRequired>
              <FormLabel>Nome</FormLabel>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nome da categoria"
              />
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Descrição</FormLabel>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Descrição da categoria"
                rows={3}
              />
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Ordem de exibição</FormLabel>
              <NumberInput
                min={0}
                value={formData.order}
                onChange={handleOrderChange}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormHelperText>
                Define a ordem de exibição no menu (0 = primeiro)
              </FormHelperText>
            </FormControl>
            
            <FormControl display="flex" alignItems="center" mb={4}>
              <FormLabel htmlFor="active" mb="0">
                Ativa
              </FormLabel>
              <Switch
                id="active"
                name="active"
                isChecked={formData.active}
                onChange={handleChange}
                colorScheme="green"
              />
              <FormHelperText ml={2}>
                Categorias inativas não são exibidas no menu
              </FormHelperText>
            </FormControl>
          </form>
        </ModalBody>
        
        <ModalFooter>
          <Button mr={3} onClick={onClose} variant="ghost">
            Cancelar
          </Button>
          <Button
            colorScheme="blue"
            type="submit"
            form="category-form"
            isLoading={loading}
            loadingText="Salvando"
          >
            {category ? 'Atualizar' : 'Criar'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CategoryFormModal;