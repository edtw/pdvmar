# 🖨️ Guia de Integração - Impressora Elgin i9

## 📋 Informações da Impressora

**Modelo**: Elgin i9
**Tipo**: Térmica não-fiscal
**Protocolo**: ESC/POS (compatível EPSON)
**Largura**: 80mm (42 caracteres/linha)
**Velocidade**: 300mm/s
**Interface**: USB

---

## 🔧 Opções de Implementação

### **OPÇÃO 1: Sistema Atual (90% Pronto)** ⚡ RÁPIDO

**Status**: JÁ IMPLEMENTADO
**Tempo**: 1-2 horas de teste
**Complexidade**: BAIXA

**Vantagens**:
- ✅ Código já pronto (`/server/controllers/printController.js`)
- ✅ Comandos ESC/POS completos
- ✅ Multi-plataforma (Windows/Linux/macOS)
- ✅ Detecção automática de impressora

**Desvantagens**:
- ❌ Depende do driver do SO
- ❌ Sem imagens/logos
- ❌ Formatação básica

**Como Usar**:
1. Conectar Elgin i9 via USB
2. Instalar driver (se necessário)
3. Testar: `GET http://localhost:5000/api/print/list`
4. Testar: `POST http://localhost:5000/api/print/test`
5. Imprimir comanda: `POST http://localhost:5000/api/print/receipt/:orderId`

**Exemplo de Cupom Gerado**:
```
==========================================
         MARAMBAIA BEACH RJ
==========================================

Data: 06/10/2025     Hora: 14:30:15
Mesa: 5
Atendente: João Silva
Pedido: #abc123
------------------------------------------
QTDE PRODUTO                 VALOR
------------------------------------------
 2 Cerveja Heineken       R$  18.00
    >> Bem gelada
 1 Porção de Fritas       R$  25.00
------------------------------------------
Subtotal:           R$  43.00
Taxa Serviço 10%:   R$   4.30
TOTAL:              R$  47.30
------------------------------------------

     Obrigado pela preferência!
    www.marambaiabeach.com.br
```

---

### **OPÇÃO 2: Upgrade com node-thermal-printer** 🚀 RECOMENDADO

**Status**: A IMPLEMENTAR
**Tempo**: 4-6 horas
**Complexidade**: MÉDIA

**Vantagens**:
- ✅ QR Code no cupom
- ✅ Código de barras
- ✅ Imagens (logo do restaurante)
- ✅ Melhor controle de formatação
- ✅ Suporte ativo da comunidade

**Desvantagens**:
- ⚠️ Precisa refatorar código existente
- ⚠️ Testes adicionais necessários

**Instalação**:
```bash
cd /Users/eto/Documents/pdvmar/marambaia-pdv/server
npm install node-thermal-printer qrcode
```

**Implementação**:

**Arquivo**: `/server/services/ElginPrinterService.js` (CRIAR)

