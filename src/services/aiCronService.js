/**
 * AI辅助Cron表达式生成服务
 * 提供自然语言到Cron表达式的转换功能
 */

export class AICronService {
  constructor() {
    // 预定义的常用Cron表达式模式
    this.commonPatterns = {
      // 每天
      '每天': '0 0 * * *',
      '每天凌晨': '0 0 * * *',
      '每天中午': '0 12 * * *',
      '每天下午': '0 14 * * *',
      '每天晚上': '0 20 * * *',
      '每天凌晨2点': '0 2 * * *',
      '每天凌晨3点': '0 3 * * *',
      '每天上午9点': '0 9 * * *',
      '每天上午10点': '0 10 * * *',
      '每天下午2点': '0 14 * * *',
      '每天下午3点': '0 15 * * *',
      '每天下午6点': '0 18 * * *',
      
      // 每周
      '每周': '0 0 * * 0',
      '每周一': '0 0 * * 1',
      '每周二': '0 0 * * 2',
      '每周三': '0 0 * * 3',
      '每周四': '0 0 * * 4',
      '每周五': '0 0 * * 5',
      '每周六': '0 0 * * 6',
      '每周日': '0 0 * * 0',
      '每周一凌晨': '0 0 * * 1',
      '每周一上午': '0 9 * * 1',
      '每周五下午': '0 14 * * 5',
      
      // 每月
      '每月': '0 0 1 * *',
      '每月1号': '0 0 1 * *',
      '每月15号': '0 0 15 * *',
      '每月最后一天': '0 0 L * *',
      '每月1号凌晨': '0 0 1 * *',
      '每月1号上午': '0 9 1 * *',
      
      // 工作日
      '工作日': '0 0 * * 1-5',
      '工作日每天': '0 0 * * 1-5',
      '工作日每天上午9点': '0 9 * * 1-5',
      '工作日每天下午6点': '0 18 * * 1-5',
      
      // 间隔时间
      '每小时': '0 * * * *',
      '每2小时': '0 */2 * * *',
      '每3小时': '0 */3 * * *',
      '每6小时': '0 */6 * * *',
      '每12小时': '0 */12 * * *',
      '每30分钟': '*/30 * * * *',
      '每15分钟': '*/15 * * * *',
      '每5分钟': '*/5 * * * *',
      '每分钟': '* * * * *',
      
      // 特定时间
      '凌晨2点': '0 2 * * *',
      '上午9点': '0 9 * * *',
      '中午12点': '0 12 * * *',
      '下午2点': '0 14 * * *',
      '下午6点': '0 18 * * *',
      '晚上8点': '0 20 * * *',
      '晚上10点': '0 22 * * *',
      '晚上11点': '0 23 * * *'
    };

    // 时间关键词映射
    this.timeKeywords = {
      '凌晨': '0',
      '早上': '6',
      '上午': '9',
      '中午': '12',
      '下午': '14',
      '傍晚': '18',
      '晚上': '20',
      '深夜': '23'
    };

    // 星期关键词映射
    this.weekdayKeywords = {
      '周一': '1',
      '周二': '2',
      '周三': '3',
      '周四': '4',
      '周五': '5',
      '周六': '6',
      '周日': '0',
      '星期天': '0',
      '星期一': '1',
      '星期二': '2',
      '星期三': '3',
      '星期四': '4',
      '星期五': '5',
      '星期六': '6',
      '星期日': '0'
    };
  }

  /**
   * 根据自然语言描述生成Cron表达式
   * @param {string} description - 自然语言描述
   * @returns {Object} - 包含cron表达式和解释的对象
   */
  generateCronExpression(description) {
    if (!description || typeof description !== 'string') {
      return {
        cron: '0 0 * * *',
        explanation: '无效的描述，使用默认值：每天凌晨执行',
        confidence: 0
      };
    }

    const normalizedDescription = description.trim().toLowerCase();

    // 首先检查是否有完全匹配的预定义模式
    for (const [pattern, cron] of Object.entries(this.commonPatterns)) {
      if (normalizedDescription.includes(pattern.toLowerCase())) {
        return {
          cron,
          explanation: this.generateExplanation(cron),
          confidence: 0.9
        };
      }
    }

    // 尝试解析复杂的时间描述
    const parsed = this.parseComplexDescription(normalizedDescription);
    if (parsed) {
      return parsed;
    }

    // 如果无法解析，返回默认值
    return {
      cron: '0 0 * * *',
      explanation: '无法解析描述，使用默认值：每天凌晨执行',
      confidence: 0.1
    };
  }

