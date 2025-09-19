// FeishuRichTextReport 组件 - 发送飞书富文本报告

/**
 * 将Markdown文本转换为飞书富文本JSON
 * 注意：这是一个简化版的转换实现
 */
function markdownToFeishuRichText(markdown) {
  const elements = [];
  const lines = markdown.split('\n');
  
  let currentParagraph = '';
  let inCodeBlock = false;
  let codeContent = '';
  
  lines.forEach(line => {
    // 处理代码块
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // 代码块结束
        elements.push({
          tag: 'code',
          text: codeContent
        });
        inCodeBlock = false;
        codeContent = '';
      } else {
        // 代码块开始
        inCodeBlock = true;
        // 保存之前的段落（如果有）
        if (currentParagraph.trim()) {
          elements.push({
            tag: 'p',
            text: currentParagraph
          });
          currentParagraph = '';
        }
      }
      return;
    }
    
    if (inCodeBlock) {
      codeContent += line + '\n';
      return;
    }
    
    // 处理标题
    if (line.startsWith('# ')) {
      if (currentParagraph.trim()) {
        elements.push({
          tag: 'p',
          text: currentParagraph
        });
        currentParagraph = '';
      }
      elements.push({
        tag: 'h1',
        text: line.substring(2)
      });
      return;
    }
    if (line.startsWith('## ')) {
      if (currentParagraph.trim()) {
        elements.push({
          tag: 'p',
          text: currentParagraph
        });
        currentParagraph = '';
      }
      elements.push({
        tag: 'h2',
        text: line.substring(3)
      });
      return;
    }
    if (line.startsWith('### ')) {
      if (currentParagraph.trim()) {
        elements.push({
          tag: 'p',
          text: currentParagraph
        });
        currentParagraph = '';
      }
      elements.push({
        tag: 'h3',
        text: line.substring(4)
      });
      return;
    }
    
    // 处理列表
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (currentParagraph.trim()) {
        elements.push({
          tag: 'p',
          text: currentParagraph
        });
        currentParagraph = '';
      }
      elements.push({
        tag: 'li',
        text: line.substring(2)
      });
      return;
    }
    
    // 处理引用
    if (line.startsWith('> ')) {
      if (currentParagraph.trim()) {
        elements.push({
          tag: 'p',
          text: currentParagraph
        });
        currentParagraph = '';
      }
      elements.push({
        tag: 'blockquote',
        text: line.substring(2)
      });
      return;
    }
    
    // 处理空行
    if (line.trim() === '') {
      if (currentParagraph.trim()) {
        elements.push({
          tag: 'p',
          text: currentParagraph
        });
        currentParagraph = '';
      }
      return;
    }
    
    // 普通文本，添加到当前段落
    currentParagraph += (currentParagraph ? '\n' : '') + line;
  });
  
  // 处理剩余的段落
  if (currentParagraph.trim()) {
    elements.push({
      tag: 'p',
      text: currentParagraph
    });
  }
  
  return elements;
}

/**
 * 创建飞书消息卡片
 */
function createFeishuCard(title, richTextElements, atAll = false) {
  return {
    msg_type: 'interactive',
    card: {
      config: {
        wide_screen_mode: true
      },
      header: {
        title: {
          tag: 'plain_text',
          content: title
        },
        template: 'blue'
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: richTextElements.map(el => {
              switch (el.tag) {
                case 'h1': return `# ${el.text}`;
                case 'h2': return `## ${el.text}`;
                case 'h3': return `### ${el.text}`;
                case 'p': return el.text;
                case 'code': return `\`\`\`\n${el.text}\`\`\``;
                case 'li': return `- ${el.text}`;
                case 'blockquote': return `> ${el.text}`;
                default: return el.text;
              }
            }).join('\n')
          }
        }
      ].concat(atAll ? [{
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: '@所有人'
        }
      }] : [])
    }
  };
}

/**
 * 发送飞书消息
 */
async function sendFeishuMessage(webhookUrl, message) {
  const fetch = (await import('node-fetch')).default;
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    throw new Error(`Error sending message to Feishu: ${error.message}`);
  }
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
    const { webhookUrl, title, content, atAll = false } = inputs;
    
    if (!webhookUrl) {
      throw new Error('飞书机器人Webhook地址不能为空');
    }
    
    if (!title) {
      throw new Error('报告标题不能为空');
    }
    
    if (!content) {
      throw new Error('报告内容不能为空');
    }
    
    log.info(`准备发送飞书报告: ${title}`);
    
    // 转换Markdown到飞书富文本
    const richTextElements = markdownToFeishuRichText(content);
    
    // 创建飞书消息卡片
    const messageCard = createFeishuCard(title, richTextElements, atAll);
    
    // 发送消息
    const response = await sendFeishuMessage(webhookUrl, messageCard);
    
    // 检查响应
    const isSuccess = response && response.StatusCode === 0;
    
    if (isSuccess) {
      log.success(`飞书报告发送成功`);
    } else {
      log.error(`飞书报告发送失败: ${JSON.stringify(response)}`);
    }
    
    // 设置输出
    context.outputs = {
      isSuccess,
      response
    };
    
    return {
      isSuccess,
      response
    };
  } catch (error) {
    log.error(`组件执行失败: ${error.message}`);
    
    // 设置错误输出
    context.outputs = {
      isSuccess: false,
      error: error.message,
      response: null
    };
    
    return {
      isSuccess: false,
      error: error.message,
      response: null
    };
  }
}

// 导出组件函数
component;