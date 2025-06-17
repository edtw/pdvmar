import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

// Criar o Context
const DataContext = createContext();

// Hook customizado para usar o DataContext
export const useData = () => {
  return useContext(DataContext);
};

// Provider do DataContext
export const DataProvider = ({ children }) => {
  // Estados para dados
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState({
    tables: false,
    categories: false,
    products: false
  });

  // Carregar mesas
  const fetchTables = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, tables: true }));
      const response = await api.get('/tables');
      
      if (response.data.success) {
        setTables(response.data.tables);
      }
    } catch (error) {
      console.error('Erro ao carregar mesas:', error);
    } finally {
      setLoading(prev => ({ ...prev, tables: false }));
    }
  }, []);

  // Carregar categorias
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, categories: true }));
      const response = await api.get('/categories');
      
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(prev => ({ ...prev, categories: false }));
    }
  }, []);

  // Carregar produtos
  const fetchProducts = useCallback(async (params = {}) => {
    try {
      setLoading(prev => ({ ...prev, products: true }));
      
      // Construir query string a partir dos parâmetros
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const query = queryParams.toString();
      const url = `/products${query ? `?${query}` : ''}`;
      
      const response = await api.get(url);
      
      if (response.data.success) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  }, []);

  // Buscar mesa por ID
  const getTableById = useCallback((tableId) => {
    return tables.find(table => table._id === tableId);
  }, [tables]);

  // Buscar produto por ID
  const getProductById = useCallback((productId) => {
    return products.find(product => product._id === productId);
  }, [products]);

  // Buscar categoria por ID
  const getCategoryById = useCallback((categoryId) => {
    return categories.find(category => category._id === categoryId);
  }, [categories]);

  // Função para atualizar uma mesa na lista
  const updateTable = useCallback((updatedTable) => {
    setTables(prevTables => 
      prevTables.map(table => 
        table._id === updatedTable._id ? updatedTable : table
      )
    );
  }, []);

  // Função para atualizar um produto na lista
  const updateProduct = useCallback((updatedProduct) => {
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product._id === updatedProduct._id ? updatedProduct : product
      )
    );
  }, []);

  // Valor a ser provido pelo Context
  const value = {
    // Dados
    tables,
    categories,
    products,
    loading,
    
    // Funções de carregamento
    fetchTables,
    fetchCategories,
    fetchProducts,
    
    // Funções de busca
    getTableById,
    getProductById,
    getCategoryById,
    
    // Funções de atualização
    updateTable,
    updateProduct
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export default DataContext;