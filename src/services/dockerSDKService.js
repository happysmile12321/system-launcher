import { Contexts } from '@docker/sdk';
import { info, error, success } from '../utils/logger.js';

/**
 * Docker SDK服务
 * 使用官方的Docker Node SDK来管理容器和镜像
 */
class DockerSDKService {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  /**
   * 初始化Docker SDK客户端
   */
  async initialize() {
    try {
      this.client = new Contexts();
      this.initialized = true;
      info('Docker SDK service initialized successfully');
    } catch (err) {
      error(`Failed to initialize Docker SDK: ${err.message}`);
      throw err;
    }
  }

  /**
   * 获取Docker上下文列表
   */
  async getContexts() {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      return new Promise((resolve, reject) => {
        this.client.list({}, (err, response) => {
          if (err) {
            reject(err);
            return;
          }
          
          const contexts = response.getContextsList().map(context => ({
            name: context.getName(),
            description: context.getDescription(),
            dockerEndpoint: context.getDockerEndpoint(),
            kubernetesEndpoint: context.getKubernetesEndpoint()
          }));
          
          resolve(contexts);
        });
      });
    } catch (err) {
      error(`Failed to get Docker contexts: ${err.message}`);
      throw err;
    }
  }

  /**
   * 检查Docker服务状态
   */
  async checkStatus() {
    try {
      const contexts = await this.getContexts();
      return {
        available: contexts.length > 0,
        contexts: contexts,
        defaultContext: contexts.find(c => c.name === 'default') || contexts[0]
      };
    } catch (err) {
      return {
        available: false,
        error: err.message,
        contexts: [],
        defaultContext: null
      };
    }
  }
}

export default new DockerSDKService();
