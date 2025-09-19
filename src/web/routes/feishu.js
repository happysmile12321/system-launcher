
import express from 'express';
import { incrementCounter } from '../../services/metricsService.js';
const router = express.Router();

// 用于处理审批实例的回调
router.post('/approval', (req, res) => {
    incrementCounter('orchestrator_pro_feishu_api_calls_total', { route: 'approval' }, 1);
    // TODO: 触发审批相关的自定义脚本
    console.log('Received Feishu approval event:', req.body);
    res.sendStatus(200);
});

// 用于处理消息卡片的回调
router.post('/card', (req, res) => {
    incrementCounter('orchestrator_pro_feishu_api_calls_total', { route: 'card' }, 1);
    // TODO: 处理卡片交互
    console.log('Received Feishu card event:', req.body);
    res.sendStatus(200);
});

export default router;
