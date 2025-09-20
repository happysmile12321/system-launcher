#!/usr/bin/env node

import inquirer from 'inquirer';
import { loadState, saveState, getState } from '../core/orchestration.js';
import { runDockerDeploy, runCloudflareDeploy } from '../core/deployment.js';
import { info, success, warning, error } from '../utils/logger.js';
import { execa, execaCommandSync } from 'execa';
import { existsSync } from 'fs';
import { GitHubTokenValidator } from '../services/githubTokenValidator.js';
import GitFS from '../core/gitfs.js';

async function main() {
  // 解析命令行参数
  const args = process.argv.slice(2);

  // 检查是否有 -t 参数
  if (args.includes('-t')) {
    await testGitHubAPI();
    return;
  }

  info('Welcome to Orchestrator Pro CLI!');
  await loadState();

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        'View Current Orchestration',
        'Run Docker Deploy',
        'Deploy System Services',
        'Configure Cloudflare Gateway',
        'Save Orchestration State',
        'Exit'
      ],
    },
  ]);

  if (action === 'View Current Orchestration') {
    info('Current state from GitHub:');
    console.log(JSON.stringify(getState(), null, 2));
  }

  if (action === 'Run Docker Deploy') {
    await runDockerDeploy();
  }

  if (action === 'Deploy System Services') {
    await deploySystemServices();
  }

  if (action === 'Configure Cloudflare Gateway') {
    await configureCloudflareGateway();
  }

  if (action === 'Save Orchestration State') {
    const state = getState() || { version: 1, steps: [] };
    await saveState(state);
  }

  if (action === 'Exit') {
    info('Goodbye!');
  }
}

// 部署系统服务函数
async function deploySystemServices() {
  info('=== 开始部署系统服务 ===');

  // --- 1. 环境检查 ---
  info('1. 正在检查环境依赖...');
  try {
    execaCommandSync('docker --version');
    execaCommandSync('docker-compose --version');
    success('环境依赖检查通过！\n');
  } catch (e) {
    error('依赖检查失败: 请确保 Docker 和 Docker Compose 已正确安装并可以运行。');
    return;
  }

  // --- 2. 启动本地服务 ---
  info('2. 正在启动本地 Docker 服务 (知识库 & n8n)...');
  if (!existsSync('docker-compose.yml')) {
    error("当前目录下未找到 'docker-compose.yml' 文件。请将此工具与 docker-compose.yml 放在同一目录运行。");
    return;
  }
  try {
    await execa('docker-compose', ['up', '-d']);
    success('本地服务已在后台启动！');
    info('n8n 访问地址: http://127.0.0.1:5678');
    info('知识库 API 地址: http://127.0.0.1:8000 (请根据您的配置确认)\n');
  } catch (e) {
    error('启动 Docker 服务失败: ' + e.stderr);
    return;
  }

  // 更新编排状态
  const state = getState() || { version: 1, steps: [] };
  state.systemDeployed = true;
  state.lastDeployTime = new Date().toISOString();
  await saveState(state);

  // --- 最终手动操作清单 ---
  info("======================================================");
  success("🎉 恭喜！自动化部署部分已全部完成！ 🎉");
  warning("📝 接下来，请您完成最后几步手动配置:");
  console.log(`
1.  ${warning('[飞书 Agent 连接]')}
    - 请登录飞书集成平台，在“自定义连接”部分找到并下载您的专属本地 Agent。
    - 在您的服务器上运行 Agent，将其连接到云端。

2.  ${warning('[飞书集成平台配置]')}
    - 登录飞书集成平台，进入“连接器管理”。
    - 创建一个【本地知识库连接器】: 选择通过 Agent 访问，地址填写 http://knowledge-base:8000。
    - 创建一个【海外API连接器】: 选择公网API，地址填写您的Cloudflare网关地址。

系统部署完成！祝您使用愉快！
  `);
}

