var activity_table;

$(document).ready(function () {
    // Show activities
    $(document).on('click', '.view_activities-btn', function () {
        var schedule_id = $(this).data('id');
        var schedule_name = $(this).data('schedule_name');
        var schedule_date = $(this).data('schedule_date');

        $('#sched_name').text(schedule_name +" "+schedule_date);
        // Show the modal
        $('#show_activities_modal').modal('show');

        // Load activities for this event using AJAX
        loadActivities(schedule_id, schedule_name);
    });

    $('#show_activities_modal').on('shown.bs.modal', function () {
        if (activity_table) {
            activity_table.columns.adjust().draw(false);
        }
    });
    

    // Function to load activities in the modal
    function loadActivities(schedule_id, schedule_name) {
        Swal.fire({
            title: 'Fetching...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        // Destroy previous DataTable instance if it exists
        if ($.fn.DataTable.isDataTable('#activity_table')) {
            $('#activity_table').DataTable().destroy();
        }

        activity_table = $('#activity_table').DataTable({
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
                                    title: schedule_name,
                                    footer: false,
                                    exportOptions: { columns: ':visible', rows: ':visible' }
                                },
                                {
                                    extend: 'print',
                                    title: schedule_name,
                                    footer: false,
                                    autoPrint: false,
                                    exportOptions: { columns: ':visible', rows: ':visible' }
                                },
                                {
                                    extend: 'excel',
                                    title: schedule_name,
                                    footer: false,
                                    exportOptions: { columns: ':visible', rows: ':visible' }
                                },
                                {
                                    extend: 'csv',
                                    title: schedule_name,
                                    footer: false,
                                    exportOptions: { columns: ':visible', rows: ':visible' }
                                },
                                {
                                    extend: 'pdf',
                                    title: schedule_name,
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
                                    title: schedule_name,
                                    footer: false,
                                    exportOptions: {
                                        columns: ':visible',
                                        modifier: { page: 'all', search: 'none' }
                                    }
                                },
                                {
                                    extend: 'print',
                                    title: schedule_name,
                                    footer: false,
                                    autoPrint: false,
                                    exportOptions: {
                                        columns: ':visible',
                                        modifier: { page: 'all', search: 'none' }
                                    }
                                },
                                {
                                    extend: 'excel',
                                    title: schedule_name,
                                    footer: false,
                                    exportOptions: {
                                        columns: ':visible',
                                        modifier: { page: 'all', search: 'none' }
                                    }
                                },
                                {
                                    extend: 'csv',
                                    title: schedule_name,
                                    footer: false,
                                    exportOptions: {
                                        columns: ':visible',
                                        modifier: { page: 'all', search: 'none' }
                                    }
                                },
                                {
                                    extend: 'pdf',
                                    title: schedule_name,
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
                url: '/sched_activities_data',
                type: 'GET',
                data: function () {
                    return { sched_id: schedule_id };
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
                { data: 'name' },
                { data: 'start_time' },
                { data: 'end_time' },
                { data: 'fines' }
            ]
        });

        // Close Swal after loading data
        activity_table.on('xhr', function () {
            Swal.close();
        });
    }
});
