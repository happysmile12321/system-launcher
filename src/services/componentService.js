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
    this.localComponents = new Map();
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
      success(`Component system initialized successfully. Loaded ${this.localComponents.size} local components and ${this.userComponents.size} user components.`);
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
      const componentsMap = componentType === 'local' ? this.localComponents : this.userComponents;
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
      result = await eval(\`(async function() { \${codeContent} })()\`);
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
    
    const localComponents = Array.from(this.localComponents.values());
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
    
    const componentsMap = componentType === 'local' ? this.localComponents : this.userComponents;
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
    
    this.localComponents.clear();
    this.userComponents.clear();
    this.componentCache.clear();
    this.loaded = false;
    
    await this.initialize();
  }

  /**
   * V3.0: 创建新的用户组件，支持公有/私有设置
   */
  async createUserComponent(componentName, manifest, code, isPublic = false) {
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

      // 添加公有/私有信息到清单
      manifest.isPublic = isPublic;

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

      // V3.0: 管理.gitignore文件
      await this.updateGitignoreForComponent(componentName, isPublic);

      // 刷新组件列表
      await this.refresh();

      success(`Created user component: ${componentName} (${isPublic ? 'public' : 'private'})`);
      return true;
    } catch (err) {
      error(`Failed to create user component ${componentName}: ${err.message}`);
      throw err;
    }
  }

  /**
   * V3.0: 更新用户组件，支持公有/私有设置
   */
  async updateUserComponent(componentName, manifest, code, isPublic = false) {
    try {
      return await this.createUserComponent(componentName, manifest, code, isPublic);
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

      // V3.0: 从.gitignore中移除组件路径
      await this.removeComponentFromGitignore(componentName);

      success(`Deleted user component: ${componentName}`);
      return true;
    } catch (err) {
      error(`Failed to delete user component ${componentName}: ${err.message}`);
      throw err;
    }
  }

  /**
   * V3.0: 更新.gitignore文件以支持组件公有/私有设置
   */
  async updateGitignoreForComponent(componentName, isPublic) {
    try {
      const config = getConfig();
      if (!config || !config.github) {
        return; // 如果没有GitHub配置，跳过.gitignore更新
      }

      const gitfs = new GitFS(config);
      const gitignorePath = '.gitignore';
      const componentPath = `components/${componentName}/`;

      // 读取现有的.gitignore文件
      let gitignoreContent = '';
      try {
        const gitignoreFile = await gitfs.readFile(gitignorePath);
        if (gitignoreFile) {
          gitignoreContent = gitignoreFile.content;
        }
      } catch (err) {
        // .gitignore文件不存在，创建新的
        gitignoreContent = '';
      }

      // 解析.gitignore内容
      const lines = gitignoreContent.split('\n');
      const newLines = [];
      let componentLineFound = false;

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // 检查是否已经存在该组件的忽略规则
        if (trimmedLine === componentPath) {
          componentLineFound = true;
          // 如果是公有组件，不添加忽略规则
          if (!isPublic) {
            newLines.push(line);
          }
        } else {
          newLines.push(line);
        }
      }

      // 如果是私有组件且没有找到忽略规则，添加它
      if (!isPublic && !componentLineFound) {
        newLines.push(componentPath);
      }

      // 确保有适当的注释
      if (!isPublic && !componentLineFound) {
        // 检查是否需要添加注释
        const hasComponentComment = newLines.some(line => 
          line.includes('# User components') || line.includes('# Components')
        );
        
        if (!hasComponentComment) {
          newLines.push('');
          newLines.push('# User components');
        }
      }

      // 写入更新后的.gitignore文件
      const newContent = newLines.join('\n');
      await gitfs.writeFile(
        gitignorePath,
        newContent,
        `V3.0: Update .gitignore for component ${componentName} (${isPublic ? 'public' : 'private'})`
      );

      info(`Updated .gitignore for component ${componentName} (${isPublic ? 'public' : 'private'})`);

    } catch (err) {
      warning(`Failed to update .gitignore for component ${componentName}: ${err.message}`);
      // 不抛出错误，因为.gitignore更新失败不应该阻止组件创建
    }
  }

  /**
   * V3.0: 从.gitignore中移除组件路径
   */
  async removeComponentFromGitignore(componentName) {
    try {
      const config = getConfig();
      if (!config || !config.github) {
        return; // 如果没有GitHub配置，跳过.gitignore更新
      }

      const gitfs = new GitFS(config);
      const gitignorePath = '.gitignore';
      const componentPath = `components/${componentName}/`;

      // 读取现有的.gitignore文件
      let gitignoreContent = '';
      try {
        const gitignoreFile = await gitfs.readFile(gitignorePath);
        if (gitignoreFile) {
          gitignoreContent = gitignoreFile.content;
        }
      } catch (err) {
        // .gitignore文件不存在，无需处理
        return;
      }

      // 移除组件路径
      const lines = gitignoreContent.split('\n');
      const newLines = lines.filter(line => line.trim() !== componentPath);

      // 写入更新后的.gitignore文件
      const newContent = newLines.join('\n');
      await gitfs.writeFile(
        gitignorePath,
        newContent,
        `V3.0: Remove component ${componentName} from .gitignore`
      );

      info(`Removed component ${componentName} from .gitignore`);

    } catch (err) {
      warning(`Failed to remove component ${componentName} from .gitignore: ${err.message}`);
      // 不抛出错误，因为.gitignore更新失败不应该阻止组件删除
    }
  }

  /**
   * V3.0: 获取组件的公有/私有状态
   */
  async getComponentVisibility(componentName) {
    try {
      const component = await this.getComponent('user', componentName);
      if (component && component.manifest) {
        return component.manifest.isPublic || false;
      }
      return false;
    } catch (err) {
      return false;
    }
  }

  /**
   * V3.0: 设置组件的公有/私有状态
   */
  async setComponentVisibility(componentName, isPublic) {
    try {
      const component = await this.getComponent('user', componentName);
      if (!component) {
        throw new Error(`Component ${componentName} not found`);
      }

      // 更新组件清单
      const manifest = component.manifest;
      manifest.isPublic = isPublic;

      // 更新组件
      await this.updateUserComponent(componentName, manifest, component.code, isPublic);

      success(`Set component ${componentName} visibility to ${isPublic ? 'public' : 'private'}`);
      return true;

    } catch (err) {
      error(`Failed to set component visibility: ${err.message}`);
      throw err;
    }
  }
}

// 创建单例实例
const componentService = new ComponentService();

export default componentService;

export { ComponentService };