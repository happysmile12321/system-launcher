import os from 'os';

const counters = new Map();

function metricKey(name, labels) {
  if (!labels || Object.keys(labels).length === 0) {
    return name;
  }
  const serialized = Object.keys(labels)
    .sort()
    .map((key) => `${key}=${labels[key]}`)
    .join('|');
  return `${name}|${serialized}`;
}

function formatLabels(labels = {}) {
  const entries = Object.entries(labels);
  if (!entries.length) {
    return '';
  }
  const formatted = entries
    .sort(([a], [b]) => (a > b ? 1 : a < b ? -1 : 0))
    .map(([key, value]) => `${key}="${String(value).replace(/"/g, '\\"')}"`)
    .join(',');
  return `{${formatted}}`;
}

export function incrementCounter(name, labels = {}, value = 1) {
  const id = metricKey(name, labels);
  const current = counters.get(id) ?? { name, labels, value: 0 };
  current.value += value;
  counters.set(id, current);
}

export function setCounter(name, labels = {}, value = 0) {
  const id = metricKey(name, labels);
  counters.set(id, { name, labels, value });
}

export function getCounters() {
  return Array.from(counters.values());
}

export function toPrometheus() {
  const lines = [];
  lines.push(`# HELP orchestrator_pro_process_uptime_seconds Uptime of the Orchestrator Pro process.`);
  lines.push(`# TYPE orchestrator_pro_process_uptime_seconds gauge`);
  lines.push(`orchestrator_pro_process_uptime_seconds ${process.uptime().toFixed(0)}`);

  lines.push(`# HELP orchestrator_pro_process_memory_rss_bytes Resident set size in bytes.`);
  lines.push(`# TYPE orchestrator_pro_process_memory_rss_bytes gauge`);
  lines.push(`orchestrator_pro_process_memory_rss_bytes ${process.memoryUsage().rss}`);

  lines.push(`# HELP orchestrator_pro_process_cpu_count Number of CPU cores available.`);
  lines.push(`# TYPE orchestrator_pro_process_cpu_count gauge`);
  lines.push(`orchestrator_pro_process_cpu_count ${os.cpus().length}`);

  for (const counter of counters.values()) {
    lines.push(`# TYPE ${counter.name} counter`);
    lines.push(`${counter.name}${formatLabels(counter.labels)} ${counter.value}`);
  }

  return lines.join('\n');
}

// Pre-populate well-known counters so they always appear in metrics output
setCounter('orchestrator_pro_scripts_executed_total', {}, 0);
setCounter('orchestrator_pro_feishu_api_calls_total', {}, 0);
setCounter('orchestrator_pro_storage_operations_total', { operation: 'upload' }, 0);
setCounter('orchestrator_pro_storage_operations_total', { operation: 'download' }, 0);
setCounter('orchestrator_pro_storage_operations_total', { operation: 'delete' }, 0);
setCounter('orchestrator_pro_container_operations_total', { operation: 'start' }, 0);
setCounter('orchestrator_pro_container_operations_total', { operation: 'stop' }, 0);
setCounter('orchestrator_pro_container_operations_total', { operation: 'list' }, 0);
setCounter('orchestrator_pro_container_operations_total', { operation: 'logs' }, 0);
