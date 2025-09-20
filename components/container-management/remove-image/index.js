#!/usr/bin/env node

import { execa } from 'execa';

/**
 * 删除镜像
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
    const { imageId, driver = 'docker', force = false } = config;
    
    if (!imageId) {
      throw new Error('Image ID is required');
    }
    
    log.info(`Removing image ${imageId} using ${driver}...`);
    
    // 构建删除命令
    const args = ['rmi'];
    if (force) {
      args.push('-f');
    }
    args.push(imageId);
    
    // 执行删除命令
    await execa(driver, args);
    
    log.info(`Image ${imageId} removed successfully`);
    
    // 设置输出
    outputs.success = 'true';
    outputs.message = `Image ${imageId} removed successfully`;
    
  } catch (error) {
    log.error(`Failed to remove image: ${error.message}`);
    outputs.success = 'false';
    outputs.message = `Failed to remove image: ${error.message}`;
  }
  
  // 输出结果
  console.log(JSON.stringify({ outputs }));
}

main().catch(error => {
  console.error('Image removal failed:', error);
  process.exit(1);
});
