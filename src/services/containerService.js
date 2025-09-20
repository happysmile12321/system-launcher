import { info, success, error, warning } from '../utils/logger.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fork } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

/**
 * 容器管理服务 - 提供容器列表、操作和监控功能
 */
class ContainerManagementService {
  constructor() {
    this.availableDrivers = ['docker', 'podman'];
    this.currentDriver = null;
    this.initialized = false;
  }

  /**
   * 初始化容器管理服务
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    info('Initializing container management service...');
    
    try {
      // 检测可用的容器运行时
      this.currentDriver = await this.detectAvailableDriver();
      
      if (!this.currentDriver) {
        warning('No container runtime (Docker/Podman) detected');
        return;
      }

      info(`Using container driver: ${this.currentDriver}`);
      this.initialized = true;
      success('Container management service initialized successfully');
    } catch (err) {
      error(`Failed to initialize container management service: ${err.message}`);
      throw err;
    }
  }

  /**
   * 检测可用的容器运行时
   */
  async detectAvailableDriver() {
    for (const driver of this.availableDrivers) {
      try {
        const { stdout } = await execAsync(`${driver} --version`);
        if (stdout.trim().length > 0) {
          return driver;
        }
      } catch (err) {
        // 继续检测下一个驱动
      }
    }
    return null;
  }

  /**
   * V3.0: 通过官方组件获取容器列表
   */
  async getContainers() {
    try {
      await this.initialize();
      
      if (!this.currentDriver) {
        return [];
      }

      // 使用官方组件执行容器列表命令
      const result = await this.executeComponent('local:container-management/list-containers', {
        driver: this.currentDriver,
        all: true
      });

      if (result.success && result.outputs.containers) {
        const containers = JSON.parse(result.outputs.containers);
        return containers.map(container => ({
          id: container.ID || container.id,
          name: container.Names || container.name,
          image: container.Image || container.image,
          status: container.Status || container.status,
          state: container.State || container.state,
          created: container.CreatedAt || container.created,
          ports: this.parsePorts(container.Ports || container.ports),
          size: container.Size || container.size
        }));
      }

      return [];
    } catch (err) {
      error(`Failed to get containers: ${err.message}`);
      return [];
    }
  }

  /**
   * 解析端口信息
   */
  parsePorts(ports) {
    if (!ports) return [];
    
    if (typeof ports === 'string') {
      return ports.split(',').map(port => port.trim()).filter(Boolean);
    }
    
    if (Array.isArray(ports)) {
      return ports;
    }
    
    return [];
  }

