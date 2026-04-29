require('dotenv').config();

const { createDeepSeek } = require('@ai-sdk/deepseek');
const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY ?? ''
});

const express = require('express');
const cors = require('cors');
const { streamText, stepCountIs, tool } = require('ai'); // 1. 引入 tool 函数
const { z } = require('zod'); // 2. 引入 zod

const app = express();
const port = 3000;

app.use(cors());
app.use(express.static('.'));
app.use(express.json());

// --- 3. 定义工具 (Tools) ---
const tools = {
  getWeather: tool({
    description: '获取指定地点的当前天气情况',
    inputSchema: z.object({
      location: z.string().describe('城市名称，例如：北京、上海')
    }),
    execute: async ({ location }) => {
      console.log(`\n🛠️ [工具执行] 正在查询 ${location} 的天气...`);
      // 模拟 API 延迟
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        location: location,
        temperature: '22°C',
        condition: '晴天'
        // 修复点 2: 移除任何可能为 undefined 的字段
        // humidity: undefined // 这种字段不要返回
      };
    }
  }),
  sendEmail: tool({
    description: '向指定收件人发送一封邮件',
    inputSchema: z.object({
      to: z.string().describe('收件人邮箱'),
      subject: z.string().describe('邮件主题'),
      body: z.string().describe('邮件正文')
    }),
    execute: async ({ to, subject, body }) => {
      console.log(`\n🛠️ [工具执行] 正在发送邮件:`);
      console.log(`   - 收件人: ${to}`);
      console.log(`   - 主题: ${subject}`);
      console.log(`   - 内容: ${body}`);
      // 模拟发送延迟
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { result: 'Email sent successfully' };
    }
  })
};

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  console.log(`\n👤 用户: ${message}`);

  try {
    // --- 4. 配置 streamText ---
    const result = streamText({
      model: deepseek('deepseek-v4-flash'),
      system: '你是一个乐于助人的 AI 助手。如果用户需要查询天气或发送邮件，请务必使用提供的工具。',
      messages: [{ role: 'user', content: message }],
      tools, // 5. 注入工具
      stopWhen: stepCountIs(5), // 6. 【关键】AI SDK v6 用 stopWhen 开启多步循环
      onStepFinish: ({ finishReason, toolResults }) => {
        console.log(`✅ [步骤完成] finishReason=${finishReason}, toolResults=${toolResults.length}`);
      },
      onError: ({ error }) => {
        console.error('❌ [流式错误]:', error);
      }
    });

    // --- 7. 处理流式响应 ---
    // 注意：当使用工具时，流中会包含工具调用的中间状态。
    // pipeTextStreamToResponse 会自动处理这些，将最终文本和中间状态流式传回前端
    result.pipeTextStreamToResponse(res);
  } catch (error) {
    console.error('❌ 发生错误:', error);
    res.status(500).send('服务器内部错误');
  }
});

app.listen(port, () => {
  console.log(`🚀 服务已启动: http://localhost:${port}`);
});
