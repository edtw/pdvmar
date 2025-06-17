// controllers/backupController.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const config = require('../config');
const mongoose = require('mongoose');
const Backup = mongoose.model('Backup');

// Diretório para armazenar backups
const BACKUP_DIR = path.join(__dirname, '../backups');

// Criar diretório de backups se não existir
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`[Backup] Diretório de backups criado: ${BACKUP_DIR}`);
}

/**
 * Criar backup do banco de dados
 */
exports.createBackup = async (req, res) => {
  console.log('[Backup] Iniciando processo de backup');
  try {
    // Verificar permissões
    if (req.user.role !== 'admin') {
      console.log(`[Backup] Acesso negado para usuário ${req.user.id} (role: ${req.user.role})`);
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Apenas administradores podem realizar backups' 
      });
    }
    
    // Gerar nome do arquivo baseado na data atual
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `backup_${timestamp}.gz`;
    const filePath = path.join(BACKUP_DIR, filename);
    
    console.log(`[Backup] Gerando arquivo: ${filename}`);
    
    // Parâmetros da conexão MongoDB
    const dbURI = config.MONGODB_URI;
    const dbName = dbURI.split('/').pop().split('?')[0]; // Extrair nome do banco
    
    console.log(`[Backup] Banco de dados alvo: ${dbName}`);
    console.log(`[Backup] URI MongoDB: ${dbURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`); // Log seguro da URI
    
    // Executar comando mongodump
    const command = `mongodump --uri="${dbURI}" --archive="${filePath}" --gzip`;
    
    console.log(`[Backup] Executando comando mongodump`);
    try {
      const { stdout, stderr } = await execPromise(command);
      if (stderr && stderr.trim() !== '') {
        console.log(`[Backup] Avisos durante mongodump: ${stderr}`);
      }
      console.log(`[Backup] mongodump concluído com sucesso`);
    } catch (dumpError) {
      console.error(`[Backup] Falha no mongodump: ${dumpError.message}`);
      throw new Error(`Erro ao executar mongodump: ${dumpError.message}`);
    }
    
    // Verificar se o arquivo foi criado
    if (!fs.existsSync(filePath)) {
      console.error(`[Backup] Arquivo não foi criado: ${filePath}`);
      throw new Error('Arquivo de backup não foi criado');
    }
    
    const fileSize = fs.statSync(filePath).size;
    console.log(`[Backup] Arquivo criado com sucesso. Tamanho: ${fileSize} bytes`);
    
    // Registrar backup no banco de dados
    console.log(`[Backup] Registrando backup no banco de dados`);
    let savedBackup;
    try {
      const backup = new Backup({
        filename,
        filepath: filePath,
        createdBy: req.user.id,
        size: fileSize
      });
      
      savedBackup = await backup.save();
      console.log(`[Backup] Backup registrado com sucesso. ID: ${savedBackup._id}`);
    } catch (dbError) {
      console.error(`[Backup] Erro ao salvar registro do backup: ${dbError.message}`);
      console.error(dbError.stack);
      // Mesmo com erro no registro, mantemos o arquivo para recuperação manual
      return res.status(500).json({ 
        success: false, 
        message: 'Backup foi criado, mas houve erro ao registrá-lo no banco',
        error: dbError.message,
        recoveryPath: filePath
      });
    }
    
    // Limitar número de backups (manter apenas os 10 mais recentes)
    console.log(`[Backup] Gerenciando backups antigos (manter 10 mais recentes)`);
    try {
      const backups = await Backup.find().sort({ createdAt: -1 }).skip(10);
      console.log(`[Backup] ${backups.length} backups antigos serão removidos`);
      
      for (const oldBackup of backups) {
        if (fs.existsSync(oldBackup.filepath)) {
          fs.unlinkSync(oldBackup.filepath);
          console.log(`[Backup] Arquivo removido: ${oldBackup.filepath}`);
        } else {
          console.log(`[Backup] Arquivo não encontrado: ${oldBackup.filepath}`);
        }
        await Backup.findByIdAndDelete(oldBackup._id);
        console.log(`[Backup] Registro removido: ${oldBackup._id}`);
      }
    } catch (cleanupError) {
      console.error(`[Backup] Erro ao limpar backups antigos: ${cleanupError.message}`);
      // Não interrompemos o processo por falha na limpeza
    }
    
    res.json({ 
      success: true, 
      message: 'Backup criado com sucesso',
      backup: {
        id: savedBackup._id,
        filename,
        createdAt: savedBackup.createdAt,
        size: savedBackup.size
      }
    });
  } catch (error) {
    console.error('[Backup] Erro crítico ao criar backup:', error);
    console.error(error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar backup',
      error: error.message
    });
  }
};

