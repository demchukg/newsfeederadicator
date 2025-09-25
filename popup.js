document.addEventListener('DOMContentLoaded', function() {
    const toggleSwitch = document.getElementById('toggle-switch');
    const statusLabel = document.getElementById('status-label');
    
    // Check current status when popup opens
    chrome.storage.local.get(['feedBlockerEnabled'], function(result) {
        const isEnabled = result.feedBlockerEnabled !== false; // Default to true
        updateUI(isEnabled);
    });
    
    // Handle toggle click
    toggleSwitch.addEventListener('click', function() {
        const isCurrentlyActive = toggleSwitch.classList.contains('active');
        const newState = !isCurrentlyActive;
        
        // Update storage
        chrome.storage.local.set({ feedBlockerEnabled: newState }, function() {
            updateUI(newState);
            
            // Broadcast to all open LinkedIn tabs
            chrome.tabs.query({ url: ['*://www.linkedin.com/*'] }, function(tabs) {
                tabs.forEach(function(tab) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'toggleBlocking',
                        enabled: newState
                    });
                });
            });
        });
    });
    
    function updateUI(isEnabled) {
        if (isEnabled) {
            toggleSwitch.classList.add('active');
            statusLabel.textContent = 'Active';
        } else {
            toggleSwitch.classList.remove('active');
            statusLabel.textContent = 'Inactive';
        }
    }
}); 