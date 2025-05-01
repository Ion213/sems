var ssg_acount_table
$(document).ready(function () {

    ssg_acount_table = new DataTable('#ssg_table', {
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
                            let selectedIds = $('.select-item-ssg:checked').map(function() {
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
                                        url: '/delete_selected_ssg_accounts',
                                        type: 'DELETE',
                                        contentType: 'application/json',
                                        data: JSON.stringify({ 'ssg_ids': selectedIds }),
                                        success: function(response) {
                                            if (response.success) {
                                                $('.select-item-ssg:checked').each(function() {
                                                    ssg_acount_table.row($(this).closest('tr')).remove().draw();
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

            top3End: {
                buttons: ['colvis',  // Column visibility button
                    {
                    extend: 'collection',
                    text: 'Export',
                    buttons: [
                        {extend: 'copy',
                            title: 'SSG ACCOUNT',
                            footer: false,
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },
                            
                        {extend: 'print',
                            title: 'SSG ACCOUNT',
                            footer: false,
                            autoPrint: false,
                            exportOptions: {columns: ':visible',rows: ':visible'}
                            }, 

                        {extend: 'excel',
                            title: 'SSG ACCOUNT',
                            footer: false,
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },   

                        {extend: 'csv',
                            title: 'SSG ACCOUNT',
                            footer: false,
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },

                        {extend: 'pdf',
                            title: 'SSG ACCOUNT',
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
                            title: 'SSG ACCOUNT',
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
                            title: 'SSG ACCOUNT',
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
                            title: 'SSG ACCOUNT',
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
                            title: 'SSG ACCOUNT',
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
                            title: 'SSG ACCOUNT',
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
                "targets": [0,6], // Target the first column (index 0)
                "orderable": false // Disable ordering for this column
            }
        ],

    //table fetch data
        ajax: `/ssg_account_data`,
        columns: [
            { data: 'id',
                render: function(data) {
                    return `<input type="checkbox" class="select-item-ssg" data-id="${data}">`;
                },
                title: '<input type="checkbox" id="selectAllssg">'
            },
            { data: 'name' },
            { data: 'email' },
            { data: 'password',
                render: function(data, type, row) {
                        //return data ? `
                       //${data.substring(0, 6)}...
                       //` : 
                       //'N/A';
                       return `
                        <p>${row.hide_password}</p>
                    `;
                  }
            },
            { data: 'date_registered' },
           // { data: 'date_updated' },
            { data: 'status' },
            {data: 'id',
                render: function(data, type, row) {
                    return `

                        <button class="view-logs-btn btn btn-dark btn-sm" 
                            data-id="${data}" style="display:inline;">
                          <i class="fas fa-file-alt" title="Logs"></i>
                        </button>

                        <button class="update-btn btn btn-warning btn-sm" 
                            data-id="${data}"
                            data-name="${row.name}"
                            data-email="${row.email}"
                            data-password="${row.password}"
                            style="display:inline;">
                            <i class="fa-solid fa-edit"></i>
                        </button>
                        <button class="delete-btn btn btn-danger btn-sm" 
                            data-id="${data}" style="display:inline;">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    `;
                }
            }, 
        ]
    });

    // Select All checkbox functionality
    $(document).on("click", "#selectAllssg", function() {
        // Toggle all checkboxes in the table
        var isChecked = $(this).prop('checked');
        $(".select-item-ssg").prop('checked', isChecked);
        table.rows().select(isChecked); // Select all rows if checked
    });

});