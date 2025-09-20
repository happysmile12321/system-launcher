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
    
    // 构建命令 - 使用更兼容的格式
    const args = ['ps'];
    if (all) {
      args.push('-a');
    }
    args.push('--format', 'table {{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}\t{{.CreatedAt}}');
    
    // 执行命令
    const { stdout } = await execa(driver, args);
    
    // 解析输出
    let containers = [];
    if (stdout.trim()) {
      const lines = stdout.trim().split('\n');
      const header = lines[0]; // 跳过表头
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const parts = line.split('\t');
          if (parts.length >= 6) {
            containers.push({
              ID: parts[0] || '',
              Names: parts[1] || '',
              Image: parts[2] || '',
              Status: parts[3] || '',
              Ports: parts[4] || '',
              CreatedAt: parts[5] || ''
            });
          }
        }
      }
    }
    
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
