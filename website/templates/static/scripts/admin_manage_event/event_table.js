var events_table;

$(document).ready(function() {
    events_table = new DataTable('#event_table', {  // Use consistent variable name
        //table tools
        responsive:true,
        stateSave: true,
        paging: true,
        scrollCollapse: true,
        scrollX: true,
        scrollY: '120vh',
        select: {
            style: 'multi'  // Enable multi-selection of rows
        },

        layout: {
            top1Start: 'pageLength',
            top1End: 'search',
            topStart: 'info',
            topEnd: 'paging',
            //bottomStart: 'pageLength',
            //bottomEnd: 'search',
            //bottom2Start: 'info',
            //bottom2End: 'paging',

            top3start: {
                buttons:[
                    {
                        text: '☑ Delete Selected',
                        action: function () {
                            let selectedIds = $('.select-item-events:checked').map(function() {
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
                                    Swal.fire({
                                        title: 'Deleting...',
                                        allowOutsideClick: false,
                                        didOpen: () => Swal.showLoading()
                                    });
                                    $.ajax({
                                        url: '/delete_selected_events',
                                        type: 'DELETE',
                                        contentType: 'application/json',
                                        data: JSON.stringify({ 'event_ids': selectedIds }),
                                        success: function(response) {
                                            if (response.success) {
                                                $('.select-item-events:checked').each(function() {
                                                    events_table.row($(this).closest('tr')).remove().draw();
                                                });
                                                Swal.fire({
                                                    icon: 'success',
                                                    title: 'Deleted!',
                                                    text: response.message,
                                                    timer: 1500,
                                                    timerProgressBar: true
                                                });
                                            } else {
                                                Swal.fire({
                                                    icon: 'error',
                                                    title: 'Error',
                                                    text: response.message,
                                                    timer: 1500,
                                                    timerProgressBar: true
                                                });
                                            }
                                        },
                                        error: function(xhr, status, error) {
                                            Swal.fire({
                                                icon: 'error',
                                                title: 'Error',
                                                text: 'An error occurred: ' + error,
                                                timer: 1500,
                                                timerProgressBar: true
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    },
                ],
            },

            top3end: {
                
                buttons: ['colvis',  // Column visibility button
                {
                    extend: 'collection',
                    text: 'Export',
                    buttons: [
                        {extend: 'copy',
                            title: 'EVENTS',
                            footer: false,
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },
                            
                        {extend: 'print',
                            title: 'EVENTS',
                            footer: false,
                            autoPrint: false,
                            exportOptions: {columns: ':visible',rows: ':visible'}
                            }, 

                        {extend: 'excel',
                            title: 'EVENTS',
                            footer: false,
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },   

                        {extend: 'csv',
                            title: 'EVENTS',
                            footer: false,
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },

                        {extend: 'pdf',
                            title: 'EVENTS',
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
                            title: 'EVENTS',
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
                            title: 'EVENTS',
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
                            title: 'EVENTS',
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
                            title: 'EVENTS',
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
                            title: 'EVENTS',
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
                            }

                    ]}
                ]
            }
        }, 
        columnDefs: [
            {
                "targets": [0,6], // Target the first column (index 0)
                "orderable": false // Disable ordering for this column
            },
        ],

        ajax: '/event_data',

        columns: [
            { data: 'id',
                render: function(data) {
                    return `<input type="checkbox" class="select-item-events" data-id="${data}">`;
                },
                title: '<input type="checkbox" id="selectAllevents">'
            },
            { data: 'name' },
            { data: 'description' },
            { data: 'id',
                render: function(data, type, row) {
                    return `
                        <a href="/manage_activities_page/${data}" class="btn btn-light btn-sm">
                           <i class="fa-solid fa-edit"></i>
                        </a>
                        <p style="display:inline;">${row.activity_counts}</p> |
                        <p style="display:inline;">&#8369;${row.total_fines}</p>
                    `;
                }
            },
            { data: 'date_created' },
            { data: 'date_updated' },
            { data: 'id',
                render: function(data, type, row) {
                    return `
                        <button class="update-btn btn btn-warning btn-sm" 
                            data-id="${data}" 
                            data-name="${row.name}" 
                            data-description="${row.description}" style="display:inline;">
                            <i class="fa-solid fa-edit"></i>
                        </button>
                        <button class="delete-btn btn btn-danger btn-sm" 
                            data-id="${data}" style="display:inline;">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    `;
                }
            }   
        ],
    });   

    // Select All checkbox functionality
    $(document).on("click", "#selectAllevents", function() {
        // Toggle all checkboxes in the table
        var isChecked = $(this).prop('checked');
        $(".select-item-events").prop('checked', isChecked);
        table.rows().select(isChecked); // Select all rows if checked
    });
        /*
        // When the year is selected, reload the table data
        $('#yearSelect').change(function() {
            table.ajax.reload();  // Reload the table with the selected year
        }); */

      /*       //When the year or name is selected, reload the table data
    $('#yearSelect, #nameFilter').on('change keyup', function() {
        table.ajax.reload();  // Reload the table with the selected year and name filter
    });*/

});
