// src/App.js (atualizado)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';

// Contextos
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { SocketProvider } from './contexts/SocketContext';

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TableMap from './pages/TableMap';
import OrderView from './pages/OrderView';
import Products from './pages/Products';
import Reports from './pages/Reports';
import Categories from './pages/Categories';
import Settings from './pages/Settings';
import CashManagement from './pages/CashManagement';
import Users from './pages/Users';

// Componentes
import ResponsiveLayout from './components/Layout/ResponsiveLayout';
import LoadingScreen from './components/ui/LoadingScreen';

// Tema personalizado
const theme = extendTheme({
  colors: {
    brand: {
      50: '#e0f2ff',
      100: '#b9e0ff',
      200: '#90cbff',
      300: '#65b3ff',
      400: '#3b9aff',
      500: '#1280ff',  // Cor principal
      600: '#0062cc',
      700: '#004999',
      800: '#003166',
      900: '#001833',
    },
    beach: {
      sand: '#f7e6c7',
      ocean: '#0077be',
      sun: '#ffac33',
      coral: '#ff7f50',
      seafoam: '#71eeb8',
    },
  },
  fonts: {
    heading: '"Montserrat", sans-serif',
    body: '"Open Sans", sans-serif',
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  styles: {
    global: (props) => ({
      html: {
        scrollBehavior: 'smooth',
      },
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
      },
      // Melhorias para mobile
      '.chakra-modal__content': {
        mx: { base: 4, md: 0 },
      },
    }),
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'medium',
        borderRadius: 'md',
      },
    },
    Card: {
      baseStyle: {
        borderRadius: 'lg',
        boxShadow: 'sm',
      },
    },
    Menu: {
      baseStyle: {
        list: {
          borderRadius: 'md',
          overflow: 'hidden',
          boxShadow: 'lg',
        },
        item: {
          borderRadius: 0,
        },
      },
    },
  },
});

// Componente de rota protegida
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, user, loading, hasPermission } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Verificar permissões se necessário
  if (requiredRoles.length > 0 && !hasPermission(requiredRoles)) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <DataProvider>
          <SocketProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route path="/" element={
                  <ProtectedRoute>
                    <ResponsiveLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/dashboard" />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="tables" element={<TableMap />} />
                  <Route path="orders/:id" element={<OrderView />} />
                  <Route path="cash" element={<CashManagement />} />
                  <Route path="products" element={
                    <ProtectedRoute requiredRoles={['admin', 'manager']}>
                      <Products />
                    </ProtectedRoute>
                  } />
                  <Route path="categories" element={
                    <ProtectedRoute requiredRoles={['admin', 'manager']}>
                      <Categories />
                    </ProtectedRoute>
                  } />
                  <Route path="users" element={
                    <ProtectedRoute requiredRoles={['admin', 'manager']}>
                      <Users />
                    </ProtectedRoute>
                  } />
                  <Route path="reports" element={
                    <ProtectedRoute requiredRoles={['admin', 'manager']}>
                      <Reports />
                    </ProtectedRoute>
                  } />
                  <Route path="settings" element={
                    <ProtectedRoute requiredRoles={['admin']}>
                      <Settings />
                    </ProtectedRoute>
                  } />
                </Route>
                
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Router>
          </SocketProvider>
        </DataProvider>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;