/**
 * Listar backups disponíveis
 */
exports.listBackups = async (req, res) => {
  console.log('[Backup] Iniciando listagem de backups');
  try {
    // Verificar permissões
    if (req.user.role !== 'admin') {
      console.log(`[Backup] Acesso negado para usuário ${req.user.id} (role: ${req.user.role})`);
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Apenas administradores podem visualizar backups' 
      });
    }
    
    console.log('[Backup] Consultando registros de backup no banco de dados');
    let backups = [];
    try {
      backups = await Backup.find()
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 });
      
      console.log(`[Backup] Encontrados ${backups.length} registros de backup`);
    } catch (dbError) {
      console.error(`[Backup] Erro ao consultar banco de dados: ${dbError.message}`);
      console.error(dbError.stack);
      throw new Error(`Falha ao consultar backups: ${dbError.message}`);
    }
    
    // Verificar integridade dos arquivos
    console.log('[Backup] Verificando integridade dos arquivos');
    const backupsWithIntegrity = await Promise.all(backups.map(async (backup) => {
      const exists = fs.existsSync(backup.filepath);
      let integrity = { valid: exists };
      
      if (exists) {
        // Verificar tamanho do arquivo
        const stats = fs.statSync(backup.filepath);
        integrity.fileSize = stats.size;
        integrity.sizeMatch = stats.size === backup.size;
        
        if (!integrity.sizeMatch) {
          console.log(`[Backup] Tamanho inconsistente para ${backup.filename}: DB=${backup.size}, File=${stats.size}`);
        }
      } else {
        console.log(`[Backup] Arquivo não encontrado: ${backup.filepath}`);
      }
      
      return {
        id: backup._id,
        filename: backup.filename,
        createdAt: backup.createdAt,
        createdBy: backup.createdBy ? backup.createdBy.name : 'Desconhecido',
        size: backup.size,
        sizeFormatted: formatBytes(backup.size),
        lastRestored: backup.lastRestored,
        integrity
      };
    }));
    
    console.log(`[Backup] Integridade verificada: ${backupsWithIntegrity.filter(b => b.integrity.valid).length} válidos, ${backupsWithIntegrity.filter(b => !b.integrity.valid).length} inválidos`);
    
    res.json({ 
      success: true, 
      backups: backupsWithIntegrity
    });
  } catch (error) {
    console.error('[Backup] Erro crítico ao listar backups:', error);
    console.error(error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao listar backups',
      error: error.message
    });
  }
};

/**
 * Verificar integridade de um backup específico
 */
