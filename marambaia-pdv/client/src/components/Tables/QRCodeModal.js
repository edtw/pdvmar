// components/Tables/QRCodeModal.js
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
  VStack,
  Text,
  Image,
  useToast,
  Alert,
  AlertIcon,
  HStack,
  Box
} from '@chakra-ui/react';
import { DownloadIcon, RepeatIcon } from '@chakra-ui/icons';
import api from '../../services/api';

const QRCodeModal = ({ isOpen, onClose, table, onTableUpdate }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [qrToken, setQrToken] = useState(null);

  // Carregar QR Code ao abrir modal
  React.useEffect(() => {
    if (isOpen && table) {
      setQrCode(table.qrCodeUrl || null);
      setQrToken(table.qrToken || null);
    }
  }, [isOpen, table]);

  const handleGenerateQRCode = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/qrcode/generate/${table._id}`);
      const { qrCode: newQRCode, qrToken: newToken, table: updatedTable } = response.data;

      setQrCode(newQRCode);
      setQrToken(newToken);

      // Notificar parent component sobre atualização
      if (onTableUpdate && updatedTable) {
        onTableUpdate(updatedTable);
      }

      toast({
        title: 'QR Code gerado!',
        description: 'QR Code salvo com sucesso no banco de dados',
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      setLoading(false);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao gerar QR Code',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      setLoading(false);
    }
  };

  const handleDownloadQRCode = () => {
    if (!qrCode) return;

    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `mesa-${table.number}-qrcode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Download iniciado',
      description: 'QR Code baixado com sucesso',
      status: 'success',
      duration: 2000
    });
  };

  const handlePrint = () => {
    if (!qrCode) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - Mesa ${table.number}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: 'Arial', sans-serif;
              background: white;
              padding: 40px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }

            .print-container {
              width: 100%;
              max-width: 600px;
              border: 3px solid #2c5282;
              border-radius: 20px;
              padding: 40px;
              background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }

            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #2c5282;
            }

            .restaurant-name {
              font-size: 32px;
              font-weight: bold;
              color: #2c5282;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 2px;
            }

            .table-number {
              font-size: 48px;
              font-weight: bold;
              color: #dd6b20;
              margin: 20px 0;
              padding: 15px 30px;
              background: white;
              border-radius: 15px;
              display: inline-block;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }

            .qr-container {
              display: flex;
              justify-content: center;
              margin: 30px 0;
              padding: 20px;
              background: white;
              border-radius: 15px;
              box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);
            }

            img {
              width: 100%;
              max-width: 400px;
              height: auto;
              border: 5px solid white;
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }

            .instructions {
              text-align: center;
              margin-top: 30px;
              padding: 20px;
              background: white;
              border-radius: 15px;
              border-left: 5px solid #dd6b20;
            }

            .instructions h3 {
              color: #2c5282;
              font-size: 24px;
              margin-bottom: 15px;
            }

            .instructions p {
              color: #4a5568;
              font-size: 16px;
              line-height: 1.6;
              margin: 10px 0;
            }

            .instructions .step {
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 10px 0;
              padding: 10px;
              background: #f7fafc;
              border-radius: 8px;
            }

            .instructions .step-number {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 30px;
              height: 30px;
              background: #dd6b20;
              color: white;
              border-radius: 50%;
              font-weight: bold;
              margin-right: 15px;
            }

            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #e2e8f0;
              color: #718096;
              font-size: 14px;
            }

            .wifi-info {
              background: #fef5e7;
              border: 2px dashed #dd6b20;
              border-radius: 10px;
              padding: 15px;
              margin-top: 20px;
              text-align: center;
            }

            .wifi-info h4 {
              color: #dd6b20;
              margin-bottom: 10px;
              font-size: 18px;
            }

            @media print {
              body {
                padding: 20px;
              }

              .print-container {
                border: 3px solid #2c5282;
                box-shadow: none;
                page-break-inside: avoid;
              }

              @page {
                margin: 1cm;
                size: A4;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="header">
              <div class="restaurant-name">🍴 Marambaia Restaurante</div>
            </div>

            <div style="text-align: center;">
              <div class="table-number">Mesa ${table.number}</div>
            </div>

            <div class="qr-container">
              <img src="${qrCode}" alt="QR Code Mesa ${table.number}" />
            </div>

            <div class="instructions">
              <h3>📱 Como Fazer Seu Pedido</h3>

              <div class="step">
                <span class="step-number">1</span>
                <p>Abra a câmera do seu celular</p>
              </div>

              <div class="step">
                <span class="step-number">2</span>
                <p>Aponte para o QR Code acima</p>
              </div>

              <div class="step">
                <span class="step-number">3</span>
                <p>Toque no link que aparecer</p>
              </div>

              <div class="step">
                <span class="step-number">4</span>
                <p>Escolha seus pratos e faça seu pedido!</p>
              </div>
            </div>

            <div class="wifi-info">
              <h4>📶 WiFi Disponível</h4>
              <p style="color: #2c5282; font-weight: 600;">Rede: Marambaia-Guest</p>
              <p style="color: #4a5568; font-size: 14px;">Pergunte a senha ao garçom</p>
            </div>

            <div class="footer">
              <p>✨ Pedidos direto da sua mesa • Rápido e fácil ✨</p>
              <p style="margin-top: 10px; font-size: 12px;">Mesa ${table.number} • Token: ${qrToken ? qrToken.substring(0, 8) : 'N/A'}</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>QR Code - Mesa {table?.number}</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4}>
            {!qrCode ? (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Text>Gere um QR Code para esta mesa permitir que clientes façam pedidos.</Text>
              </Alert>
            ) : (
              <>
                <Box
                  p={6}
                  bg="white"
                  borderRadius="xl"
                  borderWidth={3}
                  borderColor="brand.500"
                  boxShadow="lg"
                >
                  <VStack spacing={3}>
                    <Text fontSize="2xl" fontWeight="bold" color="brand.600">
                      🍴 Marambaia Restaurante
                    </Text>
                    <Text fontSize="3xl" fontWeight="bold" color="orange.500">
                      Mesa {table?.number}
                    </Text>
                    <Image
                      src={qrCode}
                      alt={`QR Code Mesa ${table?.number}`}
                      boxSize="350px"
                      mx="auto"
                      borderRadius="lg"
                      boxShadow="md"
                    />
                    <Box
                      bg="orange.50"
                      p={3}
                      borderRadius="md"
                      borderLeftWidth={4}
                      borderLeftColor="orange.400"
                      w="full"
                    >
                      <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                        📱 Instruções:
                      </Text>
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        1. Abra a câmera do celular<br/>
                        2. Aponte para o QR Code<br/>
                        3. Toque no link e faça seu pedido!
                      </Text>
                    </Box>
                  </VStack>
                </Box>

                <VStack spacing={2} w="full">
                  <Alert status="success" borderRadius="md" variant="subtle">
                    <AlertIcon />
                    <Text fontSize="sm">
                      QR Code de alta qualidade pronto para impressão
                    </Text>
                  </Alert>
                  {qrToken && (
                    <Text fontSize="xs" color="gray.500" textAlign="center">
                      Token de Segurança: {qrToken.substring(0, 8)}... (identificação única)
                    </Text>
                  )}
                </VStack>
              </>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={2} w="full" justify="space-between">
            {qrCode ? (
              <>
                <Button
                  leftIcon={<DownloadIcon />}
                  onClick={handleDownloadQRCode}
                  variant="outline"
                  colorScheme="brand"
                >
                  Download
                </Button>
                <Button onClick={handlePrint} variant="outline">
                  Imprimir
                </Button>
                <Button
                  leftIcon={<RepeatIcon />}
                  onClick={handleGenerateQRCode}
                  isLoading={loading}
                  colorScheme="orange"
                >
                  Regenerar
                </Button>
              </>
            ) : (
              <Button
                colorScheme="brand"
                onClick={handleGenerateQRCode}
                isLoading={loading}
                w="full"
              >
                Gerar QR Code
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default QRCodeModal;
