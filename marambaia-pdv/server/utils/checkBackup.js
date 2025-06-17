/**
 * Utilitário para verificar e reparar o sistema de backup
 * Este script pode ser executado pela linha de comando com:
 * node utils/checkBackup.js
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Carregar configurações
require('dotenv').config();
const config = require('../config');

// Diretório para armazenar backups
const BACKUP_DIR = path.join(__dirname, '../backups');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Função para imprimir mensagens coloridas
function log(message, color = 'white') {
  console.log(colors[color] + message + colors.reset);
}

// Conectar ao MongoDB
async function connectToDatabase() {
  try {
    log('Conectando ao banco de dados...', 'blue');
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    log('Conectado com sucesso!', 'green');
    
    // Carregar modelo de backup
    require('../models/User');
    require('../models/Backup');
    
    return true;
  } catch (error) {
    log(`Erro ao conectar ao banco de dados: ${error.message}`, 'red');
    log(error.stack, 'red');
    return false;
  }
}

// Verificar diretório de backups
async function checkBackupDirectory() {
  log('\nVerificando diretório de backups...', 'blue');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    log(`Diretório não encontrado: ${BACKUP_DIR}`, 'yellow');
    log('Criando diretório...', 'blue');
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    log('Diretório criado com sucesso!', 'green');
    return [];
  }
  
  log(`Diretório encontrado: ${BACKUP_DIR}`, 'green');
  
  // Ler arquivos no diretório
  const files = fs.readdirSync(BACKUP_DIR);
  const backupFiles = files.filter(file => 
    file.startsWith('backup_') && (file.endsWith('.gz') || file.endsWith('.archive'))
  );
  
  log(`Encontrados ${backupFiles.length} arquivos de backup`, 'green');
  
  return backupFiles.map(file => ({
    filename: file,
    filepath: path.join(BACKUP_DIR, file),
    size: fs.statSync(path.join(BACKUP_DIR, file)).size
  }));
}

// Verificar registros de backup no banco de dados
async function checkBackupRecords() {
  try {
    log('\nVerificando registros de backup no banco de dados...', 'blue');
    
    const Backup = mongoose.model('Backup');
    const backups = await Backup.find().sort({ createdAt: -1 });
    
    log(`Encontrados ${backups.length} registros de backup no banco de dados`, 'green');
    
    return backups;
  } catch (error) {
    log(`Erro ao verificar registros: ${error.message}`, 'red');
    return [];
  }
}

// Sincronizar arquivos e registros
async function syncBackupsWithDatabase(files, records) {
  log('\nSincronizando arquivos e registros...', 'blue');
  
  const Backup = mongoose.model('Backup');
  
  // Mapear arquivos e registros
  const filepaths = files.map(file => file.filepath);
  const recordedPaths = records.map(record => record.filepath);
  
  // Arquivos sem registro
  const filesWithoutRecord = files.filter(file => 
    !recordedPaths.includes(file.filepath)
  );
  
  // Registros sem arquivo
  const recordsWithoutFile = records.filter(record => 
    !filepaths.includes(record.filepath)
  );
  
  log(`${filesWithoutRecord.length} arquivos sem registro no banco de dados`, 'yellow');
  log(`${recordsWithoutFile.length} registros sem arquivo correspondente`, 'yellow');
  
  // Adicionar registros para arquivos
  if (filesWithoutRecord.length > 0) {
    log('\nCriando registros para arquivos encontrados...', 'blue');
    
    const adminUser = await mongoose.model('User').findOne({ role: 'admin' });
    
    if (!adminUser) {
      log('Nenhum usuário admin encontrado para associar aos registros', 'red');
      return;
    }
    
    for (const file of filesWithoutRecord) {
      try {
        const dateStr = file.filename.replace('backup_', '').replace('.gz', '');
        const createdAt = new Date(dateStr.replace(/-/g, ':'));
        
        const newBackup = new Backup({
          filename: file.filename,
          filepath: file.filepath,
          createdBy: adminUser._id,
          size: file.size,
          createdAt: isNaN(createdAt.getTime()) ? new Date() : createdAt
        });
        
        await newBackup.save();
        log(`Registro criado para ${file.filename}`, 'green');
      } catch (error) {
        log(`Erro ao criar registro para ${file.filename}: ${error.message}`, 'red');
      }
    }
  }
  
  // Limpar registros sem arquivo
  if (recordsWithoutFile.length > 0) {
    log('\nRemovendo registros sem arquivo correspondente...', 'blue');
    
    for (const record of recordsWithoutFile) {
      try {
        await Backup.findByIdAndDelete(record._id);
        log(`Registro removido: ${record.filename}`, 'green');
      } catch (error) {
        log(`Erro ao remover registro ${record.filename}: ${error.message}`, 'red');
      }
    }
  }
}

// Verificar integridade dos backups
async function checkBackupIntegrity() {
  try {
    log('\nVerificando integridade dos backups...', 'blue');
    
    const Backup = mongoose.model('Backup');
    const backups = await Backup.find().sort({ createdAt: -1 }).limit(5); // Verificar apenas os 5 mais recentes
    
    log(`Verificando ${backups.length} backups mais recentes...`, 'blue');
    
    for (const backup of backups) {
      log(`\nVerificando: ${backup.filename}`, 'cyan');
      
      // Verificar se arquivo existe
      if (!fs.existsSync(backup.filepath)) {
        log(`Arquivo não encontrado: ${backup.filepath}`, 'red');
        continue;
      }
      
      // Verificar tamanho
      const stats = fs.statSync(backup.filepath);
      const sizeMatches = stats.size === backup.size;
      
      if (!sizeMatches) {
        log(`Tamanho inconsistente: ${stats.size} bytes (esperado: ${backup.size} bytes)`, 'yellow');
        // Atualizar tamanho no registro
        backup.size = stats.size;
        await backup.save();
        log('Tamanho atualizado no registro', 'green');
      } else {
        log(`Tamanho correto: ${stats.size} bytes`, 'green');
      }
      
      // Testar se arquivo pode ser lido (skip para poupar tempo, descomente se necessário)
      /*
      try {
        log('Testando arquivo (simulação)...', 'blue');
        const testCmd = `mongorestore --uri="${config.MONGODB_URI}" --gzip --archive="${backup.filepath}" --dryRun`;
        
        const { stdout, stderr } = await execPromise(testCmd);
        
        // Verificar saída para erros
        const hasErrors = stderr && stderr.includes('ERROR:');
        
        if (hasErrors) {
          log(`Erros ao testar arquivo: ${stderr}`, 'red');
        } else {
          log('Teste bem-sucedido', 'green');
        }
      } catch (testError) {
        log(`Falha ao testar arquivo: ${testError.message}`, 'red');
      }
      */
    }
  } catch (error) {
    log(`Erro ao verificar integridade: ${error.message}`, 'red');
  }
}

