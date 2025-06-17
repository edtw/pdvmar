// controllers/backupController.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const config = require('../config');

// Diretório para armazenar backups
const BACKUP_DIR = path.join(__dirname, '../backups');

// Criar diretório de backups se não existir
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Criar backup do banco de dados
 */
exports.createBackup = async (req, res) => {
  try {
    // Verificar permissões
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Apenas administradores podem realizar backups' 
      });
    }
    
    // Gerar nome do arquivo baseado na data atual
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `backup_${timestamp}.gz`;
    const filePath = path.join(BACKUP_DIR, filename);
    
    // Parâmetros da conexão MongoDB
    const dbURI = config.MONGODB_URI;
    const dbName = dbURI.split('/').pop().split('?')[0]; // Extrair nome do banco
    
    // Executar comando mongodump
    const command = `mongodump --uri="${dbURI}" --archive="${filePath}" --gzip`;
    
    await execPromise(command);
    
    // Registrar backup no banco de dados
    const BackupRecord = require('../models/Backup');
    const backup = new BackupRecord({
      filename,
      filepath: filePath,
      createdBy: req.user.id,
      size: fs.statSync(filePath).size
    });
    
    await backup.save();
    
    // Limitar número de backups (manter apenas os 10 mais recentes)
    const backups = await BackupRecord.find().sort({ createdAt: -1 }).skip(10);
    for (const oldBackup of backups) {
      if (fs.existsSync(oldBackup.filepath)) {
        fs.unlinkSync(oldBackup.filepath);
      }
      await BackupRecord.findByIdAndDelete(oldBackup._id);
    }
    
    res.json({ 
      success: true, 
      message: 'Backup criado com sucesso',
      backup: {
        id: backup._id,
        filename,
        createdAt: backup.createdAt,
        size: backup.size
      }
    });
  } catch (error) {
    console.error('Erro ao criar backup:', error);
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
  try {
    // Verificar permissões
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Apenas administradores podem visualizar backups' 
      });
    }
    
    const BackupRecord = require('../models/Backup');
    const backups = await BackupRecord.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      backups: backups.map(b => ({
        id: b._id,
        filename: b.filename,
        createdAt: b.createdAt,
        createdBy: b.createdBy.name,
        size: b.size,
        sizeFormatted: formatBytes(b.size)
      }))
    });
  } catch (error) {
    console.error('Erro ao listar backups:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao listar backups',
      error: error.message
    });
  }
};

/**
 * Restaurar backup
 */
exports.restoreBackup = async (req, res) => {
  try {
    // Verificar permissões
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Apenas administradores podem restaurar backups' 
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
    
    // Parâmetros da conexão MongoDB
    const dbURI = config.MONGODB_URI;
    
    // Executar comando mongorestore
    const command = `mongorestore --uri="${dbURI}" --gzip --archive="${backup.filepath}" --drop`;
    
    await execPromise(command);
    
    // Registrar restauração
    backup.lastRestored = new Date();
    backup.restoredBy = req.user.id;
    await backup.save();
    
    // Emitir evento de atualização global
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitDataUpdate();
    }
    
    res.json({ 
      success: true, 
      message: 'Backup restaurado com sucesso',
      restoredAt: backup.lastRestored
    });
  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
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