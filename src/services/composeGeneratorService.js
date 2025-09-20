import localFSService from './localFS.js';
import { info, success, error, warning } from '../utils/logger.js';

/**
 * Compose生成器服务 - 根据表单数据生成符合LocalFS规范的docker-compose.yml
 * V3.1: 表单驱动的Compose编辑器
 */
class ComposeGeneratorService {
  constructor() {
    this.defaultComposeVersion = '3.8';
  }

  /**
   * 从表单数据生成Docker Compose配置
   * @param {Object} formData - 表单数据
   * @param {string} compositionName - 容器组名称
   * @returns {Promise<Object>} - 生成的Compose配置和目录结构
   */
  async generateComposeFromForm(formData, compositionName) {
    try {
      info(`Generating compose configuration for: ${compositionName}`);

      // 验证输入数据
      this.validateFormData(formData, compositionName);

      // 创建容器组目录结构
      const structure = await localFSService.createCompositionStructure(compositionName);

      // 生成Compose配置
      const composeConfig = this.buildComposeConfig(formData, compositionName);

      // 生成YAML内容
      const yamlContent = this.generateYAML(composeConfig);

      // 保存Compose文件
      const composeFilePath = await localFSService.saveComposeFile(compositionName, yamlContent);

      // 为每个服务创建必要的目录
      await this.createServiceDirectories(compositionName, formData.services);

      success(`Compose configuration generated successfully for: ${compositionName}`);

      return {
        compositionName,
        composeConfig,
        yamlContent,
        composeFilePath,
        structure,
        services: formData.services
      };
    } catch (err) {
      error(`Failed to generate compose configuration: ${err.message}`);
      throw err;
    }
  }

  /**
   * 验证表单数据
   * @param {Object} formData - 表单数据
   * @param {string} compositionName - 容器组名称
   */
  validateFormData(formData, compositionName) {
    if (!formData || typeof formData !== 'object') {
      throw new Error('Form data is required and must be an object');
    }

    if (!compositionName || typeof compositionName !== 'string') {
      throw new Error('Composition name is required and must be a string');
    }

    if (!formData.services || !Array.isArray(formData.services)) {
      throw new Error('Services array is required');
    }

    if (formData.services.length === 0) {
      throw new Error('At least one service is required');
    }

    // 验证每个服务
    formData.services.forEach((service, index) => {
      this.validateService(service, index);
    });
  }

  /**
   * 验证服务数据
   * @param {Object} service - 服务数据
   * @param {number} index - 服务索引
   */
  validateService(service, index) {
    if (!service.name || typeof service.name !== 'string') {
      throw new Error(`Service ${index}: name is required and must be a string`);
    }

    if (!service.image || typeof service.image !== 'string') {
      throw new Error(`Service ${index}: image is required and must be a string`);
    }

    // 验证服务名称格式
    if (!/^[a-zA-Z0-9_-]+$/.test(service.name)) {
      throw new Error(`Service ${index}: name can only contain letters, numbers, hyphens, and underscores`);
    }
  }

  /**
   * 构建Compose配置对象
   * @param {Object} formData - 表单数据
   * @param {string} compositionName - 容器组名称
   * @returns {Object} - Compose配置对象
   */
  buildComposeConfig(formData, compositionName) {
    const config = {
      version: formData.version || this.defaultComposeVersion,
      services: {},
      volumes: {},
      networks: formData.networks || {}
    };

    // 处理每个服务
    formData.services.forEach(service => {
      config.services[service.name] = this.buildServiceConfig(service, compositionName);
    });

    // 添加默认网络
    if (!config.networks || Object.keys(config.networks).length === 0) {
      config.networks = {
        default: {
          driver: 'bridge'
        }
      };
    }

    return config;
  }