```javascript
const ThermalPrinter = require('node-thermal-printer').printer;
const PrinterTypes = require('node-thermal-printer').types;
const QRCode = require('qrcode');

class ElginPrinterService {
  constructor() {
    this.printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,  // Elgin i9 é compatível
      interface: 'printer:ELGIN i9',
      characterSet: 'BRAZIL',
      removeSpecialCharacters: false,
      lineCharacter: '=',
      width: 42,
      options: {
        timeout: 5000
      }
    });
  }

  async printReceipt(order, items) {
    try {
      // Logo (se tiver)
      const logoPath = './assets/logo.png';
      if (fs.existsSync(logoPath)) {
        const image = await this.printer.printImage(logoPath);
      }

      // Cabeçalho
      this.printer.alignCenter();
      this.printer.setTextDoubleHeight();
      this.printer.bold(true);
      this.printer.println('MARAMBAIA BEACH RJ');
      this.printer.bold(false);
      this.printer.setTextNormal();
      this.printer.drawLine();

      // Dados do pedido
      this.printer.alignLeft();
      const now = new Date();
      this.printer.println(`Data: ${now.toLocaleDateString('pt-BR')}     Hora: ${now.toLocaleTimeString('pt-BR')}`);
      this.printer.println(`Mesa: ${order.table?.number || 'N/A'}`);
      this.printer.println(`Atendente: ${order.waiter?.name || 'N/A'}`);
      this.printer.println(`Pedido: #${order._id.toString().slice(-6)}`);
      this.printer.drawLine();

      // Cabeçalho dos itens
      this.printer.bold(true);
      this.printer.println('QTDE PRODUTO                 VALOR');
      this.printer.bold(false);
      this.printer.drawLine();

      // Itens
      items.forEach(item => {
        if (item.status !== 'canceled') {
          const name = (item.product?.name || 'Produto').padEnd(25).substring(0, 25);
          const qty = item.quantity.toString().padStart(2);
          const total = `R$ ${(item.quantity * item.unitPrice).toFixed(2).padStart(7)}`;

          this.printer.println(`${qty} ${name} ${total}`);

          if (item.notes) {
            this.printer.println(`    >> ${item.notes.substring(0, 35)}`);
          }
        }
      });

      this.printer.drawLine();

      // Total
      const subtotal = order.total.toFixed(2);
      const service = (order.total * 0.1).toFixed(2);
      const total = (order.total * 1.1).toFixed(2);

      this.printer.println(`Subtotal:           R$ ${subtotal.padStart(7)}`);
      this.printer.println(`Taxa Serviço 10%:   R$ ${service.padStart(7)}`);
      this.printer.bold(true);
      this.printer.println(`TOTAL:              R$ ${total.padStart(7)}`);
      this.printer.bold(false);
      this.printer.drawLine();

      // QR Code para feedback
      this.printer.alignCenter();
      const feedbackUrl = `https://marambaia.com.br/feedback/${order._id}`;
      await this.printer.printQR(feedbackUrl, {
        cellSize: 6,
        correction: 'M',
        model: 2
      });

      this.printer.println('Escaneie para avaliar');
      this.printer.newLine();

      // Rodapé
      this.printer.println('Obrigado pela preferência!');
      this.printer.println('www.marambaiabeach.com.br');

      // Cortar papel
      this.printer.cut();

      // Executar impressão
      await this.printer.execute();

      return { success: true };
    } catch (error) {
      console.error('[ElginPrinter] Erro:', error);
      return { success: false, error: error.message };
    }
  }

  async printKitchenOrder(order, items) {
    // Versão simplificada para cozinha
    this.printer.alignCenter();
    this.printer.setTextDoubleHeight();
    this.printer.bold(true);
    this.printer.println(`MESA ${order.table?.number}`);
    this.printer.bold(false);
    this.printer.setTextNormal();
    this.printer.drawLine();

    this.printer.alignLeft();
    items.forEach(item => {
      if (item.status === 'pending') {
        this.printer.setTextDoubleHeight();
        this.printer.println(`${item.quantity}x ${item.product?.name}`);
        this.printer.setTextNormal();

        if (item.notes) {
          this.printer.println(`OBS: ${item.notes}`);
        }
        this.printer.newLine();
      }
    });

    this.printer.drawLine();
    this.printer.alignCenter();
    this.printer.println(new Date().toLocaleTimeString('pt-BR'));
    this.printer.cut();

    await this.printer.execute();
    return { success: true };
  }

  async testPrint() {
    this.printer.alignCenter();
    this.printer.setTextDoubleHeight();
    this.printer.bold(true);
    this.printer.println('TESTE DE IMPRESSORA');
    this.printer.bold(false);
    this.printer.setTextNormal();
    this.printer.drawLine();

    this.printer.alignLeft();
    this.printer.println('Impressora: Elgin i9');
    this.printer.println(`Data: ${new Date().toLocaleString('pt-BR')}`);
    this.printer.newLine();

    this.printer.println('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    this.printer.println('abcdefghijklmnopqrstuvwxyz');
    this.printer.println('0123456789 !@#$%&*()-_=+');
    this.printer.println('áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ');
    this.printer.newLine();

    this.printer.bold(true);
    this.printer.println('Texto em negrito');
    this.printer.bold(false);
    this.printer.underline(true);
    this.printer.println('Texto sublinhado');
    this.printer.underline(false);
    this.printer.invert(true);
    this.printer.println('Texto invertido');
    this.printer.invert(false);

    this.printer.cut();
    await this.printer.execute();

    return { success: true };
  }
}

module.exports = new ElginPrinterService();
```

**Atualizar Controller**: `/server/controllers/printController.js`

```javascript
const ElginPrinterService = require('../services/ElginPrinterService');