exports.verifyBackup = async (req, res) => {
  console.log('[Backup] Iniciando verificação de integridade');
  try {
    // Verificar permissões
    if (req.user.role !== 'admin') {
      console.log(`[Backup] Acesso negado para usuário ${req.user.id} (role: ${req.user.role})`);
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Apenas administradores podem verificar backups' 
      });
    }
    
    const { id } = req.params;
    console.log(`[Backup] Verificando backup ID: ${id}`);
    
    // Buscar backup
    const backup = await Backup.findById(id);
    
    if (!backup) {
      console.log(`[Backup] Backup não encontrado: ${id}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Backup não encontrado' 
      });
    }
    
    console.log(`[Backup] Backup encontrado: ${backup.filename}`);
    
    // Resultado da verificação
    const result = {
      id: backup._id,
      filename: backup.filename,
      createdAt: backup.createdAt,
      fileExists: false,
      sizeCorrect: false,
      canBeRestored: false,
      details: {}
    };
    
    // Verificar se arquivo existe
    if (fs.existsSync(backup.filepath)) {
      result.fileExists = true;
      console.log(`[Backup] Arquivo existe: ${backup.filepath}`);
      
      // Verificar tamanho
      const stats = fs.statSync(backup.filepath);
      result.details.actualSize = stats.size;
      result.details.expectedSize = backup.size;
      result.sizeCorrect = stats.size === backup.size;
      
      if (!result.sizeCorrect) {
        console.log(`[Backup] Tamanho inconsistente: ${stats.size} bytes (esperado: ${backup.size} bytes)`);
      }
      
      // Testar se arquivo pode ser lido
      try {
        const testCmd = `mongorestore --uri="${config.MONGODB_URI}" --gzip --archive="${backup.filepath}" --dryRun`;
        console.log(`[Backup] Testando arquivo com --dryRun`);
        
        const { stdout, stderr } = await execPromise(testCmd);
        
        // Verificar saída para erros
        const hasErrors = stderr && stderr.includes('ERROR:');
        
        if (hasErrors) {
          console.log(`[Backup] Erros ao testar arquivo: ${stderr}`);
          result.canBeRestored = false;
          result.details.testErrors = stderr;
        } else {
          console.log(`[Backup] Teste bem-sucedido`);
          result.canBeRestored = true;
          result.details.testOutput = stderr;
        }
      } catch (testError) {
        console.error(`[Backup] Falha ao testar arquivo: ${testError.message}`);
        result.canBeRestored = false;
        result.details.testError = testError.message;
      }
    } else {
      console.log(`[Backup] Arquivo não existe: ${backup.filepath}`);
    }
    
    // Status geral
    result.isValid = result.fileExists && result.sizeCorrect && result.canBeRestored;
    
    res.json({ 
      success: true, 
      verification: result
    });
  } catch (error) {
    console.error('[Backup] Erro crítico ao verificar backup:', error);
    console.error(error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao verificar backup',
      error: error.message
    });
  }
};

/**
 * Sincronizar registros de backup com arquivos
 */
exports.syncBackups = async (req, res) => {
  try {
    // Verificar permissões
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Apenas administradores podem sincronizar backups' 
      });
    }
    
    // Diretório para armazenar backups
    const BACKUP_DIR = path.join(__dirname, '../backups');
    
    // Verificar se o diretório existe
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    
    // Ler arquivos do diretório
    const files = fs.readdirSync(BACKUP_DIR);
    const backupFiles = files.filter(file => file.startsWith('backup_') && (file.endsWith('.gz') || file.endsWith('.archive')));
    
    // Ler registros do banco de dados
    const backupRecords = await Backup.find();
    
    // Mapear arquivos existentes
    const existingFilePaths = backupRecords.map(record => record.filepath);
    
    // Contador para novos registros e registros removidos
    let newRecords = 0;
    let removedRecords = 0;
    
    // Adicionar registros para arquivos que não estão no banco de dados
    for (const file of backupFiles) {
      const filepath = path.join(BACKUP_DIR, file);
      
      // Verificar se o arquivo já está registrado
      if (!existingFilePaths.includes(filepath)) {
        // Criar novo registro
        const newBackup = new Backup({
          filename: file,
          filepath: filepath,
          createdBy: req.user.id,
          size: fs.statSync(filepath).size
        });
        
        await newBackup.save();
        newRecords++;
      }
    }
    
    // Verificar registros que não têm mais arquivos correspondentes
    for (const record of backupRecords) {
      if (!fs.existsSync(record.filepath)) {
        await Backup.findByIdAndDelete(record._id);
        removedRecords++;
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Sincronização de backups concluída', 
      summary: {
        newRecords,
        removedRecords,
        totalFiles: backupFiles.length,
        totalRecords: backupRecords.length
      }
    });
  } catch (error) {
    console.error('Erro ao sincronizar backups:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao sincronizar backups',
      error: error.message
    });
  }
};

/**
 * Restaurar backup
 */
exports.restoreBackup = async (req, res) => {
  console.log('[Backup] Iniciando processo de restauração');
  try {
    // Verificar permissões
    if (req.user.role !== 'admin') {
      console.log(`[Backup] Acesso negado para usuário ${req.user.id} (role: ${req.user.role})`);
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Apenas administradores podem restaurar backups' 
      });
    }
    
    const { id } = req.params;
    console.log(`[Backup] Tentando restaurar backup ID: ${id}`);
    
    // Buscar backup
    const backup = await Backup.findById(id);
    
    if (!backup) {
      console.log(`[Backup] Backup não encontrado: ${id}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Backup não encontrado' 
      });
    }
    
    // Guardar informações do backup antes da restauração
    const backupInfo = {
      id: backup._id.toString(),
      filename: backup.filename,
      filepath: backup.filepath,
      createdBy: backup.createdBy,
      size: backup.size,
      createdAt: backup.createdAt
    };
    
    console.log(`[Backup] Backup encontrado: ${backup.filename}`);
    
    // Verificar se arquivo existe
    if (!fs.existsSync(backup.filepath)) {
      console.error(`[Backup] Arquivo não encontrado: ${backup.filepath}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Arquivo de backup não encontrado no servidor' 
      });
    }
    
    console.log(`[Backup] Arquivo encontrado. Tamanho: ${backup.size} bytes`);
    
    // Parâmetros da conexão MongoDB
    const dbURI = config.MONGODB_URI;
    console.log(`[Backup] URI MongoDB: ${dbURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`); // Log seguro da URI
    
    // Executar comando mongorestore 
    // Use --nsExclude para não restaurar a coleção de backups, evitando perder os registros atuais
    const command = `mongorestore --uri="${dbURI}" --gzip --archive="${backupInfo.filepath}" --drop --nsExclude="marambaia_pdv.backups"`;
    
    console.log(`[Backup] Executando comando mongorestore (preservando coleção backups)`);
    try {
      const { stdout, stderr } = await execPromise(command);
      if (stderr && stderr.trim() !== '') {
        console.log(`[Backup] Avisos durante mongorestore: ${stderr}`);
      }
      console.log(`[Backup] mongorestore concluído com sucesso`);
    } catch (restoreError) {
      console.error(`[Backup] Falha no mongorestore: ${restoreError.message}`);
      throw new Error(`Erro ao executar mongorestore: ${restoreError.message}`);
    }
    
    // Registrar restauração
    console.log(`[Backup] Atualizando registro de backup após restauração`);
    try {
      // Buscar novamente o backup após a restauração
      const updatedBackup = await Backup.findById(backupInfo.id);
      
      if (!updatedBackup) {
        console.log(`[Backup] Backup não encontrado após restauração, criando registro novamente`);
        
        // Recriar o registro se foi perdido durante a restauração
        const newBackup = new Backup({
          _id: backupInfo.id, // Manter o mesmo ID
          filename: backupInfo.filename,
          filepath: backupInfo.filepath,
          createdBy: backupInfo.createdBy,
          size: backupInfo.size,
          createdAt: backupInfo.createdAt,
          lastRestored: new Date(),
          restoredBy: req.user.id
        });
        
        await newBackup.save();
        console.log(`[Backup] Registro de backup recriado com sucesso`);
      } else {
        console.log(`[Backup] Registro de backup encontrado, atualizando`);
        updatedBackup.lastRestored = new Date();
        updatedBackup.restoredBy = req.user.id;
        await updatedBackup.save();
        console.log(`[Backup] Registro atualizado`);
      }
    } catch (updateError) {
      console.error(`[Backup] Erro ao atualizar registro após restauração: ${updateError.message}`);
      console.log('[Backup] Continuando mesmo com erro de atualização de registro');
      // Não interromper o processo por falha na atualização do registro
    }
    
    // Emitir evento de atualização global
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      console.log(`[Backup] Emitindo evento de atualização global`);
      socketEvents.emitDataUpdate();
    } else {
      console.log(`[Backup] Socket não disponível para atualização`);
    }
    
    res.json({ 
      success: true, 
      message: 'Backup restaurado com sucesso',
      restoredAt: new Date()
    });
  } catch (error) {
    console.error('[Backup] Erro crítico ao restaurar backup:', error);
    console.error(error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao restaurar backup',
      error: error.message
    });
  }
};

/**
 * Download de arquivo de backup
 */
exports.downloadBackup = async (req, res) => {
  try {
    // Verificar permissões
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Apenas administradores podem baixar backups' 
      });
    }
    
    const { id } = req.params;
    
    // Buscar backup
    const BackupRecord = require('../models/Backup');
    const backup = await BackupRecord.findById(id);
    
    if (!backup) {
      return res.status(404).json({ 
        success: false, 
        message: 'Backup não encontrado' 
      });
    }
    
    // Verificar se arquivo existe
    if (!fs.existsSync(backup.filepath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Arquivo de backup não encontrado no servidor' 
      });
    }
    
    // Enviar arquivo
    res.download(backup.filepath, backup.filename);
  } catch (error) {
    console.error('Erro ao baixar backup:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao baixar backup',
      error: error.message
    });
  }
};

/**
 * Excluir backup
 */
exports.deleteBackup = async (req, res) => {
  try {
    // Verificar permissões
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Apenas administradores podem excluir backups' 
      });
    }
    
    const { id } = req.params;
    
    // Buscar backup
    const BackupRecord = require('../models/Backup');
    const backup = await BackupRecord.findById(id);
    
    if (!backup) {
      return res.status(404).json({ 
        success: false, 
        message: 'Backup não encontrado' 
      });
    }
    
    // Remover arquivo
    if (fs.existsSync(backup.filepath)) {
      fs.unlinkSync(backup.filepath);
    }
    
    // Remover registro
    await BackupRecord.findByIdAndDelete(id);
    
    res.json({ 
      success: true, 
      message: 'Backup excluído com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao excluir backup:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao excluir backup',
      error: error.message
    });
  }
};

/**
 * Formatação de tamanho em bytes para exibição
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}