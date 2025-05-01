
$(document).ready(function () {

            // Check if there's an active tab stored in localStorage
            var activeTab = localStorage.getItem('activeTab');

            if (activeTab) {
                // Activate the stored tab using Bootstrap's tab API
                var targetTab = $('#eventTabs button[data-bs-target="' + activeTab + '"]');
                targetTab.tab('show');
            } else {
                // If no tab is stored, activate the first tab by default
                $('#eventTabs button:first').tab('show');
            }
    
            // Listen for tab clicks and store the active tab in localStorage
            $('#eventTabs button').on('shown.bs.tab', function (e) {
                var tabId = $(e.target).attr('data-bs-target');
                localStorage.setItem('activeTab', tabId);
            });

            
    // Listen for clicks on tabs
    $('#upcoming-tab').on('click', function(event) {
        upcoming_sched_table.ajax.reload(null, false);
    });

        // Listen for clicks on tabs
        $('#ongoing-tab').on('click', function(event) {
            ongoing_sched_table.ajax.reload(null, false);
        });

            // Listen for clicks on tabs
    $('#completed-tab').on('click', function(event) {
        completed_sched_table.ajax.reload(null, false);
    });

});
