// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';

// Pages
import ScanTable from './pages/ScanTable';
import CreateCommand from './pages/CreateCommand';
import Menu from './pages/Menu';
import MyOrder from './pages/MyOrder';
import LandingPage from './pages/LandingPage';

// Theme - Coastal Design System
import { theme } from './theme';

// WebSocket Context
import { SocketProvider } from './contexts/SocketContext';

// Old professional home page component (kept as backup)
const HomePageOld = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '40px 20px',
      background: 'linear-gradient(135deg, #0891B2 0%, #0E7490 50%, #155E75 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Logo/Brand */}
      <div style={{
        marginBottom: '48px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: '700',
          marginBottom: '8px',
          letterSpacing: '-0.02em'
        }}>
          Marambaia
        </h1>
        <div style={{
          height: '3px',
          width: '120px',
          background: 'rgba(255, 255, 255, 0.9)',
          margin: '16px auto'
        }} />
        <p style={{
          fontSize: '1.25rem',
          fontWeight: '300',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          opacity: 0.95
        }}>
          Restaurante
        </p>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '560px',
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: '40px 32px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: '600',
          marginBottom: '24px',
          lineHeight: '1.4'
        }}>
          Cardápio Digital
        </h2>

        <p style={{
          fontSize: '1.125rem',
          lineHeight: '1.7',
          marginBottom: '32px',
          opacity: 0.95
        }}>
          Para fazer seu pedido, escaneie o QR Code disponível em sua mesa.
        </p>

        {/* Instructions */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '24px',
          marginTop: '32px',
          textAlign: 'left'
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '16px',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Como Começar
          </h3>
          <ol style={{
            fontSize: '1rem',
            lineHeight: '2',
            paddingLeft: '24px',
            margin: 0
          }}>
            <li>Abra a câmera do seu celular</li>
            <li>Aponte para o QR Code da mesa</li>
            <li>Toque na notificação para abrir</li>
            <li>Faça seu pedido diretamente pelo celular</li>
          </ol>
        </div>

        {/* Footer - English */}
        <p style={{
          fontSize: '0.9rem',
          marginTop: '32px',
          opacity: 0.8,
          fontStyle: 'italic'
        }}>
          To place your order, scan the QR code on your table.
        </p>
      </div>

      {/* Bottom Info */}
      <div style={{
        marginTop: '48px',
        textAlign: 'center',
        opacity: 0.7,
        fontSize: '0.875rem'
      }}>
        <p>Sistema de Pedidos Digital</p>
      </div>
    </div>
  );
};

function App() {
  return (
    <ChakraProvider theme={theme}>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/table/:token" element={<ScanTable />} />
            <Route path="/create-command" element={<CreateCommand />} />
            <Route path="/menu/:orderId" element={<Menu />} />
            <Route path="/my-order/:orderId" element={<MyOrder />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </SocketProvider>
    </ChakraProvider>
  );
}

export default App;
