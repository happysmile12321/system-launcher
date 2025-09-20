import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { info, success, error, warning } from '../utils/logger.js';

/**
 * LocalFS服务 - 管理项目根目录下的/backup目录
 * V3.1: 标准化容器文件系统管理
 */
class LocalFSService {
  constructor() {
    this.backupRoot = resolve(process.cwd(), 'backup');
    this.gitignorePath = resolve(process.cwd(), '.gitignore');
    this.initialized = false;
  }

  /**
   * 初始化LocalFS服务
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      info('Initializing LocalFS service...');
      
      // 确保backup目录存在
      await this.ensureBackupDirectory();
      
      // 确保.gitignore包含/backup/条目
      await this.ensureGitignoreEntry();
      
      this.initialized = true;
      success('LocalFS service initialized successfully');
    } catch (err) {
      error(`Failed to initialize LocalFS service: ${err.message}`);
      throw err;
    }
  }

  /**
   * 确保backup目录存在
   */
  async ensureBackupDirectory() {
    try {
      await fs.access(this.backupRoot);
      info(`Backup directory exists: ${this.backupRoot}`);
    } catch (err) {
      if (err.code === 'ENOENT') {
        await fs.mkdir(this.backupRoot, { recursive: true });
        success(`Created backup directory: ${this.backupRoot}`);
      } else {
        throw err;
      }
    }
  }

  /**
   * 确保.gitignore包含/backup/条目
   */
  async ensureGitignoreEntry() {
    try {
      let gitignoreContent = '';
      let needsUpdate = false;

      try {
        gitignoreContent = await fs.readFile(this.gitignorePath, 'utf8');
      } catch (err) {
        if (err.code === 'ENOENT') {
          // .gitignore文件不存在，创建它
          gitignoreContent = '';
          needsUpdate = true;
        } else {
          throw err;
        }
      }

      // 检查是否包含/backup/条目
      if (!gitignoreContent.includes('/backup/') && !gitignoreContent.includes('backup/')) {
        needsUpdate = true;
      }

      if (needsUpdate) {
        const lines = gitignoreContent.split('\n').filter(line => line.trim());
        
        // 添加/backup/条目
        if (!lines.includes('/backup/') && !lines.includes('backup/')) {
          lines.push('/backup/');
        }

        // 添加注释
        const updatedContent = [
          '# LocalFS managed directories',
          '/backup/',
          '',
          ...lines.filter(line => line !== '/backup/' && line !== 'backup/')
        ].join('\n');

        await fs.writeFile(this.gitignorePath, updatedContent, 'utf8');
        success('Updated .gitignore with /backup/ entry');
      } else {
        info('.gitignore already contains backup directory entry');
      }
    } catch (err) {
      error(`Failed to update .gitignore: ${err.message}`);
      throw err;
    }
  }

  /**
   * 为容器组创建标准目录结构
   * @param {string} compositionName - 容器组名称
   * @returns {Promise<Object>} - 创建的目录结构信息
   */
  async createCompositionStructure(compositionName) {
    try {
      await this.initialize();

      if (!compositionName || typeof compositionName !== 'string') {
        throw new Error('Composition name is required and must be a string');
      }

      // 验证容器组名称（只允许字母、数字、连字符和下划线）
      if (!/^[a-zA-Z0-9_-]+$/.test(compositionName)) {
        throw new Error('Composition name can only contain letters, numbers, hyphens, and underscores');
      }

      const compositionPath = join(this.backupRoot, compositionName);
      const structure = {
        compositionName,
        rootPath: compositionPath,
        infra: join(compositionPath, 'infra'),
        config: join(compositionPath, 'config'),
        logs: join(compositionPath, 'logs'),
        entitydata: join(compositionPath, 'entitydata')
      };

      // 创建主目录
      await fs.mkdir(compositionPath, { recursive: true });
      
      // 创建子目录
      await fs.mkdir(structure.infra, { recursive: true });
      await fs.mkdir(structure.config, { recursive: true });
      await fs.mkdir(structure.logs, { recursive: true });
      await fs.mkdir(structure.entitydata, { recursive: true });

      success(`Created composition structure for: ${compositionName}`);
      info(`Structure created at: ${compositionPath}`);

      return structure;
    } catch (err) {
      error(`Failed to create composition structure for ${compositionName}: ${err.message}`);
      throw err;
    }
  }

