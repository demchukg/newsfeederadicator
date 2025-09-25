// Content script for NewsFeed Eradicator
(function() {
    if (window.__linkedinFeedBlockerInitialized) {
        return;
    }
    window.__linkedinFeedBlockerInitialized = true;

    let isBlockingEnabled = true;

    // Check initial state from storage
    chrome.storage.local.get(['feedBlockerEnabled'], function(result) {
        isBlockingEnabled = result.feedBlockerEnabled !== false; // Default to true
        if (isBlockingEnabled) {
            applyBlockingBasedOnHost();
        }
    });

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request && request.action === 'toggleBlocking') {
            isBlockingEnabled = request.enabled;
            if (isBlockingEnabled) {
                applyBlockingBasedOnHost();
            } else {
                removeBlockingBasedOnHost();
            }
            sendResponse({success: true});
        }
    });

    // React to storage changes across all tabs
    chrome.storage.onChanged.addListener(function(changes, areaName) {
        if (areaName === 'local' && Object.prototype.hasOwnProperty.call(changes, 'feedBlockerEnabled')) {
            const enabled = changes.feedBlockerEnabled.newValue !== false;
            if (enabled) {
                applyBlockingBasedOnHost();
            } else {
                removeBlockingBasedOnHost();
            }
        }
    });

    function applyBlockingBasedOnHost() {
        if (window.location.host.includes('linkedin.com')) {
            applyLinkedInBlocking();
        } else if (window.location.host.includes('youtube.com')) {
            applyYouTubeBlocking();
        }
    }

    function removeBlockingBasedOnHost() {
        if (window.location.host.includes('linkedin.com')) {
            removeLinkedInBlocking();
        } else if (window.location.host.includes('youtube.com')) {
            removeYouTubeBlocking();
        }
    }

    function injectCss(styleId, cssContent) {
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = cssContent;
            if (document.head) {
                document.head.appendChild(style);
            } else {
                document.addEventListener('DOMContentLoaded', function() {
                    if (!document.getElementById(styleId)) {
                        document.head.appendChild(style);
                    }
                }, { once: true });
            }
        }
    }

    function removeCss(styleId) {
        const existingStyle = document.getElementById(styleId);
        if (existingStyle) {
            existingStyle.remove();
        }
    }

    function applyLinkedInBlocking() {
        // Create and inject CSS if not already present
        const linkedinCss = `
                /* Hide "Add to your feed" sidebar block */
                aside.scaffold-layout__aside[aria-label="Add to your feed"] {
                display: none !important;
                }

                /* Hide right-hand sidebar */
                aside.scaffold-layout__sidebar {
                display: none !important;
                }

                /* Hide dropdown block like <div id="ember##" class="mb2 artdeco-dropdown ...> */
                div[id^="ember"].mb2.artdeco-dropdown.artdeco-dropdown--placement-bottom.artdeco-dropdown--justification-right {
                display: none !important;
                }

                /***********************
                 * Replace the main feed
                 ***********************/
                div.scaffold-finite-scroll.scaffold-finite-scroll--infinite {
                display: block !important;
                padding: 16px 12px !important;
                font-size: 20px !important;    /* main message size */
                text-align: left !important;   /* align left */
                font-weight: 600 !important;
                border-radius: 6px !important;
                }

                /* Hide existing children (posts) */
                div.scaffold-finite-scroll.scaffold-finite-scroll--infinite > * {
                display: none !important;
                }

                /* Main placeholder message */
                div.scaffold-finite-scroll.scaffold-finite-scroll--infinite::before {
                content: "This feed won’t build your future.";
                }

                /* Author note */
                div.scaffold-finite-scroll.scaffold-finite-scroll--infinite::after {
                content: "Made by Glebdemchuk.com";
                font-size: 12px !important;
                font-weight: 400 !important;
                display: block !important;
                margin-top: 8px !important;
                opacity: 0.75 !important;
                }
            `;
        injectCss('linkedin-feed-blocker-css', linkedinCss);
    }

    function removeLinkedInBlocking() {
        // Remove the injected CSS
        removeCss('linkedin-feed-blocker-css');
    }

    function applyYouTubeBlocking() {
        // Create and inject CSS for YouTube if not already present
        const youtubeCss = `
                /* Hide the primary content div */
                #primary.style-scope.ytd-two-column-browse-results-renderer > * {
                    display: none !important;
                }

                /* Create a pseudo-element for the message */
                #primary.style-scope.ytd-two-column-browse-results-renderer::before {
                    content: "This feed won’t build your future.";
                    display: block !important;
                    padding: 20px !important;
                    font-size: 24px !important;
                    text-align: center !important;
                    font-weight: bold !important;
                    color: #333 !important; /* Adjust color as needed */
                    background-color: #f0f0f0 !important; /* Adjust background as needed */
                    border-radius: 8px !important;
                    margin-top: 50px !important;
                }

                /* Hide the YouTube guide/sidebar */
                #guide.style-scope.ytd-app {
                    display: none !important;
                }
            `;
        injectCss('youtube-feed-blocker-css', youtubeCss);
    }

    function removeYouTubeBlocking() {
        removeCss('youtube-feed-blocker-css');
    }
})();