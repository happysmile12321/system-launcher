#!/usr/bin/env node

import { execa } from 'execa';

/**
 * 获取容器日志
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
    const { containerId, driver = 'docker', tail = 100, follow = false } = config;
    
    if (!containerId) {
      throw new Error('Container ID is required');
    }
    
    log.info(`Getting logs for container ${containerId} using ${driver}...`);
    
    // 构建日志命令
    const args = ['logs'];
    if (tail) {
      args.push('--tail', tail.toString());
    }
    if (follow) {
      args.push('-f');
    }
    args.push(containerId);
    
    // 执行日志命令
    const { stdout } = await execa(driver, args);
    
    log.info(`Successfully retrieved logs for container ${containerId}`);
    
    // 设置输出
    outputs.logs = stdout;
    
  } catch (error) {
    log.error(`Failed to get container logs: ${error.message}`);
    outputs.logs = `Error: ${error.message}`;
  }
  
  // 输出结果
  console.log(JSON.stringify({ outputs }));
}

main().catch(error => {
  console.error('Container logs retrieval failed:', error);
  process.exit(1);
});
