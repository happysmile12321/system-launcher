#!/usr/bin/env node

import { execa } from 'execa';

/**
 * 列出所有容器
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
    const { driver = 'docker', all = false } = config;
    
    log.info(`Listing containers using ${driver} driver...`);
    
    // 构建命令
    const args = ['ps'];
    if (all) {
      args.push('-a');
    }
    args.push('--format', 'json');
    
    // 执行命令
    const { stdout } = await execa(driver, args);
    
    // 解析输出
    const containers = stdout.trim().split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          log.warn(`Failed to parse container line: ${line}`);
          return null;
        }
      })
      .filter(container => container !== null);
    
    log.info(`Found ${containers.length} containers`);
    
    // 设置输出
    outputs.containers = JSON.stringify(containers);
    
    // 输出结果
    console.log(JSON.stringify({ outputs }));
    
  } catch (error) {
    log.error(`Failed to list containers: ${error.message}`);
    throw error;
  }
}

main().catch(error => {
  console.error('Container listing failed:', error);
  process.exit(1);
});