  /**
   * 为服务创建配置目录
   * @param {string} compositionName - 容器组名称
   * @param {string} serviceName - 服务名称
   * @returns {Promise<string>} - 服务配置目录路径
   */
  async createServiceConfigDirectory(compositionName, serviceName) {
    try {
      await this.initialize();

      if (!serviceName || typeof serviceName !== 'string') {
        throw new Error('Service name is required and must be a string');
      }

      const serviceConfigPath = join(this.backupRoot, compositionName, 'config', serviceName);
      await fs.mkdir(serviceConfigPath, { recursive: true });

      info(`Created service config directory: ${serviceConfigPath}`);
      return serviceConfigPath;
    } catch (err) {
      error(`Failed to create service config directory for ${serviceName}: ${err.message}`);
      throw err;
    }
  }

  /**
   * 为服务创建日志目录
   * @param {string} compositionName - 容器组名称
   * @param {string} serviceName - 服务名称
   * @returns {Promise<string>} - 服务日志目录路径
   */
  async createServiceLogDirectory(compositionName, serviceName) {
    try {
      await this.initialize();

      if (!serviceName || typeof serviceName !== 'string') {
        throw new Error('Service name is required and must be a string');
      }

      const serviceLogPath = join(this.backupRoot, compositionName, 'logs', serviceName);
      await fs.mkdir(serviceLogPath, { recursive: true });

      info(`Created service log directory: ${serviceLogPath}`);
      return serviceLogPath;
    } catch (err) {
      error(`Failed to create service log directory for ${serviceName}: ${err.message}`);
      throw err;
    }
  }

  /**
   * 为服务创建数据目录
   * @param {string} compositionName - 容器组名称
   * @param {string} serviceName - 服务名称
   * @returns {Promise<string>} - 服务数据目录路径
   */
  async createServiceDataDirectory(compositionName, serviceName) {
    try {
      await this.initialize();

      if (!serviceName || typeof serviceName !== 'string') {
        throw new Error('Service name is required and must be a string');
      }

      const serviceDataPath = join(this.backupRoot, compositionName, 'entitydata', serviceName);
      await fs.mkdir(serviceDataPath, { recursive: true });

      info(`Created service data directory: ${serviceDataPath}`);
      return serviceDataPath;
    } catch (err) {
      error(`Failed to create service data directory for ${serviceName}: ${err.message}`);
      throw err;
    }
  }

  /**
   * 保存Docker Compose文件到infra目录
   * @param {string} compositionName - 容器组名称
   * @param {string} composeContent - Compose文件内容
   * @returns {Promise<string>} - Compose文件路径
   */
  async saveComposeFile(compositionName, composeContent) {
    try {
      await this.initialize();

      if (!composeContent || typeof composeContent !== 'string') {
        throw new Error('Compose content is required and must be a string');
      }

      const composeFilePath = join(this.backupRoot, compositionName, 'infra', 'docker-compose.yml');
      
      // 确保infra目录存在
      await fs.mkdir(join(this.backupRoot, compositionName, 'infra'), { recursive: true });
      
      await fs.writeFile(composeFilePath, composeContent, 'utf8');
      
      success(`Saved compose file for ${compositionName}: ${composeFilePath}`);
      return composeFilePath;
    } catch (err) {
      error(`Failed to save compose file for ${compositionName}: ${err.message}`);
      throw err;
    }
  }

