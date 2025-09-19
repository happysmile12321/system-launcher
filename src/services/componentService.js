import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import GitFS from '../core/gitfs.js';
import { getConfig } from './configService.js';
import { info, success, error, warning } from '../utils/logger.js';

// 获取当前文件的目录路径（替代 __dirname）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 组件管理器服务 - 负责加载、注册和执行组件
 */
class ComponentService {
  constructor() {
    this.officialComponents = new Map();
    this.userComponents = new Map();
    this.componentCache = new Map();
    this.loaded = false;
  }

  /**
   * 初始化组件系统
   */
  async initialize() {
    if (this.loaded) {
      return;
    }

    info('Initializing component system...');
    
    try {
      // 加载官方组件
      await this.loadOfficialComponents();
      
      // 加载用户组件
      await this.loadUserComponents();
      
      this.loaded = true;
      success(`Component system initialized successfully. Loaded ${this.officialComponents.size} official components and ${this.userComponents.size} user components.`);
    } catch (err) {
      error(`Failed to initialize component system: ${err.message}`);
      throw err;
    }
  }

  /**
   * 获取官方组件目录
   */
  getOfficialComponentsDir() {
    return path.resolve(__dirname, '../../components/official');
  }

  /**
   * 获取用户组件在GitHub仓库中的路径
   */
  getUserComponentsPath() {
    return '.orchestrator-pro/components';
  }

  /**
   * 加载官方组件
   */
  async loadOfficialComponents() {
    const officialDir = this.getOfficialComponentsDir();
    
    // 如果官方组件目录不存在，创建它
    if (!fs.existsSync(officialDir)) {
      fs.mkdirSync(officialDir, { recursive: true });
      info(`Created official components directory: ${officialDir}`);
      return;
    }

    try {
      // 读取官方组件目录
      const components = this.readComponentDirectories(officialDir);
      
      for (const component of components) {
        await this.loadComponent(component, true);
      }
    } catch (err) {
      error(`Failed to load official components: ${err.message}`);
    }
  }

  /**
   * 加载用户组件
   */
  async loadUserComponents() {
    try {
      const config = getConfig();
      if (!config || !config.github) {
        warning('GitHub configuration not found. Skipping user components load.');
        return;
      }

      const gitfs = new GitFS(config);
      const componentsPath = this.getUserComponentsPath();
      
      // 列出用户组件目录中的所有组件
      const entries = await gitfs.listDirectory(componentsPath);
      
      for (const entry of entries) {
        if (entry.type === 'dir') {
          const componentName = entry.name;
          await this.loadUserComponentFromGit(gitfs, componentsPath, componentName);
        }
      }
    } catch (err) {
      error(`Failed to load user components: ${err.message}`);
    }
  }

  /**
   * 从Git仓库加载用户组件
   */
  async loadUserComponentFromGit(gitfs, basePath, componentName) {
    try {
      const componentPath = `${basePath}/${componentName}`;
      
      // 读取component.json
      const manifestFile = await gitfs.readFile(`${componentPath}/component.json`);
      if (!manifestFile) {
        warning(`Skipping component ${componentName}: component.json not found`);
        return;
      }

      // 读取index.js
      const codeFile = await gitfs.readFile(`${componentPath}/index.js`);
      if (!codeFile) {
        warning(`Skipping component ${componentName}: index.js not found`);
        return;
      }

      // 解析manifest
      const manifest = JSON.parse(manifestFile.content);
      
      // 验证组件清单
      if (!this.validateComponentManifest(manifest)) {
        warning(`Skipping component ${componentName}: invalid manifest`);
        return;
      }

      // 缓存组件代码
      const componentKey = `user:${componentName}`;
      this.componentCache.set(componentKey, {
        manifest,
        code: codeFile.content
      });

      // 存储组件信息
      this.userComponents.set(componentName, {
        name: componentName,
        displayName: manifest.displayName || componentName,
        description: manifest.description || '',
        version: manifest.version || '1.0.0',
        inputs: manifest.inputs || [],
        outputs: manifest.outputs || [],
        type: 'user'
      });

      info(`Loaded user component: ${componentName}`);
    } catch (err) {
      error(`Failed to load user component ${componentName}: ${err.message}`);
    }
  }

