#!/usr/bin/env node

import { execa } from 'execa';

/**
 * 执行docker-compose命令
 * V3.0: 通过官方组件替代Docker API
 */
async function main() {
  const inputs = process.env.inputs;
  const outputs = {};
  
  // 创建简单的日志函数
  const log = {
    info: (msg) => console.log(`[INFO] ${msg}`),
    warn: (msg) => console.warn(`[WARN] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`)
  };
  
  try {
    const config = inputs ? JSON.parse(inputs) : {};
    const { command, file = 'docker-compose.yml', projectName, detached = true } = config;
    
    if (!command) {
      throw new Error('Command is required');
    }
    
    log.info(`Executing docker-compose ${command}...`);
    
    // 构建命令参数
    const args = ['-f', file];
    
    if (projectName) {
      args.push('-p', projectName);
    }
    
    args.push(command);
    
    // 根据命令类型添加额外参数
    if (command === 'up' && detached) {
      args.push('-d');
    }
    
    // 执行命令
    const { stdout, stderr } = await execa('docker-compose', args);
    
    log.info(`Docker-compose ${command} completed successfully`);
    
    // 设置输出
    outputs.success = 'true';
    outputs.output = stdout || stderr || '';
    
  } catch (error) {
    log.error(`Failed to execute docker-compose: ${error.message}`);
    outputs.success = 'false';
    outputs.output = error.message;
  }
  
  // 输出结果
  console.log(JSON.stringify({ outputs }));
}

main().catch(error => {
  console.error('Docker-compose execution failed:', error);
  process.exit(1);
});
