#!/usr/bin/env node

import { execa } from 'execa';

/**
 * 列出所有镜像
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
    
    log.info(`Listing images using ${driver} driver...`);
    
    // 构建命令 - 使用更兼容的格式
    const args = ['images'];
    if (all) {
      args.push('-a');
    }
    args.push('--format', 'table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.CreatedAt}}\t{{.Size}}');
    
    // 执行命令
    const { stdout } = await execa(driver, args);
    
    // 解析输出
    let images = [];
    if (stdout.trim()) {
      const lines = stdout.trim().split('\n');
      const header = lines[0]; // 跳过表头
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const parts = line.split('\t');
          if (parts.length >= 5) {
            images.push({
              Repository: parts[0] || '<none>',
              Tag: parts[1] || '<none>',
              ID: parts[2] || '',
              CreatedAt: parts[3] || '',
              Size: parts[4] || '0B'
            });
          }
        }
      }
    }
    
    log.info(`Found ${images.length} images`);
    
    // 设置输出
    outputs.images = JSON.stringify(images);
    
  } catch (error) {
    log.error(`Failed to list images: ${error.message}`);
    outputs.images = JSON.stringify([]);
  }
  
  // 输出结果
  console.log(JSON.stringify({ outputs }));
}

main().catch(error => {
  console.error('Image listing failed:', error);
  process.exit(1);
});
