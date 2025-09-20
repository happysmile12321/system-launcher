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

      // 直接使用Docker命令获取容器列表
      const args = ['ps', '-a', '--format', 'json'];
      const { stdout } = await execAsync(`${this.currentDriver} ${args.join(' ')}`);
      
      let containers = [];
      if (stdout.trim()) {
        const lines = stdout.trim().split('\n');
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const container = JSON.parse(line);
              containers.push({
                ID: container.ID || container.Id || '',
                Names: container.Names || container.Name || '',
                Image: container.Image || '',
                Status: container.Status || container.State || '',
                State: container.State || container.Status || '',
                Ports: container.Ports || '',
                CreatedAt: container.CreatedAt || container.Created || ''
              });
            } catch (parseErr) {
              warning(`Failed to parse container line: ${line}`);
            }
          }
        }
      }

      info(`Found ${containers.length} containers`);
      return containers;
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
   * 获取容器日志
   * @param {string} containerId - 容器ID
   * @param {number} tail - 显示最后N行
   * @param {boolean} follow - 是否实时跟踪
   * @returns {Promise<string>} - 日志内容
   */
  async getContainerLogs(containerId, tail = 100, follow = false) {
    try {
      await this.initialize();
      
      if (!this.currentDriver) {
        throw new Error('No container runtime available');
      }

      const result = await this.executeComponent('local:container-management/get-container-logs', {
        containerId,
        driver: this.currentDriver,
        tail,
        follow
      });

      return result.outputs.logs;
    } catch (err) {
      error(`Failed to get container logs: ${err.message}`);
      throw err;
    }
  }

  /**
   * 获取镜像列表
   * @param {boolean} all - 是否显示所有镜像
   * @returns {Promise<Array>} - 镜像列表
   */
  async getImages(all = false) {
    try {
      await this.initialize();
      
      if (!this.currentDriver) {
        throw new Error('No container runtime available');
      }

      // 直接使用Docker命令获取镜像列表
      const args = ['images', '--format', 'json'];
      if (all) {
        args.push('-a');
      }
      const { stdout } = await execAsync(`${this.currentDriver} ${args.join(' ')}`);
      
      let images = [];
      if (stdout.trim()) {
        const lines = stdout.trim().split('\n');
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const image = JSON.parse(line);
              images.push({
                ID: image.ID || image.Id || '',
                Repository: image.Repository || '',
                Tag: image.Tag || '',
                CreatedAt: image.CreatedAt || image.Created || '',
                Size: image.Size || ''
              });
            } catch (parseErr) {
              warning(`Failed to parse image line: ${line}`);
            }
          }
        }
      }

      info(`Found ${images.length} images`);
      return images;
    } catch (err) {
      error(`Failed to get images: ${err.message}`);
      throw err;
    }
  }

  /**
   * 删除镜像
   * @param {string} imageId - 镜像ID
   * @param {boolean} force - 是否强制删除
   * @returns {Promise<Object>} - 操作结果
   */
  async removeImage(imageId, force = false) {
    try {
      await this.initialize();
      
      if (!this.currentDriver) {
        throw new Error('No container runtime available');
      }

      const result = await this.executeComponent('local:container-management/remove-image', {
        imageId,
        driver: this.currentDriver,
        force
      });

      if (result.success) {
        success(`Removed image: ${imageId}`);
        return { success: true, message: result.outputs.message };
      } else {
        throw new Error(result.outputs.message || 'Failed to remove image');
      }
    } catch (err) {
      error(`Failed to remove image ${imageId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * 执行Docker Compose命令
   * @param {string} composeContent - Compose文件内容
   * @param {string} projectName - 项目名称
   * @returns {Promise<Object>} - 操作结果
   */
  async executeCompose(composeContent, projectName = 'orchestrator-compose') {
    try {
      await this.initialize();
      
      if (!this.currentDriver) {
        throw new Error('No container runtime available');
      }

      const result = await this.executeComponent('local:container-management/exec-compose', {
        command: 'up -d',
        composeFileContent: composeContent,
        projectName,
        driver: this.currentDriver
      });

      if (result.success) {
        success(`Docker Compose deployed successfully`);
        return { 
          success: true, 
          output: result.outputs.output,
          message: 'Docker Compose部署成功'
        };
      } else {
        throw new Error(result.outputs.output || 'Failed to deploy Docker Compose');
      }
    } catch (err) {
      error(`Failed to execute Docker Compose: ${err.message}`);
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
