import express from 'express';
import { info, error, success } from '../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import localFSService from '../../services/localFS.js';
import composeGeneratorService from '../../services/composeGeneratorService.js';

const router = express.Router();

// 模拟数据存储（实际项目中应该使用数据库）
let compositions = [
  {
    id: '1',
    name: 'web-stack',
    description: 'Web应用栈',
    content: `version: '3.8'

services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    environment:
      - NGINX_HOST=localhost
      - NGINX_PORT=80
    volumes:
      - ./html:/usr/share/nginx/html
    restart: unless-stopped

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:`,
    status: 'stopped',
    services: [
      { name: 'web', image: 'nginx:latest', ports: '80:80,443:443' },
      { name: 'db', image: 'postgres:13', ports: '5432:5432' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'monitoring-stack',
    description: '监控系统',
    content: `version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped

volumes:
  grafana_data:`,
    status: 'running',
    services: [
      { name: 'prometheus', image: 'prom/prometheus:latest', ports: '9090:9090' },
      { name: 'grafana', image: 'grafana/grafana:latest', ports: '3000:3000' }
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

/**
 * 获取容器组列表
 */
router.get('/', async (req, res) => {
  try {
    info('Getting compositions list');
    
    // 从LocalFS获取容器组列表
    const localFSCompositions = await localFSService.listCompositions();
    
    // 转换为前端需要的格式
    const formattedCompositions = localFSCompositions.map(comp => ({
      id: comp.compositionName,
      name: comp.compositionName,
      description: 'Docker Compose项目',
      content: '', // 可以从文件读取
      status: 'stopped', // 可以从Docker状态获取
      services: [], // 可以从compose文件解析
      createdAt: comp.stats?.infra?.modified || new Date().toISOString(),
      updatedAt: comp.stats?.infra?.modified || new Date().toISOString()
    }));
    
    res.json({
      success: true,
      data: formattedCompositions
    });
  } catch (err) {
    error(`Failed to get compositions: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 创建容器组
 */
router.post('/', async (req, res) => {
  try {
    const { name, content, description, formData } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: '名称不能为空'
      });
    }

    let result;
    
    if (formData) {
      // 使用表单数据创建容器组
      result = await composeGeneratorService.generateComposeFromForm(formData, name);
    } else if (content) {
      // 使用YAML内容创建容器组
      const structure = await localFSService.createCompositionStructure(name);
      const composeFilePath = await localFSService.saveComposeFile(name, content);
      
      result = {
        compositionName: name,
        composeConfig: null,
        yamlContent: content,
        composeFilePath,
        structure,
        services: []
      };
    } else {
      return res.status(400).json({
        success: false,
        error: '内容或表单数据不能为空'
      });
    }
    
    success(`Created composition: ${name}`);
    
    res.json({
      success: true,
      data: {
        id: result.compositionName,
        name: result.compositionName,
        description: description || 'Docker Compose项目',
        content: result.yamlContent,
        status: 'stopped',
        services: result.services,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    error(`Failed to create composition: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 获取单个容器组
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 从LocalFS获取容器组结构
    const structure = await localFSService.getCompositionStructure(id);
    
    // 读取Compose文件内容
    let content = '';
    try {
      content = await localFSService.readComposeFile(id);
    } catch (err) {
      // Compose文件不存在，使用空内容
      content = '';
    }
    
    const composition = {
      id: structure.compositionName,
      name: structure.compositionName,
      description: 'Docker Compose项目',
      content,
      status: 'stopped', // 可以从Docker状态获取
      services: [], // 可以从compose文件解析
      createdAt: structure.stats?.infra?.modified || new Date().toISOString(),
      updatedAt: structure.stats?.infra?.modified || new Date().toISOString()
    };

    res.json({
      success: true,
      data: composition
    });
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: '容器组不存在'
      });
    }
    error(`Failed to get composition: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 更新容器组
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, content, description } = req.body;
    
    const compositionIndex = compositions.findIndex(c => c.id === id);
    
    if (compositionIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '容器组不存在'
      });
    }

    // 解析服务信息
    const services = parseServicesFromYaml(content);
    
    compositions[compositionIndex] = {
      ...compositions[compositionIndex],
      name: name || compositions[compositionIndex].name,
      content: content || compositions[compositionIndex].content,
      description: description || compositions[compositionIndex].description,
      services,
      updatedAt: new Date().toISOString()
    };

    success(`Updated composition: ${id}`);
    
    res.json({
      success: true,
      data: compositions[compositionIndex]
    });
  } catch (err) {
    error(`Failed to update composition: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 删除容器组
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 从LocalFS删除容器组
    await localFSService.deleteComposition(id);
    
    success(`Deleted composition: ${id}`);
    
    res.json({
      success: true,
      message: '容器组删除成功'
    });
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: '容器组不存在'
      });
    }
    error(`Failed to delete composition: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 验证容器组配置
 */
router.post('/:id/validate', async (req, res) => {
  try {
    const { id } = req.params;
    const composition = compositions.find(c => c.id === id);
    
    if (!composition) {
      return res.status(404).json({
        success: false,
        error: '容器组不存在'
      });
    }

    // 简单的YAML验证
    const validationResult = validateYaml(composition.content);
    
    if (validationResult.valid) {
      success(`Composition ${id} validation passed`);
      res.json({
        success: true,
        message: '配置验证通过'
      });
    } else {
      res.json({
        success: false,
        error: validationResult.error
      });
    }
  } catch (err) {
    error(`Failed to validate composition: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 部署容器组
 */
router.post('/:id/deploy', async (req, res) => {
  try {
    const { id } = req.params;
    const composition = compositions.find(c => c.id === id);
    
    if (!composition) {
      return res.status(404).json({
        success: false,
        error: '容器组不存在'
      });
    }

    // 这里应该调用实际的Docker Compose部署逻辑
    // 现在只是模拟部署过程
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 更新状态
    composition.status = 'running';
    composition.updatedAt = new Date().toISOString();
    
    success(`Deployed composition: ${composition.name}`);
    
    res.json({
      success: true,
      message: '部署成功',
      data: {
        output: `Successfully deployed ${composition.name}\nServices started: ${composition.services.map(s => s.name).join(', ')}`
      }
    });
  } catch (err) {
    error(`Failed to deploy composition: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 停止容器组
 */
router.post('/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    const composition = compositions.find(c => c.id === id);
    
    if (!composition) {
      return res.status(404).json({
        success: false,
        error: '容器组不存在'
      });
    }

    // 这里应该调用实际的Docker Compose停止逻辑
    // 现在只是模拟停止过程
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 更新状态
    composition.status = 'stopped';
    composition.updatedAt = new Date().toISOString();
    
    success(`Stopped composition: ${composition.name}`);
    
    res.json({
      success: true,
      message: '停止成功',
      data: {
        output: `Successfully stopped ${composition.name}\nServices stopped: ${composition.services.map(s => s.name).join(', ')}`
      }
    });
  } catch (err) {
    error(`Failed to stop composition: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 从YAML内容解析服务信息
 */
function parseServicesFromYaml(content) {
  try {
    const services = [];
    const lines = content.split('\n');
    let currentService = null;
    let inServices = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed === 'services:') {
        inServices = true;
        continue;
      }
      
      if (inServices && trimmed && !trimmed.startsWith(' ') && !trimmed.startsWith('-') && trimmed.endsWith(':')) {
        if (currentService) {
          services.push(currentService);
        }
        currentService = {
          name: trimmed.slice(0, -1).trim(),
          image: '',
          ports: ''
        };
      } else if (currentService && trimmed.startsWith('image:')) {
        currentService.image = trimmed.replace('image:', '').trim();
      } else if (currentService && trimmed.startsWith('ports:')) {
        // 处理端口配置
        const portLines = [];
        let i = lines.indexOf(line) + 1;
        while (i < lines.length && lines[i].startsWith('  ')) {
          const portLine = lines[i].trim();
          if (portLine.startsWith('-')) {
            portLines.push(portLine.replace('-', '').replace(/"/g, '').trim());
          }
          i++;
        }
        currentService.ports = portLines.join(',');
      }
    }
    
    if (currentService) {
      services.push(currentService);
    }
    
    return services;
  } catch (err) {
    error(`Failed to parse services from YAML: ${err.message}`);
    return [];
  }
}

/**
 * 验证YAML配置
 */
function validateYaml(content) {
  try {
    if (!content.trim()) {
      return { valid: false, error: '配置不能为空' };
    }
    
    if (!content.includes('services:')) {
      return { valid: false, error: '配置必须包含 services 部分' };
    }
    
    if (!content.includes('version:')) {
      return { valid: false, error: '配置必须包含 version 部分' };
    }
    
    return { valid: true };
  } catch (err) {
    return { valid: false, error: `配置格式错误: ${err.message}` };
  }
}

export default router;
