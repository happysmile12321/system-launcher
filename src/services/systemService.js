import { getConfig } from './configService.js';
import { info, success, error, warning } from '../utils/logger.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 系统服务管理 - 负责管理可插拔的系统级扩展模块
 */
class SystemService {
  constructor() {
    this.availableServices = new Map();
    this.installedServices = new Map();
    this.loaded = false;
  }

  /**
   * 初始化系统服务
   */
  async initialize() {
    if (this.loaded) {
      return;
    }

    info('Initializing system services...');
    
    try {
      await this.loadAvailableServices();
      await this.loadInstalledServices();
      this.loaded = true;
      success(`System services initialized successfully. Loaded ${this.availableServices.size} available services and ${this.installedServices.size} installed services.`);
    } catch (err) {
      error(`Failed to initialize system services: ${err.message}`);
      throw err;
    }
  }

  /**
   * 加载可用的系统服务
   */
  async loadAvailableServices() {
    // 定义可用的系统服务
    const services = [
      {
        id: 'container-management',
        name: '容器管理',
        description: '管理本地Docker/Podman容器，提供容器列表、操作和日志查看功能',
        version: '1.0.0',
        icon: 'ContainerIcon',
        dependencies: ['docker', 'podman'],
        category: 'infrastructure'
      },
      {
        id: 'database-management',
        name: '数据库管理',
        description: '管理数据库连接和操作，支持多种数据库类型',
        version: '1.0.0',
        icon: 'DatabaseIcon',
        dependencies: [],
        category: 'data'
      }
    ];

    for (const service of services) {
      this.availableServices.set(service.id, service);
    }
  }

  /**
   * 加载已安装的服务
   */
  async loadInstalledServices() {
    try {
      const config = getConfig();
      if (!config || !config.services) {
        return;
      }

      for (const [serviceId, serviceConfig] of Object.entries(config.services)) {
        if (serviceConfig.installed) {
          const service = this.availableServices.get(serviceId);
          if (service) {
            this.installedServices.set(serviceId, {
              ...service,
              installed: true,
              installedAt: serviceConfig.installedAt,
              config: serviceConfig
            });
          }
        }
      }
    } catch (err) {
      error(`Failed to load installed services: ${err.message}`);
    }
  }

  /**
   * 检查依赖是否安装
   */
  async checkDependency(dependency) {
    try {
      // 检查命令是否存在
      const { stdout } = await execAsync(`which ${dependency} || where ${dependency}`);
      return stdout.trim().length > 0;
    } catch (err) {
      return false;
    }
  }

  /**
   * 安装系统服务
   */
  async installService(serviceId) {
    try {
      const service = this.availableServices.get(serviceId);
      if (!service) {
        throw new Error('Service not found');
      }

      // 检查依赖
      for (const dependency of service.dependencies) {
        const isInstalled = await this.checkDependency(dependency);
        if (!isInstalled) {
          throw new Error(`Dependency ${dependency} is not installed`);
        }
      }

      // 更新配置
      const config = getConfig();
      if (!config.services) {
        config.services = {};
      }

      config.services[serviceId] = {
        installed: true,
        installedAt: new Date().toISOString(),
        version: service.version
      };

      // 保存配置
      await this.saveConfig(config);

      // 更新内存中的状态
      this.installedServices.set(serviceId, {
        ...service,
        installed: true,
        installedAt: config.services[serviceId].installedAt,
        config: config.services[serviceId]
      });

      success(`Installed system service: ${service.name}`);
      return true;
    } catch (err) {
      error(`Failed to install service ${serviceId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * 卸载系统服务
   */
  async uninstallService(serviceId) {
    try {
      const service = this.availableServices.get(serviceId);
      if (!service) {
        throw new Error('Service not found');
      }

      // 更新配置
      const config = getConfig();
      if (config.services && config.services[serviceId]) {
        delete config.services[serviceId];
        await this.saveConfig(config);
      }

      // 从内存中移除
      this.installedServices.delete(serviceId);

      success(`Uninstalled system service: ${service.name}`);
      return true;
    } catch (err) {
      error(`Failed to uninstall service ${serviceId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * 获取所有可用服务
   */
  async getAllServices() {
    await this.initialize();
    
    const services = Array.from(this.availableServices.values()).map(service => ({
      ...service,
      installed: this.installedServices.has(service.id)
    }));

    return services;
  }

  /**
   * 获取已安装的服务
   */
  async getInstalledServices() {
    await this.initialize();
    return Array.from(this.installedServices.values());
  }

  /**
   * 根据ID获取服务
   */
  async getService(serviceId) {
    await this.initialize();
    return this.availableServices.get(serviceId) || null;
  }

  /**
   * 保存配置
   */
  async saveConfig(config) {
    // 这里应该保存到配置文件
    // 暂时使用内存存储，实际应该保存到 .orchestrator.config.json
    const fs = await import('fs');
    const path = await import('path');
    
    const configPath = path.join(process.cwd(), '.orchestrator.config.json');
    await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));
  }

  /**
   * 刷新服务列表
   */
  async refresh() {
    info('Refreshing system services...');
    
    this.availableServices.clear();
    this.installedServices.clear();
    this.loaded = false;
    
    await this.initialize();
  }
}

// 创建单例实例
const systemService = new SystemService();

export default systemService;

export { SystemService };
