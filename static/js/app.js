document.addEventListener('DOMContentLoaded', () => {
    // State variables
    let releaseData = [];
    let selectedUpdate = null; // Stores {date, type, plainText, link}
    
    // DOM Elements
    const refreshBtn = document.getElementById('refresh-btn');
    const searchInput = document.getElementById('search-input');
    const typeFilter = document.getElementById('type-filter');
    const feedContent = document.getElementById('feed-content');
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const emptyState = document.getElementById('empty-state');
    const errorMessage = document.getElementById('error-message');
    const retryBtn = document.getElementById('retry-btn');
    
    // Stats elements
    const datesCount = document.getElementById('dates-count');
    const itemsCount = document.getElementById('items-count');
    
    // Floating action bar elements
    const tweetActionBar = document.getElementById('tweet-action-bar');
    const selectedCount = document.getElementById('selected-count');
    const clearSelectionBtn = document.getElementById('clear-selection-btn');
    const tweetSelectedBtn = document.getElementById('tweet-selected-btn');
    
    // Modal elements
    const tweetModal = document.getElementById('tweet-modal');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCount = document.getElementById('char-count');
    const previewTitle = document.getElementById('preview-title');
    const previewMeta = document.getElementById('preview-meta');
    const closeModal = document.getElementById('close-modal');
    const cancelTweetBtn = document.getElementById('cancel-tweet-btn');
    const publishTweetBtn = document.getElementById('publish-tweet-btn');

    // Load data on start
    fetchReleaseNotes();

    // Event listeners
    refreshBtn.addEventListener('click', fetchReleaseNotes);
    retryBtn.addEventListener('click', fetchReleaseNotes);
    
    searchInput.addEventListener('input', filterAndRenderFeed);
    typeFilter.addEventListener('change', filterAndRenderFeed);
    
    clearSelectionBtn.addEventListener('click', clearSelection);
    tweetSelectedBtn.addEventListener('click', () => openTweetModal(selectedUpdate));
    
    closeModal.addEventListener('click', closeTweetModal);
    cancelTweetBtn.addEventListener('click', closeTweetModal);
    
    tweetTextarea.addEventListener('input', updateCharCounter);
    publishTweetBtn.addEventListener('click', publishTweet);

    // Fetch feed from Flask API
    function fetchReleaseNotes() {
        showState('loading');
        clearSelection();
        
        // Add rotation class to spinner
        const spinner = refreshBtn.querySelector('.spinner-icon');
        if (spinner) spinner.classList.add('spinning');
        refreshBtn.disabled = true;

        fetch('/api/feed')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server returned status ${response.status}`);
                }
                return response.json();
            })
            .then(result => {
                if (result.success) {
                    releaseData = result.data;
                    renderStats();
                    filterAndRenderFeed();
                } else {
                    showError(result.error || 'Failed to fetch release notes.');
                }
            })
            .catch(error => {
                showError(error.message || 'Network error occurred while connecting to the backend.');
            })
            .finally(() => {
                if (spinner) spinner.classList.remove('spinning');
                refreshBtn.disabled = false;
            });
    }

    function renderStats() {
        datesCount.textContent = releaseData.length;
        let totalUpdates = 0;
        releaseData.forEach(entry => {
            totalUpdates += entry.updates.length;
        });
        itemsCount.textContent = totalUpdates;
    }

    // Toggle view states
    function showState(state) {
        loadingState.classList.add('hidden');
        errorState.classList.add('hidden');
        emptyState.classList.add('hidden');
        feedContent.classList.add('hidden');

        if (state === 'loading') {
            loadingState.classList.remove('hidden');
        } else if (state === 'error') {
            errorState.classList.remove('hidden');
        } else if (state === 'empty') {
            emptyState.classList.remove('hidden');
        } else if (state === 'content') {
            feedContent.classList.remove('hidden');
        }
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        showState('error');
    }

    // Filter and Render Release Notes
    function filterAndRenderFeed() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedType = typeFilter.value;
        
        feedContent.innerHTML = '';
        let matchCount = 0;
        let datesMatchCount = 0;

        releaseData.forEach((entry, entryIndex) => {
            // Filter updates within the entry
            const filteredUpdates = entry.updates.filter(update => {
                const typeMatches = selectedType === 'all' || 
                                    (selectedType === 'Other' && !['Feature', 'Change', 'Deprecated', 'Breaking Change'].includes(update.type)) ||
                                    update.type === selectedType;
                
                const textMatches = searchTerm === '' || 
                                    update.plain_text.toLowerCase().includes(searchTerm) || 
                                    update.type.toLowerCase().includes(searchTerm) ||
                                    entry.title.toLowerCase().includes(searchTerm);
                                    
                return typeMatches && textMatches;
            });

            if (filteredUpdates.length > 0) {
                datesMatchCount++;
                matchCount += filteredUpdates.length;

                // Create date header
                const dateSec = document.createElement('div');
                dateSec.className = 'date-section';
                
                const dateHeader = document.createElement('div');
                dateHeader.className = 'date-header';
                dateHeader.textContent = entry.title;
                dateSec.appendChild(dateHeader);

                // Create update cards
                filteredUpdates.forEach((update, updateIndex) => {
                    const card = document.createElement('div');
                    
                    // Determine CSS class based on update type
                    let typeClass = 'type-other';
                    if (update.type === 'Feature') typeClass = 'type-feature';
                    else if (update.type === 'Change') typeClass = 'type-change';
                    else if (update.type === 'Deprecated') typeClass = 'type-deprecated';
                    else if (update.type === 'Breaking Change') typeClass = 'type-breaking';
                    
                    card.className = `update-card card-glass ${typeClass}`;
                    card.dataset.id = `${entryIndex}-${update.type}-${updateIndex}`;
                    
                    // Unique reference for checking selection
                    const isSelected = selectedUpdate && selectedUpdate.id === card.dataset.id;
                    if (isSelected) {
                        card.classList.add('selected');
                    }

                    // Card structure: selection checkbox, main content, direct tweet button
                    card.innerHTML = `
                        <div class="selection-container">
                            <div class="custom-checkbox">
                                <i class="fa-solid fa-check"></i>
                            </div>
                        </div>
                        <div class="update-info">
                            <div class="badge-row">
                                <span class="type-badge badge-${update.type.toLowerCase().replace(' ', '-')}">${update.type}</span>
                                <span class="date-badge"><i class="fa-regular fa-calendar"></i> ${entry.title}</span>
                            </div>
                            <div class="update-content">
                                ${update.content_html}
                            </div>
                        </div>
                        <div class="share-action">
                            <button class="card-tweet-btn" title="Tweet this update">
                                <i class="fa-brands fa-x-twitter"></i>
                            </button>
                        </div>
                    `;

                    // Click event to toggle selection (clicking the card or checkbox)
                    card.addEventListener('click', (e) => {
                        // Prevent triggering selection when clicking a link or the share button
                        if (e.target.tagName === 'A' || e.target.closest('.card-tweet-btn') || e.target.closest('a')) {
                            return;
                        }
                        toggleSelect(card, {
                            id: card.dataset.id,
                            date: entry.title,
                            type: update.type,
                            plainText: update.plain_text,
                            link: entry.link
                        });
                    });

                    // Click event for direct tweet button
                    const tweetBtn = card.querySelector('.card-tweet-btn');
                    tweetBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openTweetModal({
                            id: card.dataset.id,
                            date: entry.title,
                            type: update.type,
                            plainText: update.plain_text,
                            link: entry.link
                        });
                    });

                    dateSec.appendChild(card);
                });

                feedContent.appendChild(dateSec);
            }
        });

        // Show appropriate state based on matches
        if (releaseData.length === 0) {
            showState('loading');
        } else if (matchCount === 0) {
            showState('empty');
        } else {
            showState('content');
        }
    }

    // Toggle card selection
    function toggleSelect(cardElement, updateObj) {
        const alreadySelected = cardElement.classList.contains('selected');
        
        // Remove selection from all cards
        document.querySelectorAll('.update-card').forEach(c => {
            c.classList.remove('selected');
        });

        if (alreadySelected) {
            selectedUpdate = null;
            hideTweetActionBar();
        } else {
            cardElement.classList.add('selected');
            selectedUpdate = updateObj;
            showTweetActionBar();
        }
    }

    function clearSelection() {
        document.querySelectorAll('.update-card').forEach(c => {
            c.classList.remove('selected');
        });
        selectedUpdate = null;
        hideTweetActionBar();
    }

    function showTweetActionBar() {
        selectedCount.textContent = '1';
        tweetActionBar.classList.add('show');
    }

    function hideTweetActionBar() {
        tweetActionBar.classList.remove('show');
    }

    // Compose Tweet Content
    function generateTweetText(updateObj) {
        const prefix = `BigQuery Update [${updateObj.date}] - ${updateObj.type}:\n`;
        const suffix = `\n\nRead more: ${updateObj.link || 'https://cloud.google.com/bigquery/docs/release-notes'}\n#BigQuery #GoogleCloud`;
        
        const maxLen = 280;
        const availableLen = maxLen - prefix.length - suffix.length;
        
        let body = updateObj.plainText;
        if (body.length > availableLen) {
            body = body.substring(0, availableLen - 3) + '...';
        }
        
        return `${prefix}${body}${suffix}`;
    }

    // Open Tweet Customizer Modal
    function openTweetModal(updateObj) {
        if (!updateObj) return;
        
        const initialText = generateTweetText(updateObj);
        tweetTextarea.value = initialText;
        updateCharCounter();
        
        previewTitle.textContent = `BigQuery Release Note (${updateObj.date})`;
        previewMeta.textContent = `Type: ${updateObj.type} | URL: ${updateObj.link || 'N/A'}`;
        
        tweetModal.classList.remove('hidden');
        tweetTextarea.focus();
    }

    function closeTweetModal() {
        tweetModal.classList.add('hidden');
    }

    function updateCharCounter() {
        const len = tweetTextarea.value.length;
        charCount.textContent = len;
        
        // Visual warning near limits
        charCount.className = '';
        if (len > 280) {
            charCount.classList.add('danger');
            publishTweetBtn.disabled = true;
        } else if (len > 250) {
            charCount.classList.add('warning');
            publishTweetBtn.disabled = false;
        } else {
            publishTweetBtn.disabled = false;
        }
    }

    // Publish to X/Twitter Web Intent
    function publishTweet() {
        const text = tweetTextarea.value;
        if (text.length > 280) return;
        
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank', 'width=550,height=420,referrerpolicy=no-referrer');
        closeTweetModal();
    }
});