exports.printReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('waiter table');

    const items = await OrderItem.find({ _id: { $in: order.items } })
      .populate('product');

    const result = await ElginPrinterService.printReceipt(order, items);

    if (result.success) {
      res.json({ success: true, message: 'Comanda impressa com sucesso' });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.printKitchenOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('table');

    const items = await OrderItem.find({
      _id: { $in: order.items },
      status: 'pending'
    }).populate('product');

    const result = await ElginPrinterService.printKitchenOrder(order, items);

    if (result.success) {
      res.json({ success: true, message: 'Pedido enviado para cozinha' });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

---

### **OPÇÃO 3: Driver USB Direto** 🔥 AVANÇADO

**Status**: NÃO IMPLEMENTADO
**Tempo**: 12-16 horas
**Complexidade**: ALTA

**Vantagens**:
- ✅ Não depende do SO
- ✅ Comunicação direta USB
- ✅ Mais confiável
- ✅ Funciona sem driver

**Desvantagens**:
- ❌ Muito complexo
- ❌ Requer permissões especiais
- ❌ Debug difícil

**Bibliotecas Necessárias**:
```bash
npm install escpos escpos-usb usb
```

**Implementação** (sketch):
```javascript
const escpos = require('escpos');
escpos.USB = require('escpos-usb');

const device = new escpos.USB(0x0dd4, 0x0205); // VID/PID da Elgin i9
const printer = new escpos.Printer(device);

device.open(function(error) {
  printer
    .font('a')
    .align('ct')
    .style('bu')
    .size(2, 2)
    .text('MARAMBAIA BEACH')
    .feed(2)
    .cut()
    .close();
});
```

**Encontrar VID/PID da Elgin i9**:
```bash
# Linux
lsusb | grep -i elgin

# Windows
wmic path Win32_PnPEntity where "Name like '%Elgin%'" get DeviceID

# macOS
system_profiler SPUSBDataType | grep -A 10 -i elgin
```

---

## 🎯 Integração no Frontend

### **1. Adicionar Botão no WaiterView**

**Arquivo**: `/client/src/pages/WaiterView.js`

```javascript
// No modal de detalhes da mesa, adicionar:
<Button
  colorScheme="purple"
  leftIcon={<FiPrinter />}
  onClick={() => handlePrintReceipt(selectedTable.currentOrder._id)}
  isLoading={isPrinting}
>
  Imprimir Comanda
</Button>

// Função
const [isPrinting, setIsPrinting] = useState(false);

const handlePrintReceipt = async (orderId) => {
  try {
    setIsPrinting(true);
    const response = await api.post(`/print/receipt/${orderId}`);

    toast({
      title: 'Comanda impressa!',
      description: response.data.message,
      status: 'success',
      duration: 2000
    });
  } catch (error) {
    toast({
      title: 'Erro na impressão',
      description: error.response?.data?.message || 'Tente novamente',
      status: 'error',
      duration: 3000
    });
  } finally {
    setIsPrinting(false);
  }
};
```

### **2. Auto-impressão ao Fechar Mesa**

**Arquivo**: `/client/src/components/Tables/CloseTableModal.js`

```javascript
// Após fechar mesa com sucesso:
const handleClose = async () => {
  try {
    await api.put(`/tables/${tableId}/close`, { /* ... */ });

    // Imprimir automaticamente
    if (autoPrint) {
      await api.post(`/print/receipt/${order._id}`);
    }

    toast({ title: 'Mesa fechada com sucesso!' });
  } catch (error) {
    // ...
  }
};
```

### **3. Configuração de Impressora**

**Arquivo**: `/client/src/pages/Settings.js`

```javascript
const [printers, setPrinters] = useState([]);
const [selectedPrinter, setSelectedPrinter] = useState(null);

useEffect(() => {
  loadPrinters();
}, []);

const loadPrinters = async () => {
  const response = await api.get('/print/list');
  setPrinters(response.data.printers);
  setSelectedPrinter(response.data.defaultPrinter);
};

const handleTestPrinter = async () => {
  await api.post('/print/test', { printer: selectedPrinter });
  toast({ title: 'Teste enviado!' });
};

// UI
<FormControl>
  <FormLabel>Impressora Padrão</FormLabel>
  <Select
    value={selectedPrinter}
    onChange={(e) => setSelectedPrinter(e.target.value)}
  >
    {printers.map(p => (
      <option key={p.name} value={p.name}>{p.name}</option>
    ))}
  </Select>
  <Button mt={2} onClick={handleTestPrinter}>
    Testar Impressão
  </Button>
</FormControl>
```

---

## 🧪 Plano de Testes

### **Quando Receber a Impressora**

#### ✅ Checklist de Teste

**1. Teste de Conectividade** (15 min)
- [ ] Conectar USB
- [ ] Ligar impressora
- [ ] Verificar driver instalado
- [ ] Testar comando: `GET /api/print/list`
- [ ] Verificar se retorna "ELGIN i9"

**2. Teste de Impressão Básica** (30 min)
- [ ] `POST /api/print/test` → deve imprimir página teste
- [ ] Verificar todos os caracteres
- [ ] Verificar acentuação
- [ ] Verificar alinhamento
- [ ] Verificar corte de papel

**3. Teste de Comanda Real** (1 hora)
- [ ] Criar pedido de teste com múltiplos itens
- [ ] `POST /api/print/receipt/:orderId`
- [ ] Verificar formatação
- [ ] Verificar totais corretos
- [ ] Verificar observações dos itens
- [ ] Testar com pedido vazio
- [ ] Testar com 20+ itens (cupom longo)

**4. Teste de Erros** (30 min)
- [ ] Desconectar impressora → deve retornar erro amigável
- [ ] Impressora sem papel → deve notificar
- [ ] Impressora travada → deve timeout
- [ ] Múltiplas impressões simultâneas → deve enfileirar

**5. Teste de Performance** (30 min)
- [ ] Imprimir 10 comandas seguidas
- [ ] Verificar se não trava
- [ ] Medir tempo médio de impressão
- [ ] Verificar consumo de memória

---

## 🔥 Troubleshooting

### **Problema: Impressora não detectada**

**Solução Windows**:
```bash
# Verificar impressoras
wmic printer get name

# Se não aparecer, reinstalar driver:
# 1. Device Manager → USB Printing Support
# 2. Update Driver → Browse → Elgin folder
```

**Solução Linux**:
```bash
# Instalar CUPS
sudo apt-get install cups

# Adicionar impressora
sudo lpadmin -p ElginI9 -E -v usb://ELGIN/i9

# Testar
echo "teste" | lp -d ElginI9
```

### **Problema: Caracteres estranhos**

**Causa**: Encoding errado

**Solução**:
```javascript
// Definir charset correto
characterSet: 'BRAZIL'  // ou 'PC860'
```

### **Problema: Não corta o papel**

**Causa**: Comando de corte incorreto

**Solução**:
```javascript
// Tentar comandos alternativos
this.printer.cut();           // Padrão
// ou
this.printer.raw([0x1D, 0x56, 0x00]);  // Corte parcial
// ou
this.printer.raw([0x1D, 0x56, 0x41]);  // Corte total
```

---

## 📊 Comparação das Opções

| Feature | Opção 1 (Atual) | Opção 2 (node-thermal) | Opção 3 (USB) |
|---------|-----------------|------------------------|---------------|
| Tempo de implementação | 1-2h | 4-6h | 12-16h |
| Dificuldade | Baixa | Média | Alta |
| Depende de driver SO | ✅ Sim | ✅ Sim | ❌ Não |
| QR Code | ❌ Não | ✅ Sim | ✅ Sim |
| Imagens/Logo | ❌ Não | ✅ Sim | ✅ Sim |
| Código de barras | ❌ Não | ✅ Sim | ✅ Sim |
| Confiabilidade | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Manutenção | Fácil | Fácil | Difícil |

---

## 🎯 Recomendação Final

### **Para Começar: OPÇÃO 1**
- Já está pronta
- Funciona em 1-2 horas
- Baixo risco

### **Para Produção: OPÇÃO 2**
- Melhor custo-benefício
- QR Code para feedback
- Logo do restaurante
- Implementação em 1 dia

### **Para Futuro: OPÇÃO 3**
- Apenas se OPÇÃO 2 não funcionar
- Ou se precisar de algo muito específico

---

## 📦 Pacote de Entrega

Quando a impressora chegar, siga esta ordem:

**DIA 1: Setup e Teste** (2-4 horas)
1. Conectar impressora
2. Instalar driver
3. Testar OPÇÃO 1 (sistema atual)
4. Ajustar formatação se necessário

**DIA 2: Upgrade (Opcional)** (4-6 horas)
1. Instalar node-thermal-printer
2. Implementar ElginPrinterService
3. Adicionar QR Code
4. Adicionar logo
5. Testar tudo novamente

**DIA 3: Integração Frontend** (2-3 horas)
1. Botões de impressão no WaiterView
2. Auto-impressão ao fechar mesa
3. Configurações de impressora
4. Testes finais

---

**O sistema de impressão está 90% pronto. Os 10% restantes são ajustes finos que só podem ser feitos com a impressora física em mãos!** 🎉
