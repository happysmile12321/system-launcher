import vm from 'vm';
import { info, success, error } from '../utils/logger.js';
import GitFS from './gitfs.js';
import fetch from 'node-fetch';
import * as vmModule from 'vm';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 脚本运行器 - 在安全的沙箱环境中执行用户自定义脚本
 */
class ScriptRunner {
  constructor(config) {
    this.config = config;
    this.scriptContext = null;
    this.scriptTimeout = 30000; // 30秒超时
  }

  /**
   * 创建隔离的VM环境
   */
  createIsolatedEnvironment() {
    try {
      // 创建一个隔离的上下文对象
      this.scriptContext = vmModule.createContext({
        // 空对象作为基础上下文，后续会注入SDK
      });
    } catch (err) {
      error(`Failed to create isolated environment: ${err.message}`);
      throw err;
    }
  }

  /**
   * 销毁隔离环境
   */
  destroyIsolatedEnvironment() {
    // 使用Node.js的VM模块时，上下文会被垃圾回收
    // 我们只需要将引用设为null即可
    this.scriptContext = null;
  }

  /**
   * 注入OrchestratorSDK到沙箱环境
   */
  injectSDK(logs = []) {
    if (!this.scriptContext) {
      this.createIsolatedEnvironment();
    }

    const gitfs = new GitFS(this.config);

    // 创建SDK对象
    const sdk = {
      // GitFS功能
      gitfs: {
        readFile: async (path) => {
          logs.push(`[GitFS] Reading file: ${path}`);
          try {
            const result = await gitfs.readFile(path);
            if (result) {
              logs.push(`[GitFS] Successfully read file: ${path}`);
              return result.content;
            }
            logs.push(`[GitFS] File not found: ${path}`);
            return null;
          } catch (err) {
            logs.push(`[GitFS] Error reading file: ${err.message}`);
            throw err;
          }
        },
        writeFile: async (path, content) => {
          logs.push(`[GitFS] Writing file: ${path}`);
          try {
            await gitfs.writeFile(path, content);
            logs.push(`[GitFS] Successfully wrote file: ${path}`);
          } catch (err) {
            logs.push(`[GitFS] Error writing file: ${err.message}`);
            throw err;
          }
        },
        listDirectory: async (path) => {
          logs.push(`[GitFS] Listing directory: ${path}`);
          try {
            const items = await gitfs.listDirectory(path);
            logs.push(`[GitFS] Found ${items.length} items in directory: ${path}`);
            return items;
          } catch (err) {
            logs.push(`[GitFS] Error listing directory: ${err.message}`);
            throw err;
          }
        }
      },
      // Logger功能
      logger: {
        info: (msg) => {
          logs.push(`[INFO] ${msg}`);
        },
        success: (msg) => {
          logs.push(`[SUCCESS] ${msg}`);
        },
        warning: (msg) => {
          logs.push(`[WARNING] ${msg}`);
        },
        error: (msg) => {
          logs.push(`[ERROR] ${msg}`);
        }
      },
      // HTTP客户端
      http: {
        get: async (url, options = {}) => {
          logs.push(`[HTTP] GET ${url}`);
          try {
            const response = await fetch(url, options);
            const data = await response.json();
            logs.push(`[HTTP] GET ${url} - Status: ${response.status}`);
            return { data, status: response.status };
          } catch (err) {
            logs.push(`[HTTP] GET ${url} - Error: ${err.message}`);
            throw err;
          }
        },
        post: async (url, body = {}, options = {}) => {
          logs.push(`[HTTP] POST ${url}`);
          try {
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...options.headers
              },
              body: JSON.stringify(body),
              ...options
            });
            const data = await response.json();
            logs.push(`[HTTP] POST ${url} - Status: ${response.status}`);
            return { data, status: response.status };
          } catch (err) {
            logs.push(`[HTTP] POST ${url} - Error: ${err.message}`);
            throw err;
          }
        }
      }
    };

    // 将SDK注入到沙箱环境
    this.scriptContext.OrchestratorSDK = sdk;
  }

  /**
   * 执行脚本
   */
  async runScript(scriptContent) {
    const logs = [];
    let result = null;
    let errorMessage = null;

    try {
      // 创建隔离环境并注入SDK
      this.createIsolatedEnvironment();
      this.injectSDK(logs);

      // 添加基本的日志捕获
      this.scriptContext.console = {
        log: (...args) => logs.push(`[LOG] ${args.join(' ')}`),
        info: (...args) => logs.push(`[INFO] ${args.join(' ')}`),
        warn: (...args) => logs.push(`[WARN] ${args.join(' ')}`),
        error: (...args) => logs.push(`[ERROR] ${args.join(' ')}`)
      };

      // 包装脚本内容以便处理异步操作
      const wrappedScript = `
        (async function() {
          try {
            ${scriptContent}
          } catch (err) {
            throw new Error(err.message || 'Unknown script error');
          }
        })();
      `;

      // 执行脚本
      info('Starting script execution in isolated environment');
      
      // 使用Promise处理可能的异步脚本执行
      const scriptResult = await new Promise((resolve, reject) => {
        try {
          // 创建脚本对象
          const script = new vm.Script(wrappedScript);
          
          // 执行脚本并获取结果
          const timeoutId = setTimeout(() => {
            reject(new Error(`Script execution timed out after ${this.scriptTimeout / 1000} seconds`));
          }, this.scriptTimeout);
          
          // 执行脚本并等待结果
          const result = script.runInContext(this.scriptContext);
          
          // 清除超时定时器
          clearTimeout(timeoutId);
          
          // 处理Promise结果
          if (result && typeof result.then === 'function') {
            result.then(resolve).catch(reject);
          } else {
            resolve(result);
          }
        } catch (err) {
          reject(err);
        }
      });

      result = scriptResult;
      success('Script execution completed successfully');
      logs.push('[SCRIPT] Execution completed successfully');
    } catch (err) {
      errorMessage = err.message;
      error(`Script execution failed: ${errorMessage}`);
      logs.push(`[SCRIPT] Execution failed: ${errorMessage}`);
    } finally {
      // 确保销毁隔离环境
      this.destroyIsolatedEnvironment();
    }

    return {
      result,
      error: errorMessage,
      logs
    };
  }

  /**
   * 从文件路径执行脚本
   */
  async runScriptFromPath(scriptPath) {
    try {
      const gitfs = new GitFS(this.config);
      const fileData = await gitfs.readFile(scriptPath);
      
      if (!fileData) {
        throw new Error(`Script file not found: ${scriptPath}`);
      }

      info(`Executing script from file: ${scriptPath}`);
      return await this.runScript(fileData.content);
    } catch (err) {
      error(`Failed to run script from path: ${err.message}`);
      return {
        result: null,
        error: err.message,
        logs: [`[ERROR] Failed to run script from path: ${err.message}`]
      };
    }
  }
}

/**
 * 执行shell命令的辅助函数
 * @param {string} command - 要执行的shell命令
 * @param {Object} options - 执行选项
 * @returns {Promise<Object>} - 执行结果
 */
export async function runShellCommand(command, options = {}) {
  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: options.timeout || 30000, // 默认30秒超时
      ...options
    });
    
    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      success: true
    };
  } catch (err) {
    return {
      stdout: '',
      stderr: err.message,
      success: false,
      error: err.message
    };
  }
}

export default ScriptRunner;