$(document).ready(function(){
    // === TAB PERSISTENCE ===
    var activeTab = localStorage.getItem('activeTab');

    if (activeTab) {
        $('#eventTabs button[data-bs-target="' + activeTab + '"]').tab('show');
        $(activeTab).addClass('show active');
    } else {
        $('#eventTabs button:first').tab('show');
        $('#ongoing').addClass('show active');
    }

    $('#eventTabs button').on('shown.bs.tab', function (e) {
        var tabId = $(e.target).attr('data-bs-target');
        localStorage.setItem('activeTab', tabId);
    });


    // Listen for clicks on tabs to reload data
    $('#ongoing-tab').on('click', function(event) {
        ongoing_attendance_table.ajax.reload(null, false);
    });

})