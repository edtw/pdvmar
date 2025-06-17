// controllers/printController.js
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const os = require('os');

// Modelos
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Table = require('../models/Table');
const User = require('../models/User');

// Configurações de impressora
const PRINTER_CONFIG = {
  default: 'ELGIN i9',
  alternativeNames: ['ELGIN i9', 'BEMATECH i9', 'i9', 'ELGIN BEMATECH i9'],
  charWidth: 42, // Número de caracteres por linha para esta impressora
  commands: {
    initialize: '\x1B\x40', // ESC @
    emphasizedOn: '\x1B\x45\x01', // ESC E 1
    emphasizedOff: '\x1B\x45\x00', // ESC E 0
    alignCenter: '\x1B\x61\x01', // ESC a 1
    alignLeft: '\x1B\x61\x00', // ESC a 0
    alignRight: '\x1B\x61\x02', // ESC a 2
    cut: '\x1D\x56\x41', // GS V A - Corte total
    feed: '\x1B\x64\x05', // ESC d 5 - Avança 5 linhas
  }
};

// Diretório temporário para impressão
const TEMP_DIR = path.join(__dirname, '../temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  console.log(`[Print] Diretório temporário criado: ${TEMP_DIR}`);
}

/**
 * Imprimir comanda de pedido
 */
