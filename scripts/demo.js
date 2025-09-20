#!/usr/bin/env node

import chalk from 'chalk';
import { execa } from 'execa';

/**
 * Orchestrator Pro 演示脚本
 * 展示项目的核心功能
 */

const colors = {
  primary: chalk.hex('#0ea5e9'),
  success: chalk.hex('#10b981'),
  warning: chalk.hex('#f59e0b'),
  error: chalk.hex('#ef4444'),
  info: chalk.hex('#6b7280'),
  accent: chalk.hex('#8b5cf6')
};

function printHeader() {
  console.log(colors.primary(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  🚀 Orchestrator Pro - 下一代智能系统编排平台                ║
║                                                              ║
║  🎯 架构收敛 · 核心服务精通 · 组件化驱动                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`));
}

function printSection(title, content) {
  console.log(colors.accent(`\n📋 ${title}`));
  console.log(colors.info('─'.repeat(50)));
  console.log(content);
}

function printFeature(name, description, status = '✅') {
  console.log(`${status} ${colors.primary(name)}: ${colors.info(description)}`);
}

async function checkDependencies() {
  printSection('环境检查', '检查系统依赖和配置...');
  
  try {
    // 检查Node.js版本
    const { stdout: nodeVersion } = await execa('node', ['--version']);
    printFeature('Node.js', nodeVersion.trim());
    
    // 检查npm版本
    const { stdout: npmVersion } = await execa('npm', ['--version']);
    printFeature('npm', npmVersion.trim());
    
    // 检查Docker
    try {
      const { stdout: dockerVersion } = await execa('docker', ['--version']);
      printFeature('Docker', dockerVersion.trim());
    } catch {
      printFeature('Docker', '未安装 (可选)', '⚠️');
    }
    
    // 检查Git
    try {
      const { stdout: gitVersion } = await execa('git', ['--version']);
      printFeature('Git', gitVersion.trim());
    } catch {
      printFeature('Git', '未安装', '❌');
    }
    
  } catch (error) {
    console.log(colors.error(`❌ 环境检查失败: ${error.message}`));
  }
}

function showFeatures() {
  printSection('核心功能', 'Orchestrator Pro 的主要特性:');
  
  const features = [
    ['🎨 可视化工作流设计器', '拖拽式设计，实时预览，版本控制'],
    ['🐳 容器管理', '对标Docker Desktop，完整的容器生命周期管理'],
    ['⚡ 智能触发器', '定时、Webhook、手动、系统事件触发器'],
    ['🧩 组件生态', '官方组件 + 用户自定义组件'],
    ['🔧 系统服务', '容器管理、备份管理、飞书集成'],
    ['📊 实时监控', '工作流执行状态和系统资源监控'],
    ['🔄 自动化', 'GitFS集成的配置管理和部署'],
    ['🛡️ 安全可靠', '企业级权限控制和数据保护']
  ];
  
  features.forEach(([name, desc]) => {
    printFeature(name, desc);
  });
}

function showArchitecture() {
  printSection('技术架构', '现代化的技术栈和架构设计:');
  
  const techStack = [
    ['前端', 'Vue 3 + Vite + Tailwind CSS + Vue Router'],
    ['后端', 'Node.js + Express.js + ES Modules'],
    ['容器', 'Docker SDK + execa + 组件化执行'],
    ['存储', 'GitFS + 飞书云盘 + 本地文件系统'],
    ['构建', 'Vite + PostCSS + 热重载开发'],
    ['部署', 'GitHub Actions + 自动化CI/CD']
  ];
  
  techStack.forEach(([layer, tech]) => {
    printFeature(layer, tech);
  });
}

async function showQuickStart() {
  printSection('快速开始', '几个简单步骤即可开始使用:');
  
  const steps = [
    '1. 克隆仓库: git clone https://github.com/your-username/orchestrator-pro.git',
    '2. 安装依赖: npm install',
    '3. 配置环境: cp .env.example .env',
    '4. 构建前端: npm run web:build',
    '5. 启动服务: npm start',
    '6. 访问界面: http://localhost:3000'
  ];
  
  steps.forEach(step => {
    console.log(colors.info(`   ${step}`));
  });
}

function showDemo() {
  printSection('功能演示', '体验Orchestrator Pro的强大功能:');
  
  console.log(colors.primary('🎯 工作流设计:'));
  console.log(colors.info('   • 拖拽组件到设计器'));
  console.log(colors.info('   • 配置组件参数'));
  console.log(colors.info('   • 实时预览和测试'));
  
  console.log(colors.primary('\n🐳 容器管理:'));
  console.log(colors.info('   • 查看容器列表和状态'));
  console.log(colors.info('   • 启动/停止/重启容器'));
  console.log(colors.info('   • 查看容器日志'));
  console.log(colors.info('   • Docker Compose可视化编辑'));
  
  console.log(colors.primary('\n⚡ 智能触发:'));
  console.log(colors.info('   • 定时任务 (Cron表达式)'));
  console.log(colors.info('   • Webhook触发器'));
  console.log(colors.info('   • 手动触发器'));
  console.log(colors.info('   • 系统事件触发器'));
}

function showContributing() {
  printSection('贡献指南', '加入我们的开源社区:');
  
  console.log(colors.primary('🤝 贡献方式:'));
  console.log(colors.info('   • Fork 仓库并创建特性分支'));
  console.log(colors.info('   • 提交代码并创建 Pull Request'));
  console.log(colors.info('   • 报告 Bug 和功能建议'));
  console.log(colors.info('   • 完善文档和示例'));
  
  console.log(colors.primary('\n📚 文档资源:'));
  console.log(colors.info('   • 完整文档: https://t1zosp7g1k7.feishu.cn/docx/QNN6dcEefohapsxmpMTcBnusnkf'));
  console.log(colors.info('   • API文档: docs/api.md'));
  console.log(colors.info('   • 组件开发: docs/component-development.md'));
}

function showFooter() {
  console.log(colors.primary(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  ⭐ 如果这个项目对您有帮助，请给我们一个Star！                ║
║                                                              ║
║  🚀 让系统编排变得简单而优雅！                                ║
║                                                              ║
║  GitHub: https://github.com/your-username/orchestrator-pro   ║
║  文档: https://t1zosp7g1k7.feishu.cn/docx/QNN6dcEefohapsxmpMTcBnusnkf ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`));
}

async function main() {
  printHeader();
  
  await checkDependencies();
  showFeatures();
  showArchitecture();
  await showQuickStart();
  showDemo();
  showContributing();
  showFooter();
  
  console.log(colors.success('\n🎉 演示完成！开始您的Orchestrator Pro之旅吧！'));
}

// 运行演示
main().catch(error => {
  console.error(colors.error(`演示脚本执行失败: ${error.message}`));
  process.exit(1);
});
