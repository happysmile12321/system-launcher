import { info, success, error, warning } from '../utils/logger.js';
import { getConfig } from './configService.js';

/**
 * FeishuFS - 飞书云盘文件系统服务
 */
class FeishuFS {
  constructor() {
    this.baseUrl = 'https://open.feishu.cn/open-apis';
    this.driveToken = null;
    this.appAccessToken = null;
    this.appAccessTokenExpires = null;
  }

  /**
   * 获取应用级别的访问令牌
   * @returns {string} - 应用访问令牌
   */
  async getAppAccessToken() {
    try {
      // 检查缓存的令牌是否仍然有效
      if (this.appAccessToken && this.appAccessTokenExpires && new Date() < this.appAccessTokenExpires) {
        return this.appAccessToken;
      }

      const config = await getConfig();
      
      if (!config.feishu?.appId || !config.feishu?.appSecret) {
        throw new Error('Feishu App ID and App Secret are required');
      }

      info('Getting Feishu app access token');

      const response = await fetch(`${this.baseUrl}/auth/v3/app_access_token/internal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: config.feishu.appId,
          app_secret: config.feishu.appSecret
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to get app access token: ${errorData.error_description || response.statusText}`);
      }

      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`Feishu API error: ${data.msg}`);
      }

      // 缓存令牌
      this.appAccessToken = data.app_access_token;
      this.appAccessTokenExpires = new Date(Date.now() + (data.expire - 60) * 1000); // 提前1分钟过期

      success('Successfully obtained Feishu app access token');
      return this.appAccessToken;

    } catch (err) {
      error(`Failed to get app access token: ${err.message}`);
      throw err;
    }
  }

  /**
   * 获取有效的访问令牌（兼容性方法）
   * @returns {string} - 访问令牌
   */
  async getAccessToken() {
    return await this.getAppAccessToken();
  }

  /**
   * 获取云盘根目录信息
   * @returns {Object} - 根目录信息
   */
  async getRootFolder() {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(`${this.baseUrl}/drive/v1/files/root_folder`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to get root folder: ${errorData.error_description || response.statusText}`);
      }

      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`Feishu API error: ${data.msg}`);
      }

      return data.data;

    } catch (err) {
      error(`Failed to get root folder: ${err.message}`);
      throw err;
    }
  }

  /**
   * 获取工作空间列表
   * @returns {Array} - 工作空间列表
   */
  async getWorkspaces() {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(`${this.baseUrl}/drive/v1/files`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          page_size: 200,
          order_by: 'created_time',
          direction: 'desc'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to get workspaces: ${errorData.error_description || response.statusText}`);
      }

      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`Feishu API error: ${data.msg}`);
      }

      // 过滤出文件夹类型的工作空间
      const workspaces = data.data.files?.filter(file => file.type === 'folder') || [];
      
      // 添加根目录作为默认工作空间
      const rootFolder = await this.getRootFolder();
      workspaces.unshift({
        token: rootFolder.token,
        name: '根目录',
        type: 'folder',
        is_root: true
      });

      return workspaces;

    } catch (err) {
      error(`Failed to get workspaces: ${err.message}`);
      throw err;
    }
  }

  /**
   * 设置默认工作空间
   * @param {string} workspaceToken - 工作空间令牌
   * @param {string} workspaceName - 工作空间名称
   */
  async setDefaultWorkspace(workspaceToken, workspaceName) {
    try {
      const config = await getConfig();
      
      // 检查是否有GitHub配置
      if (!config.github?.token) {
        // 如果没有GitHub配置，只保存到本地缓存
        const workspaceData = {
          token: workspaceToken,
          name: workspaceName,
          selectedAt: new Date().toISOString()
        };
        
        this.defaultWorkspace = workspaceData;
        success(`默认工作空间已设置为: ${workspaceName} (仅本地缓存)`);
        return;
      }
      
      const gitfs = new GitFS(config);
      
      const workspaceData = {
        token: workspaceToken,
        name: workspaceName,
        selectedAt: new Date().toISOString()
      };
      
      // 确保.orchestrator-pro目录存在
      await gitfs.createDirectory('.orchestrator-pro');
      
      // 保存默认工作空间到GitFS
      await gitfs.writeFile(
        '.orchestrator-pro/feishu-workspace.json',
        JSON.stringify(workspaceData, null, 2),
        'Set default Feishu workspace'
      );
      
      // 更新本地缓存
      this.defaultWorkspace = workspaceData;
      
      success(`默认工作空间已设置为: ${workspaceName}`);
      
    } catch (err) {
      error(`设置默认工作空间失败: ${err.message}`);
      throw err;
    }
  }

  /**
   * 获取默认工作空间
   * @returns {Object|null} - 默认工作空间信息
   */
  async getDefaultWorkspace() {
    try {
      if (this.defaultWorkspace) {
        return this.defaultWorkspace;
      }

      const config = await getConfig();
      
      // 检查是否有GitHub配置
      if (!config.github?.token) {
        info('GitHub未配置，无法从GitFS读取工作空间配置');
        return null;
      }
      
      const gitfs = new GitFS(config);
      
      const workspaceFile = await gitfs.readFile('.orchestrator-pro/feishu-workspace.json');
      
      if (workspaceFile) {
        this.defaultWorkspace = JSON.parse(workspaceFile.content);
        return this.defaultWorkspace;
      }
      
      return null;
      
    } catch (err) {
      info(`未找到默认工作空间配置: ${err.message}`);
      return null;
    }
  }

  /**
   * 列出文件夹内容
   * @param {string} folderToken - 文件夹令牌
   * @param {Object} options - 选项
   * @returns {Array} - 文件列表
   */
  async listFiles(folderToken = null, options = {}) {
    try {
      const accessToken = await this.getAccessToken();
      
      const params = new URLSearchParams({
        page_size: options.pageSize || 50,
        page_token: options.pageToken || '',
        order_by: options.orderBy || 'created_time',
        direction: options.direction || 'desc'
      });

      const url = folderToken 
        ? `${this.baseUrl}/drive/v1/files/${folderToken}/children?${params.toString()}`
        : `${this.baseUrl}/drive/v1/files/root_folder/children?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to list files: ${errorData.error_description || response.statusText}`);
      }

      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`Feishu API error: ${data.msg}`);
      }

      return data.data;

    } catch (err) {
      error(`Failed to list files: ${err.message}`);
      throw err;
    }
  }

  /**
   * 创建文件夹
   * @param {string} name - 文件夹名称
   * @param {string} parentToken - 父文件夹令牌
   * @returns {Object} - 创建的文件夹信息
   */
  async createFolder(name, parentToken = null) {
    try {
      const accessToken = await this.getAccessToken();
      
      const requestBody = {
        name: name,
        type: 'folder'
      };

      if (parentToken) {
        requestBody.parent_token = parentToken;
      }

      const response = await fetch(`${this.baseUrl}/drive/v1/files/create_folder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to create folder: ${errorData.error_description || response.statusText}`);
      }

      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`Feishu API error: ${data.msg}`);
      }

      success(`Created folder: ${name}`);
      return data.data;

    } catch (err) {
      error(`Failed to create folder: ${err.message}`);
      throw err;
    }
  }

  /**
   * 上传文件
   * @param {string} fileName - 文件名
   * @param {Buffer|string} content - 文件内容
   * @param {string} parentToken - 父文件夹令牌
   * @param {string} contentType - 内容类型
   * @returns {Object} - 上传的文件信息
   */
  async uploadFile(fileName, content, parentToken = null, contentType = 'application/octet-stream') {
    try {
      const accessToken = await this.getAccessToken();
      
      // 第一步：创建文件
      const createRequest = {
        name: fileName,
        type: 'file'
      };

      if (parentToken) {
        createRequest.parent_token = parentToken;
      }

      const createResponse = await fetch(`${this.baseUrl}/drive/v1/files/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createRequest)
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        throw new Error(`Failed to create file: ${errorData.error_description || createResponse.statusText}`);
      }

      const createData = await createResponse.json();
      
      if (createData.code !== 0) {
        throw new Error(`Feishu API error: ${createData.msg}`);
      }

      const fileToken = createData.data.file_token;

      // 第二步：上传文件内容
      const uploadResponse = await fetch(`${this.baseUrl}/drive/v1/files/${fileToken}/content`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': contentType
        },
        body: content
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(`Failed to upload file content: ${errorData.error_description || uploadResponse.statusText}`);
      }

      success(`Uploaded file: ${fileName}`);
      return createData.data;

    } catch (err) {
      error(`Failed to upload file: ${err.message}`);
      throw err;
    }
  }

  /**
   * 下载文件
   * @param {string} fileToken - 文件令牌
   * @returns {Buffer} - 文件内容
   */
  async downloadFile(fileToken) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(`${this.baseUrl}/drive/v1/files/${fileToken}/content`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to download file: ${errorData.error_description || response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      success(`Downloaded file: ${fileToken}`);
      return Buffer.from(buffer);

    } catch (err) {
      error(`Failed to download file: ${err.message}`);
      throw err;
    }
  }

  /**
   * 删除文件或文件夹
   * @param {string} fileToken - 文件/文件夹令牌
   * @param {string} type - 类型 ('file' 或 'folder')
   * @returns {boolean} - 是否删除成功
   */
  async deleteFile(fileToken, type = 'file') {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(`${this.baseUrl}/drive/v1/files/${fileToken}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: type })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to delete ${type}: ${errorData.error_description || response.statusText}`);
      }

      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`Feishu API error: ${data.msg}`);
      }

      success(`Deleted ${type}: ${fileToken}`);
      return true;

    } catch (err) {
      error(`Failed to delete ${type}: ${err.message}`);
      throw err;
    }
  }

  /**
   * 获取文件信息
   * @param {string} fileToken - 文件令牌
   * @returns {Object} - 文件信息
   */
  async getFileInfo(fileToken) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(`${this.baseUrl}/drive/v1/files/${fileToken}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to get file info: ${errorData.error_description || response.statusText}`);
      }

      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`Feishu API error: ${data.msg}`);
      }

      return data.data;

    } catch (err) {
      error(`Failed to get file info: ${err.message}`);
      throw err;
    }
  }

  /**
   * 搜索文件
   * @param {string} query - 搜索查询
   * @param {Object} options - 搜索选项
   * @returns {Array} - 搜索结果
   */
  async searchFiles(query, options = {}) {
    try {
      const accessToken = await this.getAccessToken();
      
      const requestBody = {
        search_key: query,
        count: options.count || 20,
        offset: options.offset || 0
      };

      if (options.searchScope) {
        requestBody.search_scope = options.searchScope;
      }

      const response = await fetch(`${this.baseUrl}/drive/v1/files/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to search files: ${errorData.error_description || response.statusText}`);
      }

      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`Feishu API error: ${data.msg}`);
      }

      return data.data;

    } catch (err) {
      error(`Failed to search files: ${err.message}`);
      throw err;
    }
  }

  /**
   * 检查服务是否可用
   * @returns {boolean} - 是否可用
   */
  async isAvailable() {
    try {
      await this.getAccessToken();
      return true;
    } catch (err) {
      return false;
    }
  }
}

// 创建单例实例
const feishuFS = new FeishuFS();

export default feishuFS;
export { FeishuFS };