exports.printReceipt = async (req, res) => {
  console.log('[Print] Iniciando impressão de comanda');
  try {
    const { id } = req.params;
    const { printer } = req.body;
    
    console.log(`[Print] Pedido ID: ${id}`);
    
    // Buscar pedido com itens
    const order = await Order.findById(id)
      .populate('waiter')
      .populate('table');
    
    if (!order) {
      console.log(`[Print] Pedido não encontrado: ${id}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Pedido não encontrado' 
      });
    }
    
    console.log(`[Print] Buscando itens do pedido. Mesa: ${order.table?.number}, Atendente: ${order.waiter?.name}`);
    
    // Buscar itens do pedido
    const items = await OrderItem.find({ _id: { $in: order.items } })
      .populate('product');
    
    console.log(`[Print] ${items.length} itens encontrados`);
    
    // Gerar conteúdo da comanda
    const receiptContent = generateReceiptContent(order, items);
    
    // Buscar impressora disponível
    const printerName = await findPrinter(printer);
    console.log(`[Print] Usando impressora: ${printerName}`);
    
    // Arquivo temporário
    const tempFile = path.join(TEMP_DIR, `receipt_${id}_${Date.now()}.txt`);
    fs.writeFileSync(tempFile, receiptContent);
    console.log(`[Print] Arquivo temporário criado: ${tempFile}`);
    
    // Enviar para impressora
    try {
      const result = await printFile(tempFile, printerName);
      
      // Limpar arquivo temporário
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
        console.log(`[Print] Arquivo temporário removido`);
      }
      
      if (result.success) {
        console.log(`[Print] Impressão bem-sucedida`);
        res.json({ 
          success: true, 
          message: 'Comanda enviada para impressão com sucesso',
          printer: printerName
        });
      } else {
        console.error(`[Print] Falha na impressão: ${result.error}`);
        throw new Error(result.error);
      }
    } catch (printError) {
      console.error(`[Print] Erro ao imprimir: ${printError.message}`);
      
      // Se falhar com a impressora padrão, tentar alternativas
      if (!printer) {
        console.log(`[Print] Tentando impressoras alternativas`);
        
        // Buscar todas as impressoras
        const printers = await listAvailablePrinters();
        
        // Filtrar apenas as que não são a que acabou de falhar
        const alternatives = printers
          .filter(p => p.name !== printerName)
          .slice(0, 2); // limitar a 2 alternativas
        
        if (alternatives.length > 0) {
          console.log(`[Print] Alternativas encontradas: ${alternatives.map(p => p.name).join(', ')}`);
          return res.status(500).json({
            success: false,
            message: 'Falha na impressora principal',
            error: printError.message,
            alternatives: alternatives.map(p => ({ name: p.name }))
          });
        }
      }
      
      throw printError;
    }
  } catch (error) {
    console.error(`[Print] Erro crítico ao imprimir comanda: ${error.message}`);
    console.error(error.stack);
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
  console.log('[Print] Iniciando teste de impressora');
  try {
    const { printer } = req.body;
    
    // Buscar impressora disponível
    const printerName = await findPrinter(printer);
    console.log(`[Print] Usando impressora para teste: ${printerName}`);
    
    // Conteúdo de teste
    const testContent = generateTestPage(printerName);
    
    // Arquivo temporário
    const tempFile = path.join(TEMP_DIR, `test_${Date.now()}.txt`);
    fs.writeFileSync(tempFile, testContent);
    console.log(`[Print] Arquivo de teste criado: ${tempFile}`);
    
    // Enviar para impressora
    const result = await printFile(tempFile, printerName);
    
    // Limpar arquivo temporário
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
      console.log(`[Print] Arquivo de teste removido`);
    }
    
    if (result.success) {
      console.log(`[Print] Teste enviado com sucesso`);
      res.json({ 
        success: true, 
        message: 'Teste enviado para impressão com sucesso',
        printer: printerName
      });
    } else {
      console.error(`[Print] Falha no teste: ${result.error}`);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error(`[Print] Erro crítico ao testar impressora: ${error.message}`);
    console.error(error.stack);
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
  console.log('[Print] Listando impressoras disponíveis');
  try {
    const printers = await listAvailablePrinters();
    console.log(`[Print] ${printers.length} impressoras encontradas`);
    
    // Identificar impressora térmica
    const thermalPrinter = printers.find(p => 
      PRINTER_CONFIG.alternativeNames.some(name => 
        p.name.toLowerCase().includes(name.toLowerCase())
      )
    );
    
    if (thermalPrinter) {
      thermalPrinter.isDefault = true;
      thermalPrinter.type = 'thermal';
      console.log(`[Print] Impressora térmica identificada: ${thermalPrinter.name}`);
    }
    
    res.json({ 
      success: true, 
      printers,
      defaultPrinter: thermalPrinter?.name || PRINTER_CONFIG.default
    });
  } catch (error) {
    console.error(`[Print] Erro ao listar impressoras: ${error.message}`);
    console.error(error.stack);
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
  
  const { commands, charWidth } = PRINTER_CONFIG;
  const line = '-'.repeat(charWidth);
  
  let content = '';
  
  // Inicializar impressora
  content += commands.initialize;
  
  // Cabeçalho centralizado e enfatizado
  content += commands.emphasizedOn;
  content += commands.alignCenter;
  content += '='.repeat(charWidth) + '\n';
  content += 'MARAMBAIA BEACH RJ\n';
  content += '='.repeat(charWidth) + '\n\n';
  content += commands.emphasizedOff;
  
  // Informações do pedido
  content += commands.alignLeft;
  content += `Data: ${dateStr}     Hora: ${timeStr}\n`;
  content += `Mesa: ${order.table?.number || 'N/A'}\n`;
  content += `Atendente: ${order.waiter?.name || 'N/A'}\n`;
  content += `Pedido: #${order._id.toString().slice(-6)}\n`;
  content += line + '\n';
  
  // Cabeçalho dos itens
  content += commands.emphasizedOn;
  content += 'QTDE PRODUTO                 VALOR\n';
  content += commands.emphasizedOff;
  content += line + '\n';
  
  // Itens
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
  
  content += line + '\n';
  
  // Total
  const subtotal = order.total.toFixed(2);
  const serviceCharge = (order.total * 0.1).toFixed(2);
  const total = (order.total * 1.1).toFixed(2);
  
  content += `Subtotal:           R$ ${subtotal.padStart(7)}\n`;
  content += `Taxa Serviço 10%:   R$ ${serviceCharge.padStart(7)}\n`;
  content += commands.emphasizedOn;
  content += `TOTAL:              R$ ${total.padStart(7)}\n`;
  content += commands.emphasizedOff;
  content += line + '\n\n';
  
  // Rodapé
  content += commands.alignCenter;
  content += 'Obrigado pela preferência!\n';
  content += 'www.marambaiabeach.com.br\n';
  
  // Alimentar papel e cortar
  content += commands.feed;
  content += commands.cut;
  
  return content;
}

/**
 * Função para gerar página de teste
 */
function generateTestPage(printerName) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR');
  
  const { commands, charWidth } = PRINTER_CONFIG;
  const line = '-'.repeat(charWidth);
  
  let content = '';
  
  // Inicializar impressora
  content += commands.initialize;
  
  // Cabeçalho centralizado e enfatizado
  content += commands.emphasizedOn;
  content += commands.alignCenter;
  content += '='.repeat(charWidth) + '\n';
  content += 'MARAMBAIA BEACH RJ\n';
  content += '='.repeat(charWidth) + '\n\n';
  content += commands.emphasizedOff;
  
  // Teste
  content += commands.emphasizedOn;
  content += 'PÁGINA DE TESTE DE IMPRESSÃO\n';
  content += commands.emphasizedOff;
  
  content += line + '\n';
  content += commands.alignLeft;
  content += `Data: ${dateStr}     Hora: ${timeStr}\n\n`;
  content += `Impressora: ${printerName}\n\n`;
  
  content += commands.emphasizedOn;
  content += 'TESTE DE CARACTERES:\n';
  content += commands.emphasizedOff;
  content += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ\n';
  content += 'abcdefghijklmnopqrstuvwxyz\n';
  content += '0123456789 !@#$%&*()_+-=\n\n';
  
  content += commands.emphasizedOn;
  content += 'TESTE DE ACENTUAÇÃO:\n';
  content += commands.emphasizedOff;
  content += 'àáâãäåçèéêëìíîïñòóôõöùúûüý\n\n';
  
  // Largura de linha
  content += commands.emphasizedOn;
  content += 'LARGURA DA LINHA:\n';
  content += commands.emphasizedOff;
  content += '1234567890123456789012345678901234567890XX\n\n';
  
  // Status do sistema
  content += commands.emphasizedOn;
  content += 'INFORMAÇÕES DO SISTEMA:\n';
  content += commands.emphasizedOff;
  content += `SO: ${os.platform()} ${os.release()}\n`;
  content += `Hostname: ${os.hostname()}\n`;
  content += `Memória livre: ${Math.round(os.freemem() / 1024 / 1024)} MB\n`;
  content += `Uptime: ${Math.round(os.uptime() / 3600)} horas\n\n`;
  
  // Rodapé
  content += line + '\n';
  content += commands.alignCenter;
  content += 'Sistema PDV Marambaia Beach\n';
  
  // Alimentar papel e cortar
  content += commands.feed;
  content += commands.cut;
  
  return content;
}

/**
 * Função para listar impressoras disponíveis
 */
async function listAvailablePrinters() {
  try {
    let command;
    let printers = [];
    
    // Diferentes comandos por sistema operacional
    if (os.platform() === 'win32') {
      // Windows
      command = 'wmic printer get name';
      const result = await execPromise(command);
      
      printers = result.stdout
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && line !== 'Name')
        .map(name => ({ name }));
    } else if (os.platform() === 'linux') {
      // Linux
      command = 'lpstat -a || lpc status';
      try {
        const result = await execPromise(command);
        
        // Processar saída do lpstat
        printers = result.stdout
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            const name = line.split(' ')[0];
            return { name };
          });
      } catch (err) {
        // Se lpstat falhar, tentar com CUPS
        try {
          const result = await execPromise('lpinfo -v');
          printers = result.stdout
            .split('\n')
            .filter(line => line.includes('://'))
            .map(line => {
              const parts = line.split('://');
              const name = parts[1] ? parts[1].trim() : line.trim();
              return { name };
            });
        } catch (cupsErr) {
          console.error('[Print] Erro ao detectar impressoras CUPS:', cupsErr);
          // Usar lista padrão em caso de falha
          printers = [{ name: PRINTER_CONFIG.default }];
        }
      }
    } else if (os.platform() === 'darwin') {
      // macOS
      command = 'lpstat -p';
      try {
        const result = await execPromise(command);
        
        printers = result.stdout
          .split('\n')
          .filter(line => line.startsWith('printer'))
          .map(line => {
            const name = line.split(' ')[1];
            return { name };
          });
      } catch (err) {
        console.error('[Print] Erro ao detectar impressoras macOS:', err);
        printers = [{ name: PRINTER_CONFIG.default }];
      }
    }
    
    // Se nenhuma impressora for encontrada, usar a padrão
    if (printers.length === 0) {
      console.log('[Print] Nenhuma impressora detectada, usando padrão');
      printers.push({ name: PRINTER_CONFIG.default });
    }
    
    return printers;
  } catch (error) {
    console.error('[Print] Erro ao listar impressoras:', error);
    // Retornar impressora padrão em caso de erro
    return [{ name: PRINTER_CONFIG.default }];
  }
}

