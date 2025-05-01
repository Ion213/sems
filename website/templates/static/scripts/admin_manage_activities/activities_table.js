 //RENDER Activities DATA
 var activity_table

 $(document).ready(function() {
    //var selected_event_Id = "{{ selected_event.id }}";

    var selected_event_Id = document.getElementById('activity_table').dataset.eventId;
    var selected_event_Name = document.getElementById('activity_table').dataset.eventName;

    activity_table = new DataTable('#activity_table', {
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
                            let selectedIds = $('.select-item-activities:checked').map(function() {
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
                                        url: '/delete_selected_activities',
                                        type: 'DELETE',
                                        contentType: 'application/json',
                                        data: JSON.stringify({ 'activities_ids': selectedIds }),
                                        success: function(response) {

                                            if (response.success) {
                                                $('.select-item-activities:checked').closest('tr').each(function() {
                                                    activity_table.row($(this)).remove().draw();
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
                                        error: function() {
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
                    }
                ],
            },

            top3End: {
                buttons: ['colvis',
                    {
                    extend: 'collection',
                    text: 'Export',
                    buttons: [
                        {extend: 'copy',
                            title: selected_event_Name,
                            footer: false,
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },
                            
                        {extend: 'print',
                            title: selected_event_Name,
                            footer: false,
                            autoPrint: false,
                            exportOptions: {columns: ':visible',rows: ':visible'}
                            }, 

                        {extend: 'excel',
                            title: selected_event_Name,
                            footer: false,
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },   

                        {extend: 'csv',
                            title: selected_event_Name,
                            footer: false,
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },

                        {extend: 'pdf',
                            title: selected_event_Name,
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
                            title: selected_event_Name,
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
                            title: selected_event_Name,
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
                            title: selected_event_Name,
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
                            title: selected_event_Name,
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
                            title: selected_event_Name,
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

                    ]},
                ]
            }
        }, 
        columnDefs: [
            {
                "targets": [0,5], // Target the first column (index 0)
                "orderable": false // Disable ordering for this column
            }
        ],


    //table fetch data

        ajax: {
            url: '/activities_data',
            type: 'GET',
            data: function(d) {
                return { event_id: selected_event_Id }; // Pass data correctly
            },
            contentType: 'application/json'
        },

        columns: [

            { data: 'id',
                render: function(data, type, row) {
                    return `<input type="checkbox" class="select-item-activities" data-id="${data}">`;
                },
                title: '<input type="checkbox" id="selectAllactivities">'
            },


            { data: 'activity_name' },
            { data: 'start_time' },
            { data: 'end_time' },
            { data: 'fines',
                render: function(data, type, row) {
                    return `
                        <p>&#8369;${data}</p>
                       
                    `;
                }

             },
            {data: 'id',
                render: function(data, type, row) {
                    return `
                        <button class="update-btn btn btn-warning btn-sm" 
                            data-id="${data}" 
                            data-activity_name="${row.activity_name}"
                            data-start_time="${row.start_time}"
                            data-end_time="${row.end_time}" 
                            data-fines="${row.fines}" 
                            style="display:inline;">
                            <i class="fa-solid fa-edit"></i>
                        </button>
                        <button class="delete-btn btn btn-danger btn-sm" 
                            data-id="${data}" 
                            style="display:inline;">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                     `;
                }
            }
        ]
    });

    // Select All checkbox functionality
    $(document).on("click", "#selectAllactivities", function() {
        // Toggle all checkboxes in the table
        var isChecked = $(this).prop('checked');
        $(".select-item-activities").prop('checked', isChecked);
        activity_table.rows().select(isChecked); // Select all rows if checked
    });

});