var completed_sched_table;

$(document).ready(function () {
    completed_sched_table = new DataTable('#completed_sched_table', {
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
                            let selectedIds = $('.select-item-completed:checked').map(function() {
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
                                                $('.select-item-completed:checked').closest('tr').each(function() {
                                                    completed_sched_table.row($(this)).remove().draw();
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
                buttons: ['colvis',  // Column visibility button
                {
                    extend: 'collection',
                    text: 'Export',
                    buttons: [
                        {extend: 'copy',
                            title: 'COMPLETED EVENTS SCHEDULE',
                            footer: false,
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },
                            
                        {extend: 'print',
                            title: 'COMPLETED EVENTS  SCHEDULE',
                            footer: false,
                            autoPrint: false,
                            exportOptions: {columns: ':visible',rows: ':visible'}
                            }, 

                        {extend: 'excel',
                            title: 'COMPLETED EVENTS  SCHEDULE',
                            footer: false,
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },   

                        {extend: 'csv',
                            title: 'COMPLETED EVENTS  SCHEDULE',
                            footer: false,
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },

                        {extend: 'pdf',
                            title: 'COMPLETED EVENTS  SCHEDULE',
                            footer: false,
                            orientation: 'portrait',
                            pageSize: 'LEGAL',
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },      
                ]},

                    {
                    extend: 'collection',
                    text: 'Export All Page',
                    buttons: [
                        {extend: 'copy',
                            title: 'COMPLETED EVENTS  SCHEDULE',
                            footer: false,
                            exportOptions: {
                                columns: ':visible',
                                modifier: {
                                    page: 'all',
                                    search: 'none'   
                                    },
                                },
                        },
                            
                        {extend: 'print',
                            title: 'COMPLETED EVENTS  SCHEDULE',
                            footer: false,
                            autoPrint: false,
                            exportOptions: {
                                columns: ':visible',
                                modifier: {
                                    page: 'all',
                                    search: 'none'   
                                    },
                                },
                            }, 

                        {extend: 'excel',
                            title: 'COMPLETED EVENTS  SCHEDULE',
                            footer: false,
                            exportOptions: {
                                columns: ':visible',
                                modifier: {
                                    page: 'all',
                                    search: 'none'   
                                    },
                                },
                            },   

                        {extend: 'csv',
                            title: 'COMPLETED EVENTS  SCHEDULE',
                            footer: false,
                            exportOptions: {
                                columns: ':visible',
                                modifier: {
                                    page: 'all',
                                    search: 'none'   
                                    },
                                },
                            },

                        {extend: 'pdf',
                            title: 'COMPLETED EVENTS  SCHEDULE',
                            footer: false,
                            orientation: 'portrait',
                            pageSize: 'LEGAL',
                            exportOptions: {
                                columns: ':visible',
                                modifier: {
                                    page: 'all',
                                    search: 'none'   
                                    },
                                },
                            },

                    ]}
                    
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
        ajax: {
            url: '/schedule_data_completed',  // Fetch event data
            dataSrc: 'data',  // Specify that data is under the 'data' key
            data: function(d) {
                var selectedYear = $('#yearSelect').val();
                if (selectedYear) {
                    d.year = selectedYear;  // Send selected year with the request
                }
            },
        },
        columns: [
            { data: 'id',
                render: function(data, type, row) {
                    return `<input type="checkbox" class="select-item-completed" data-id="${data}">`;
                },
                title: '<input type="checkbox" id="selectAllcompleted">'
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
                        <button class="delete_schedule-btn btn btn-danger btn-sm" 
                            data-id="${data}" style="display:inline;">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    `;
                }
            },   
        ]
    });

     // Select All checkbox functionality
     $(document).on("click", "#selectAllcompleted", function() {
        // Toggle all checkboxes in the table
        var isChecked = $(this).prop('checked');
        $(".select-item-completed").prop('checked', isChecked);
        completed_sched_table.rows().select(isChecked); // Select all rows if checked
    });

    // ✅ Reload table when year is changed
    $('#yearSelect').change(function () {
        completed_sched_table.ajax.reload(null, false);
    });

});
