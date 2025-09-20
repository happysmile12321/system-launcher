document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('setup-form');
    const statusMessage = document.getElementById('status-message');
    const submitButton = document.getElementById('submit-button');

    let originalButtonText = submitButton.innerHTML;

    // Check for URL parameters and show appropriate messages
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');

    if (error === 'invalid_token') {
        showStatus('GitHub token is invalid or expired. Please update your token and try again.', 'error');
    } else if (error === 'validation_failed') {
        showStatus('Token validation failed. Please check your GitHub configuration.', 'error');
    }

    // Display status message with Tailwind CSS styling
    function showStatus(message, type = 'info') {
        statusMessage.textContent = message;
        statusMessage.classList.remove('hidden', 'bg-green-100', 'bg-red-100', 'bg-blue-100', 'text-green-800', 'text-red-800', 'text-blue-800', 'border', 'border-green-200', 'border-red-200', 'border-blue-200');

        // Apply appropriate Tailwind classes based on message type
        statusMessage.classList.add('p-4', 'rounded-lg', 'mb-6');

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

    // Set button loading state
    function setButtonLoading(isLoading) {
        if (isLoading) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fa fa-circle-o-notch fa-spin"></i> Processing...';
        } else {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            setButtonLoading(true);
            showStatus('Saving GitHub configuration...', 'info');

            const response = await fetch('/api/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const responseData = await response.json();

            if (response.ok) {
                showStatus(responseData.message || 'Configuration saved! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                showStatus('Error saving configuration: ' + (responseData.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            showStatus('Error: ' + error.message, 'error');
            console.error('Error saving configuration:', error);
        } finally {
            setButtonLoading(false);
        }
    });
});