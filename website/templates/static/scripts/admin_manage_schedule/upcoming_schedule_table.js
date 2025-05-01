var upcoming_sched_table;

$(document).ready(function () {
        // Force the "Upcoming Events" tab to be active on page load
    $('#upcoming-tab').addClass('active').attr('aria-selected', 'true');
    $('#upcoming').addClass('show active');

    upcoming_sched_table = new DataTable('#upcoming_sched_table', {
        //table tools
        responsive:true,
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
            //bottomStart: 'pageLength',
            //bottomEnd: 'search',
            //bottom2Start: 'info',
            //bottom2End: 'paging', 
        
            top3Start: {  // Fixed typo
                buttons: [
                    {
                        text: '☑ Delete Selected',
                        action: function () {
                            let selectedIds = $('.select-item-upcoming:checked').map(function() {
                                return $(this).data('id');
                            }).get();
                            if (selectedIds.length === 0) {
                                Swal.fire('No items selected', 'Please select at least one item to delete.', 'warning');
                                return;
                            }
                            Swal.fire({
                                title: 'Are you sure?',
                                text: `You are about to delete ${selectedIds.length} items. This cannot be undone!`,
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonText: 'Yes, delete them!',
                                cancelButtonText: 'Cancel'
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    $.ajax({
                                        url: '/delete_selected_schedules',
                                        type: 'POST',
                                        contentType: 'application/json',
                                        data: JSON.stringify({ 'sched_ids': selectedIds }),
                                        success: function(response) {
                                            if (response.success) {
                                                $('.select-item-upcoming:checked').closest('tr').each(function() {
                                                    upcoming_sched_table.row($(this)).remove().draw();
                                                });
                                                Swal.fire({
                                                    icon: 'success',
                                                    title: 'Deleted!',
                                                    text: 'Selected items have been removed.',
                                                    timer: 1500,
                                                    timerProgressBar: true
                                                });
                                            } else {
                                                Swal.fire({
                                                    icon: 'error',
                                                    title: 'Error',
                                                    text: response.errors.join('\n'),
                                                    timer: 3000,
                                                    timerProgressBar: true
                                                });
                                            }
                                        },
                                        error: function() {
                                            Swal.fire({
                                                icon: 'error',
                                                title: 'Error',
                                                text: 'Failed to delete schedule.',
                                                timer: 3000,
                                                timerProgressBar: true
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    },
                ]
            },
        
            top3End: {
                buttons: [
                    'colvis',  // Fixed comma issue
                    {
                        extend: 'collection',
                        text: 'Export',
                        buttons: [
                            {
                                extend: 'copy',
                                title: 'UPCOMING EVENTS SCHEDULE',
                                footer: false,
                                exportOptions: { columns: ':visible', rows: ':visible' }
                            },
                            {
                                extend: 'print',
                                title: 'UPCOMING EVENTS SCHEDULE',
                                footer: false,
                                autoPrint: false,
                                exportOptions: { columns: ':visible', rows: ':visible' }
                            },
                            {
                                extend: 'excel',
                                title: 'UPCOMING EVENTS SCHEDULE',
                                footer: false,
                                exportOptions: { columns: ':visible', rows: ':visible' }
                            },
                            {
                                extend: 'csv',
                                title: 'UPCOMING EVENTS SCHEDULE',
                                footer: false,
                                exportOptions: { columns: ':visible', rows: ':visible' }
                            },
                            {
                                extend: 'pdf',
                                title: 'UPCOMING EVENTS SCHEDULE',
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
                                title: 'UPCOMING EVENTS SCHEDULE',
                                footer: false,
                                exportOptions: {
                                    columns: ':visible',
                                    modifier: { page: 'all', search: 'none' }
                                }
                            },
                            {
                                extend: 'print',
                                title: 'UPCOMING EVENTS SCHEDULE',
                                footer: false,
                                autoPrint: false,
                                exportOptions: {
                                    columns: ':visible',
                                    modifier: { page: 'all', search: 'none' }
                                }
                            },
                            {
                                extend: 'excel',
                                title: 'UPCOMING EVENTS SCHEDULE',
                                footer: false,
                                exportOptions: {
                                    columns: ':visible',
                                    modifier: { page: 'all', search: 'none' }
                                }
                            },
                            {
                                extend: 'csv',
                                title: 'UPCOMING EVENTS SCHEDULE',
                                footer: false,
                                exportOptions: {
                                    columns: ':visible',
                                    modifier: { page: 'all', search: 'none' }
                                }
                            },
                            {
                                extend: 'pdf',
                                title: 'UPCOMING EVENTS SCHEDULE',
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
        
        columnDefs: [
            {
                targets: [0,4,5], // Disable ordering for specific columns
                orderable: false
            }
        ],
        

        //table fetch data
        ajax: '/schedule_data_upcoming', 
        columns: [
            { data: 'id',
                render: function(data, type, row) {
                    return `<input type="checkbox" class="select-item-upcoming" data-id="${data}">`;
                },
                title: '<input type="checkbox" id="selectAllupcoming">'
            },
            { data: 'name' },
            { data: 'scheduled_date'},
            
            { data: 'id', 
                    render: function(data, type, row) {
                        return `
                            <button class="view_activities-btn btn btn-light btn-sm" 
                                data-id="${data}"
                                data-schedule_name="${row.name}" 
                                data-schedule_date="${row.scheduled_date}" 
                                style="display:inline;">
                                <i class="fa-regular fa-clock"></i>
                            </button>
                            <p style="display:inline;">${row.activity_count}</p> |
                            <p style="display:inline;">${row.total_fines}</p>
                        `;
                    } 
            },
            { data: 'status'},
            {
                data: 'id', // Maps to the key 'id' in the JSON
                render: function(data, type, row) {
                    return `
                        <button class="update_schedule-btn btn btn-warning btn-sm" 
                            data-id="${data}" 
                            data-schedule_name="${row.name}"
                            data-scheduled_date="${row.scheduled_date}">
                            <i class="fa-solid fa-calendar-day"></i>
                        </button>
                        <button class="delete_schedule-btn btn btn-danger btn-sm" 
                            data-id="${data}" style="display:inline;">
                            <i class="fa-solid fa-calendar-xmark"></i>
                        </button>
                    `;
                }
            },   
        ]
    });
    // Select All checkbox functionality
    $(document).on("click", "#selectAllupcoming", function() {
        // Toggle all checkboxes in the table
        var isChecked = $(this).prop('checked');
        $(".select-item-upcoming").prop('checked', isChecked);
        upcoming_sched_table.rows().select(isChecked); // Select all rows if checked
    });

});