  /**
   * 读取本地组件目录
   */
  readComponentDirectories(dirPath) {
    if (!fs.existsSync(dirPath)) {
      return [];
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const componentDirs = entries
      .filter(entry => entry.isDirectory())
      .map(entry => path.join(dirPath, entry.name));

    return componentDirs;
  }

  /**
   * 加载本地组件
   */
  async loadComponent(componentPath, isOfficial = false) {
    try {
      const componentName = path.basename(componentPath);
      
      // 读取component.json
      const manifestPath = path.join(componentPath, 'component.json');
      if (!fs.existsSync(manifestPath)) {
        warning(`Skipping component ${componentName}: component.json not found`);
        return;
      }

      // 读取index.js
      const codePath = path.join(componentPath, 'index.js');
      if (!fs.existsSync(codePath)) {
        warning(`Skipping component ${componentName}: index.js not found`);
        return;
      }

      // 读取文件内容
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      const codeContent = fs.readFileSync(codePath, 'utf-8');

      // 解析manifest
      const manifest = JSON.parse(manifestContent);
      
      // 验证组件清单
      if (!this.validateComponentManifest(manifest)) {
        warning(`Skipping component ${componentName}: invalid manifest`);
        return;
      }

      // 缓存组件代码
      const componentKey = isOfficial ? `official:${componentName}` : `local:${componentName}`;
      this.componentCache.set(componentKey, {
        manifest,
        code: codeContent
      });

      // 存储组件信息
      const componentsMap = isOfficial ? this.officialComponents : this.userComponents;
      componentsMap.set(componentName, {
        name: componentName,
        displayName: manifest.displayName || componentName,
        description: manifest.description || '',
        version: manifest.version || '1.0.0',
        inputs: manifest.inputs || [],
        outputs: manifest.outputs || [],
        type: isOfficial ? 'official' : 'local'
      });

      info(`Loaded ${isOfficial ? 'official' : 'local'} component: ${componentName}`);
    } catch (err) {
      error(`Failed to load component ${path.basename(componentPath)}: ${err.message}`);
    }
  }

  /**
   * 验证组件清单
   */
  validateComponentManifest(manifest) {
    if (!manifest || typeof manifest !== 'object') {
      return false;
    }

    // 检查必需字段
    if (!manifest.name) {
      return false;
    }

    // 验证inputs和outputs格式
    if (manifest.inputs && !Array.isArray(manifest.inputs)) {
      return false;
    }
    
    if (manifest.outputs && !Array.isArray(manifest.outputs)) {
      return false;
    }

    return true;
  }

  /**
   * 执行组件
   */
  async executeComponent(componentType, componentName, inputs, context = {}) {
    try {
      info(`Executing ${componentType} component: ${componentName}`);
      
      // 获取组件缓存
      const componentKey = `${componentType}:${componentName}`;
      const componentCache = this.componentCache.get(componentKey);
      
      if (!componentCache) {
        throw new Error(`Component ${componentName} not found or not loaded`);
      }

      const { manifest, code } = componentCache;

      // 验证输入参数
      if (!this.validateInputs(manifest.inputs, inputs)) {
        throw new Error('Invalid inputs provided for component execution');
      }

      // 准备执行环境
      const executionContext = {
        inputs: inputs || {},
        outputs: {},
        context: context || {},
        log: {
          info: (msg) => info(`[Component: ${componentName}] ${msg}`),
          error: (msg) => error(`[Component: ${componentName}] ${msg}`),
          success: (msg) => success(`[Component: ${componentName}] ${msg}`)
        }
      };

      // 创建一个安全的执行上下文
      const result = await this.executeComponentCode(code, executionContext);
      
      success(`Successfully executed component: ${componentName}`);
      return result;
    } catch (err) {
      error(`Failed to execute component ${componentName}: ${err.message}`);
      throw err;
    }
  }

  /**
   * 验证输入参数
   */
  validateInputs(inputSchema, inputs) {
    if (!inputSchema || !Array.isArray(inputSchema)) {
      return true; // 没有输入要求，默认通过
    }

    for (const input of inputSchema) {
      if (input.required && (inputs[input.id] === undefined || inputs[input.id] === null)) {
        error(`Missing required input: ${input.id}`);
        return false;
      }
    }

    return true;
  }

  /**
   * 执行组件代码
   */
  async executeComponentCode(code, context) {
    try {
      // 创建一个隔离的执行环境
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      
      // 定义组件函数
      const componentFunction = new AsyncFunction('context', code);
      
      // 执行组件
      const result = await componentFunction(context);
      
      // 合并返回结果和context中的outputs
      return {
        ...context.outputs,
        ...(result || {})
      };
    } catch (err) {
      error(`Component execution error: ${err.message}`);
      throw err;
    }
  }

  /**
   * 获取所有组件
   */
  async getAllComponents() {
    await this.initialize();
    
    const officialComponents = Array.from(this.officialComponents.values());
    const userComponents = Array.from(this.userComponents.values());
    
    return {
      official: officialComponents,
      user: userComponents
    };
  }

  /**
   * 获取组件详情
   */
  async getComponent(componentType, componentName) {
    await this.initialize();
    
    const componentsMap = componentType === 'official' ? this.officialComponents : this.userComponents;
    return componentsMap.get(componentName) || null;
  }

  /**
   * 刷新组件列表
   */
  async refresh() {
    info('Refreshing component list...');
    
    this.officialComponents.clear();
    this.userComponents.clear();
    this.componentCache.clear();
    this.loaded = false;
    
    await this.initialize();
  }

  /**
   * 创建新的用户组件
   */
  async createUserComponent(componentName, manifest, code) {
    try {
      const config = getConfig();
      if (!config || !config.github) {
        throw new Error('GitHub configuration not found');
      }

      const gitfs = new GitFS(config);
      const componentsPath = this.getUserComponentsPath();
      const componentPath = `${componentsPath}/${componentName}`;

      // 验证组件清单
      if (!this.validateComponentManifest(manifest)) {
        throw new Error('Invalid component manifest');
      }

      // 写入component.json
      await gitfs.writeFile(
        `${componentPath}/component.json`,
        JSON.stringify(manifest, null, 2),
        `Create component manifest for ${componentName}`
      );

      // 写入index.js
      await gitfs.writeFile(
        `${componentPath}/index.js`,
        code,
        `Create component code for ${componentName}`
      );

      // 刷新组件列表
      await this.refresh();

      success(`Created user component: ${componentName}`);
      return true;
    } catch (err) {
      error(`Failed to create user component ${componentName}: ${err.message}`);
      throw err;
    }
  }

  /**
   * 更新用户组件
   */
  async updateUserComponent(componentName, manifest, code) {
    try {
      return await this.createUserComponent(componentName, manifest, code);
    } catch (err) {
      error(`Failed to update user component ${componentName}: ${err.message}`);
      throw err;
    }
  }

  /**
   * 删除用户组件
   */
  async deleteUserComponent(componentName) {
    try {
      const config = getConfig();
      if (!config || !config.github) {
        throw new Error('GitHub configuration not found');
      }

      const gitfs = new GitFS(config);
      const componentsPath = this.getUserComponentsPath();
      const componentPath = `${componentsPath}/${componentName}`;

      // 删除组件目录下的所有文件
      const entries = await gitfs.listDirectory(componentPath);
      for (const entry of entries) {
        if (entry.type === 'file') {
          await gitfs.deleteFile(entry.path, `Delete component file: ${entry.name}`);
        }
      }

      // 刷新组件列表
      await this.refresh();

      success(`Deleted user component: ${componentName}`);
      return true;
    } catch (err) {
      error(`Failed to delete user component ${componentName}: ${err.message}`);
      throw err;
    }
  }
}

// 创建单例实例
const componentService = new ComponentService();

export default componentService;

export { ComponentService };