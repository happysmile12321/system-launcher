document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const jsonEditor = document.getElementById('json-editor');
    const loadButton = document.getElementById('load-button');
    const saveButton = document.getElementById('save-button');
    const deployDockerButton = document.getElementById('deploy-docker-button');
    const statusMessage = document.getElementById('status-message');
    
    // Navigation Elements
    const navDashboard = document.getElementById('nav-dashboard');
    const navScripts = document.getElementById('nav-scripts');
    const dashboardSection = document.getElementById('dashboard-section');
    const scriptsSection = document.getElementById('scripts-section');
    
    // Script Management Elements
    const scriptsList = document.getElementById('scripts-list');
    const createScriptButton = document.getElementById('create-script-button');
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
        
        // Apply appropriate Tailwind classes based on message type
        statusMessage.classList.add('p-4', 'rounded-lg', 'shadow-lg', 'max-w-sm', 'transform', 'transition-all', 'duration-300', 'translate-y-0');
        
        if (type === 'success') {
            statusMessage.classList.add('bg-green-100', 'text-green-800', 'border', 'border-green-200');
        } else if (type === 'error') {
            statusMessage.classList.add('bg-red-100', 'text-red-800', 'border', 'border-red-200');
        } else {
            statusMessage.classList.add('bg-blue-100', 'text-blue-800', 'border', 'border-blue-200');
        }
        
        // Clear message after 5 seconds
        setTimeout(() => {
            statusMessage.classList.add('hidden');
        }, 5000);
    }
    
    // Navigation functions
    function switchToDashboard() {
        dashboardSection.classList.remove('hidden');
        scriptsSection.classList.add('hidden');
        navDashboard.classList.add('active');
        navScripts.classList.remove('active');
    }
    
    function switchToScripts() {
        dashboardSection.classList.add('hidden');
        scriptsSection.classList.remove('hidden');
        navDashboard.classList.remove('active');
        navScripts.classList.add('active');
        
        // Load scripts list
        loadScriptsList();
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
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(configData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showStatus(data.message, 'success');
            } else {
                showStatus('Failed to save configuration: ' + data.error, 'error');
            }
        } catch (error) {
            showStatus('Error saving configuration: ' + error.message, 'error');
            console.error('Error saving configuration:', error);
        }
    }
    
    // Run Docker deployment
    async function runDockerDeployment() {
        try {
            showStatus('Running Docker deployment...', 'info');
            
            const response = await fetch('/api/deploy/docker', {
                method: 'POST'
            });
            
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
    
    // Load scripts list
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
                    
                    // Add event listeners to script actions
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
    
    // Create new script
    function createNewScript() {
        const scriptName = prompt('Enter a name for the new script (must end with .js):');
        
        if (!scriptName) return;
        
        if (!scriptName.endsWith('.js')) {
            alert('Script name must end with .js');
            return;
        }
        
        // Open editor with default content
        currentScriptName = scriptName;
        scriptEditorTitle.textContent = `Edit Script: ${scriptName}`;
        scriptEditor.value = `// Your custom script\n// Use OrchestratorSDK to interact with the system\n\nasync function main() {\n  // Example: Log a message\n  OrchestratorSDK.logger.info('Script is running!');\n  \n  // Example: Make an HTTP request\n  /*\n  const response = await OrchestratorSDK.http.get('https://api.example.com/data');\n  OrchestratorSDK.logger.info('Response:', response.data);\n  */\n  \n  return 'Script executed successfully!';\n}\n\nmain();`;
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
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: scriptEditor.value })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showStatus(data.message, 'success');
                // Refresh scripts list
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
        if (!confirm(`Are you sure you want to delete script: ${scriptName}?`)) {
            return;
        }
        
        try {
            showStatus(`Deleting script: ${scriptName}`, 'info');
            
            const response = await fetch(`/api/scripts/${scriptName}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showStatus(data.message, 'success');
                // Refresh scripts list
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
            
            // Show log modal
            logModalTitle.textContent = `Running: ${scriptName}`;
            logContent.innerHTML = '<p class="loading">Starting script execution...</p>';
            logModal.classList.remove('hidden');
            
            const response = await fetch(`/api/scripts/${scriptName}/run`, {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Format logs for display
                const formattedLogs = data.logs.map(log => `<p>${log}</p>`).join('');
                logContent.innerHTML = formattedLogs;
                
                if (data.result) {
                    logContent.innerHTML += `<p class="result">Result: ${JSON.stringify(data.result)}</p>`;
                }
                
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
    navDashboard.addEventListener('click', switchToDashboard);
    navScripts.addEventListener('click', switchToScripts);
    
    loadButton.addEventListener('click', loadConfiguration);
    saveButton.addEventListener('click', saveConfiguration);
    deployDockerButton.addEventListener('click', runDockerDeployment);
    
    createScriptButton.addEventListener('click', createNewScript);
    closeEditorButton.addEventListener('click', () => {
        scriptEditorContainer.classList.add('hidden');
        currentScriptName = null;
    });
    saveScriptButton.addEventListener('click', saveScript);
    runScriptButton.addEventListener('click', () => {
        if (currentScriptName) {
            runScript(currentScriptName);
        }
    });
    
    closeLogModal.addEventListener('click', () => {
        logModal.classList.add('hidden');
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === logModal) {
            logModal.classList.add('hidden');
        }
    });
    
    // Initialize
    jsonEditor.value = JSON.stringify({ version: 1, steps: [] }, null, 2);
    loadConfiguration();
});