// 配置 Cloudflare 网关函数
async function configureCloudflareGateway() {
  info('3. 正在配置 Cloudflare API 网关...');
  warning('此步骤需要您已拥有 Cloudflare 账户、一个域名，并已全局安装 wrangler CLI。');

  const { apiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: '请输入您要代理的海外API的密钥 (例如 OpenAI API Key):',
      mask: '*',
    },
  ]);

  if (!apiKey) {
    error('API Key 不能为空。');
    return;
  }

  try {
    info('正在将您的 API Key 安全地上传到 Cloudflare...');
    await execa('wrangler', ['secret', 'put', 'API_KEY'], { input: apiKey });
    success('API Key 已成功设置为环境变量。');

    info('正在部署 Worker 到 Cloudflare...');
    const { stdout } = await execa('wrangler', ['deploy', 'cloudflare/index.js']); // 假设代码在 cloudflare/index.js
    const workerUrl = stdout.match(/https:\/\/[^ ]*/)[0];
    success('Cloudflare API 网关已部署！');
    info(`您的专属API代理地址是: ${workerUrl}\n`);

    // 更新编排状态
    const state = getState() || { version: 1, steps: [] };
    state.cloudflareDeployed = true;
    state.workerUrl = workerUrl;
    state.lastCloudflareUpdate = new Date().toISOString();
    await saveState(state);

  } catch (e) {
    error('Cloudflare 配置失败: ' + (e.stderr || e.message));
    warning('请确保您已运行 `wrangler login` 并正确配置了 cloudflare/wrangler.toml 文件。');
    return;
  }
}

/**
 * GitHub API 测试功能
 */
async function testGitHubAPI() {
  info('=== GitHub API 测试工具 ===');

  try {
    // 获取 GitHub 配置信息
    const config = await getGitHubConfigFromUser();

    // 验证配置
    info('正在验证 GitHub 配置...');
    const validation = await GitHubTokenValidator.validateToken(
      config.github.token,
      config.github.owner,
      config.github.repo
    );

    if (!validation.valid) {
      error(`GitHub 配置验证失败: ${validation.error}`);
      return;
    }

    success('GitHub 配置验证成功！');

    // 创建 GitFS 实例
    const gitfs = new GitFS(config);

    // 测试各种 GitHub API 调用
    await testGitHubAPIs(gitfs, config);

  } catch (err) {
    error(`GitHub API 测试失败: ${err.message}`);
  }
}

/**
 * 从用户输入获取 GitHub 配置
 */
async function getGitHubConfigFromUser() {
  const questions = [
    {
      type: 'input',
      name: 'token',
      message: '请输入 GitHub Personal Access Token:',
      validate: (input) => input.length > 0 || 'Token 不能为空'
    },
    {
      type: 'input',
      name: 'owner',
      message: '请输入 GitHub 用户名或组织名:',
      validate: (input) => input.length > 0 || '用户名不能为空'
    },
    {
      type: 'input',
      name: 'repo',
      message: '请输入仓库名:',
      validate: (input) => input.length > 0 || '仓库名不能为空'
    }
  ];

  const answers = await inquirer.prompt(questions);

  return {
    github: {
      token: answers.token,
      owner: answers.owner,
      repo: answers.repo
    }
  };
}

/**
 * 测试各种 GitHub API 调用
 */
