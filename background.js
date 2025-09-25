// Background service worker for NewsFeed Eradicator
// Tracks LinkedIn tabs (existing and new) and injects content script when URL is the feed

function isLinkedInUrl(urlString) {
    try {
        const url = new URL(urlString);
        return url.hostname === 'www.linkedin.com';
    } catch (e) {
        return false;
    }
}

function isLinkedInFeedUrl(urlString) {
    try {
        const url = new URL(urlString);
        if (url.hostname !== 'www.linkedin.com') return false;
        // Matches /feed and /feed/*
        return url.pathname === '/feed' || url.pathname.startsWith('/feed/');
    } catch (e) {
        return false;
    }
}

function injectContentScriptIfNeeded(tabId, urlString) {
    if (!isLinkedInFeedUrl(urlString)) return;
    chrome.scripting.executeScript(
        {
            target: { tabId: tabId },
            files: ['content.js']
        },
        () => {
            // Swallow errors (e.g., no permission, tab closed) to avoid noisy logs
            const lastError = chrome.runtime.lastError;
            if (lastError) {
                // Optionally log for debugging
                // console.debug('Injection skipped:', lastError.message);
            }
        }
    );
}

// Handle previously opened tabs on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.query({ url: ['*://www.linkedin.com/*'] }, (tabs) => {
        tabs.forEach((tab) => {
            if (tab.id != null && typeof tab.url === 'string') {
                injectContentScriptIfNeeded(tab.id, tab.url);
            }
        });
    });
});

// Handle previously opened tabs on browser startup (service worker start)
chrome.runtime.onStartup.addListener(() => {
    chrome.tabs.query({ url: ['*://www.linkedin.com/*'] }, (tabs) => {
        tabs.forEach((tab) => {
            if (tab.id != null && typeof tab.url === 'string') {
                injectContentScriptIfNeeded(tab.id, tab.url);
            }
        });
    });
});

// Handle tab URL updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (typeof changeInfo.url === 'string') {
        if (isLinkedInFeedUrl(changeInfo.url)) {
            injectContentScriptIfNeeded(tabId, changeInfo.url);
            return;
        }
    }
    if (changeInfo.status === 'complete' && typeof tab.url === 'string') {
        if (isLinkedInFeedUrl(tab.url)) {
            injectContentScriptIfNeeded(tabId, tab.url);
        }
    }
});

// Handle SPA route changes (history API) on LinkedIn
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (typeof details.url === 'string' && isLinkedInFeedUrl(details.url)) {
        injectContentScriptIfNeeded(details.tabId, details.url);
    }
}, { url: [{ hostEquals: 'www.linkedin.com' }] });


