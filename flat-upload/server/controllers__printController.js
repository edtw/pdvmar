// controllers/printController.js
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Modelos
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Table = require('../models/Table');
const User = require('../models/User');

/**
 * Imprimir comanda de pedido
 */
exports.printReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { printer } = req.body;
    
    // Buscar pedido com itens
    const order = await Order.findById(id)
      .populate('waiter')
      .populate('table');
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pedido não encontrado' 
      });
    }
    
    // Buscar itens do pedido
    const items = await OrderItem.find({ _id: { $in: order.items } })
      .populate('product');
    
    // Gerar conteúdo da comanda
    const receiptContent = generateReceiptContent(order, items);
    
    // Diretório temporário para armazenar arquivo da comanda
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Arquivo temporário
    const tempFile = path.join(tempDir, `receipt_${id}.txt`);
    fs.writeFileSync(tempFile, receiptContent);
    
    // Nome da impressora (padrão se não informado)
    const printerName = printer || 'ELGIN i9';
    
    // Enviar para impressora
    const result = await printFile(tempFile, printerName);
    
    // Limpar arquivo temporário
    fs.unlinkSync(tempFile);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Comanda enviada para impressão com sucesso' 
      });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Erro ao imprimir comanda:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao imprimir comanda',
      error: error.message
    });
  }
};

/**
 * Testar impressora
 */
exports.testPrinter = async (req, res) => {
  try {
    const { printer } = req.body;
    
    // Nome da impressora (padrão se não informado)
    const printerName = printer || 'ELGIN i9';
    
    // Conteúdo de teste
    const testContent = generateTestPage();
    
    // Diretório temporário para armazenar arquivo de teste
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Arquivo temporário
    const tempFile = path.join(tempDir, `test_${Date.now()}.txt`);
    fs.writeFileSync(tempFile, testContent);
    
    // Enviar para impressora
    const result = await printFile(tempFile, printerName);
    
    // Limpar arquivo temporário
    fs.unlinkSync(tempFile);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Teste enviado para impressão com sucesso' 
      });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Erro ao testar impressora:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao testar impressora',
      error: error.message
    });
  }
};

/**
 * Listar impressoras disponíveis
 */
exports.listPrinters = async (req, res) => {
  try {
    // Comando para listar impressoras no Windows
    const result = await execPromise('wmic printer get name');
    
    // Tratar a saída para extrair nomes de impressoras
    const printerList = result.stdout
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line !== 'Name')
      .map(name => ({ name }));
    
    res.json({ 
      success: true, 
      printers: printerList
    });
  } catch (error) {
    console.error('Erro ao listar impressoras:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao listar impressoras',
      error: error.message
    });
  }
};

/**
 * Função para gerar conteúdo da comanda
 */
function generateReceiptContent(order, items) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR');
  
  let content = '';
  
  // Cabeçalho
  content += '=================================\n';
  content += '        MARAMBAIA BEACH RJ       \n';
  content += '=================================\n\n';
  
  // Informações do pedido
  content += `Data: ${dateStr}     Hora: ${timeStr}\n`;
  content += `Mesa: ${order.table?.number || 'N/A'}\n`;
  content += `Atendente: ${order.waiter?.name || 'N/A'}\n`;
  content += `Pedido: #${order._id.toString().slice(-6)}\n`;
  content += '---------------------------------\n';
  
  // Itens
  content += 'QTDE PRODUTO                 VALOR\n';
  content += '---------------------------------\n';
  
  items.forEach(item => {
    if (item.status !== 'canceled') {
      const name = item.product?.name || 'Produto';
      const nameFormatted = name.padEnd(25).substring(0, 25);
      const quantity = item.quantity.toString().padStart(2);
      const total = (item.quantity * item.unitPrice).toFixed(2).padStart(7);
      
      content += `${quantity} ${nameFormatted} R$${total}\n`;
      
      // Observações do item
      if (item.notes) {
        content += `    >> ${item.notes.substring(0, 30)}\n`;
        if (item.notes.length > 30) {
          content += `    >> ${item.notes.substring(30, 60)}\n`;
        }
      }
    }
  });
  
  content += '---------------------------------\n';
  
  // Total
  const subtotal = order.total.toFixed(2);
  const serviceCharge = (order.total * 0.1).toFixed(2);
  const total = (order.total * 1.1).toFixed(2);
  
  content += `Subtotal:           R$ ${subtotal.padStart(7)}\n`;
  content += `Taxa Serviço 10%:   R$ ${serviceCharge.padStart(7)}\n`;
  content += `TOTAL:              R$ ${total.padStart(7)}\n`;
  content += '---------------------------------\n\n';
  
  // Rodapé
  content += '      Obrigado pela preferência!      \n';
  content += '      www.marambaiabeach.com.br       \n';
  content += '\n\n\n\n\n'; // Espaço para corte
  
  return content;
}

/**
 * Função para gerar página de teste
 */
function generateTestPage() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR');
  
  let content = '';
  
  // Cabeçalho
  content += '=================================\n';
  content += '        MARAMBAIA BEACH RJ       \n';
  content += '=================================\n\n';
  
  // Teste
  content += `      PÁGINA DE TESTE DE IMPRESSÃO     \n`;
  content += `---------------------------------\n`;
  content += `Data: ${dateStr}     Hora: ${timeStr}\n\n`;
  content += `TESTE DE CARACTERES:\n`;
  content += `ABCDEFGHIJKLMNOPQRSTUVWXYZ\n`;
  content += `abcdefghijklmnopqrstuvwxyz\n`;
  content += `0123456789 !@#$%&*()_+-=\n\n`;
  content += `TESTE DE ACENTUAÇÃO:\n`;
  content += `àáâãäåçèéêëìíîïñòóôõöùúûüý\n\n`;
  
  // Rodapé
  content += '---------------------------------\n';
  content += '   Sistema PDV Marambaia Beach   \n';
  content += '\n\n\n\n\n'; // Espaço para corte
  
  return content;
}

/**
 * Função para enviar arquivo para impressora
 */
async function printFile(filePath, printerName) {
  try {
    // Comando para impressão no Windows
    const command = `print /d:"${printerName}" "${filePath}"`;
    
    await execPromise(command);
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar para impressora:', error);
    return { success: false, error: error.message };
  }
}