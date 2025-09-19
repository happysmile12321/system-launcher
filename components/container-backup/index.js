import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGzip } from 'zlib';

const execAsync = promisify(exec);

export default async function main(inputs) {
  const {
    containerId,
    backupPath = '/tmp/backups',
    includeVolumes = true,
    includeConfig = true,
    compress = true
  } = inputs;

  try {
    // 确保备份目录存在
    await fs.mkdir(backupPath, { recursive: true });

    // 获取容器信息
    const containerInfo = await getContainerInfo(containerId);
    if (!containerInfo) {
      throw new Error(`容器 ${containerId} 不存在`);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${containerId}-${timestamp}`;
    const backupDir = path.join(backupPath, backupName);
    
    await fs.mkdir(backupDir, { recursive: true });

    // 备份容器配置
    if (includeConfig) {
      await backupContainerConfig(containerId, backupDir);
    }

    // 备份数据卷
    if (includeVolumes) {
      await backupContainerVolumes(containerId, backupDir);
    }

    // 创建备份清单
    await createBackupManifest(containerInfo, backupDir, {
      includeVolumes,
      includeConfig,
      timestamp
    });

    let finalBackupFile;
    let backupSize;

    if (compress) {
      // 压缩整个备份目录
      const tarFile = path.join(backupPath, `${backupName}.tar.gz`);
      await createTarGz(backupDir, tarFile);
      
      // 删除未压缩的目录
      await fs.rm(backupDir, { recursive: true, force: true });
      
      finalBackupFile = tarFile;
    } else {
      finalBackupFile = backupDir;
    }

    // 获取备份文件大小
    const stats = await fs.stat(finalBackupFile);
    backupSize = stats.size;

    return {
      backupFile: finalBackupFile,
      backupSize,
      containerInfo: {
        id: containerInfo.id,
        name: containerInfo.name,
        image: containerInfo.image,
        status: containerInfo.status,
        created: containerInfo.created
      }
    };

  } catch (error) {
    throw new Error(`容器备份失败: ${error.message}`);
  }
}

async function getContainerInfo(containerId) {
  try {
    // 尝试使用docker
    try {
      const { stdout } = await execAsync(`docker inspect ${containerId}`);
      const containers = JSON.parse(stdout);
      if (containers.length > 0) {
        const container = containers[0];
        return {
          id: container.Id,
          name: container.Name.replace('/', ''),
          image: container.Config.Image,
          status: container.State.Status,
          created: container.Created,
          driver: 'docker'
        };
      }
    } catch (dockerError) {
      // 如果docker失败，尝试podman
      try {
        const { stdout } = await execAsync(`podman inspect ${containerId}`);
        const containers = JSON.parse(stdout);
        if (containers.length > 0) {
          const container = containers[0];
          return {
            id: container.Id,
            name: container.Name.replace('/', ''),
            image: container.Config.Image,
            status: container.State.Status,
            created: container.Created,
            driver: 'podman'
          };
        }
      } catch (podmanError) {
        throw new Error('无法获取容器信息，请检查Docker或Podman是否运行');
      }
    }
    
    return null;
  } catch (error) {
    throw new Error(`获取容器信息失败: ${error.message}`);
  }
}

async function backupContainerConfig(containerId, backupDir) {
  try {
    // 导出容器配置
    const configFile = path.join(backupDir, 'container-config.json');
    
    // 尝试docker
    try {
      await execAsync(`docker inspect ${containerId} > "${configFile}"`);
    } catch (dockerError) {
      // 尝试podman
      await execAsync(`podman inspect ${containerId} > "${configFile}"`);
    }
    
    console.log(`容器配置已备份到: ${configFile}`);
  } catch (error) {
    console.warn(`备份容器配置失败: ${error.message}`);
  }
}

async function backupContainerVolumes(containerId, backupDir) {
  try {
    const volumesDir = path.join(backupDir, 'volumes');
    await fs.mkdir(volumesDir, { recursive: true });

    // 获取容器的挂载点信息
    let mounts;
    try {
      const { stdout } = await execAsync(`docker inspect ${containerId} --format='{{json .Mounts}}'`);
      mounts = JSON.parse(stdout);
    } catch (dockerError) {
      try {
        const { stdout } = await execAsync(`podman inspect ${containerId} --format='{{json .Mounts}}'`);
        mounts = JSON.parse(stdout);
      } catch (podmanError) {
        console.warn('无法获取容器挂载点信息');
        return;
      }
    }

    // 备份每个挂载的数据卷
    for (const mount of mounts) {
      if (mount.Type === 'volume' || mount.Type === 'bind') {
        const volumeName = mount.Name || path.basename(mount.Source);
        const volumeBackupDir = path.join(volumesDir, volumeName);
        
        try {
          await fs.mkdir(volumeBackupDir, { recursive: true });
          
          // 复制数据卷内容
          if (mount.Source && await fs.access(mount.Source).then(() => true).catch(() => false)) {
            await copyDirectory(mount.Source, volumeBackupDir);
            console.log(`数据卷 ${volumeName} 已备份`);
          }
        } catch (error) {
          console.warn(`备份数据卷 ${volumeName} 失败: ${error.message}`);
        }
      }
    }
  } catch (error) {
    console.warn(`备份容器数据卷失败: ${error.message}`);
  }
}

async function copyDirectory(src, dest) {
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true });
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function createBackupManifest(containerInfo, backupDir, options) {
  const manifest = {
    container: containerInfo,
    backup: {
      timestamp: options.timestamp,
      includeVolumes: options.includeVolumes,
      includeConfig: options.includeConfig,
      version: '1.0.0'
    }
  };

  const manifestFile = path.join(backupDir, 'backup-manifest.json');
  await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2));
}

async function createTarGz(sourceDir, outputFile) {
  return new Promise((resolve, reject) => {
    const tar = require('tar');
    
    tar.create({
      gzip: true,
      file: outputFile,
      cwd: path.dirname(sourceDir)
    }, [path.basename(sourceDir)])
    .then(() => resolve())
    .catch(reject);
  });
}
