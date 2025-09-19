import express from 'express';
import { getConfig } from '../../services/configService.js';
import { toPrometheus } from '../../services/metricsService.js';

const router = express.Router();

// Middleware for API Key Authentication
router.use((req, res, next) => {
    const apiKey = req.get('X-Api-Key');
    const config = getConfig();
    if (!apiKey || apiKey !== config.management?.apiKey) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
});

// GET /status - Health check
router.get('/status', (req, res) => {
    res.json({
        status: 'ok',
        version: '1.0.0', // Replace with actual version from package.json later
        uptime: process.uptime(),
    });
});

// GET /metrics - Prometheus metrics
router.get('/metrics', (req, res) => {
    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.send(toPrometheus());
});

// GET /workflows - List workflows
router.get('/workflows', (req, res) => {
    // TODO: Implement workflow listing
    res.json([]);
});

// GET /workflows/:workflowId/history - Get workflow history
router.get('/workflows/:workflowId/history', (req, res) => {
    // TODO: Implement workflow history
    res.json([]);
});

export default router;