/**
 * Função para localizar a impressora a ser usada
 */
async function findPrinter(requestedPrinter) {
  try {
    // Se uma impressora específica foi solicitada, usar ela
    if (requestedPrinter) {
      return requestedPrinter;
    }
    
    // Caso contrário, buscar impressoras disponíveis
    const printers = await listAvailablePrinters();
    
    // Procurar por impressoras ELGIN/BEMATECH na lista
    for (const name of PRINTER_CONFIG.alternativeNames) {
      const found = printers.find(p => 
        p.name.toLowerCase().includes(name.toLowerCase())
      );
      
      if (found) {
        console.log(`[Print] Impressora térmica encontrada: ${found.name}`);
        return found.name;
      }
    }
    
    // Se não encontrar, usar a primeira disponível
    console.log(`[Print] Impressora térmica não encontrada, usando primeira disponível: ${printers[0]?.name}`);
    return printers[0]?.name || PRINTER_CONFIG.default;
  } catch (error) {
    console.error(`[Print] Erro ao buscar impressora: ${error.message}`);
    return PRINTER_CONFIG.default;
  }
}

/**
 * Função para enviar arquivo para impressora
 */
async function printFile(filePath, printerName) {
  console.log(`[Print] Enviando arquivo para impressora: ${printerName}`);
  try {
    let command;
    
    if (os.platform() === 'win32') {
      // Windows - comando print
      command = `print /d:"${printerName}" "${filePath}"`;
    } else if (os.platform() === 'linux') {
      // Linux - comando lp
      command = `lp -d "${printerName}" "${filePath}"`;
    } else if (os.platform() === 'darwin') {
      // macOS - comando lp
      command = `lp -d "${printerName}" "${filePath}"`;
    } else {
      throw new Error(`Sistema operacional não suportado: ${os.platform()}`);
    }
    
    console.log(`[Print] Executando comando: ${command}`);
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr && stderr.trim() !== '') {
      console.log(`[Print] Avisos durante impressão: ${stderr}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error(`[Print] Erro ao enviar para impressora: ${error.message}`);
    return { success: false, error: error.message };
  }
}