  /**
   * 构建单个服务的配置
   * @param {Object} service - 服务数据
   * @param {string} compositionName - 容器组名称
   * @returns {Object} - 服务配置
   */
  buildServiceConfig(service, compositionName) {
    const serviceConfig = {
      image: service.image,
      container_name: service.containerName || `${compositionName}_${service.name}`,
      restart: service.restart || 'unless-stopped'
    };

    // 处理端口映射
    if (service.ports && service.ports.length > 0) {
      serviceConfig.ports = service.ports.map(port => {
        if (typeof port === 'string') {
          return port;
        }
        return `${port.host}:${port.container}`;
      });
    }

    // 处理环境变量
    if (service.environment && service.environment.length > 0) {
      serviceConfig.environment = service.environment.map(env => {
        if (typeof env === 'string') {
          return env;
        }
        return `${env.key}=${env.value}`;
      });
    }

    // 处理卷映射 - 使用LocalFS规范
    if (service.volumes && service.volumes.length > 0) {
      serviceConfig.volumes = service.volumes.map(volume => {
        if (volume.type === 'bind') {
          // 使用LocalFS规范生成路径
          const hostPath = localFSService.generateVolumePath(
            compositionName,
            service.name,
            volume.containerPath,
            volume.hostType || 'entitydata'
          );
          return hostPath;
        } else if (volume.type === 'named') {
          // 命名卷
          const volumeName = `${compositionName}_${volume.name}`;
          return `${volumeName}:${volume.containerPath}`;
        } else {
          // 直接路径映射
          return `${volume.hostPath}:${volume.containerPath}`;
        }
      });
    }

    // 处理网络
    if (service.networks && service.networks.length > 0) {
      serviceConfig.networks = service.networks;
    }

    // 处理依赖关系
    if (service.dependsOn && service.dependsOn.length > 0) {
      serviceConfig.depends_on = service.dependsOn;
    }

    // 处理健康检查
    if (service.healthCheck) {
      serviceConfig.healthcheck = {
        test: service.healthCheck.test,
        interval: service.healthCheck.interval || '30s',
        timeout: service.healthCheck.timeout || '10s',
        retries: service.healthCheck.retries || 3,
        start_period: service.healthCheck.startPeriod || '40s'
      };
    }

    // 处理标签
    if (service.labels && service.labels.length > 0) {
      serviceConfig.labels = {};
      service.labels.forEach(label => {
        if (typeof label === 'string') {
          const [key, value] = label.split('=');
          serviceConfig.labels[key] = value;
        } else {
          serviceConfig.labels[label.key] = label.value;
        }
      });
    }

    // 处理命令
    if (service.command) {
      serviceConfig.command = service.command;
    }

    // 处理工作目录
    if (service.workingDir) {
      serviceConfig.working_dir = service.workingDir;
    }

    // 处理用户
    if (service.user) {
      serviceConfig.user = service.user;
    }

    return serviceConfig;
  }

  /**
   * 生成YAML内容
   * @param {Object} config - Compose配置对象
   * @returns {string} - YAML内容
   */
  generateYAML(config) {
    let yaml = `version: '${config.version}'\n\n`;

    // 生成服务配置
    yaml += 'services:\n';
    Object.entries(config.services).forEach(([serviceName, serviceConfig]) => {
      yaml += `  ${serviceName}:\n`;
      Object.entries(serviceConfig).forEach(([key, value]) => {
        yaml += this.formatYAMLValue(key, value, 4);
      });
      yaml += '\n';
    });

    // 生成卷配置
    if (config.volumes && Object.keys(config.volumes).length > 0) {
      yaml += 'volumes:\n';
      Object.entries(config.volumes).forEach(([volumeName, volumeConfig]) => {
        yaml += `  ${volumeName}:\n`;
        if (typeof volumeConfig === 'object' && volumeConfig !== null) {
          Object.entries(volumeConfig).forEach(([key, value]) => {
            yaml += this.formatYAMLValue(key, value, 4);
          });
        }
      });
      yaml += '\n';
    }

    // 生成网络配置
    if (config.networks && Object.keys(config.networks).length > 0) {
      yaml += 'networks:\n';
      Object.entries(config.networks).forEach(([networkName, networkConfig]) => {
        yaml += `  ${networkName}:\n`;
        if (typeof networkConfig === 'object' && networkConfig !== null) {
          Object.entries(networkConfig).forEach(([key, value]) => {
            yaml += this.formatYAMLValue(key, value, 4);
          });
        }
      });
    }

    return yaml.trim();
  }

  /**
   * 格式化YAML值
   * @param {string} key - 键名
   * @param {any} value - 值
   * @param {number} indent - 缩进级别
   * @returns {string} - 格式化的YAML行
   */
  formatYAMLValue(key, value, indent = 0) {
    const spaces = ' '.repeat(indent);
    
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return `${spaces}${key}: []\n`;
      }
      
