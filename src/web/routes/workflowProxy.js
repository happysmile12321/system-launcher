import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { info, success, error, warning } from '../../utils/logger.js';
import { createWorkflow, saveWorkflow } from '../../services/workflowService.js';
import { createTrigger } from '../../services/triggerService.js';

const router = express.Router();

/**
 * 一键创建工作流代理
 * V3.1: 自动创建Webhook触发器和工作流，实现容器服务代理
 */
router.post('/create-proxy', async (req, res) => {
  try {
    const {
      compositionName,
      serviceName,
      targetPort,
      proxyName,
      description,
      method = 'GET',
      path = '/',
      headers = {},
      timeout = 30000
    } = req.body;

    // 验证必需参数
    if (!compositionName || !serviceName || !targetPort || !proxyName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: compositionName, serviceName, targetPort, proxyName'
      });
    }

    info(`Creating workflow proxy for ${compositionName}/${serviceName}:${targetPort}`);

    // 生成唯一的代理ID
    const proxyId = `proxy-${compositionName}-${serviceName}-${targetPort}-${Date.now()}`;
    
    // 1. 创建工作流
    const workflow = await createWorkflow({
      name: proxyName,
      description: description || `Proxy for ${compositionName}/${serviceName}:${targetPort}`,
      steps: [
        {
          id: uuidv4(),
          type: 'component',
          component: 'local:container-proxy',
          name: 'Container Proxy',
          inputs: {
            compositionName,
            serviceName,
            targetPort: parseInt(targetPort),
            method,
            path,
            headers,
            timeout: parseInt(timeout)
          },
          outputs: {},
          position: { x: 100, y: 100 }
        }
      ],
      metadata: {
        proxyId,
        compositionName,
        serviceName,
        targetPort,
        createdAt: new Date().toISOString(),
        type: 'container-proxy'
      }
    });

    // 2. 创建Webhook触发器
    const trigger = await createTrigger({
      name: `${proxyName} Webhook`,
      type: 'webhook',
      workflowId: workflow.id,
      config: {
        path: `/proxy/${proxyId}`,
        method: 'POST',
        description: `Webhook proxy for ${compositionName}/${serviceName}`,
        headers: {
          'Content-Type': 'application/json'
        }
      },
      enabled: true
    });

    // 3. 生成代理URL
    const proxyUrl = `${req.protocol}://${req.get('host')}/api/webhook/proxy/${proxyId}`;

    success(`Created workflow proxy: ${proxyName} (${proxyId})`);

    res.json({
      success: true,
      data: {
        proxyId,
        proxyName,
        workflowId: workflow.id,
        triggerId: trigger.id,
        proxyUrl,
        compositionName,
        serviceName,
        targetPort,
        method,
        path,
        createdAt: new Date().toISOString()
      },
      message: `Workflow proxy created successfully: ${proxyName}`
    });

  } catch (err) {
    error(`Failed to create workflow proxy: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 获取所有工作流代理
 */
router.get('/proxies', async (req, res) => {
  try {
    const { listWorkflows } = await import('../../services/workflowService.js');
    const workflows = await listWorkflows();
    
    // 过滤出代理类型的工作流
    const proxies = workflows.filter(workflow => 
      workflow.metadata && workflow.metadata.type === 'container-proxy'
    ).map(workflow => ({
      proxyId: workflow.metadata.proxyId,
      proxyName: workflow.name,
      workflowId: workflow.id,
      compositionName: workflow.metadata.compositionName,
      serviceName: workflow.metadata.serviceName,
      targetPort: workflow.metadata.targetPort,
      createdAt: workflow.metadata.createdAt,
      description: workflow.description
    }));

    res.json({
      success: true,
      data: proxies
    });

  } catch (err) {
    error(`Failed to get workflow proxies: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 获取单个工作流代理
 */
router.get('/proxies/:proxyId', async (req, res) => {
  try {
    const { proxyId } = req.params;
    const { listWorkflows } = await import('../../services/workflowService.js');
    const workflows = await listWorkflows();
    
    const workflow = workflows.find(w => 
      w.metadata && w.metadata.proxyId === proxyId
    );

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow proxy not found'
      });
    }

    // 获取关联的触发器
    const { listTriggers } = await import('../../services/triggerService.js');
    const triggers = await listTriggers();
    const trigger = triggers.find(t => t.workflowId === workflow.id);

    res.json({
      success: true,
      data: {
        proxyId: workflow.metadata.proxyId,
        proxyName: workflow.name,
        workflowId: workflow.id,
        triggerId: trigger?.id,
        compositionName: workflow.metadata.compositionName,
        serviceName: workflow.metadata.serviceName,
        targetPort: workflow.metadata.targetPort,
        createdAt: workflow.metadata.createdAt,
        description: workflow.description,
        trigger: trigger ? {
          id: trigger.id,
          name: trigger.name,
          type: trigger.type,
          config: trigger.config,
          enabled: trigger.enabled
        } : null
      }
    });

  } catch (err) {
    error(`Failed to get workflow proxy: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 更新工作流代理
 */
router.put('/proxies/:proxyId', async (req, res) => {
  try {
    const { proxyId } = req.params;
    const {
      proxyName,
      description,
      method,
      path,
      headers,
      timeout,
      enabled
    } = req.body;

    const { listWorkflows, getWorkflow, saveWorkflow } = await import('../../services/workflowService.js');
    const workflows = await listWorkflows();
    
    const workflow = workflows.find(w => 
      w.metadata && w.metadata.proxyId === proxyId
    );

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow proxy not found'
      });
    }

    // 更新工作流
    const updatedWorkflow = {
      ...workflow,
      name: proxyName || workflow.name,
      description: description || workflow.description
    };

    // 更新代理步骤的输入参数
    if (method || path || headers || timeout) {
      updatedWorkflow.steps = workflow.steps.map(step => {
        if (step.component === 'local:container-proxy') {
          return {
            ...step,
            inputs: {
              ...step.inputs,
              ...(method && { method }),
              ...(path && { path }),
              ...(headers && { headers }),
              ...(timeout && { timeout: parseInt(timeout) })
            }
          };
        }
        return step;
      });
    }

    await saveWorkflow(updatedWorkflow);

    // 更新触发器状态
    if (enabled !== undefined) {
      const { listTriggers, updateTrigger } = await import('../../services/triggerService.js');
      const triggers = await listTriggers();
      const trigger = triggers.find(t => t.workflowId === workflow.id);
      
      if (trigger) {
        await updateTrigger(trigger.id, { enabled });
      }
    }

    success(`Updated workflow proxy: ${proxyId}`);

    res.json({
      success: true,
      data: {
        proxyId,
        proxyName: updatedWorkflow.name,
        workflowId: updatedWorkflow.id,
        compositionName: workflow.metadata.compositionName,
        serviceName: workflow.metadata.serviceName,
        targetPort: workflow.metadata.targetPort,
        updatedAt: new Date().toISOString()
      },
      message: 'Workflow proxy updated successfully'
    });

  } catch (err) {
    error(`Failed to update workflow proxy: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 删除工作流代理
 */
router.delete('/proxies/:proxyId', async (req, res) => {
  try {
    const { proxyId } = req.params;
    const { listWorkflows, deleteWorkflow } = await import('../../services/workflowService.js');
    const workflows = await listWorkflows();
    
    const workflow = workflows.find(w => 
      w.metadata && w.metadata.proxyId === proxyId
    );

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow proxy not found'
      });
    }

    // 删除关联的触发器
    const { listTriggers, deleteTrigger } = await import('../../services/triggerService.js');
    const triggers = await listTriggers();
    const trigger = triggers.find(t => t.workflowId === workflow.id);
    
    if (trigger) {
      await deleteTrigger(trigger.id);
    }

    // 删除工作流
    await deleteWorkflow(workflow.id);

    success(`Deleted workflow proxy: ${proxyId}`);

    res.json({
      success: true,
      message: 'Workflow proxy deleted successfully'
    });

  } catch (err) {
    error(`Failed to delete workflow proxy: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 测试工作流代理
 */
router.post('/proxies/:proxyId/test', async (req, res) => {
  try {
    const { proxyId } = req.params;
    const { testData = {} } = req.body;

    const { listWorkflows } = await import('../../services/workflowService.js');
    const workflows = await listWorkflows();
    
    const workflow = workflows.find(w => 
      w.metadata && w.metadata.proxyId === proxyId
    );

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow proxy not found'
      });
    }

    // 执行工作流测试
    const { executeWorkflow } = await import('../../services/workflowService.js');
    const result = await executeWorkflow(workflow.id, testData);

    res.json({
      success: true,
      data: {
        proxyId,
        testResult: result,
        testedAt: new Date().toISOString()
      },
      message: 'Workflow proxy test completed'
    });

  } catch (err) {
    error(`Failed to test workflow proxy: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 获取代理统计信息
 */
router.get('/proxies/:proxyId/stats', async (req, res) => {
  try {
    const { proxyId } = req.params;
    
    // 这里可以集成监控服务来获取统计信息
    // 暂时返回模拟数据
    const stats = {
      proxyId,
      totalRequests: 0,
      successRequests: 0,
      errorRequests: 0,
      averageResponseTime: 0,
      lastRequestAt: null,
      uptime: 0
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (err) {
    error(`Failed to get proxy stats: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
