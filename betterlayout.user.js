// ==UserScript==
// @name         Jira Better Layout Script
// @namespace    https://github.com/HuongNV13
// @version      1.0
// @description  Jira Better Layout Script for Moodlers
// @author       Huong Nguyen
// @homepage     https://github.com/HuongNV13/moodle-userscripts
// @downloadURL  https://github.com/HuongNV13/moodle-userscripts/raw/main/betterlayout.user.js
// @updateURL    https://github.com/HuongNV13/moodle-userscripts/raw/main/betterlayout.user.js
// @match        https://moodle.atlassian.net/browse/*
// @match        https://moodle.atlassian.net/issues/*
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @grant        none
// @run-at       document-end
// ==/UserScript==
(function() {
    'use strict';

    const selectors = {
        target: 'div[data-testid="issue.views.issue-base.context.status-and-approvals-wrapper.status-and-approval"]',
        transitionButton: 'div[data-testid="issue.views.issue-base.foundation.status.status-field-wrapper"]',
        automationButton: 'div[data-testid="issue.views.issue-base.foundation.status.actions-wrapper"] button',
        freshDeskField: 'div[data-testid="issue.views.issue-base.context.ecosystem.connect.field-wrapper"]',
    };

    const updateView = () => {
        // Get the transition button element.
        const transitionElement = $(selectors.transitionButton);
        // Get the parent of the parent (grandparent).
        const grandparent = transitionElement.parent().parent().parent().parent();
        // Move the automation button to the grandparent.
        const automationButton = $(selectors.automationButton);
        automationButton.appendTo(grandparent);
        
        // Move the grandparent to the target.
        grandparent.appendTo($(selectors.target));
        console.log("Moved transition button to target area.");

        // Remove the FreshDesk fields if it exists.
        const freshDeskFields = $(selectors.freshDeskField);
        if (freshDeskFields.length > 0) {
            freshDeskFields.each(function() {
                $(this).parent().parent().remove();
            });
        }
    }

    // Wait for custom field to be available.
    const waitForCustomField = () => {
        console.log("Checking for custom field...");
        if ($(selectors.freshDeskField).length > 0 && $(selectors.target).length > 0) {
            console.log("Custom field found, calling updateView");
            updateView();
        } else {
            setTimeout(waitForCustomField, 1000);
        }
    };

    // Use a longer delay to ensure Jira has fully loaded.
    const startScript = () => {
        if (typeof AJS === 'undefined') {
            console.log("AJS not loaded yet, retrying...");
            setTimeout(startScript, 1000);
            return;
        }
        console.log("AJS loaded, starting to wait for custom field");
        waitForCustomField();
    };
    setTimeout(startScript, 2000);
    
})();