      let result = `${spaces}${key}:\n`;
      value.forEach(item => {
        if (typeof item === 'string') {
          result += `${spaces}  - "${item}"\n`;
        } else {
          result += `${spaces}  - ${JSON.stringify(item)}\n`;
        }
      });
      return result;
    } else if (typeof value === 'object' && value !== null) {
      let result = `${spaces}${key}:\n`;
      Object.entries(value).forEach(([subKey, subValue]) => {
        result += this.formatYAMLValue(subKey, subValue, indent + 2);
      });
      return result;
    } else if (typeof value === 'string') {
      return `${spaces}${key}: "${value}"\n`;
    } else {
      return `${spaces}${key}: ${value}\n`;
    }
  }

  /**
   * 为服务创建必要的目录
   * @param {string} compositionName - 容器组名称
   * @param {Array} services - 服务列表
   */
  async createServiceDirectories(compositionName, services) {
    for (const service of services) {
      try {
        // 创建配置目录
        await localFSService.createServiceConfigDirectory(compositionName, service.name);
        
        // 创建日志目录
        await localFSService.createServiceLogDirectory(compositionName, service.name);
        
        // 创建数据目录
        await localFSService.createServiceDataDirectory(compositionName, service.name);
        
        info(`Created directories for service: ${service.name}`);
      } catch (err) {
        warning(`Failed to create directories for service ${service.name}: ${err.message}`);
      }
    }
  }

  /**
   * 从现有Compose文件解析表单数据
   * @param {string} yamlContent - YAML内容
   * @returns {Object} - 解析后的表单数据
   */
  parseComposeToForm(yamlContent) {
    try {
      // 这里可以使用YAML解析库，暂时使用简单的解析逻辑
      const lines = yamlContent.split('\n');
      const formData = {
        version: '3.8',
        services: [],
        networks: {}
      };

      let currentService = null;
      let inServices = false;
      let inVolumes = false;
      let inNetworks = false;

      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('version:')) {
          formData.version = trimmed.replace('version:', '').replace(/'/g, '').trim();
        } else if (trimmed === 'services:') {
          inServices = true;
          inVolumes = false;
          inNetworks = false;
        } else if (trimmed === 'volumes:') {
          inServices = false;
          inVolumes = true;
          inNetworks = false;
        } else if (trimmed === 'networks:') {
          inServices = false;
          inVolumes = false;
          inNetworks = true;
        } else if (inServices && trimmed && !trimmed.startsWith(' ') && !trimmed.startsWith('-') && trimmed.endsWith(':')) {
          if (currentService) {
            formData.services.push(currentService);
          }
          currentService = {
            name: trimmed.slice(0, -1).trim(),
            image: '',
            ports: [],
            environment: [],
            volumes: [],
            networks: [],
            dependsOn: [],
            labels: [],
            restart: 'unless-stopped'
          };
        } else if (currentService && trimmed.startsWith('image:')) {
          currentService.image = trimmed.replace('image:', '').replace(/'/g, '').trim();
        }
        // 可以继续添加更多解析逻辑...
      }

      if (currentService) {
        formData.services.push(currentService);
      }

      return formData;
    } catch (err) {
      error(`Failed to parse compose to form: ${err.message}`);
      throw err;
    }
  }

  /**
   * 验证生成的Compose配置
   * @param {Object} composeConfig - Compose配置对象
   * @returns {Object} - 验证结果
   */
  validateComposeConfig(composeConfig) {
    const errors = [];
    const warnings = [];

    // 检查版本
    if (!composeConfig.version) {
      errors.push('Version is required');
    }

    // 检查服务
    if (!composeConfig.services || Object.keys(composeConfig.services).length === 0) {
      errors.push('At least one service is required');
    }

    // 检查每个服务
    Object.entries(composeConfig.services).forEach(([serviceName, serviceConfig]) => {
      if (!serviceConfig.image) {
        errors.push(`Service ${serviceName}: image is required`);
      }

      // 检查端口冲突
      if (serviceConfig.ports) {
        const usedPorts = new Set();
        serviceConfig.ports.forEach(port => {
          const hostPort = port.split(':')[0];
          if (usedPorts.has(hostPort)) {
            warnings.push(`Service ${serviceName}: port ${hostPort} is used by multiple services`);
          }
          usedPorts.add(hostPort);
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// 创建单例实例
const composeGeneratorService = new ComposeGeneratorService();

export default composeGeneratorService;
export { ComposeGeneratorService };