  /**
   * 解析复杂的时间描述
   * @param {string} description - 标准化的描述
   * @returns {Object|null} - 解析结果或null
   */
  parseComplexDescription(description) {
    // 匹配模式：每天X点
    const dailyTimeMatch = description.match(/每天(\d+)点/);
    if (dailyTimeMatch) {
      const hour = parseInt(dailyTimeMatch[1]);
      if (hour >= 0 && hour <= 23) {
        return {
          cron: `0 ${hour} * * *`,
          explanation: `每天${hour}点执行`,
          confidence: 0.8
        };
      }
    }

    // 匹配模式：每周X的Y点
    const weeklyTimeMatch = description.match(/每周([一二三四五六日天])(?:的)?(\d+)点/);
    if (weeklyTimeMatch) {
      const weekday = this.weekdayKeywords[weeklyTimeMatch[1]];
      const hour = parseInt(weeklyTimeMatch[2]);
      if (weekday !== undefined && hour >= 0 && hour <= 23) {
        return {
          cron: `0 ${hour} * * ${weekday}`,
          explanation: `每周${weeklyTimeMatch[1]}${hour}点执行`,
          confidence: 0.8
        };
      }
    }

    // 匹配模式：每X小时
    const hourlyMatch = description.match(/每(\d+)小时/);
    if (hourlyMatch) {
      const interval = parseInt(hourlyMatch[1]);
      if (interval > 0 && interval <= 24) {
        return {
          cron: `0 */${interval} * * *`,
          explanation: `每${interval}小时执行一次`,
          confidence: 0.8
        };
      }
    }

    // 匹配模式：每X分钟
    const minuteMatch = description.match(/每(\d+)分钟/);
    if (minuteMatch) {
      const interval = parseInt(minuteMatch[1]);
      if (interval > 0 && interval <= 59) {
        return {
          cron: `*/${interval} * * * *`,
          explanation: `每${interval}分钟执行一次`,
          confidence: 0.8
        };
      }
    }

    // 匹配模式：工作日X点
    const workdayTimeMatch = description.match(/工作日(\d+)点/);
    if (workdayTimeMatch) {
      const hour = parseInt(workdayTimeMatch[1]);
      if (hour >= 0 && hour <= 23) {
        return {
          cron: `0 ${hour} * * 1-5`,
          explanation: `工作日每天${hour}点执行`,
          confidence: 0.8
        };
      }
    }

    return null;
  }

  /**
   * 生成Cron表达式的解释
   * @param {string} cron - Cron表达式
   * @returns {string} - 人类可读的解释
   */
  generateExplanation(cron) {
    const parts = cron.split(' ');
    if (parts.length !== 5) {
      return '无效的Cron表达式';
    }

    const [minute, hour, day, month, weekday] = parts;

    let explanation = '';

    // 解析分钟
    if (minute === '*') {
      explanation += '每分钟';
    } else if (minute.startsWith('*/')) {
      const interval = minute.substring(2);
      explanation += `每${interval}分钟`;
    } else if (minute === '0') {
      explanation += '整点';
    } else {
      explanation += `第${minute}分钟`;
    }

    // 解析小时
    if (hour === '*') {
      explanation += '每小时';
    } else if (hour.startsWith('*/')) {
      const interval = hour.substring(2);
      explanation += `每${interval}小时`;
    } else {
      explanation += `${hour}点`;
    }

    // 解析日期
    if (day === '*') {
      explanation += '每天';
    } else if (day.startsWith('*/')) {
      const interval = day.substring(2);
      explanation += `每${interval}天`;
    } else if (day === 'L') {
      explanation += '每月最后一天';
    } else {
      explanation += `每月${day}号`;
    }

    // 解析月份
    if (month !== '*') {
      if (month.startsWith('*/')) {
        const interval = month.substring(2);
        explanation += `每${interval}个月`;
      } else {
        explanation += `${month}月`;
      }
    }

    // 解析星期
    if (weekday !== '*') {
      if (weekday.includes('-')) {
        const [start, end] = weekday.split('-');
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        explanation += `周${weekdays[start]}到周${weekdays[end]}`;
      } else if (weekday.includes(',')) {
        const days = weekday.split(',');
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        explanation += `周${days.map(d => weekdays[d]).join('、')}`;
      } else {
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        explanation += `周${weekdays[weekday]}`;
      }
    }

    explanation += '执行';

    return explanation;
  }

  /**
   * 验证Cron表达式是否有效
   * @param {string} cron - Cron表达式
   * @returns {boolean} - 是否有效
   */
  validateCronExpression(cron) {
    if (!cron || typeof cron !== 'string') {
      return false;
    }

    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5) {
      return false;
    }

    // 简单的格式验证
    const patterns = [
      /^(\*|([0-5]?\d)(-([0-5]?\d))?(,([0-5]?\d)(-([0-5]?\d))?)*)$/, // 分钟
      /^(\*|([01]?\d|2[0-3])(-([01]?\d|2[0-3]))?(,([01]?\d|2[0-3])(-([01]?\d|2[0-3]))?)*)$/, // 小时
      /^(\*|([012]?\d|3[01])(-([012]?\d|3[01]))?(,([012]?\d|3[01])(-([012]?\d|3[01]))?)*)$/, // 日期
      /^(\*|([01]?\d)(-([01]?\d))?(,([01]?\d)(-([01]?\d))?)*)$/, // 月份
      /^(\*|[0-6](-[0-6])?(,[0-6](-[0-6])?)*)$/ // 星期
    ];

    return parts.every((part, index) => {
      // 支持 */n 格式
      if (part.startsWith('*/')) {
        const num = parseInt(part.substring(2));
        return !isNaN(num) && num > 0;
      }
      return patterns[index].test(part);
    });
  }

  /**
   * 获取常用的Cron表达式建议
   * @returns {Array} - 建议列表
   */
  getCommonSuggestions() {
    return [
      { description: '每天凌晨2点', cron: '0 2 * * *', explanation: '每天凌晨2点执行' },
      { description: '每天上午9点', cron: '0 9 * * *', explanation: '每天上午9点执行' },
      { description: '每天下午6点', cron: '0 18 * * *', explanation: '每天下午6点执行' },
      { description: '每周一凌晨', cron: '0 0 * * 1', explanation: '每周一凌晨执行' },
      { description: '每月1号凌晨', cron: '0 0 1 * *', explanation: '每月1号凌晨执行' },
      { description: '工作日每天上午9点', cron: '0 9 * * 1-5', explanation: '工作日每天上午9点执行' },
      { description: '每2小时', cron: '0 */2 * * *', explanation: '每2小时执行一次' },
      { description: '每30分钟', cron: '*/30 * * * *', explanation: '每30分钟执行一次' },
      { description: '每小时', cron: '0 * * * *', explanation: '每小时执行一次' }
    ];
  }
}

export default AICronService;
