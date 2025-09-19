document.addEventListener('DOMContentLoaded', () => {
    const configEditor = document.getElementById('config-editor');
    const loadBtn = document.getElementById('load-btn');
    const saveBtn = document.getElementById('save-btn');
    const deployBtn = document.getElementById('deploy-btn');
    const statusMessage = document.getElementById('status-message');

    // Display status message with appropriate styling
    function showStatus(message, type = 'info') {
        statusMessage.textContent = message;
        statusMessage.className = type;
        
        // Clear message after 5 seconds
        setTimeout(() => {
            statusMessage.textContent = '';
            statusMessage.className = '';
        }, 5000);
    }

    // Load configuration from GitHub
    loadBtn.addEventListener('click', async () => {
        try {
            showStatus('Loading configuration from GitHub...', 'info');
            const response = await fetch('/api/orchestration');
            const data = await response.json();
            
            if (response.ok) {
                configEditor.value = JSON.stringify(data, null, 2);
                showStatus('Configuration loaded successfully!', 'success');
            } else {
                showStatus('Failed to load configuration: ' + data.message, 'error');
            }
        } catch (error) {
            showStatus('Error loading configuration: ' + error.message, 'error');
            console.error('Error loading configuration:', error);
        }
    });

    // Save configuration to GitHub
    saveBtn.addEventListener('click', async () => {
        try {
            const configData = JSON.parse(configEditor.value);
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
                showStatus('Failed to save configuration: ' + data.message, 'error');
            }
        } catch (error) {
            showStatus('Error saving configuration: ' + error.message, 'error');
            console.error('Error saving configuration:', error);
        }
    });

    // Run Docker deployment
    deployBtn.addEventListener('click', async () => {
        try {
            showStatus('Running Docker deployment...', 'info');
            
            const response = await fetch('/api/deploy/docker', {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showStatus(data.message + ' Output: ' + data.output, 'success');
            } else {
                showStatus('Failed to run deployment: ' + data.message, 'error');
            }
        } catch (error) {
            showStatus('Error running deployment: ' + error.message, 'error');
            console.error('Error running deployment:', error);
        }
    });

    // Initialize editor with default JSON structure
    configEditor.value = JSON.stringify({ version: 1, steps: [] }, null, 2);
});