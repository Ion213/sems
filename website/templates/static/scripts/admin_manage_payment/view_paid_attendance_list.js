var paid_attendance_table;

$(document).ready(function () {
    // Show activities
    $('#transaction_history').on('click', '.btn-view-transaction-details', function () {
        var transaction_id = $(this).data('id');
        var student_name = $(this).data('student_name');
        var transaction_code = $(this).data('transaction_code');
        var date = $(this).data('date');



        $('#student_name').text(student_name +" | "+transaction_code + " | "+date);
        // Show the modal
        $('#show_paid_attendance_modal').modal('show');

        // Load activities for this event using AJAX
        loadActivities(transaction_id, student_name,date);
    });

    $('#show_paid_attendance_modal').on('shown.bs.modal', function () {
        if (paid_attendance_table) {
            paid_attendance_table.columns.adjust().draw(false);
        }
    });
    

    // Function to load activities in the modal
    function loadActivities(transaction_id) {
        
        Swal.fire({
            title: 'Fetching...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        // Destroy previous DataTable instance if it exists
        if ($.fn.DataTable.isDataTable('#paid_attendance_table')) {
            $('#paid_attendance_table').DataTable().destroy();
            
        }

        paid_attendance_table = $('#paid_attendance_table').DataTable({
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
                                    title: $('#student_name').text(),
                                    footer: false,
                                    exportOptions: { columns: ':visible', rows: ':visible' }
                                },
                                {
                                    extend: 'print',
                                    title: $('#student_name').text(),
                                    footer: false,
                                    autoPrint: false,
                                    exportOptions: { columns: ':visible', rows: ':visible' }
                                },
                                {
                                    extend: 'excel',
                                    title: $('#student_name').text(),
                                    footer: false,
                                    exportOptions: { columns: ':visible', rows: ':visible' }
                                },
                                {
                                    extend: 'csv',
                                    title: $('#student_name').text(),
                                    footer: false,
                                    exportOptions: { columns: ':visible', rows: ':visible' }
                                },
                                {
                                    extend: 'pdf',
                                    title: $('#student_name').text(),
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
                                    title: $('#student_name').text(),
                                    footer: false,
                                    exportOptions: {
                                        columns: ':visible',
                                        modifier: { page: 'all', search: 'none' }
                                    }
                                },
                                {
                                    extend: 'print',
                                    title: $('#student_name').text(),
                                    footer: false,
                                    autoPrint: false,
                                    exportOptions: {
                                        columns: ':visible',
                                        modifier: { page: 'all', search: 'none' }
                                    }
                                },
                                {
                                    extend: 'excel',
                                    title: $('#student_name').text(),
                                    footer: false,
                                    exportOptions: {
                                        columns: ':visible',
                                        modifier: { page: 'all', search: 'none' }
                                    }
                                },
                                {
                                    extend: 'csv',
                                    title:$('#student_name').text(),
                                    footer: false,
                                    exportOptions: {
                                        columns: ':visible',
                                        modifier: { page: 'all', search: 'none' }
                                    }
                                },
                                {
                                    extend: 'pdf',
                                    title: $('#student_name').text(),
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
                url: '/get_paid_attendance_data',
                type: 'GET',
                data: function () {
                    return { transaction_id: transaction_id };
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
                { data: 'event_name' },
                { data: 'event_date' },
                { data: 'activity_name' },
                { data: 'time_in' },
                { data: 'time_out' },
                { data: 'status' },
                { data: 'fines' },
                { data: 'payment_status' }

            ]
        });

        // Close Swal after loading data
        paid_attendance_table.on('xhr', function () {
            Swal.close();
        });
    }
});

