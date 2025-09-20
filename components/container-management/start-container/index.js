#!/usr/bin/env node

import { execa } from 'execa';

/**
 * 启动容器
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
    const { containerId, driver = 'docker' } = config;
    
    if (!containerId) {
      throw new Error('Container ID is required');
    }
    
    log.info(`Starting container ${containerId} using ${driver}...`);
    
    // 执行启动命令
    await execa(driver, ['start', containerId]);
    
    log.info(`Container ${containerId} started successfully`);
    
    // 设置输出
    outputs.success = 'true';
    outputs.message = `Container ${containerId} started successfully`;
    
  } catch (error) {
    log.error(`Failed to start container: ${error.message}`);
    outputs.success = 'false';
    outputs.message = `Failed to start container: ${error.message}`;
  }
  
  // 输出结果
  console.log(JSON.stringify({ outputs }));
}

main().catch(error => {
  console.error('Container start failed:', error);
  process.exit(1);
});
