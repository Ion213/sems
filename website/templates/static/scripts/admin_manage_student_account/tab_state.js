$(document).ready(function(){
// Check if there's an active tab stored in localStorage
var activeTab = localStorage.getItem('activeTab');

    if (activeTab) {
        var targetTab = $('#account_tabs button[data-bs-target="' + activeTab + '"]');
        targetTab.tab('show');
    } else {
        $('#account_tabs button:first').tab('show');
    }

    // Listen for tab clicks and store the active tab in localStorage
    $('#account_tabs button').on('shown.bs.tab', function (e) {
        var tabId = $(e.target).attr('data-bs-target');
        localStorage.setItem('activeTab', tabId);
    });



        $('#add_students_tab').on('click', function(event) {
            student_acount_table.ajax.reload(null, false);
        });
        $('#unverified_students_tab').on('click', function(event) {
            uverified_student_table.ajax.reload(null, false);
        });
})