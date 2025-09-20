#!/usr/bin/env node

import { execa } from 'execa';

/**
 * 停止容器
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
    const { containerId, driver = 'docker', timeout = 10 } = config;
    
    if (!containerId) {
      throw new Error('Container ID is required');
    }
    
    log.info(`Stopping container ${containerId} using ${driver}...`);
    
    // 执行停止命令
    await execa(driver, ['stop', '--time', timeout.toString(), containerId]);
    
    log.info(`Container ${containerId} stopped successfully`);
    
    // 设置输出
    outputs.success = 'true';
    outputs.message = `Container ${containerId} stopped successfully`;
    
  } catch (error) {
    log.error(`Failed to stop container: ${error.message}`);
    outputs.success = 'false';
    outputs.message = `Failed to stop container: ${error.message}`;
  }
  
  // 输出结果
  console.log(JSON.stringify({ outputs }));
}

main().catch(error => {
  console.error('Container stop failed:', error);
  process.exit(1);
});
