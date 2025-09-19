import { Client, WSClient, EventDispatcher, LoggerLevel } from '@larksuiteoapi/node-sdk';
import { info, success, error, warning } from '../utils/logger.js';
import { getConfig } from './configService.js';
import GitFS from '../core/gitfs.js';
import feishuFS from './feishuFS.js';

class FeishuWebSocketService {
  constructor() {
    this.client = null;
    this.wsClient = null;
    this.eventDispatcher = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000; // 5秒
  }

  /**
   * 初始化飞书WebSocket客户端
   */
  async initialize() {
    try {
      const config = await getConfig();
      
      if (!config.feishu?.appId || !config.feishu?.appSecret) {
        warning('飞书配置不完整，无法启动WebSocket服务');
        return false;
      }

      // 创建飞书客户端（用于API调用）
      this.client = new Client({
        appId: config.feishu.appId,
        appSecret: config.feishu.appSecret,
        logLevel: 'info'
      });

      // 创建WebSocket客户端（用于长连接）
      this.wsClient = new WSClient({
        appId: config.feishu.appId,
        appSecret: config.feishu.appSecret,
        loggerLevel: LoggerLevel.info
      });

      // 创建事件分发器
      this.eventDispatcher = new EventDispatcher({}).register({
        'im.message.receive_v1': async (data) => {
          this.handleMessageReceive(data);
        },
        'im.message.reaction.created_v1': async (data) => {
          this.handleMessageReaction(data);
        },
        'drive.file.created_v1': async (data) => {
          this.handleFileCreated(data);
        },
        'drive.file.updated_v1': async (data) => {
          this.handleFileUpdated(data);
        },
        'drive.file.deleted_v1': async (data) => {
          this.handleFileDeleted(data);
        }
      });

      info('飞书WebSocket客户端初始化完成');
      return true;
    } catch (err) {
      error(`飞书WebSocket客户端初始化失败: ${err.message}`);
      return false;
    }
  }


  /**
   * 处理消息接收事件
   */
  handleMessageReceive(data) {
    try {
      const { message, sender } = data;
      info(`收到新消息: ${JSON.stringify(message.content)} 来自: ${sender?.sender_id?.user_id || 'unknown'}`);
      
      // 这里可以添加消息处理逻辑
      // 例如：自动回复、消息转发、触发工作流等
    } catch (err) {
      error(`处理消息接收事件失败: ${err.message}`);
    }
  }

  /**
   * 处理消息反应事件
   */
  handleMessageReaction(data) {
    try {
      const { message_id, reaction_type, operator } = data;
      info(`消息反应: ${reaction_type} 来自: ${operator?.operator_id?.user_id || 'unknown'}`);
      
      // 这里可以添加反应处理逻辑
    } catch (err) {
      error(`处理消息反应事件失败: ${err.message}`);
    }
  }

  /**
   * 处理文件创建事件
   */
  handleFileCreated(data) {
    try {
      const { file_token, file_type } = data;
      info(`文件创建: ${file_token} 类型: ${file_type}`);
      
      // 这里可以添加文件创建处理逻辑
      // 例如：自动备份、文件同步等
    } catch (err) {
      error(`处理文件创建事件失败: ${err.message}`);
    }
  }

  /**
   * 处理文件更新事件
   */
  handleFileUpdated(data) {
    try {
      const { file_token, file_type } = data;
      info(`文件更新: ${file_token} 类型: ${file_type}`);
      
      // 这里可以添加文件更新处理逻辑
    } catch (err) {
      error(`处理文件更新事件失败: ${err.message}`);
    }
  }

  /**
   * 处理文件删除事件
   */
  handleFileDeleted(data) {
    try {
      const { file_token, file_type } = data;
      info(`文件删除: ${file_token} 类型: ${file_type}`);
      
      // 这里可以添加文件删除处理逻辑
    } catch (err) {
      error(`处理文件删除事件失败: ${err.message}`);
    }
  }

  /**
   * 启动WebSocket连接
   */
  async start() {
    if (!this.wsClient || !this.eventDispatcher) {
      const initialized = await this.initialize();
      if (!initialized) {
        return false;
      }
    }

    try {
      await this.wsClient.start({
        eventDispatcher: this.eventDispatcher
      });
      this.isConnected = true;
      this.reconnectAttempts = 0;
      success('飞书WebSocket长连接启动成功');
      
      // 连接成功后自动记录到GitFS并刷新文件列表
      await this.onConnectionSuccess();
      
      return true;
    } catch (err) {
      error(`启动飞书WebSocket连接失败: ${err.message}`);
      return false;
    }
  }

  /**
   * WebSocket连接成功后的处理
   */
  async onConnectionSuccess() {
    try {
      // 记录连接状态到GitFS
      await this.saveConnectionStatusToGitFS();
      
      // 尝试刷新文件列表
      await this.refreshFileList();
      
    } catch (err) {
      warning(`WebSocket连接成功后的处理失败: ${err.message}`);
    }
  }

  /**
   * 保存连接状态到GitFS
   */
  async saveConnectionStatusToGitFS() {
    try {
      const config = await getConfig();
      const gitfs = new GitFS(config);
      
      const connectionData = {
        connected: true,
        connectedAt: new Date().toISOString(),
        appId: config.feishu?.appId,
        connectionType: 'websocket_long_connection'
      };
      
      // 确保.orchestrator-pro目录存在
      await gitfs.createDirectory('.orchestrator-pro');
      
      // 保存连接状态到GitFS
      await gitfs.writeFile(
        '.orchestrator-pro/feishu-connection.json',
        JSON.stringify(connectionData, null, 2),
        'Update Feishu WebSocket connection status'
      );
      
      success('飞书WebSocket连接状态已保存到GitFS');
      
    } catch (err) {
      warning(`保存连接状态到GitFS失败: ${err.message}`);
    }
  }

  /**
   * 刷新文件列表
   */
  async refreshFileList() {
    try {
      // 这里可以触发前端刷新文件列表
      // 由于这是后端服务，我们只能记录日志
      info('WebSocket连接成功，建议刷新前端文件列表');
      
      // 可以在这里添加其他需要执行的初始化操作
      
    } catch (err) {
      warning(`刷新文件列表失败: ${err.message}`);
    }
  }

  /**
   * 停止WebSocket连接
   */
  async stop() {
    if (this.wsClient && this.isConnected) {
      try {
        await this.wsClient.stop();
        this.isConnected = false;
        success('飞书WebSocket连接已停止');
      } catch (err) {
        error(`停止飞书WebSocket连接失败: ${err.message}`);
      }
    }
  }

  /**
   * 处理重连逻辑
   */
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      error('飞书WebSocket重连次数已达上限，停止重连');
      return;
    }

    this.reconnectAttempts++;
    warning(`飞书WebSocket将在${this.reconnectInterval/1000}秒后尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(async () => {
      try {
        await this.start();
      } catch (err) {
        error(`飞书WebSocket重连失败: ${err.message}`);
      }
    }, this.reconnectInterval);
  }

  /**
   * 获取连接状态
   */
  getStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }
}

// 创建单例实例
const feishuWebSocketService = new FeishuWebSocketService();

export default feishuWebSocketService;
