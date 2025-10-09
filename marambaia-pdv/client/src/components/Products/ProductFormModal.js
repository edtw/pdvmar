// src/components/Products/ProductFormModal.js
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
  Select,
  Switch,
  FormHelperText,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Flex,
  Box,
  Image,
  IconButton,
  useToast
} from '@chakra-ui/react';
import { FiUpload, FiTrash2 } from 'react-icons/fi';
import api from '../../services/api';

const ProductFormModal = ({ 
  isOpen, 
  onClose, 
  product = null, 
  categories = [], 
  onSuccess 
}) => {
  // Estados do formulário
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    image: '',
    available: true,
    featured: false,
    preparationTime: 10,
    productType: 'food'
  });
  
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const toast = useToast();
  
  // Preencher formulário com dados do produto (edição)
  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || 0,
        category: product.category?._id || product.category || '',
        image: product.image || '',
        available: product.available !== undefined ? product.available : true,
        featured: product.featured || false,
        preparationTime: product.preparationTime || 10,
        productType: product.productType || 'food'
      });
    } else if (isOpen) {
      // Reset para novo produto
      setFormData({
        name: '',
        description: '',
        price: 0,
        category: categories.length > 0 ? categories[0]._id : '',
        image: '',
        available: true,
        featured: false,
        preparationTime: 10,
        productType: 'food'
      });
      setImageFile(null);
    }
  }, [product, isOpen, categories]);
  
  // Manipular alterações dos campos
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Manipular alteração de preço
  const handlePriceChange = (value) => {
    setFormData({
      ...formData,
      price: value
    });
  };
  
  // Manipular alteração de tempo de preparo
  const handlePrepTimeChange = (value) => {
    setFormData({
      ...formData,
      preparationTime: value
    });
  };
  
  // Manipular upload de imagem
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Tipo de arquivo inválido',
        description: 'Apenas imagens JPEG, PNG, GIF e WEBP são permitidas',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Validar tamanho do arquivo (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo permitido é 5MB',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setImageFile(file);
    
    // Criar preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData({
        ...formData,
        image: event.target.result
      });
    };
    reader.readAsDataURL(file);
  };
  
  // Upload da imagem para o servidor
  const uploadImage = async () => {
    if (!imageFile) return formData.image;
    
    try {
      const formDataImg = new FormData();
      formDataImg.append('image', imageFile);
      
      const response = await api.post('/upload', formDataImg);
      
      if (response.data.success) {
        return response.data.filePath;
      }
      
      throw new Error('Falha ao fazer upload da imagem');
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      throw error;
    }
  };
  
  // Remover imagem
  const handleRemoveImage = () => {
    setFormData({
      ...formData,
      image: ''
    });
    setImageFile(null);
  };
  
  // Enviar formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name || !formData.price || !formData.category) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Nome, preço e categoria são obrigatórios',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Fazer upload da imagem se houver
      let imagePath = formData.image;
      if (imageFile) {
        imagePath = await uploadImage();
      }
      
      // Dados para enviar à API
      const productData = {
        ...formData,
        image: imagePath,
        price: parseFloat(formData.price),
        preparationTime: parseInt(formData.preparationTime)
      };
      
      let response;
      
      if (product) {
        // Atualizar produto existente
        response = await api.put(`/products/${product._id}`, productData);
      } else {
        // Criar novo produto
        response = await api.post('/products', productData);
      }
      
      if (response.data.success) {
        toast({
          title: product ? 'Produto atualizado' : 'Produto criado',
          description: product 
            ? 'Produto atualizado com sucesso' 
            : 'Produto criado com sucesso',
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
      console.error('Erro ao salvar produto:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao salvar produto',
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
      size="xl"
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {product ? 'Editar Produto' : 'Novo Produto'}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <form id="product-form" onSubmit={handleSubmit}>
            <FormControl mb={4} isRequired>
              <FormLabel>Nome</FormLabel>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nome do produto"
              />
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Descrição</FormLabel>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Descrição do produto"
                rows={3}
              />
            </FormControl>
            
            <Flex gap={4} mb={4} direction={{ base: 'column', md: 'row' }}>
              <FormControl isRequired>
                <FormLabel>Preço</FormLabel>
                <NumberInput
                  min={0}
                  step={0.5}
                  precision={2}
                  value={formData.price}
                  onChange={handlePriceChange}
                >
                  <NumberInputField placeholder="0,00" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Categoria</FormLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="" disabled>Selecione uma categoria</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Flex>

            <FormControl mb={4} isRequired>
              <FormLabel>Tipo de Produto</FormLabel>
              <Select
                name="productType"
                value={formData.productType}
                onChange={handleChange}
              >
                <option value="food">🍔 Comida (vai para cozinha)</option>
                <option value="beverage">🍹 Bebida (vai direto para garçom)</option>
              </Select>
              <FormHelperText>
                Comida: enviado para a cozinha preparar | Bebida: enviado diretamente para o garçom
              </FormHelperText>
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Tempo de Preparo (minutos)</FormLabel>
              <NumberInput
                min={1}
                max={120}
                value={formData.preparationTime}
                onChange={handlePrepTimeChange}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            
            <Flex justify="space-between" gap={4} mb={4}>
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="available" mb="0">
                  Disponível
                </FormLabel>
                <Switch
                  id="available"
                  name="available"
                  isChecked={formData.available}
                  onChange={handleChange}
                  colorScheme="green"
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="featured" mb="0">
                  Destaque
                </FormLabel>
                <Switch
                  id="featured"
                  name="featured"
                  isChecked={formData.featured}
                  onChange={handleChange}
                  colorScheme="orange"
                />
              </FormControl>
            </Flex>
            
            <FormControl mb={4}>
              <FormLabel>Imagem</FormLabel>
              
              {formData.image ? (
                <Box position="relative" mb={2}>
                  <Image
                    src={formData.image}
                    alt="Preview"
                    maxH="200px"
                    objectFit="cover"
                    borderRadius="md"
                  />
                  <IconButton
                    position="absolute"
                    top="2"
                    right="2"
                    icon={<FiTrash2 />}
                    colorScheme="red"
                    size="sm"
                    onClick={handleRemoveImage}
                    aria-label="Remover imagem"
                  />
                </Box>
              ) : (
                <Flex
                  justifyContent="center"
                  alignItems="center"
                  h="100px"
                  bg="gray.100"
                  borderRadius="md"
                  mb={2}
                  cursor="pointer"
                  onClick={() => document.getElementById('image-upload').click()}
                >
                  <FiUpload size={24} />
                  <Box ml={2}>Clique para fazer upload</Box>
                </Flex>
              )}
              
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                display="none"
              />
              
              <Button
                leftIcon={<FiUpload />}
                onClick={() => document.getElementById('image-upload').click()}
                variant="outline"
                size="sm"
                width="full"
              >
                {formData.image ? 'Trocar imagem' : 'Upload de imagem'}
              </Button>
              
              <FormHelperText>
                Formatos aceitos: JPEG, PNG, GIF, WEBP. Tamanho máximo: 5MB
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
            form="product-form"
            isLoading={loading}
            loadingText="Salvando"
          >
            {product ? 'Atualizar' : 'Criar'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ProductFormModal;