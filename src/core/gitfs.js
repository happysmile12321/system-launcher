
import { info, success, error } from '../utils/logger.js';
import { Octokit } from 'octokit';

/**
 * GitFS - 抽象层，用于模拟文件系统操作，将所有对GitHub的API调用进行封装
 */
class GitFS {
  constructor(config) {
    this.config = config;
    this.baseDir = '.orchestrator-pro'; // 专属命名空间
    this.octokit = null;
    this.initializeOctokit();
  }

  initializeOctokit() {
    if (!this.config || !this.config.github || !this.config.github.token) {
      throw new Error('GitHub token is not configured.');
    }
    this.octokit = new Octokit({ auth: this.config.github.token });
  }

  /**
   * 获取完整路径，添加专属命名空间前缀
   * V3.0: 支持新的目录结构
   */
  getFullPath(path) {
    if (path.startsWith(this.baseDir)) {
      return path;
    }
    return `${this.baseDir}/${path}`;
  }

  /**
   * V3.0: 获取新的目录结构路径
   * 支持 workflows/, components/, triggers/, containers/, feishu/, system_services/, backups/, recovery/
   */
  getV3Path(type, path = '') {
    const v3Paths = {
      workflows: 'workflows',
      components: 'components', 
      triggers: 'triggers',
      containers: 'containers',
      feishu: 'feishu',
      system_services: 'system_services',
      backups: 'backups',
      recovery: 'recovery'
    };
    
    if (!v3Paths[type]) {
      throw new Error(`Unknown V3 path type: ${type}`);
    }
    
    const basePath = v3Paths[type];
    return path ? `${basePath}/${path}` : basePath;
  }

  /**
   * 列出目录内容
   */
  async listDirectory(path = '') {
    try {
      const fullPath = this.getFullPath(path);
      info(`Listing directory: ${fullPath}`);
      
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.config.github.owner,
        repo: this.config.github.repo,
        path: fullPath
      });

      // 确保目录存在
      if (data.type === 'file') {
        throw new Error(`${fullPath} is a file, not a directory`);
      }

      // 过滤出文件和子目录
      const items = data.map(item => ({
        name: item.name,
        path: item.path,
        type: item.type
      }));