  /**
   * V3.0: 通过官方组件启动容器
   */
  async startContainer(containerId) {
    try {
      await this.initialize();
      
      if (!this.currentDriver) {
        throw new Error('No container runtime available');
      }

      // 使用官方组件执行启动命令
      const result = await this.executeComponent('local:container-management/start-container', {
        containerId,
        driver: this.currentDriver
      });

      if (result.success) {
        success(`Started container: ${containerId}`);
        return { success: true, message: result.outputs.message };
      } else {
        throw new Error(result.outputs.message || 'Failed to start container');
      }
    } catch (err) {
      error(`Failed to start container ${containerId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * V3.0: 通过官方组件停止容器
   */
  async stopContainer(containerId) {
    try {
      await this.initialize();
      
      if (!this.currentDriver) {
        throw new Error('No container runtime available');
      }

      // 使用官方组件执行停止命令
      const result = await this.executeComponent('local:container-management/stop-container', {
        containerId,
        driver: this.currentDriver,
        timeout: 10
      });

      if (result.success) {
        success(`Stopped container: ${containerId}`);
        return { success: true, message: result.outputs.message };
      } else {
        throw new Error(result.outputs.message || 'Failed to stop container');
      }
    } catch (err) {
      error(`Failed to stop container ${containerId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * 重启容器
   */
  async restartContainer(containerId) {
    try {
      await this.stopContainer(containerId);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
      return await this.startContainer(containerId);
    } catch (err) {
      error(`Failed to restart container ${containerId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * 删除容器
   */
  async removeContainer(containerId) {
    try {
      await this.initialize();
      
      if (!this.currentDriver) {
        throw new Error('No container runtime available');
      }

      const command = `${this.currentDriver} rm -f ${containerId}`;
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('No such container')) {
        throw new Error(stderr);
      }

      success(`Removed container: ${containerId}`);
      return { success: true, message: 'Container removed successfully' };
    } catch (err) {
      error(`Failed to remove container ${containerId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * 获取容器日志
   */
  async getContainerLogs(containerId, lines = 100) {
    try {
      await this.initialize();
      
      if (!this.currentDriver) {
        throw new Error('No container runtime available');
      }

      const command = `${this.currentDriver} logs --tail ${lines} ${containerId}`;
      const { stdout, stderr } = await execAsync(command);
      
      return {
        logs: stdout,
        error: stderr
      };
    } catch (err) {
      error(`Failed to get logs for container ${containerId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * 获取容器统计信息
   */
  async getContainerStats(containerId) {
    try {
      await this.initialize();
      
      if (!this.currentDriver) {
        throw new Error('No container runtime available');
      }

      const command = `${this.currentDriver} stats --no-stream --format json ${containerId}`;
      const { stdout } = await execAsync(command);
      
      try {
        return JSON.parse(stdout);
      } catch (parseErr) {
        return { error: 'Failed to parse container stats' };
      }
    } catch (err) {
      error(`Failed to get stats for container ${containerId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * 检查服务状态
   */
  async isAvailable() {
    try {
      await this.initialize();
      return this.currentDriver !== null;
    } catch (err) {
      return false;
    }
  }

  /**
   * V3.0: 执行官方组件
   */
  async executeComponent(componentPath, inputs = {}) {
    return new Promise((resolve, reject) => {
      try {
        // 创建临时文件存储输入参数
        const tempFile = join(tmpdir(), `container-component-${uuidv4()}.json`);
        const componentData = {
          inputs: JSON.stringify(inputs),
          outputs: {},
          log: {
            info: (msg) => info(`[Component] ${msg}`),
            warn: (msg) => warning(`[Component] ${msg}`),
            error: (msg) => error(`[Component] ${msg}`)
          }
        };

        writeFileSync(tempFile, JSON.stringify(componentData));

        // 解析组件路径
        const [type, path] = componentPath.split(':');
        const componentDir = join(process.cwd(), 'components', path);
        const componentFile = join(componentDir, 'index.js');

        // 创建子进程执行组件
        const child = fork(componentFile, [], {
          cwd: componentDir,
          stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
          env: {
            ...process.env,
            inputs: JSON.stringify(inputs)
          }
        });

        let output = '';
        let errorOutput = '';

        child.stdout.on('data', (data) => {
          output += data.toString();
        });

        child.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        child.on('close', (code) => {
          // 清理临时文件
          try {
            unlinkSync(tempFile);
          } catch (e) {
            // 忽略清理错误
          }

          if (code === 0) {
            try {
              // 尝试解析输出
              const result = JSON.parse(output);
              resolve({
                success: true,
                outputs: result.outputs || {},
                logs: output
              });
            } catch (parseErr) {
              resolve({
                success: true,
                outputs: {},
                logs: output
              });
            }
          } else {
            reject(new Error(`Component execution failed with code ${code}: ${errorOutput}`));
          }
        });

        child.on('error', (err) => {
          reject(new Error(`Component execution error: ${err.message}`));
        });

        // 设置超时
        setTimeout(() => {
          child.kill();
          reject(new Error('Component execution timeout'));
        }, 30000);

      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * 获取当前驱动信息
   */
  async getDriverInfo() {
    try {
      await this.initialize();
      
      if (!this.currentDriver) {
        return null;
      }

      const { stdout } = await execAsync(`${this.currentDriver} --version`);
      return {
        driver: this.currentDriver,
        version: stdout.trim()
      };
    } catch (err) {
      error(`Failed to get driver info: ${err.message}`);
      return null;
    }
  }
}

// 创建单例实例
const containerManagementService = new ContainerManagementService();

export default containerManagementService;
export { ContainerManagementService };
