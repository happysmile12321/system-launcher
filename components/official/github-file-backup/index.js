// GitHubFileBackup 组件 - 备份GitHub仓库中的文件

/**
 * 格式化时间戳
 */
function formatTimestamp(format) {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  let formatted = format;
  formatted = formatted.replace('YYYY', year);
  formatted = formatted.replace('MM', month);
  formatted = formatted.replace('DD', day);
  formatted = formatted.replace('HH', hours);
  formatted = formatted.replace('mm', minutes);
  formatted = formatted.replace('ss', seconds);
  
  return formatted;
}

/**
 * 生成带时间戳的文件名
 */
function generateBackupFileName(originalPath, includeTimestamp, timestampFormat) {
  const path = require('path');
  const baseName = path.basename(originalPath);
  const dirName = path.dirname(originalPath);
  const extName = path.extname(baseName);
  const nameWithoutExt = path.basename(baseName, extName);
  
  if (includeTimestamp) {
    const timestamp = formatTimestamp(timestampFormat);
    return `${nameWithoutExt}_${timestamp}${extName}`;
  }
  
  return baseName;
}

/**
 * 组件主函数
 */
async function component(context) {
  const {
    inputs,
    log,
    context: globalContext
  } = context;
  
  try {
    // 验证输入参数
    const {
      sourceFilePath,
      targetDirPath,
      includeTimestamp = true,
      timestampFormat = 'YYYYMMDD_HHmmss'
    } = inputs;
    
    if (!sourceFilePath) {
      throw new Error('源文件路径不能为空');
    }
    
    if (!targetDirPath) {
      throw new Error('目标目录路径不能为空');
    }
    
    log.info(`准备备份文件: ${sourceFilePath} -> ${targetDirPath}`);
    
    // 获取GitFS实例
    const GitFS = (await import('../../core/gitfs.js')).default;
    const getConfig = (await import('../../services/configService.js')).getConfig;
    
    const config = getConfig();
    if (!config) {
      throw new Error('应用未配置，请先完成初始化');
    }
    
    const gitfs = new GitFS(config);
    
    // 读取源文件
    log.info(`正在读取源文件: ${sourceFilePath}`);
    const sourceFile = await gitfs.readFile(sourceFilePath);
    
    if (!sourceFile) {
      throw new Error(`源文件不存在: ${sourceFilePath}`);
    }
    
    // 生成备份文件名
    const backupFileName = generateBackupFileName(sourceFilePath, includeTimestamp, timestampFormat);
    const backupFilePath = `${targetDirPath}/${backupFileName}`;
    
    // 确保目标目录存在
    log.info(`正在检查目标目录: ${targetDirPath}`);
    try {
      await gitfs.createDirectory(targetDirPath);
    } catch (err) {
      // 目录可能已存在，继续执行
      log.info(`目标目录已存在或创建失败，尝试直接写入文件`);
    }
    
    // 写入备份文件
    log.info(`正在写入备份文件: ${backupFilePath}`);
    await gitfs.writeFile(
      backupFilePath,
      sourceFile.content,
      `Backup file: ${sourceFilePath} -> ${backupFilePath}`
    );
    
    // 获取文件大小
    const fileSize = Buffer.byteLength(sourceFile.content, 'utf-8');
    
    log.success(`文件备份成功: ${backupFilePath} (${fileSize} 字节)`);
    
    // 设置输出
    context.outputs = {
      isSuccess: true,
      backupFilePath,
      fileSize
    };
    
    return {
      isSuccess: true,
      backupFilePath,
      fileSize
    };
  } catch (error) {
    log.error(`组件执行失败: ${error.message}`);
    
    // 设置错误输出
    context.outputs = {
      isSuccess: false,
      backupFilePath: null,
      fileSize: 0,
      error: error.message
    };
    
    return {
      isSuccess: false,
      backupFilePath: null,
      fileSize: 0,
      error: error.message
    };
  }
}

// 导出组件函数
component;