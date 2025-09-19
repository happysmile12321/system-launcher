import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadState, saveState } from '../core/orchestration.js';
import { runDockerDeploy } from '../core/deployment.js';
import { info, success } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API to get the current config
app.get('/api/orchestration', async (req, res) => {
  const state = await loadState();
  res.json(state);
});

// API to save the config
app.post('/api/orchestration', async (req, res) => {
  await saveState(req.body);
  res.json({ message: 'Configuration saved successfully!' });
});

// API to trigger a deployment
app.post('/api/deploy/docker', async (req, res) => {
  const result = await runDockerDeploy();
  res.json({ message: 'Docker deployment triggered!', output: result });
});

app.listen(PORT, () => {
  success(`Web UI is running!`);
  info(`Open your browser at http://localhost:${PORT}`);
});