#!/usr/bin/env node

import { execa } from 'execa';

/**
 * 删除容器
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
    const { containerId, driver = 'docker', force = false } = config;
    
    if (!containerId) {
      throw new Error('Container ID is required');
    }
    
    log.info(`Removing container ${containerId} using ${driver}...`);
    
    // 构建删除命令
    const args = ['rm'];
    if (force) {
      args.push('-f');
    }
    args.push(containerId);
    
    // 执行删除命令
    await execa(driver, args);
    
    log.info(`Container ${containerId} removed successfully`);
    
    // 设置输出
    outputs.success = 'true';
    outputs.message = `Container ${containerId} removed successfully`;
    
  } catch (error) {
    log.error(`Failed to remove container: ${error.message}`);
    outputs.success = 'false';
    outputs.message = `Failed to remove container: ${error.message}`;
  }
  
  // 输出结果
  console.log(JSON.stringify({ outputs }));
}

main().catch(error => {
  console.error('Container removal failed:', error);
  process.exit(1);
});
