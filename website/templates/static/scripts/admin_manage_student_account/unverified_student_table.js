var uverified_student_table
$(document).ready(function () {


    uverified_student_table = new DataTable('#unverified_student_table', {
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
                    text: '☑ Accept Selected',
                    action: function () {
                        let selectedIds = $('.select-item-unverified_students:checked').map(function() {
                            return $(this).data('id');
                        }).get();
                        if (selectedIds.length === 0) {
                            Swal.fire('No items selected', 'Please select at least one item to accept.', 'warning');
                            return;
                        }
                        Swal.fire({
                            title: 'Are you sure?',
                            text: `You are about to accept ${selectedIds.length} items.`,
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonText: 'Yes, accept them!',
                            cancelButtonText: 'Cancel'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                Swal.fire({
                                    title: 'Verifying...',
                                    allowOutsideClick: false,
                                    didOpen: () => Swal.showLoading()
                                });
                                $.ajax({
                                    url: '/verify_selected_students_account',
                                    type: 'PUT',
                                    contentType: 'application/json',
                                    data: JSON.stringify({ 'student_ids': selectedIds }),
                                    success: function(response) {
                                        if (response.success) {
                                            $('.select-item-unverified_students:checked').each(function() {
                                                uverified_student_table.row($(this).closest('tr')).remove().draw();
                                            });
                                            Swal.fire({
                                                icon: 'success',
                                                title: 'Accounts Verified!!',
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
                    {
                        text: '✖ Decline Selected',
                        action: function () {
                            let selectedIds = $('.select-item-unverified_students:checked').map(function() {
                                return $(this).data('id');
                            }).get();
                            if (selectedIds.length === 0) {
                                Swal.fire('No items selected', 'Please select at least one item to decline.', 'warning');
                                return;
                            }
                            Swal.fire({
                                title: 'Are you sure?',
                                text: `You are about to decline ${selectedIds.length} items. This cannot be undone!`,
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonText: 'Yes, decline them!',
                                cancelButtonText: 'Cancel'
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    Swal.fire({
                                        title: 'Declining...',
                                        allowOutsideClick: false,
                                        didOpen: () => Swal.showLoading()
                                    });
                                    $.ajax({
                                        url: '/decline_selected_students_account',
                                        type: 'DELETE',
                                        contentType: 'application/json',
                                        data: JSON.stringify({ 'student_ids': selectedIds }),
                                        success: function(response) {
                                            if (response.success) {
                                                $('.select-item-unverified_students:checked').each(function() {
                                                    uverified_student_table.row($(this).closest('tr')).remove().draw();
                                                });
                                                Swal.fire({
                                                    icon: 'success',
                                                    title: 'Declined!',
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
                            title: 'UNVERIFIED STUDENTS ACCOUNT',
                            footer: false,
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },
                            
                        {extend: 'print',
                            title: 'UNVERIFIED STUDENTS ACCOUNT',
                            footer: false,
                            autoPrint: false,
                            exportOptions: {columns: ':visible',rows: ':visible'}
                            }, 

                        {extend: 'excel',
                            title: 'UNVERIFIED STUDENTS ACCOUNT',
                            footer: false,
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },   

                        {extend: 'csv',
                            title: 'UNVERIFIED STUDENTS ACCOUNT',
                            footer: false,
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },

                        {extend: 'pdf',
                            title: 'UNVERIFIED STUDENTS ACCOUNT',
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
                            title: 'UNVERIFIED STUDENTS ACCOUNT',
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
                            title: 'UNVERIFIED STUDENTS ACCOUNT',
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
                            title: 'UNVERIFIED STUDENTS ACCOUNT',
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
                            title: 'UNVERIFIED STUDENTS ACCOUNT',
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
                            title: 'UNVERIFIED STUDENTS ACCOUNT',
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
                    "targets": [0,10], // Target the first column (index 0)
                    "orderable": false // Disable ordering for this column
                }
            ],

    //table fetch data
        //ajax: `/student_account_data`,
        ajax: {
            url: '/unverified_student_account_data',  // Fetch event data
            dataSrc: 'data',  // Specify that data is under the 'data' key
            data: function(d) {
                var selectedCourse = $('#courseSelect_U').val();
                var selectedYear = $('#yearSelect_U').val();
                var selectedSection = $('#sectionSelect_U').val();
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
                    return `<input type="checkbox" class="select-item-unverified_students" data-id="${data}">`;
                },
                title: '<input type="checkbox" id="selectAll_unverified_students">'
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
            {data: 'id',
                render: function(data, type, row) {
                    return `
                        <button class="verify-btn btn btn-success btn-sm"
                            data-id="${data}" style="display:inline;">
                            <i class="fa-regular fa-circle-check"></i>
                        </button>

                        <button class="decline-btn btn btn-danger btn-sm" 
                            data-id="${data}" style="display:inline;">
                            <i class="fa-solid fa-user-xmark"></i>
                        </button>
                    `;
                }
            },
        ]
    });

    // Select All checkbox functionality
    $(document).on("click", "#selectAll_unverified_students", function() {
        // Toggle all checkboxes in the table
        var isChecked = $(this).prop('checked');
        $(".select-item-unverified_students").prop('checked', isChecked);
        uverified_student_table.rows().select(isChecked); // Select all rows if checked
    });

    // ✅ Reload table when year is changed
    $('#courseSelect_U,#yearSelect_U,#sectionSelect_U').change(function () {
        uverified_student_table.ajax.reload(null, false);
    });
    $("#refresh_U").click(function() {
        // Reset all dropdowns to the default "Not Filtered" option
        $("#courseSelect_U").val("");
        $("#yearSelect_U").val("");
        $("#sectionSelect_U").val("");

        // Trigger the change event to refresh the table
        $("#courseSelect_U, #yearSelect_U, #sectionSelect_U").trigger("change");
    });

});