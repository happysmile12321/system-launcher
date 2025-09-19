document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const jsonEditor = document.getElementById('json-editor');
    const loadButton = document.getElementById('load-button');
    const saveButton = document.getElementById('save-button');
    const deployDockerButton = document.getElementById('deploy-docker-button');
    const statusMessage = document.getElementById('status-message');

    // Management API Elements
    const managementApiKeyInput = document.getElementById('management-api-key');
    const btnFetchStatus = document.getElementById('btn-fetch-status');
    const btnFetchMetrics = document.getElementById('btn-fetch-metrics');
    const mgmtVersion = document.getElementById('mgmt-version');
    const mgmtUptime = document.getElementById('mgmt-uptime');
    const mgmtStatus = document.getElementById('mgmt-status');
    const metricsOutput = document.getElementById('metrics-output');

    // Counters Elements
    const counterFeishu = document.getElementById('counter-feishu');
    const counterScripts = document.getElementById('counter-scripts');
    const counterUpload = document.getElementById('counter-upload');
    const counterContainers = document.getElementById('counter-containers');

    // Scheduler Elements
    const schedulerRunning = document.getElementById('scheduler-running');
    const schedulerNext = document.getElementById('scheduler-next');
    const cronInput = document.getElementById('cron-input');
    const btnUpdateCron = document.getElementById('btn-update-cron');

    // Scripts modal and actions
    const manageScriptsButton = document.getElementById('manage-scripts-button');
    const scriptsModal = document.getElementById('scripts-modal');
    const closeScriptsModal = document.getElementById('close-scripts-modal');
    const scriptsList = document.getElementById('scripts-list');
    const createScriptButton = document.getElementById('create-script-button');

    // Script Editor Modal Elements
    const scriptEditorContainer = document.getElementById('script-editor-container');
    const scriptEditorTitle = document.getElementById('script-editor-title');
    const scriptEditor = document.getElementById('script-editor');
    const closeEditorButton = document.getElementById('close-editor-button');
    const saveScriptButton = document.getElementById('save-script-button');
    const runScriptButton = document.getElementById('run-script-button');

    // Log Modal Elements
    const logModal = document.getElementById('log-modal');
    const logModalTitle = document.getElementById('log-modal-title');
    const logContent = document.getElementById('log-content');
    const closeLogModal = document.getElementById('close-log-modal');

    // Current state
    let currentScriptName = null;

    // Display status message with Tailwind CSS styling
    function showStatus(message, type = 'info') {
        statusMessage.textContent = message;
        statusMessage.classList.remove('hidden', 'bg-green-100', 'bg-red-100', 'bg-blue-100', 'text-green-800', 'text-red-800', 'text-blue-800', 'border', 'border-green-200', 'border-red-200', 'border-blue-200');
        statusMessage.classList.add('p-4', 'rounded-lg', 'shadow-lg', 'max-w-sm', 'transform', 'transition-all', 'duration-300', 'translate-y-0');
        if (type === 'success') {
            statusMessage.classList.add('bg-green-100', 'text-green-800', 'border', 'border-green-200');
        } else if (type === 'error') {
            statusMessage.classList.add('bg-red-100', 'text-red-800', 'border', 'border-red-200');
        } else {
            statusMessage.classList.add('bg-blue-100', 'text-blue-800', 'border', 'border-blue-200');
        }
        setTimeout(() => { statusMessage.classList.add('hidden'); }, 5000);
    }

    // Load configuration from GitHub
    async function loadConfiguration() {
        try {
            showStatus('Loading configuration from GitHub...', 'info');
            const response = await fetch('/api/orchestration');
            const data = await response.json();
            if (response.ok) {
                jsonEditor.value = JSON.stringify(data, null, 2);
                showStatus('Configuration loaded successfully!', 'success');
            } else {
                showStatus('Failed to load configuration: ' + data.error, 'error');
            }
        } catch (error) {
            showStatus('Error loading configuration: ' + error.message, 'error');
            console.error('Error loading configuration:', error);
        }
    }

    // Save configuration to GitHub
    async function saveConfiguration() {
        try {
            let configData;
            try {
                configData = JSON.parse(jsonEditor.value);
            } catch (e) {
                showStatus('Invalid JSON format: ' + e.message, 'error');
                return;
            }
            showStatus('Saving configuration to GitHub...', 'info');
            const response = await fetch('/api/orchestration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(configData)
            });
            const data = await response.json();
            if (response.ok) {
                showStatus(data.message, 'success');
            } else {
                showStatus('Failed to save configuration: ' + data.error, 'error');
            }
        } catch (error) {
            showStatus('Error saving configuration: ' + error.message', 'error');
            console.error('Error saving configuration:', error);
        }
    }

    // Run Docker deployment
    async function runDockerDeployment() {
        try {
            showStatus('Running Docker deployment...', 'info');
            const response = await fetch('/api/deploy/docker', { method: 'POST' });
            const data = await response.json();
            if (response.ok) {
                showStatus(data.message + ' Output: ' + data.output, 'success');
            } else {
                showStatus('Failed to run deployment: ' + data.error, 'error');
            }
        } catch (error) {
            showStatus('Error running deployment: ' + error.message, 'error');
            console.error('Error running deployment:', error);
        }
    }

    // Helpers to call management API with header
    function withApiKey(headers = {}) {
        const apiKey = managementApiKeyInput?.value?.trim();
        if (apiKey) headers['X-Api-Key'] = apiKey;
        return headers;
    }

    async function fetchManagementStatus() {
        try {
            const res = await fetch('/api/management/status', { headers: withApiKey() });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Unauthorized');
            }
            const data = await res.json();
            mgmtVersion.textContent = data.version ?? '-';
            mgmtUptime.textContent = String(data.uptime ?? '-');
            mgmtStatus.textContent = data.status ?? '-';
            showStatus('Fetched management status', 'success');
        } catch (e) {
            showStatus('Failed to fetch status: ' + e.message, 'error');
        }
    }

    async function fetchManagementMetrics() {
        try {
            const res = await fetch('/api/management/metrics', { headers: withApiKey() });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Unauthorized');
            }
            const text = await res.text();
            metricsOutput.textContent = text;
            const counters = parseCounters(text);
            counterFeishu.textContent = counters['orchestrator_pro_feishu_api_calls_total'] || 0;
            counterScripts.textContent = counters['orchestrator_pro_scripts_executed_total'] || 0;
            counterUpload.textContent = counters['orchestrator_pro_storage_operations_total{operation="upload"}'] || 0;
            counterContainers.textContent = counters['orchestrator_pro_container_operations_total'] || 0;
            showStatus('Fetched metrics', 'success');
        } catch (e) {
            showStatus('Failed to fetch metrics: ' + e.message, 'error');
        }
    }

    function parseCounters(text) {
        const lines = text.split('\n');
        const map = {};
        for (const line of lines) {
            if (!line || line.startsWith('#')) continue;
            const parts = line.trim().split(' ');
            const metric = parts[0];
            const value = Number(parts[1]);
            if (Number.isFinite(value)) {
                if (metric.startsWith('orchestrator_pro_storage_operations_total')) {
                    if (metric.includes('operation="upload"')) {
                        map['orchestrator_pro_storage_operations_total{operation="upload"}'] = (map['orchestrator_pro_storage_operations_total{operation="upload"}'] || 0) + value;
                    }
                } else if (metric.startsWith('orchestrator_pro_container_operations_total')) {
                    map['orchestrator_pro_container_operations_total'] = (map['orchestrator_pro_container_operations_total'] || 0) + value;
                } else {
                    map[metric] = (map[metric] || 0) + value;
                }
            }
        }
        return map;
    }

    // Scheduler
    async function fetchSchedulerStatus() {
        try {
            const res = await fetch('/api/scheduler/status');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            schedulerRunning.textContent = data.status.running ? 'Yes' : 'No';
            schedulerNext.textContent = data.status.nextRun || '-';
        } catch (e) {
            schedulerRunning.textContent = '-';
            schedulerNext.textContent = '-';
        }
    }

    async function updateCron() {
        const cron = cronInput.value.trim();
        if (!cron) {
            showStatus('Cron expression is required', 'error');
            return;
        }
        try {
            const res = await fetch('/api/scheduler/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cronExpression: cron })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            showStatus('Scheduler updated. Next: ' + (data.nextRun || '-'), 'success');
            fetchSchedulerStatus();
        } catch (e) {
            showStatus('Failed to update scheduler: ' + e.message, 'error');
        }
    }

    // Scripts list handling (in modal)
    async function loadScriptsList() {
        try {
            scriptsList.innerHTML = '<p class="loading">Loading scripts...</p>';
            const response = await fetch('/api/scripts');
            const scripts = await response.json();
            if (response.ok) {
                if (scripts.length === 0) {
                    scriptsList.innerHTML = '<p class="empty">No scripts found. Create a new script to get started.</p>';
                } else {
                    scriptsList.innerHTML = '';
                    scripts.forEach(script => {
                        const scriptItem = document.createElement('div');
                        scriptItem.className = 'script-item';
                        scriptItem.innerHTML = `
                            <div class="script-info">
                                <span class="script-name">${script.name}</span>
                            </div>
                            <div class="script-actions">
                                <button class="edit-script" data-name="${script.name}">Edit</button>
                                <button class="delete-script" data-name="${script.name}">Delete</button>
                                <button class="run-script" data-name="${script.name}">Run</button>
                            </div>
                        `;
                        scriptsList.appendChild(scriptItem);
                    });
                    document.querySelectorAll('.edit-script').forEach(button => {
                        button.addEventListener('click', () => editScript(button.dataset.name));
                    });
                    document.querySelectorAll('.delete-script').forEach(button => {
                        button.addEventListener('click', () => deleteScript(button.dataset.name));
                    });
                    document.querySelectorAll('.run-script').forEach(button => {
                        button.addEventListener('click', () => runScript(button.dataset.name));
                    });
                }
            } else {
                scriptsList.innerHTML = `<p class="error">Failed to load scripts: ${scripts.error}</p>`;
            }
        } catch (error) {
            scriptsList.innerHTML = `<p class="error">Error loading scripts: ${error.message}</p>`;
            console.error('Error loading scripts:', error);
        }
    }

    function openScriptsModal() {
        scriptsModal.classList.remove('hidden');
        loadScriptsList();
    }

    function closeScripts() {
        scriptsModal.classList.add('hidden');
    }

    // Create new script
    function createNewScript() {
        const scriptName = prompt('Enter a name for the new script (must end with .js):');
        if (!scriptName) return;
        if (!scriptName.endsWith('.js')) {
            alert('Script name must end with .js');
            return;
        }
        currentScriptName = scriptName;
        scriptEditorTitle.textContent = `Edit Script: ${scriptName}`;
        scriptEditor.value = `// Your custom script\n// Use OrchestratorSDK to interact with the system\n\nasync function main() {\n  // Example: Log a message\n  OrchestratorSDK.logger.info('Script is running!');\n  return 'Script executed successfully!';\n}\n\nmain();`;
        scriptEditorContainer.classList.remove('hidden');
    }

    // Edit script
    async function editScript(scriptName) {
        try {
            showStatus(`Loading script: ${scriptName}`, 'info');
            const response = await fetch(`/api/scripts/${scriptName}`);
            const data = await response.json();
            if (response.ok) {
                currentScriptName = scriptName;
                scriptEditorTitle.textContent = `Edit Script: ${scriptName}`;
                scriptEditor.value = data.content;
                scriptEditorContainer.classList.remove('hidden');
                showStatus(`Loaded script: ${scriptName}`, 'success');
            } else {
                showStatus(`Failed to load script: ${data.error}`, 'error');
            }
        } catch (error) {
            showStatus(`Error loading script: ${error.message}`, 'error');
            console.error('Error loading script:', error);
        }
    }

    // Save script
    async function saveScript() {
        if (!currentScriptName) {
            showStatus('No script selected to save', 'error');
            return;
        }
        try {
            showStatus(`Saving script: ${currentScriptName}`, 'info');
            const response = await fetch(`/api/scripts/${currentScriptName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: scriptEditor.value })
            });
            const data = await response.json();
            if (response.ok) {
                showStatus(data.message, 'success');
                loadScriptsList();
            } else {
                showStatus(`Failed to save script: ${data.error}`, 'error');
            }
        } catch (error) {
            showStatus(`Error saving script: ${error.message}`, 'error');
            console.error('Error saving script:', error);
        }
    }

    // Delete script
    async function deleteScript(scriptName) {
        if (!confirm(`Are you sure you want to delete script: ${scriptName}?`)) return;
        try {
            showStatus(`Deleting script: ${scriptName}`, 'info');
            const response = await fetch(`/api/scripts/${scriptName}`, { method: 'DELETE' });
            const data = await response.json();
            if (response.ok) {
                showStatus(data.message, 'success');
                loadScriptsList();
            } else {
                showStatus(`Failed to delete script: ${data.error}`, 'error');
            }
        } catch (error) {
            showStatus(`Error deleting script: ${error.message}`, 'error');
            console.error('Error deleting script:', error);
        }
    }

    // Run script
    async function runScript(scriptName) {
        try {
            showStatus(`Running script: ${scriptName}`, 'info');
            logModalTitle.textContent = `Running: ${scriptName}`;
            logContent.innerHTML = '<p class="loading">Starting script execution...</p>';
            logModal.classList.remove('hidden');
            const response = await fetch(`/api/scripts/${scriptName}/run`, { method: 'POST' });
            const data = await response.json();
            if (response.ok) {
                const formattedLogs = data.logs.map(log => `<p>${log}</p>`).join('');
                logContent.innerHTML = formattedLogs;
                if (data.result) logContent.innerHTML += `<p class="result">Result: ${JSON.stringify(data.result)}</p>`;
                showStatus(data.message, 'success');
            } else {
                const formattedLogs = data.logs.map(log => `<p class="error">${log}</p>`).join('');
                logContent.innerHTML = formattedLogs;
                showStatus(`Failed to run script: ${data.error}`, 'error');
            }
        } catch (error) {
            logContent.innerHTML = `<p class="error">Error running script: ${error.message}</p>`;
            showStatus(`Error running script: ${error.message}`, 'error');
            console.error('Error running script:', error);
        }
    }

    // Event Listeners
    loadButton.addEventListener('click', loadConfiguration);
    saveButton.addEventListener('click', saveConfiguration);
    deployDockerButton.addEventListener('click', runDockerDeployment);

    if (btnFetchStatus) btnFetchStatus.addEventListener('click', fetchManagementStatus);
    if (btnFetchMetrics) btnFetchMetrics.addEventListener('click', () => { fetchManagementMetrics(); fetchSchedulerStatus(); });

    if (btnUpdateCron) btnUpdateCron.addEventListener('click', updateCron);

    if (manageScriptsButton) manageScriptsButton.addEventListener('click', openScriptsModal);
    if (closeScriptsModal) closeScriptsModal.addEventListener('click', closeScripts);
    if (createScriptButton) createScriptButton.addEventListener('click', createNewScript);

    const closeOnBackdrop = (event, modalEl) => { if (event.target === modalEl) modalEl.classList.add('hidden'); };
    window.addEventListener('click', (e) => { closeOnBackdrop(e, scriptsModal); closeOnBackdrop(e, logModal); closeOnBackdrop(e, scriptEditorContainer); });

    const closeLog = () => { logModal.classList.add('hidden'); };
    const closeEditor = () => { scriptEditorContainer.classList.add('hidden'); currentScriptName = null; };
    if (closeLogModal) closeLogModal.addEventListener('click', closeLog);
    if (closeEditorButton) closeEditorButton.addEventListener('click', closeEditor);

    // Initialize
    jsonEditor.value = JSON.stringify({ version: 1, steps: [] }, null, 2);
    loadConfiguration();
    fetchSchedulerStatus();
});