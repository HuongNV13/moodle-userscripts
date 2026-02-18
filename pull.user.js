// ==UserScript==
// @name         Pull Helper Script
// @namespace    https://github.com/HuongNV13
// @version      1.3
// @description  Moodle Pull Helper Script for Integrators
// @author       Huong Nguyen
// @homepage     https://github.com/HuongNV13/moodle-userscripts
// @downloadURL  https://github.com/HuongNV13/moodle-userscripts/raw/main/pull.user.js
// @updateURL    https://github.com/HuongNV13/moodle-userscripts/raw/main/pull.user.js
// @match        https://moodle.atlassian.net/browse/*
// @match        https://moodle.atlassian.net/issues/*
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @grant        none
// @run-at       document-end
// ==/UserScript==
(function() {
    'use strict';

    const userScript = function() {
        const selectors = {
            pullRepo: 'div[data-testid*="customfield_10244"] a',
            target: 'div[data-testid="issue.views.issue-base.context.status-and-approvals-wrapper.status-and-approval"]',
        };
        const branches = [
        {
            shortname: 'Main',
            customField: '10221',
            branchname: 'main',
        },
        {
            shortname: '5.1',
            customField: '11075',
            branchname: 'MOODLE_501_STABLE',
        },
        {
            shortname: '5.0',
            customField: '10218',
            branchname: 'MOODLE_500_STABLE',
        },
        {
            shortname: '4.5',
            customField: '10230',
            branchname: 'MOODLE_405_STABLE',
        },
        {
            shortname: '4.4',
            customField: '10216',
            branchname: 'MOODLE_404_STABLE',
        },
        {
            shortname: '4.1',
            customField: '10217',
            branchname: 'MOODLE_401_STABLE',
        },
        ];

        const showMessage = (type, message) => {
        // Try AJS flag first.
        if (typeof AJS !== 'undefined' && AJS.flag) {
            AJS.flag({
                type: type,
                body: message,
                close: 'auto'
            });
        } else {
            // Fallback to custom notification.
            const notification = $(`
                <div class="aui-message aui-message-${type}" style="position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 300px;">
                    <p class="title">
                        <strong>${type === 'success' ? 'Success!' : 'Error!'}</strong>
                    </p>
                    <p>${message}</p>
                </div>
            `);
            $('body').append(notification);

            // Auto-remove after 3 seconds.
            setTimeout(() => {
                notification.fadeOut(() => notification.remove());
            }, 3000);
        }
        };

        const handleMergeCommand = (branch, pullBranch) => {
        console.log('Merge command for', branch.branchname, 'with pull branch:', pullBranch);

        // Get the Github repository URL.
        let gitRepo = $(selectors.pullRepo).attr('href');
        if (!gitRepo || !gitRepo.length) {
            console.error('Git repository URL not found');
            return;
        }

        // Ensure proper git protocol.
        gitRepo = gitRepo.replace('git://github.com', 'https://github.com');

        // Generate git command.
        const gitCommand = `git checkout ${branch.branchname} && git reset --hard origin/${branch.branchname} && git fetch ${gitRepo} ${pullBranch} && git merge --no-ff --no-edit FETCH_HEAD`;

        console.log('Generated git command:', gitCommand);

        // Copy to clipboard.
        navigator.clipboard.writeText(gitCommand).then(() => {
            console.log('Git command copied to clipboard');
            showMessage('success', `Git merge command for ${branch.shortname} has been copied to clipboard.`);
        }).catch(err => {
            console.error('Failed to copy to clipboard:', err);
            showMessage('error', 'Failed to copy git merge command to clipboard.');
        });
        };

        const handlePushCommand = (branchesToPush) => {
        console.log('Push command for branches:', branchesToPush);

        // Generate git push command.
        const gitPushCommand = `git push origin ${branchesToPush.join(' ')}`;

        console.log('Generated git push command:', gitPushCommand);

        // Copy to clipboard.
        navigator.clipboard.writeText(gitPushCommand).then(() => {
            console.log('Git push command copied to clipboard');
            showMessage('success', 'Git push command has been copied to clipboard.');
        }).catch(err => {
            console.error('Failed to copy to clipboard:', err);
            showMessage('error', 'Failed to copy git push command to clipboard.');
        });
        };

        const updateView = () => {
        // Get the Github repository URL.
        let gitRepo = $(selectors.pullRepo).attr('href');
        if (!gitRepo || !gitRepo.length) {
            return;
        }
        // https://github.blog/2021-09-01-improving-git-protocol-security-github/#no-more-unauthenticated-git.
        gitRepo = gitRepo.replace('git://github.com', 'https://github.com');
        const githubRepoName = gitRepo.replace('moodle.git', 'moodle');

        // Store pullBranch data for each branch
        const branchData = [];
        const availableBranches = [];

        // Create content for branches
        let branchContent = '<div style="padding-left: 8px; padding-right: 8px;"><h2 style="font-size: 1em;">Integration</h2>';

        branches.forEach((branch, index) => {
            // Get the pullBranch for this branch.
            const pullBranchSelector = `div[data-testid="issue.views.field.single-line-text.read-view.customfield_${branch.customField}"]`;
            const pullBranchNode = $(pullBranchSelector);
            if (pullBranchNode.length) {
                const remoteBranchName = pullBranchNode.text().trim();

                // Store branch data with pullBranch.
                branchData[index] = { ...branch, remoteBranchName };
                availableBranches.push(branch.branchname);

                console.log(`Pull branch for ${branch.shortname}:`, remoteBranchName);

                branchContent += `
                    <div style="display: flex; margin-bottom: 4px; align-items: center;">
                        <div style="flex: 1; font-weight: bold;">${branch.shortname}</div>
                        <div style="flex: 1; display: flex; justify-content: center;">
                            <a href="${githubRepoName}/actions?query=branch%3A${remoteBranchName}">
                                <img src="${githubRepoName}/actions/workflows/push.yml/badge.svg?branch=${remoteBranchName}" alt="Build status badge for the ${remoteBranchName} branch"/>
                            </a>
                        </div>
                        <div style="flex: 1; display: flex; justify-content: flex-end;">
                            <button class="aui-button aui-button-secondary merge-btn" data-branch-index="${index}">Merge command</button>
                        </div>
                    </div>
                `;
            }
        });

        // Add push command section.
        branchContent += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; align-items: center; border-top: 1px solid rgba(128, 128, 128, 0.3); padding-top: 8px; margin-top: 8px;">
                <div style="font-weight: bold;">Push command</div>
                <button class="aui-button aui-button-primary push-btn">Push command</button>
            </div>
        `;

        branchContent += '</div>';

        // Create empty div with id userscript_moodle_merger.
        const userscriptDiv = $('<div>', {
            id: 'userscript_moodle_merger',
            html: branchContent,
            css: {
                'border': '1px solid rgba(128, 128, 128, 0.3)',
                'border-radius': '4px',
                'margin-bottom': '8px'
            }
        });

        // Insert it after selectors.target.
        $(selectors.target).after(userscriptDiv);

        // Bind click events to merge buttons
        $('.merge-btn').on('click', function() {
            const branchIndex = $(this).data('branch-index');
            const branchWithPullBranch = branchData[branchIndex];
            handleMergeCommand(branchWithPullBranch, branchWithPullBranch.remoteBranchName);
        });

        // Bind click event to push button.
        $('.push-btn').on('click', function() {
            handlePushCommand(availableBranches);
        });
        };

        // Wait for custom field to be available.
        const waitForCustomField = () => {
            console.log("Checking for custom field...");
            // Check if our injected element already exists
            if ($('#userscript_moodle_merger').length > 0) {
                console.log("Userscript element already exists, skipping injection");
                return;
            }
            
            if ($(selectors.pullRepo).length > 0 && $(selectors.target).length > 0) {
                console.log("Custom field found, calling updateView");
                updateView();
            } else {
                setTimeout(waitForCustomField, 1000);
            }
        };

        // Use AJS.toInit if available, otherwise fallback to polling
        const startScript = () => {
            if (typeof AJS !== 'undefined' && typeof AJS.toInit === 'function') {
                console.log("AJS available, using AJS.toInit");
                AJS.toInit(() => {
                    console.log("AJS ready, starting to wait for custom field");
                    waitForCustomField();
                });
            } else if (typeof AJS === 'undefined') {
                console.log("AJS not loaded yet, retrying...");
                setTimeout(startScript, 1000);
            } else {
                // AJS exists but toInit not available, proceed anyway
                console.log("AJS loaded without toInit, starting to wait for custom field");
                waitForCustomField();
            }
        };

        // Initialize on page load
        setTimeout(startScript, 2000);

        // Watch for DOM changes (Jira SPA navigation)
        const observer = new MutationObserver((mutations) => {
            // Check if our injected element exists
            if ($('#userscript_moodle_merger').length === 0) {
                console.log("DOM changed and userscript element is missing, re-initializing...");
                // Debounce: wait a bit before re-injecting to avoid multiple calls
                clearTimeout(window.userscriptReinitTimeout);
                window.userscriptReinitTimeout = setTimeout(() => {
                    waitForCustomField();
                }, 500);
            }
        });

        // Observe the entire document for changes
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    // Execute the script.
    userScript();
})();