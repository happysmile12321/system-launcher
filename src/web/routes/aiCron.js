import express from 'express';
import AICronService from '../../services/aiCronService.js';

const router = express.Router();
const aiCronService = new AICronService();

/**
 * 生成Cron表达式
 * POST /api/ai-cron/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        error: '描述不能为空'
      });
    }

    const result = aiCronService.generateCronExpression(description);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('生成Cron表达式失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 验证Cron表达式
 * POST /api/ai-cron/validate
 */
router.post('/validate', async (req, res) => {
  try {
    const { cron } = req.body;

    if (!cron) {
      return res.status(400).json({
        success: false,
        error: 'Cron表达式不能为空'
      });
    }

    const isValid = aiCronService.validateCronExpression(cron);
    const explanation = isValid ? aiCronService.generateExplanation(cron) : null;

    res.json({
      success: true,
      data: {
        valid: isValid,
        explanation
      }
    });
  } catch (error) {
    console.error('验证Cron表达式失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取常用Cron表达式建议
 * GET /api/ai-cron/suggestions
 */
router.get('/suggestions', async (req, res) => {
  try {
    const suggestions = aiCronService.getCommonSuggestions();

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('获取Cron建议失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