  /**
   * 读取Docker Compose文件
   * @param {string} compositionName - 容器组名称
   * @returns {Promise<string>} - Compose文件内容
   */
  async readComposeFile(compositionName) {
    try {
      await this.initialize();

      const composeFilePath = join(this.backupRoot, compositionName, 'infra', 'docker-compose.yml');
      const content = await fs.readFile(composeFilePath, 'utf8');
      
      info(`Read compose file for ${compositionName}`);
      return content;
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new Error(`Compose file not found for composition: ${compositionName}`);
      }
      error(`Failed to read compose file for ${compositionName}: ${err.message}`);
      throw err;
    }
  }

  /**
   * 获取容器组目录结构信息
   * @param {string} compositionName - 容器组名称
   * @returns {Promise<Object>} - 目录结构信息
   */
  async getCompositionStructure(compositionName) {
    try {
      await this.initialize();

      const compositionPath = join(this.backupRoot, compositionName);
      
      try {
        await fs.access(compositionPath);
      } catch (err) {
        if (err.code === 'ENOENT') {
          throw new Error(`Composition directory not found: ${compositionName}`);
        }
        throw err;
      }

      const structure = {
        compositionName,
        rootPath: compositionPath,
        infra: join(compositionPath, 'infra'),
        config: join(compositionPath, 'config'),
        logs: join(compositionPath, 'logs'),
        entitydata: join(compositionPath, 'entitydata')
      };

      // 检查各个目录是否存在
      const stats = {};
      for (const [key, path] of Object.entries(structure)) {
        if (key === 'compositionName' || key === 'rootPath') continue;
        
        try {
          const stat = await fs.stat(path);
          stats[key] = {
            exists: true,
            isDirectory: stat.isDirectory(),
            size: stat.size,
            modified: stat.mtime
          };
        } catch (err) {
          stats[key] = {
            exists: false,
            isDirectory: false,
            size: 0,
            modified: null
          };
        }
      }

      return {
        ...structure,
        stats
      };
    } catch (err) {
      error(`Failed to get composition structure for ${compositionName}: ${err.message}`);
      throw err;
    }
  }

  /**
   * 列出所有容器组
   * @returns {Promise<Array>} - 容器组列表
   */
  async listCompositions() {
    try {
      await this.initialize();

      const entries = await fs.readdir(this.backupRoot, { withFileTypes: true });
      const compositions = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const compositionPath = join(this.backupRoot, entry.name);
          const structure = await this.getCompositionStructure(entry.name);
          compositions.push(structure);
        }
      }

      info(`Found ${compositions.length} compositions`);
      return compositions;
    } catch (err) {
      error(`Failed to list compositions: ${err.message}`);
      throw err;
    }
  }

  /**
   * 删除容器组目录结构
   * @param {string} compositionName - 容器组名称
   * @returns {Promise<void>}
   */
  async deleteComposition(compositionName) {
    try {
      await this.initialize();

      const compositionPath = join(this.backupRoot, compositionName);
      
      try {
        await fs.access(compositionPath);
      } catch (err) {
        if (err.code === 'ENOENT') {
          throw new Error(`Composition directory not found: ${compositionName}`);
        }
        throw err;
      }

      await fs.rm(compositionPath, { recursive: true, force: true });
      success(`Deleted composition: ${compositionName}`);
    } catch (err) {
      error(`Failed to delete composition ${compositionName}: ${err.message}`);
      throw err;
    }
  }

  /**
   * 生成符合LocalFS规范的卷映射路径
   * @param {string} compositionName - 容器组名称
   * @param {string} serviceName - 服务名称
   * @param {string} containerPath - 容器内路径
   * @param {string} type - 目录类型 (config, logs, entitydata)
   * @returns {string} - 主机路径
   */
  generateVolumePath(compositionName, serviceName, containerPath, type = 'entitydata') {
    const validTypes = ['config', 'logs', 'entitydata'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid volume type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    }

    const hostPath = join(this.backupRoot, compositionName, type, serviceName);
    return `${hostPath}:${containerPath}`;
  }

  /**
   * 检查服务是否正在运行
   * @param {string} compositionName - 容器组名称
   * @returns {Promise<boolean>} - 是否正在运行
   */
  async isCompositionRunning(compositionName) {
    try {
      // 这里可以集成Docker API来检查容器状态
      // 暂时返回false，后续可以扩展
      return false;
    } catch (err) {
      error(`Failed to check composition status for ${compositionName}: ${err.message}`);
      return false;
    }
  }

  /**
   * 获取服务状态信息
   * @returns {Promise<Object>} - 服务状态
   */
  async getServiceStatus() {
    try {
      await this.initialize();
      
      const compositions = await this.listCompositions();
      
      return {
        initialized: this.initialized,
        backupRoot: this.backupRoot,
        compositionCount: compositions.length,
        compositions: compositions.map(comp => ({
          name: comp.compositionName,
          path: comp.rootPath,
          stats: comp.stats
        }))
      };
    } catch (err) {
      error(`Failed to get service status: ${err.message}`);
      throw err;
    }
  }
}

// 创建单例实例
const localFSService = new LocalFSService();

export default localFSService;
export { LocalFSService };
