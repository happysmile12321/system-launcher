import { Octokit } from 'octokit';
import { info, error, warning } from '../utils/logger.js';

/**
 * GitHub Token验证服务
 */
export class GitHubTokenValidator {
    /**
     * 验证GitHub token是否有效
     * @param {string} token - GitHub Personal Access Token
     * @param {string} owner - GitHub用户名
     * @param {string} repo - 仓库名
     * @param {boolean} skipRepoCheck - 是否跳过仓库检查，只验证token有效性
     * @returns {Promise<{valid: boolean, error?: string}>}
     */
    static async validateToken(token, owner, repo, skipRepoCheck = false) {
        try {
            if (!token || !owner || !repo) {
                return { valid: false, error: 'Missing required parameters' };
            }

            const octokit = new Octokit({
                auth: token,
                request: {
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'Orchestrator-Pro/1.0'
                    }
                }
            });

            // 检查token类型
            const isFineGrainedToken = token.startsWith('github_pat_');
            info(`Token type: ${isFineGrainedToken ? 'Fine-grained PAT' : 'Classic PAT'}`);

            // 对于Fine-grained token，需要特殊处理
            if (isFineGrainedToken) {
                // 如果跳过仓库检查，只验证token有效性
                if (skipRepoCheck) {
                    info('GitHub token validation: Skipping repository check for Fine-grained PAT');
                    return { valid: true };
                }

                // 对于Fine-grained PAT，我们使用重试机制
                let lastError = null;
                const maxRetries = 3;
                
                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        info(`GitHub token validation: Testing repository access for ${owner}/${repo} (attempt ${attempt}/${maxRetries})`);
                        
                        // 使用更长的超时时间，因为网络可能较慢
                        const timeoutPromise = new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Repository access timeout')), 15000)
                        );
                        
                        const repoPromise = octokit.rest.repos.get({
                            owner,
                            repo
                        });
                        
                        const repoData = await Promise.race([repoPromise, timeoutPromise]);
                        info(`GitHub token validation: Repository access confirmed for ${repoData.data.full_name}`);
                        info(`Repository visibility: ${repoData.data.private ? 'Private' : 'Public'}`);
                        
                        return { valid: true };
                    } catch (err) {
                        lastError = err;
                        error(`GitHub token validation attempt ${attempt} failed: ${err.message}`);
                        
                        if (attempt < maxRetries) {
                            info(`Retrying in 2 seconds...`);
                            await new Promise(resolve => setTimeout(resolve, 2000));
                        }
                    }
                }
                
                // 所有重试都失败了
                error(`GitHub token validation failed after ${maxRetries} attempts`);
                error(`Error status: ${lastError.status}`);
                error(`Error message: ${lastError.message}`);
                
                if (lastError.message.includes('timeout')) {
                    return { valid: false, error: `Repository access timeout after ${maxRetries} attempts. Please check your network connection.` };
                } else if (lastError.status === 404) {
                    return { valid: false, error: `Repository ${owner}/${repo} not found. Please check if the repository exists and your token has access to it.` };
                } else if (lastError.status === 403) {
                    return { valid: false, error: `Access denied to repository ${owner}/${repo}. Please check your token permissions.` };
                } else {
                    return { valid: false, error: `Cannot access repository ${owner}/${repo}: ${lastError.message}` };
                }
            }

            // 对于Classic token，测试用户认证
            try {
                const user = await octokit.rest.users.getAuthenticated();
                info(`GitHub token validation: User authenticated as ${user.data.login}`);
            } catch (err) {
                error(`GitHub token validation failed: ${err.message}`);
                error(`Error status: ${err.status}`);
                error(`Error response: ${JSON.stringify(err.response?.data || {})}`);
                return { valid: false, error: `Invalid token or authentication failed: ${err.message}` };
            }

            // 测试仓库访问权限
            try {
                const repoData = await octokit.rest.repos.get({
                    owner,
                    repo
                });
                info(`GitHub token validation: Repository access confirmed for ${repoData.data.full_name}`);
            } catch (err) {
                error(`GitHub token validation failed: Cannot access repository ${owner}/${repo}`);
                return { valid: false, error: `Cannot access repository ${owner}/${repo}` };
            }

            // 测试API权限（尝试列出根目录）
            try {
                await octokit.rest.repos.getContent({
                    owner,
                    repo,
                    path: '.'
                });
                info('GitHub token validation: API permissions confirmed');
            } catch (err) {
                warning(`GitHub token validation: Limited API access - ${err.message}`);
                // 不返回错误，因为可能只是仓库为空
            }

            return { valid: true };

        } catch (err) {
            error(`GitHub token validation error: ${err.message}`);
            return { valid: false, error: err.message };
        }
    }

    /**
     * 验证配置中的GitHub token
     * @param {Object} config - 配置对象
     * @returns {Promise<{valid: boolean, error?: string}>}
     */
    static async validateConfig(config) {
        if (!config || !config.github) {
            return { valid: false, error: 'GitHub configuration not found' };
        }

        const { token, owner, repo } = config.github;
        return await this.validateToken(token, owner, repo);
    }
}
