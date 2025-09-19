#!/usr/bin/env node

// ↑↑↑ 这一行非常重要！它告诉系统这个文件应该用 Node.js 来执行。

import chalk from 'chalk';
import { execa } from 'execa';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

// --- 辅助函数 ---
const log = console.log;
const info = (msg) => log(chalk.blue(`[INFO] ${msg}`));
const success = (msg) => log(chalk.green(`[SUCCESS] ${msg}`));
const warning = (msg) => log(chalk.yellow(`[WARNING] ${msg}`));
const error = (msg) => log(chalk.red(`[ERROR] ${msg}`));

async function main() {
  // 打印欢迎信息
  log(chalk.bold.green('========================================='));
  log(chalk.bold.green('        Orchestrator Pro v1.0'));
  log(chalk.bold.green('========================================='));
  log('您的个人自动化与集成中枢');
  log(chalk.gray('将您的 GitHub 仓库转变为私有的、版本化的个人云后端'));
  log();

  // 解析命令行参数
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'start':
    case 'serve':
      // 启动Web服务器
      await startWebServer();
      break;
    
    case 'cli':
    case 'command':
    case 'terminal':
      // 启动CLI模式
      startCliMode();
      break;
    
    case 'help':
    case '-h':
    case '--help':
      // 显示帮助信息
      showHelp();
      break;
    
    case 'version':
    case '-v':
    case '--version':
      // 显示版本信息
      showVersion();
      break;
    
    default:
      // 默认行为：显示欢迎信息并启动Web服务器
      info('正在启动 Orchestrator Pro...');
      await startWebServer();
      break;
  }
}

/**
 * 启动Web服务器
 */
async function startWebServer() {
  try {
    // 检查Node.js版本
    const nodeVersion = process.version;
    const [major] = nodeVersion.match(/v(\d+)/).slice(1).map(Number);
    if (major < 16) {
      warning(`您的Node.js版本 (${nodeVersion}) 低于推荐版本 (v16+)。某些功能可能无法正常工作。`);
    }

    // 启动Web服务器
    const serverPath = path.join(__dirname, 'src', 'web', 'server.js');
    info(`正在启动Web服务器...`);
    
    // 使用子进程启动服务器，以便可以显示彩色日志
    const serverProcess = execa('node', [serverPath], {
      stdio: 'inherit' // 继承父进程的标准输入输出
    });

    // 监听进程退出事件
    serverProcess.on('exit', (code) => {
      if (code !== 0) {
        error(`Web服务器意外退出，退出码: ${code}`);
      }
    });

    // 监听用户中断信号
    process.on('SIGINT', () => {
      info('正在停止Web服务器...');
      serverProcess.kill('SIGINT');
      process.exit(0);
    });
  } catch (err) {
    error(`启动Web服务器失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 启动CLI模式
 */
function startCliMode() {
  info('CLI模式尚未完全实现。请使用Web界面进行操作。');
  info('正在启动Web服务器...');
  startWebServer();
}

/**
 * 显示帮助信息
 */
function showHelp() {
  log(chalk.bold('Orchestrator Pro - 使用帮助'));
  log();
  log(chalk.cyan('命令列表:'));
  log('  orchestrator-pro            启动Orchestrator Pro Web服务器');
  log('  orchestrator-pro start      启动Web服务器');
  log('  orchestrator-pro help       显示帮助信息');
  log('  orchestrator-pro version    显示版本信息');
  log();
  log(chalk.cyan('使用说明:'));
  log('1. 首次运行时，系统会引导您完成GitHub配置。');
  log('2. 完成配置后，您可以通过Web界面管理编排和脚本。');
  log('3. 所有数据都安全地存储在您自己的GitHub仓库中。');
  log();
}

/**
 * 显示版本信息
 */
function showVersion() {
  try {
    const packageJson = JSON.parse(readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
    log(`Orchestrator Pro v${packageJson.version}`);
    log(packageJson.description);
  } catch (err) {
    log('Orchestrator Pro v1.0');
  }
}

// 执行主函数
main().catch((err) => {
  error(`程序执行出错: ${err.message}`);
  process.exit(1);
});