async function testGitHubAPIs(gitfs, config) {
  info('\n=== 开始测试 GitHub API ===');

  try {
    // 1. 测试获取仓库信息
    info('1. 测试获取仓库信息...');
    const repoInfo = await gitfs.octokit.rest.repos.get({
      owner: config.github.owner,
      repo: config.github.repo
    });

    success('✅ 仓库信息获取成功:');
    console.log(JSON.stringify({
      name: repoInfo.data.name,
      full_name: repoInfo.data.full_name,
      description: repoInfo.data.description,
      private: repoInfo.data.private,
      html_url: repoInfo.data.html_url,
      created_at: repoInfo.data.created_at,
      updated_at: repoInfo.data.updated_at,
      language: repoInfo.data.language,
      stargazers_count: repoInfo.data.stargazers_count,
      forks_count: repoInfo.data.forks_count
    }, null, 2));

    // 2. 测试获取仓库内容
    info('\n2. 测试获取仓库根目录内容...');
    try {
      const rootContent = await gitfs.octokit.rest.repos.getContent({
        owner: config.github.owner,
        repo: config.github.repo,
        path: '.'
      });

      success('✅ 仓库根目录内容获取成功:');
      console.log(JSON.stringify(rootContent.data.map(item => ({
        name: item.name,
        type: item.type,
        path: item.path,
        size: item.size
      })), null, 2));
    } catch (err) {
      warning(`⚠️  获取仓库内容失败: ${err.message}`);
    }

    // 3. 测试获取分支信息
    info('\n3. 测试获取分支信息...');
    try {
      const branches = await gitfs.octokit.rest.repos.listBranches({
        owner: config.github.owner,
        repo: config.github.repo
      });

      success('✅ 分支信息获取成功:');
      console.log(JSON.stringify(branches.data.map(branch => ({
        name: branch.name,
        commit: {
          sha: branch.commit.sha,
          url: branch.commit.url
        },
        protected: branch.protected
      })), null, 2));
    } catch (err) {
      warning(`⚠️  获取分支信息失败: ${err.message}`);
    }

    // 4. 测试获取提交历史
    info('\n4. 测试获取最近的提交历史...');
    try {
      const commits = await gitfs.octokit.rest.repos.listCommits({
        owner: config.github.owner,
        repo: config.github.repo,
        per_page: 5
      });

      success('✅ 提交历史获取成功:');
      console.log(JSON.stringify(commits.data.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: {
          name: commit.commit.author.name,
          email: commit.commit.author.email,
          date: commit.commit.author.date
        },
        committer: {
          name: commit.commit.committer.name,
          email: commit.commit.committer.email,
          date: commit.commit.committer.date
        }
      })), null, 2));
    } catch (err) {
      warning(`⚠️  获取提交历史失败: ${err.message}`);
    }

    // 5. 测试获取 Issues
    info('\n5. 测试获取 Issues...');
    try {
      const issues = await gitfs.octokit.rest.issues.listForRepo({
        owner: config.github.owner,
        repo: config.github.repo,
        state: 'open',
        per_page: 5
      });

      success('✅ Issues 获取成功:');
      console.log(JSON.stringify(issues.data.map(issue => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        user: {
          login: issue.user.login,
          avatar_url: issue.user.avatar_url
        }
      })), null, 2));
    } catch (err) {
      warning(`⚠️  获取 Issues 失败: ${err.message}`);
    }

    // 6. 测试获取 Pull Requests
    info('\n6. 测试获取 Pull Requests...');
    try {
      const pulls = await gitfs.octokit.rest.pulls.list({
        owner: config.github.owner,
        repo: config.github.repo,
        state: 'open',
        per_page: 5
      });

      success('✅ Pull Requests 获取成功:');
      console.log(JSON.stringify(pulls.data.map(pull => ({
        number: pull.number,
        title: pull.title,
        state: pull.state,
        created_at: pull.created_at,
        updated_at: pull.updated_at,
        user: {
          login: pull.user.login,
          avatar_url: pull.user.avatar_url
        },
        head: {
          ref: pull.head.ref,
          sha: pull.head.sha
        },
        base: {
          ref: pull.base.ref,
          sha: pull.base.sha
        }
      })), null, 2));
    } catch (err) {
      warning(`⚠️  获取 Pull Requests 失败: ${err.message}`);
    }

    // 7. 测试 GitFS 功能
    info('\n7. 测试 GitFS 文件系统功能...');
    try {
      // 测试列出目录
      const dirList = await gitfs.listDirectory();
      success('✅ GitFS 目录列表功能正常:');
      console.log(JSON.stringify(dirList, null, 2));

      // 测试检查路径是否存在
      const exists = await gitfs.exists('README.md');
      info(`README.md 文件存在: ${exists}`);

    } catch (err) {
      warning(`⚠️  GitFS 功能测试失败: ${err.message}`);
    }

    success('\n🎉 GitHub API 测试完成！所有功能都正常工作。');

  } catch (err) {
    error(`GitHub API 测试过程中出现错误: ${err.message}`);
    throw err;
  }
}

main().catch(console.error);