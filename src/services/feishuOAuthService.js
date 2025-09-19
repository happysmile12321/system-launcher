import { info, success, error, warning } from '../utils/logger.js';
import { getConfig, saveConfig } from './configService.js';

/**
 * Feishu OAuth 服务
 */
class FeishuOAuthService {
  constructor() {
    this.clientId = process.env.FEISHU_CLIENT_ID;
    this.clientSecret = process.env.FEISHU_CLIENT_SECRET;
    this.redirectUri = process.env.FEISHU_REDIRECT_URI || 'http://localhost:3000/auth/feishu/callback';
    this.baseUrl = 'https://open.feishu.cn/open-apis';
    this.tokenCache = new Map();
  }

  /**
   * 生成OAuth授权URL
   * @param {string} state - 状态参数，用于防止CSRF攻击
   * @returns {string} - 授权URL
   */
  generateAuthUrl(state) {
    if (!this.clientId) {
      throw new Error('Feishu Client ID not configured');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'user:read,drive:read,drive:write',
      state: state
    });

    return `${this.baseUrl}/authen/v1/authorize?${params.toString()}`;
  }

  /**
   * 交换授权码获取访问令牌
   * @param {string} code - 授权码
   * @param {string} state - 状态参数
   * @returns {Object} - 令牌信息
   */
  async exchangeCodeForToken(code, state) {
    try {
      info('Exchanging authorization code for access token');

      const response = await fetch(`${this.baseUrl}/authen/v1/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: code,
          redirect_uri: this.redirectUri
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Token exchange failed: ${errorData.error_description || response.statusText}`);
      }

      const tokenData = await response.json();
      
      if (tokenData.code !== 0) {
        throw new Error(`Feishu API error: ${tokenData.msg}`);
      }

      const tokens = {
        accessToken: tokenData.data.access_token,
        refreshToken: tokenData.data.refresh_token,
        expiresIn: tokenData.data.expires_in,
        tokenType: tokenData.data.token_type,
        scope: tokenData.data.scope,
        obtainedAt: new Date()
      };

      // 缓存令牌
      this.tokenCache.set('feishu_tokens', tokens);

      // 保存到配置文件
      await this.saveTokensToConfig(tokens);

      success('Successfully obtained Feishu access token');
      return tokens;

    } catch (err) {
      error(`Failed to exchange code for token: ${err.message}`);
      throw err;
    }
  }

  /**
   * 刷新访问令牌
   * @param {string} refreshToken - 刷新令牌
   * @returns {Object} - 新的令牌信息
   */
  async refreshAccessToken(refreshToken) {
    try {
      info('Refreshing Feishu access token');

      const response = await fetch(`${this.baseUrl}/authen/v1/refresh_access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Token refresh failed: ${errorData.error_description || response.statusText}`);
      }

      const tokenData = await response.json();
      
      if (tokenData.code !== 0) {
        throw new Error(`Feishu API error: ${tokenData.msg}`);
      }

      const tokens = {
        accessToken: tokenData.data.access_token,
        refreshToken: tokenData.data.refresh_token,
        expiresIn: tokenData.data.expires_in,
        tokenType: tokenData.data.token_type,
        scope: tokenData.data.scope,
        obtainedAt: new Date()
      };

      // 更新缓存
      this.tokenCache.set('feishu_tokens', tokens);

      // 保存到配置文件
      await this.saveTokensToConfig(tokens);

      success('Successfully refreshed Feishu access token');
      return tokens;

    } catch (err) {
      error(`Failed to refresh access token: ${err.message}`);
      throw err;
    }
  }

  /**
   * 获取用户信息
   * @param {string} accessToken - 访问令牌
   * @returns {Object} - 用户信息
   */
  async getUserInfo(accessToken) {
    try {
      info('Fetching Feishu user info');

      const response = await fetch(`${this.baseUrl}/authen/v1/user_info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to get user info: ${errorData.error_description || response.statusText}`);
      }

      const userData = await response.json();
      
      if (userData.code !== 0) {
        throw new Error(`Feishu API error: ${userData.msg}`);
      }

      success('Successfully fetched Feishu user info');
      return userData.data;

    } catch (err) {
      error(`Failed to get user info: ${err.message}`);
      throw err;
    }
  }

  /**
   * 获取有效的访问令牌
   * @returns {string} - 访问令牌
   */
  async getValidAccessToken() {
    try {
      let tokens = this.tokenCache.get('feishu_tokens');
      
      if (!tokens) {
        // 从配置文件加载
        const config = await getConfig();
        tokens = config.feishu?.tokens;
        
        if (!tokens) {
          throw new Error('No Feishu tokens found. Please authenticate first.');
        }
        
        this.tokenCache.set('feishu_tokens', tokens);
      }

      // 检查令牌是否过期
      const now = new Date();
      const tokenAge = now - new Date(tokens.obtainedAt);
      const expiresInMs = tokens.expiresIn * 1000;

      if (tokenAge >= expiresInMs - 60000) { // 提前1分钟刷新
        info('Feishu access token is about to expire, refreshing...');
        tokens = await this.refreshAccessToken(tokens.refreshToken);
      }

      return tokens.accessToken;

    } catch (err) {
      error(`Failed to get valid access token: ${err.message}`);
      throw err;
    }
  }

  /**
   * 保存令牌到配置文件
   * @param {Object} tokens - 令牌信息
   */
  async saveTokensToConfig(tokens) {
    try {
      const config = await getConfig();
      
      if (!config.feishu) {
        config.feishu = {};
      }
      
      config.feishu.tokens = tokens;
      config.feishu.authenticated = true;
      config.feishu.authenticatedAt = new Date().toISOString();
      
      await saveConfig(config);
      
    } catch (err) {
      warning(`Failed to save tokens to config: ${err.message}`);
    }
  }

  /**
   * 检查是否已认证
   * @returns {boolean} - 是否已认证
   */
  async isAuthenticated() {
    try {
      const config = await getConfig();
      return config.feishu?.authenticated === true;
    } catch (err) {
      return false;
    }
  }

  /**
   * 登出
   */
  async logout() {
    try {
      // 清除缓存
      this.tokenCache.delete('feishu_tokens');
      
      // 清除配置文件中的令牌
      const config = await getConfig();
      if (config.feishu) {
        delete config.feishu.tokens;
        config.feishu.authenticated = false;
        await saveConfig(config);
      }
      
      success('Successfully logged out from Feishu');
      
    } catch (err) {
      error(`Failed to logout: ${err.message}`);
      throw err;
    }
  }

  /**
   * 获取认证状态信息
   * @returns {Object} - 认证状态
   */
  async getAuthStatus() {
    try {
      const config = await getConfig();
      const isAuth = config.feishu?.authenticated === true;
      
      if (!isAuth) {
        return {
          authenticated: false,
          authUrl: this.generateAuthUrl('feishu_auth_' + Date.now())
        };
      }

      const tokens = config.feishu.tokens;
      const now = new Date();
      const tokenAge = now - new Date(tokens.obtainedAt);
      const expiresInMs = tokens.expiresIn * 1000;
      const isExpired = tokenAge >= expiresInMs;

      return {
        authenticated: true,
        isExpired,
        expiresAt: new Date(new Date(tokens.obtainedAt).getTime() + expiresInMs),
        scope: tokens.scope
      };

    } catch (err) {
      error(`Failed to get auth status: ${err.message}`);
      return {
        authenticated: false,
        error: err.message
      };
    }
  }
}

// 创建单例实例
const feishuOAuthService = new FeishuOAuthService();

export default feishuOAuthService;
export { FeishuOAuthService };
