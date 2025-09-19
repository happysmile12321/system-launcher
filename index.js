#!/usr/bin/env node

// ↑↑↑ 这一行非常重要！它告诉系统这个文件应该用 Node.js 来执行。

import inquirer from 'inquirer';
import chalk from 'chalk';
import { execa, execaCommandSync } from 'execa';
import { existsSync } from 'fs';

// --- 辅助函数 ---
const log = console.log;
const info = (msg) => log(chalk.blue(`[INFO] ${msg}`));
const success = (msg) => log(chalk.green(`[SUCCESS] ${msg}`));
const warning = (msg) => log(chalk.yellow(`[WARNING] ${msg}`));
const error = (msg) => log(chalk.red(`[ERROR] ${msg}`));

async function main() {
  info('=== 欢迎使用系统一键部署启动器 ===');

  // --- 1. 环境检查 ---
  info('1. 正在检查环境依赖...');
  try {
    execaCommandSync('docker --version');
    execaCommandSync('docker-compose --version');
  } catch (e) {
    error('依赖检查失败: 请确保 Docker 和 Docker Compose 已正确安装并可以运行。');
    return;
  }
  success('环境依赖检查通过！\n');

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

  // --- 3. 配置 Cloudflare 网关 (交互式) ---
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
  } catch (e) {
    error('Cloudflare 配置失败: ' + (e.stderr || e.message));
    warning('请确保您已运行 `wrangler login` 并正确配置了 cloudflare/wrangler.toml 文件。');
    return;
  }

  // ... 可以在这里继续添加 n8n 的交互式配置 ...
  
  // --- 5. 最终手动操作清单 ---
  info("======================================================");
  success("🎉 恭喜！自动化部署部分已全部完成！ 🎉");
  warning("📝 接下来，请您完成最后几步手动配置:");
  log(`
1.  ${chalk.cyan('[飞书 Agent 连接]')}
    - 请登录飞书集成平台，在“自定义连接”部分找到并下载您的专属本地 Agent。
    - 在您的服务器上运行 Agent，将其连接到云端。

2.  ${chalk.cyan('[飞书集成平台配置]')}
    - 登录飞书集成平台，进入“连接器管理”。
    - 创建一个【本地知识库连接器】: 选择通过 Agent 访问，地址填写 http://knowledge-base:8000。
    - 创建一个【海外API连接器】: 选择公网API，地址填写您的Cloudflare网关地址。

系统部署完成！祝您使用愉快！
  `);
}

main().catch(console.error);