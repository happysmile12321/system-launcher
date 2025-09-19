import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fork } from 'child_process';
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
      // 加载本地组件
      await this.loadLocalComponents();
      
      // 加载用户组件
      await this.loadUserComponents();
      
      this.loaded = true;
      success(`Component system initialized successfully. Loaded ${this.officialComponents.size} local components and ${this.userComponents.size} user components.`);
    } catch (err) {
      error(`Failed to initialize component system: ${err.message}`);
      throw err;
    }
  }

  /**
   * 获取本地组件目录
   */
  getLocalComponentsDir() {
    return path.resolve(__dirname, '../../components');
  }

  /**
   * 获取用户组件在GitHub仓库中的路径
   */
  getUserComponentsPath() {
    return '.orchestrator-pro/components';
  }

  /**
   * 加载本地组件
   */
  async loadLocalComponents() {
    const localDir = this.getLocalComponentsDir();
    
    // 如果本地组件目录不存在，创建它
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
      info(`Created local components directory: ${localDir}`);
      return;
    }

    try {
      // 读取本地组件目录
      const components = this.readComponentDirectories(localDir);
      
      for (const component of components) {
        await this.loadComponent(component, 'local');
      }
    } catch (err) {
      error(`Failed to load local components: ${err.message}`);
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
  async loadComponent(componentPath, componentType = 'local') {
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
      const componentKey = `${componentType}:${componentName}`;
      this.componentCache.set(componentKey, {
        manifest,
        code: codeContent
      });

      // 存储组件信息
      const componentsMap = componentType === 'local' ? this.officialComponents : this.userComponents;
      componentsMap.set(componentName, {
        name: componentName,
        displayName: manifest.displayName || componentName,
        description: manifest.description || '',
        version: manifest.version || '1.0.0',
        inputs: manifest.inputs || [],
        outputs: manifest.outputs || [],
        type: componentType
      });

      info(`Loaded ${componentType} component: ${componentName}`);
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
   * 执行组件代码 - 使用子进程模型
   */
  async executeComponentCode(code, context) {
    return new Promise((resolve, reject) => {
      try {
        // 创建临时文件来存储组件代码
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const tempFile = path.join(tempDir, `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.js`);
        
        // 创建组件执行器代码
        const executorCode = `
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 组件代码
${code}

// 执行组件
async function executeComponent() {
  try {
    const context = ${JSON.stringify(context)};
    
    // 创建日志函数
    const log = {
      info: (msg) => console.log('[INFO]', msg),
      error: (msg) => console.error('[ERROR]', msg),
      success: (msg) => console.log('[SUCCESS]', msg),
      warning: (msg) => console.warn('[WARNING]', msg)
    };
    
    // 创建输出对象
    const outputs = {};
    
    // 创建执行上下文
    const execContext = {
      inputs: context.inputs || {},
      outputs: outputs,
      context: context.context || {},
      log: log
    };
    
    let result;
    
    // 检查是否是ES Module格式
    if (typeof componentFunction === 'function') {
      result = await componentFunction(execContext);
    } else {
      // 如果不是函数，直接执行代码
      result = await eval(\`(async function() { \${componentCode} })()\`);
    }
    
    // 返回结果
    process.send({
      success: true,
      result: {
        ...outputs,
        ...(result || {})
      }
    });
    
  } catch (err) {
    process.send({
      success: false,
      error: err.message,
      stack: err.stack
    });
  }
}

// 启动执行
executeComponent();
        `;
        
        // 写入临时文件
        fs.writeFileSync(tempFile, executorCode);
        
        // 创建子进程
        const child = fork(tempFile, [], {
          cwd: path.dirname(tempFile), // 设置工作目录为组件所在目录
          stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
          timeout: 30000 // 30秒超时
        });
        
        // 设置超时
        const timeout = setTimeout(() => {
          child.kill('SIGTERM');
          reject(new Error('Component execution timed out after 30 seconds'));
        }, 30000);
        
        // 监听子进程消息
        child.on('message', (message) => {
          clearTimeout(timeout);
          child.kill();
          
          // 清理临时文件
          try {
            fs.unlinkSync(tempFile);
          } catch (err) {
            // 忽略清理错误
          }
          
          if (message.success) {
            resolve(message.result);
          } else {
            reject(new Error(message.error || 'Component execution failed'));
          }
        });
        
        // 监听子进程错误
        child.on('error', (err) => {
          clearTimeout(timeout);
          child.kill();
          
          // 清理临时文件
          try {
            fs.unlinkSync(tempFile);
          } catch (cleanupErr) {
            // 忽略清理错误
          }
          
          reject(err);
        });
        
        // 监听子进程退出
        child.on('exit', (code, signal) => {
          clearTimeout(timeout);
          
          // 清理临时文件
          try {
            fs.unlinkSync(tempFile);
          } catch (err) {
            // 忽略清理错误
          }
          
          if (code !== 0 && !signal) {
            reject(new Error(`Component process exited with code ${code}`));
          }
        });
        
      } catch (err) {
        error(`Component execution error: ${err.message}`);
        reject(err);
      }
    });
  }

  /**
   * 获取所有组件
   */
  async getAllComponents() {
    await this.initialize();
    
    const localComponents = Array.from(this.officialComponents.values());
    const userComponents = Array.from(this.userComponents.values());
    
    return {
      local: localComponents,
      user: userComponents
    };
  }

  /**
   * 获取组件详情
   */
  async getComponent(componentType, componentName) {
    await this.initialize();
    
    const componentsMap = componentType === 'local' ? this.officialComponents : this.userComponents;
    const component = componentsMap.get(componentName);
    
    if (!component) {
      return null;
    }

    // 获取组件代码
    const componentKey = `${componentType}:${componentName}`;
    const componentCache = this.componentCache.get(componentKey);
    
    if (componentCache) {
      return {
        ...component,
        manifest: componentCache.manifest,
        code: componentCache.code
      };
    }
    
    return component;
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