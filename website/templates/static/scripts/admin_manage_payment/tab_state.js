$(document).ready(function () {


     // Manually set the active tab
     $('#upcoming-tab').addClass('active').attr('aria-selected', 'true');
     $('#add-payment').addClass('show active');
    // Check if there's an active tab stored in localStorage
    var activeTab = localStorage.getItem('activeTab');

    if (activeTab) {
        // Activate the stored tab using Bootstrap's tab API
        var targetTab = $('#paymentTabs a[href="' + activeTab + '"]');
        targetTab.tab('show');
    } else {
        // If no tab is stored, activate the first tab by default
        $('#paymentTabs a:first').tab('show');
    }

    // Listen for tab clicks and store the active tab in localStorage
    $('#paymentTabs a').on('shown.bs.tab', function (e) {
        var tabId = $(e.target).attr('href');
        localStorage.setItem('activeTab', tabId);
    });

    // Listen for clicks on the tabs to trigger any table reload if needed
    $('#transaction-tab').on('click', function(event) {
        // Add your specific table reload logic here if necessary
        transaction_history.ajax.reload(null, false);
    });

    $('#unpaid-students-tab').on('click', function(event) {
        // Add your specific table reload logic here if necessary
        unpaid_students_attendance_table.ajax.reload(null, false);
        
    });

});