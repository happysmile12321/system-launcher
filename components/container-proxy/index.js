#!/usr/bin/env node

import { execa } from 'execa';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 容器反向代理组件
 * V3.1: 将HTTP请求代理到Docker网络内部的容器服务
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
    const {
      compositionName,
      serviceName,
      targetPort,
      method = 'GET',
      path = '/',
      headers = {},
      body = '',
      timeout = 30000,
      followRedirects = true
    } = config;
    
    if (!compositionName) {
      throw new Error('Composition name is required');
    }
    
    if (!serviceName) {
      throw new Error('Service name is required');
    }
    
    if (!targetPort || typeof targetPort !== 'number') {
      throw new Error('Target port is required and must be a number');
    }
    
    log.info(`Proxying ${method} request to ${serviceName}:${targetPort}${path}`);
    
    const startTime = Date.now();
    
    // 构建目标URL
    const targetUrl = `http://${serviceName}:${targetPort}${path}`;
    
    // 检查容器是否运行
    const isRunning = await checkContainerRunning(compositionName, serviceName);
    if (!isRunning) {
      throw new Error(`Service ${serviceName} in composition ${compositionName} is not running`);
    }
    
    // 使用curl发送HTTP请求
    const curlCommand = buildCurlCommand(targetUrl, method, headers, body, timeout, followRedirects);
    
    log.info(`Executing curl command: ${curlCommand}`);
    
    const { stdout, stderr } = await execAsync(curlCommand);
    
    const duration = Date.now() - startTime;
    
    // 解析响应
    const response = parseCurlResponse(stdout, stderr);
    
    log.info(`Request completed in ${duration}ms with status ${response.statusCode}`);
    
    // 设置输出
    outputs.success = response.success;
    outputs.statusCode = response.statusCode;
    outputs.headers = response.headers;
    outputs.body = response.body;
    outputs.error = response.error || '';
    outputs.duration = duration;
    
  } catch (error) {
    log.error(`Container proxy failed: ${error.message}`);
    outputs.success = false;
    outputs.statusCode = 0;
    outputs.headers = {};
    outputs.body = '';
    outputs.error = error.message;
    outputs.duration = 0;
  }
  
  // 输出结果
  console.log(JSON.stringify({ outputs }));
}

/**
 * 检查容器是否运行
 * @param {string} compositionName - 容器组名称
 * @param {string} serviceName - 服务名称
 * @returns {Promise<boolean>} - 是否运行
 */
async function checkContainerRunning(compositionName, serviceName) {
  try {
    // 查找容器组中的服务容器
    const containerName = `${compositionName}_${serviceName}`;
    const { stdout } = await execAsync(`docker ps --filter "name=${containerName}" --format "{{.Names}}"`);
    
    return stdout.trim() === containerName;
  } catch (error) {
    console.warn(`Failed to check container status: ${error.message}`);
    return false;
  }
}

/**
 * 构建curl命令
 * @param {string} url - 目标URL
 * @param {string} method - HTTP方法
 * @param {Object} headers - 请求头
 * @param {string} body - 请求体
 * @param {number} timeout - 超时时间
 * @param {boolean} followRedirects - 是否跟随重定向
 * @returns {string} - curl命令
 */
function buildCurlCommand(url, method, headers, body, timeout, followRedirects) {
  let command = `curl -s -w "\\n%{http_code}\\n%{time_total}\\n"`;
  
  // 设置HTTP方法
  if (method !== 'GET') {
    command += ` -X ${method}`;
  }
  
  // 设置请求头
  Object.entries(headers).forEach(([key, value]) => {
    command += ` -H "${key}: ${value}"`;
  });
  
  // 设置请求体
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    command += ` -d '${body}'`;
  }
  
  // 设置超时
  command += ` --max-time ${Math.floor(timeout / 1000)}`;
  
  // 设置重定向
  if (followRedirects) {
    command += ' -L';
  } else {
    command += ' --max-redirs 0';
  }
  
  // 添加URL
  command += ` "${url}"`;
  
  return command;
}

/**
 * 解析curl响应
 * @param {string} stdout - 标准输出
 * @param {string} stderr - 标准错误
 * @returns {Object} - 解析后的响应
 */
function parseCurlResponse(stdout, stderr) {
  try {
    const lines = stdout.split('\n');
    
    // curl的-w选项会在最后添加状态码和时间
    const statusCode = parseInt(lines[lines.length - 3]) || 0;
    const timeTotal = parseFloat(lines[lines.length - 2]) || 0;
    
    // 响应体是除了最后两行之外的所有内容
    const body = lines.slice(0, -3).join('\n');
    
    // 简单的响应头解析（实际项目中可能需要更复杂的解析）
    const headers = {};
    
    // 检查是否有错误
    const hasError = stderr && stderr.trim().length > 0;
    
    return {
      success: statusCode >= 200 && statusCode < 400 && !hasError,
      statusCode,
      headers,
      body,
      error: hasError ? stderr : null
    };
  } catch (error) {
    return {
      success: false,
      statusCode: 0,
      headers: {},
      body: '',
      error: error.message
    };
  }
}

/**
 * 使用Docker网络内部通信
 * @param {string} compositionName - 容器组名称
 * @param {string} serviceName - 服务名称
 * @param {string} targetPort - 目标端口
 * @param {string} path - 请求路径
 * @returns {Promise<Object>} - 响应结果
 */
async function proxyToContainer(compositionName, serviceName, targetPort, path) {
  try {
    // 获取容器组网络
    const networkName = `${compositionName}_default`;
    
    // 使用docker exec在容器组网络内执行curl
    const curlCommand = `curl -s -w "\\n%{http_code}\\n%{time_total}\\n" http://${serviceName}:${targetPort}${path}`;
    const dockerCommand = `docker run --rm --network ${networkName} curlimages/curl:latest ${curlCommand}`;
    
    const { stdout, stderr } = await execAsync(dockerCommand);
    
    return parseCurlResponse(stdout, stderr);
  } catch (error) {
    throw new Error(`Failed to proxy to container: ${error.message}`);
  }
}

/**
 * 验证服务可达性
 * @param {string} compositionName - 容器组名称
 * @param {string} serviceName - 服务名称
 * @param {number} targetPort - 目标端口
 * @returns {Promise<boolean>} - 是否可达
 */
async function validateServiceReachability(compositionName, serviceName, targetPort) {
  try {
    // 使用docker exec检查服务是否可达
    const networkName = `${compositionName}_default`;
    const testCommand = `docker run --rm --network ${networkName} curlimages/curl:latest curl -s -o /dev/null -w "%{http_code}" http://${serviceName}:${targetPort}/`;
    
    const { stdout } = await execAsync(testCommand);
    const statusCode = parseInt(stdout.trim());
    
    return statusCode >= 200 && statusCode < 500;
  } catch (error) {
    console.warn(`Service reachability check failed: ${error.message}`);
    return false;
  }
}

main().catch(error => {
  console.error('Container proxy execution failed:', error);
  process.exit(1);
});
