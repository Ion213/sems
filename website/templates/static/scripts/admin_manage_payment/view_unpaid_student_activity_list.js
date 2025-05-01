var unpaid_activity_attendance_table;

$(document).ready(function () {
    // Show activities
    $('#unpaid_students_attendance_table').on('click', '.view-unpaid-activity-btn', function () {
        var student_id = $(this).data('id');
        var schedule_name = $(this).data('schedule_name');
        var schedule_date = $(this).data('schedule_date');
        var sched_activity_sched_id = $(this).data('sched_activity_sched_id');

        $('#Unpaid_schedule_name').text(schedule_name +" "+schedule_date);
        // Show the modal
        $('#show_unpaid_activity_attendance_modal').modal('show');

        // Load activities for this event using AJAX
        loadUnpaidActivities(sched_activity_sched_id, student_id);
    });

    $('#show_unpaid_activity_attendance_modal').on('shown.bs.modal', function () {
        if (unpaid_activity_attendance_table) {
            unpaid_activity_attendance_table.columns.adjust().draw(false);
        }
    });
    

    // Function to load activities in the modal
    function loadUnpaidActivities(sched_activity_sched_id, student_id) {

        Swal.fire({
            title: 'Fetching...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        // Destroy previous DataTable instance if it exists
        if ($.fn.DataTable.isDataTable('#unpaid_activity_attendance_table')) {
            $('#unpaid_activity_attendance_table').DataTable().destroy();
        }

        unpaid_activity_attendance_table = $('#unpaid_activity_attendance_table').DataTable({
            destroy: true,
            responsive: true,
            stateSave: true,
            paging: true,
            scrollCollapse: true,
            scrollX: true,
            scrollY: '50vh',
            select: true,
            layout: {
                top1Start: 'pageLength',
                top1End: 'search',
                topStart: 'info',
                topEnd: 'paging',

                top3Start: {
                    buttons: [
                        'colvis',  // Fixed comma issue
                        {
                            extend: 'collection',
                            text: 'Export',
                            buttons: [
                                {
                                    extend: 'copy',
                                    title: $('#Unpaid_schedule_name').text(),
                                    footer: false,
                                    exportOptions: { columns: ':visible', rows: ':visible' }
                                },
                                {
                                    extend: 'print',
                                    title: $('#Unpaid_schedule_name').text(),
                                    footer: false,
                                    autoPrint: false,
                                    exportOptions: { columns: ':visible', rows: ':visible' }
                                },
                                {
                                    extend: 'excel',
                                    title: $('#Unpaid_schedule_name').text(),
                                    footer: false,
                                    exportOptions: { columns: ':visible', rows: ':visible' }
                                },
                                {
                                    extend: 'csv',
                                    title: $('#Unpaid_schedule_name').text(),
                                    footer: false,
                                    exportOptions: { columns: ':visible', rows: ':visible' }
                                },
                                {
                                    extend: 'pdf',
                                    title: $('#Unpaid_schedule_name').text(),
                                    footer: false,
                                    orientation: 'portrait',  // Fixed typo
                                    pageSize: 'LEGAL',
                                    exportOptions: { columns: ':visible', rows: ':visible' }
                                }
                            ]
                        },
                        {
                            extend: 'collection',
                            text: 'Export All Page',
                            buttons: [
                                {
                                    extend: 'copy',
                                    title: $('#Unpaid_schedule_name').text(),
                                    footer: false,
                                    exportOptions: {
                                        columns: ':visible',
                                        modifier: { page: 'all', search: 'none' }
                                    }
                                },
                                {
                                    extend: 'print',
                                    title: $('#Unpaid_schedule_name').text(),
                                    footer: false,
                                    autoPrint: false,
                                    exportOptions: {
                                        columns: ':visible',
                                        modifier: { page: 'all', search: 'none' }
                                    }
                                },
                                {
                                    extend: 'excel',
                                    title: $('#Unpaid_schedule_name').text(),
                                    footer: false,
                                    exportOptions: {
                                        columns: ':visible',
                                        modifier: { page: 'all', search: 'none' }
                                    }
                                },
                                {
                                    extend: 'csv',
                                    title: $('#Unpaid_schedule_name').text(),
                                    footer: false,
                                    exportOptions: {
                                        columns: ':visible',
                                        modifier: { page: 'all', search: 'none' }
                                    }
                                },
                                {
                                    extend: 'pdf',
                                    title: $('#Unpaid_schedule_name').text(),
                                    footer: false,
                                    orientation: 'portrait',  // Fixed typo
                                    pageSize: 'LEGAL',
                                    exportOptions: {
                                        columns: ':visible',
                                        modifier: { page: 'all', search: 'none' }
                                    }
                                }
                            ]
                        }
                    ]
                }
            },
            ajax: {
                url: '/get_selected_unpaid_activity_attendance_data',
                type: 'GET',
                data: function () {
                    return { schedule_id: sched_activity_sched_id,student_id:student_id };
                },
                dataSrc: function (json) {
                    if (!json.success) {
                        Swal.fire('Error', json.message, 'error');
                        return [];
                    }
                    return json.data;
                },
                error: function (xhr, error, thrown) {
                    Swal.fire('Error', 'Failed to fetch data: ' + xhr.responseText, 'error');
                }
            },

            columns: [
                { data: 'activity_name' },
                { data: 'time_in' },
                { data: 'time_out' },
                { data: 'status' },
                { data: 'fines' },
                { data: 'payment_status' }
            ]
        });

        // Close Swal after loading data
        unpaid_activity_attendance_table.on('xhr', function () {
            Swal.close();
        });
    }
});