      success(`Successfully listed directory: ${fullPath}`);
      return items;
    } catch (err) {
      if (err.status === 404) {
        return []; // 目录不存在返回空数组
      }
      error(`Failed to list directory: ${err.message}`);
      throw err;
    }
  }

  /**
   * 读取文件内容
   */
  async readFile(path) {
    try {
      const fullPath = this.getFullPath(path);
      info(`Reading file: ${fullPath}`);
      
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.config.github.owner,
        repo: this.config.github.repo,
        path: fullPath
      });

      if (data.type !== 'file') {
        throw new Error(`${fullPath} is not a file`);
      }

      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      success(`Successfully read file: ${fullPath}`);
      return {
        content,
        sha: data.sha
      };
    } catch (err) {
      if (err.status === 404) {
        error(`File not found: ${path}`);
        return null;
      }
      error(`Failed to read file: ${err.message}`);
      throw err;
    }
  }

  /**
   * 写入文件内容
   */
  async writeFile(path, content, message = 'Update file via GitFS') {
    try {
      const fullPath = this.getFullPath(path);
      info(`Writing file: ${fullPath}`);
      
      // 检查文件是否存在
      let sha = null;
      try {
        const fileData = await this.octokit.rest.repos.getContent({
          owner: this.config.github.owner,
          repo: this.config.github.repo,
          path: fullPath
        });
        sha = fileData.data.sha;
      } catch (err) {
        // 文件不存在，继续创建
      }

      const encodedContent = Buffer.from(content).toString('base64');
      
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.config.github.owner,
        repo: this.config.github.repo,
        path: fullPath,
        message,
        content: encodedContent,
        sha
      });

      success(`Successfully wrote file: ${fullPath}`);
    } catch (err) {
      error(`Failed to write file: ${err.message}`);
      throw err;
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(path, message = 'Delete file via GitFS') {
    try {
      const fullPath = this.getFullPath(path);
      info(`Deleting file: ${fullPath}`);
      
      // 获取文件的sha
      const fileData = await this.octokit.rest.repos.getContent({
        owner: this.config.github.owner,
        repo: this.config.github.repo,
        path: fullPath
      });
      
      await this.octokit.rest.repos.deleteFile({
        owner: this.config.github.owner,
        repo: this.config.github.repo,
        path: fullPath,
        message,
        sha: fileData.data.sha
      });

      success(`Successfully deleted file: ${fullPath}`);
    } catch (err) {
      error(`Failed to delete file: ${err.message}`);
      throw err;
    }
  }

  /**
   * 创建目录（通过创建一个占位文件）
   */
  async createDirectory(path, message = 'Create directory via GitFS') {
    try {
      const fullPath = this.getFullPath(path);
      info(`Creating directory: ${fullPath}`);
      
      // GitHub 通过文件路径隐式创建目录，所以我们创建一个占位文件
      const placeholderPath = `${fullPath}/.gitkeep`;
      
      // 检查文件是否存在以获取SHA
      let sha = null;
      try {
        const fileData = await this.octokit.rest.repos.getContent({
          owner: this.config.github.owner,
          repo: this.config.github.repo,
          path: placeholderPath
        });
        sha = fileData.data.sha;
      } catch (err) {
        // 文件不存在，继续创建
      }
      
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.config.github.owner,
        repo: this.config.github.repo,
        path: placeholderPath,
        message,
        content: Buffer.from('').toString('base64'),
        sha
      });

      success(`Successfully created directory: ${fullPath}`);
    } catch (err) {
      error(`Failed to create directory: ${err.message}`);
      throw err;
    }
  }

  /**
   * 检查路径是否存在
   */
  async exists(path) {
    try {
      const fullPath = this.getFullPath(path);
      await this.octokit.rest.repos.getContent({
        owner: this.config.github.owner,
        repo: this.config.github.repo,
        path: fullPath
      });
      return true;
    } catch (err) {
      if (err.status === 404) {
        return false;
      }
      throw err;
    }
  }

  /**
   * V3.0: 初始化新的目录结构
   */
  async initializeV3Structure() {
    const v3Directories = [
      'workflows',
      'components', 
      'triggers',
      'containers',
      'feishu',
      'system_services',
      'backups',
      'recovery'
    ];

    for (const dir of v3Directories) {
      try {
        await this.createDirectory(dir, `V3.0: Initialize ${dir} directory`);
        info(`V3.0: Created directory ${dir}`);
      } catch (err) {
        if (!err.message.includes('already exists')) {
          warning(`V3.0: Failed to create directory ${dir}: ${err.message}`);
        }
      }
    }
  }

  /**
   * V3.0: 迁移旧配置到新结构
   */
  async migrateToV3() {
    info('V3.0: Starting migration from old config structure...');
    
    try {
      // 迁移工作流配置
      const oldWorkflowsPath = 'config/workflows';
      const newWorkflowsPath = this.getV3Path('workflows');
      
      if (await this.exists(oldWorkflowsPath)) {
        const workflows = await this.listDirectory(oldWorkflowsPath);
        for (const workflow of workflows) {
          if (workflow.type === 'file' && workflow.name.endsWith('.json')) {
            const content = await this.readFile(`${oldWorkflowsPath}/${workflow.name}`);
            await this.writeFile(
              `${newWorkflowsPath}/${workflow.name}`,
              content.content,
              `V3.0: Migrate workflow ${workflow.name}`
            );
          }
        }
        success('V3.0: Migrated workflows to new structure');
      }

      // 迁移触发器配置
      const oldTriggersPath = 'config/triggers';
      const newTriggersPath = this.getV3Path('triggers');
      
      if (await this.exists(oldTriggersPath)) {
        const triggers = await this.listDirectory(oldTriggersPath);
        for (const trigger of triggers) {
          if (trigger.type === 'file' && trigger.name.endsWith('.json')) {
            const content = await this.readFile(`${oldTriggersPath}/${trigger.name}`);
            await this.writeFile(
              `${newTriggersPath}/${trigger.name}`,
              content.content,
              `V3.0: Migrate trigger ${trigger.name}`
            );
          }
        }
        success('V3.0: Migrated triggers to new structure');
      }

      // 迁移系统服务配置
      const oldServicesPath = 'config/services';
      const newServicesPath = this.getV3Path('system_services');
      
      if (await this.exists(oldServicesPath)) {
        const services = await this.listDirectory(oldServicesPath);
        for (const service of services) {
          if (service.type === 'file' && service.name.endsWith('.json')) {
            const content = await this.readFile(`${oldServicesPath}/${service.name}`);
            await this.writeFile(
              `${newServicesPath}/${service.name}`,
              content.content,
              `V3.0: Migrate service ${service.name}`
            );
          }
        }
        success('V3.0: Migrated system services to new structure');
      }

      success('V3.0: Migration completed successfully');
    } catch (err) {
      error(`V3.0: Migration failed: ${err.message}`);
      throw err;
    }
  }
}

export default GitFS;