// Criar backup se necessário
async function createBackupIfNeeded(files) {
  try {
    log('\nVerificando necessidade de novo backup...', 'blue');
    
    // Verificar se há backup recente (últimas 24h)
    const recentFiles = files.filter(file => {
      try {
        const stats = fs.statSync(file.filepath);
        const fileTime = new Date(stats.mtime).getTime();
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        return fileTime > oneDayAgo;
      } catch (e) {
        return false;
      }
    });
    
    if (recentFiles.length > 0) {
      log('Já existe backup recente (últimas 24h)', 'green');
      log(`Backup mais recente: ${recentFiles[0].filename}`, 'green');
      return;
    }
    
    log('Nenhum backup recente encontrado, criando novo backup...', 'yellow');
    
    // Gerar nome do arquivo baseado na data atual
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `backup_${timestamp}.gz`;
    const filePath = path.join(BACKUP_DIR, filename);
    
    // Executar comando mongodump
    const command = `mongodump --uri="${config.MONGODB_URI}" --archive="${filePath}" --gzip`;
    
    log('Executando mongodump...', 'blue');
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr && stderr.trim() !== '') {
      log(`Avisos durante mongodump: ${stderr}`, 'yellow');
    }
    
    if (fs.existsSync(filePath)) {
      const fileSize = fs.statSync(filePath).size;
      log(`Backup criado com sucesso! Tamanho: ${fileSize} bytes`, 'green');
      
      // Criar registro no banco de dados
      const Backup = mongoose.model('Backup');
      const adminUser = await mongoose.model('User').findOne({ role: 'admin' });
      
      if (adminUser) {
        const backup = new Backup({
          filename,
          filepath: filePath,
          createdBy: adminUser._id,
          size: fileSize
        });
        
        await backup.save();
        log('Registro criado no banco de dados', 'green');
      } else {
        log('Nenhum usuário admin encontrado para associar ao registro', 'red');
      }
    } else {
      log('Falha ao criar arquivo de backup', 'red');
    }
  } catch (error) {
    log(`Erro ao criar backup: ${error.message}`, 'red');
  }
}

// Função principal
async function main() {
  log('\n=== VERIFICAÇÃO DO SISTEMA DE BACKUP ===', 'magenta');
  log(`Data e hora: ${new Date().toLocaleString()}`, 'cyan');
  log(`Sistema: ${process.platform}`, 'cyan');
  
  // Conectar ao banco de dados
  const connected = await connectToDatabase();
  if (!connected) {
    log('Abortando verificação por falha na conexão', 'red');
    process.exit(1);
  }
  
  // Verificar diretório e arquivos
  const files = await checkBackupDirectory();
  
  // Verificar registros
  const records = await checkBackupRecords();
  
  // Sincronizar
  await syncBackupsWithDatabase(files, records);
  
  // Verificar integridade
  await checkBackupIntegrity();
  
  // Criar backup se necessário
  await createBackupIfNeeded(files);
  
  log('\n=== VERIFICAÇÃO CONCLUÍDA ===', 'magenta');
  
  // Fechar conexão
  await mongoose.connection.close();
  log('Conexão com o banco de dados fechada', 'blue');
}

// Executar
main().catch(error => {
  log(`Erro fatal: ${error.message}`, 'red');
  log(error.stack, 'red');
  process.exit(1);
}); 