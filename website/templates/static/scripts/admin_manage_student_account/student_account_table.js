var student_acount_table
$(document).ready(function () {


    student_acount_table = new DataTable('#student_table', {
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
                            let selectedIds = $('.select-item-students:checked').map(function() {
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
                                        url: '/delete_selected_students_account',
                                        type: 'DELETE',
                                        contentType: 'application/json',
                                        data: JSON.stringify({ 'student_ids': selectedIds }),
                                        success: function(response) {
                                            if (response.success) {
                                                $('.select-item-students:checked').each(function() {
                                                    student_acount_table.row($(this).closest('tr')).remove().draw();
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
                                                    timer: 3000,
                                                    timerProgressBar: true
                                                });
                                            }
                                        },
                                        error: function(xhr, status, error) {
                                            Swal.fire({
                                                icon: 'error',
                                                title: 'Error',
                                                text: 'An error occurred: ' + error,
                                                timer: 3000,
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
                            title: 'STUDENTS ACCOUNT',
                            footer: false,
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },
                            
                        {extend: 'print',
                            title: 'STUDENTS ACCOUNT',
                            footer: false,
                            autoPrint: false,
                            exportOptions: {columns: ':visible',rows: ':visible'}
                            }, 

                        {extend: 'excel',
                            title: 'STUDENTS ACCOUNT',
                            footer: false,
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },   

                        {extend: 'csv',
                            title: 'STUDENTS ACCOUNT',
                            footer: false,
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },

                        {extend: 'pdf',
                            title: 'STUDENTS ACCOUNT',
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
                            title: 'STUDENTS ACCOUNT',
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
                            title: 'STUDENTS ACCOUNT',
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
                            title: 'STUDENTS ACCOUNT',
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
                            title: 'STUDENTS ACCOUNT',
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
                            title: 'STUDENTS ACCOUNT',
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
                    "targets": [0,11], // Target the first column (index 0)
                    "orderable": false // Disable ordering for this column
                }
            ],

    //table fetch data
        //ajax: `/student_account_data`,
        ajax: {
            url: '/student_account_data',  // Fetch event data
            dataSrc: 'data',  // Specify that data is under the 'data' key
            data: function(d) {
                var selectedCourse = $('#courseSelect').val();
                var selectedYear = $('#yearSelect').val();
                var selectedSection = $('#sectionSelect').val();
                if (selectedCourse ||selectedYear||selectedSection) {
                    d.course = selectedCourse; 
                    d.year = selectedYear;  
                    d.section = selectedSection;  
                }
            },
        },
        columns: [
            { data: 'id',
                render: function(data) {
                    return `<input type="checkbox" class="select-item-students" data-id="${data}">`;
                },
                title: '<input type="checkbox" id="selectAllstudents">'
            },
            { data: 'student_ID' },
            { data: 'first_name' },
            { data: 'last_name' },
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
            { data: 'department' },
            { data: 'year' },
            { data: 'section' },
            { data: 'date_registered' },
            //{ data: 'date_updated' },
            { data: 'status' },
            {data: 'id',
                render: function(data, type, row) {
                    return `
                        <button class="update-btn btn btn-warning btn-sm" 
                            data-id="${data}"
                            data-student_id="${row.student_ID}"
                            data-first_name="${row.first_name}" 
                            data-last_name="${row.last_name}"
                            data-email="${row.email}"
                            data-password="${row.password}"
                            data-department="${row.department}"
                            data-year="${row.year}"
                            data-section="${row.section}"
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
    $(document).on("click", "#selectAllstudents", function() {
        // Toggle all checkboxes in the table
        var isChecked = $(this).prop('checked');
        $(".select-item-students").prop('checked', isChecked);
        student_acount_table.rows().select(isChecked); // Select all rows if checked
    });

    // ✅ Reload table when year is changed
    $('#courseSelect,#yearSelect,#sectionSelect').change(function () {
        student_acount_table.ajax.reload(null, false);
    });
    $("#refresh").click(function() {
        // Reset all dropdowns to the default "Not Filtered" option
        $("#courseSelect").val("");
        $("#yearSelect").val("");
        $("#sectionSelect").val("");

        // Trigger the change event to refresh the table
        $("#courseSelect, #yearSelect, #sectionSelect").trigger("change");
    });

});