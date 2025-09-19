
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
   */
  getFullPath(path) {
    if (path.startsWith(this.baseDir)) {
      return path;
    }
    return `${this.baseDir}/${path}`;
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
}

export default GitFS;