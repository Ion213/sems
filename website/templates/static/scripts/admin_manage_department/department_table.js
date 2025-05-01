var department_table;

$(document).ready(function(){
    department_table = new DataTable('#department_table', {
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
                            let selectedIds = $('.select-item-departments:checked').map(function() {
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
                                        url: '/delete_selected_departments',
                                        type: 'DELETE',
                                        contentType: 'application/json',
                                        data: JSON.stringify({ 'department_ids': selectedIds }),
                                        success: function(response) {
                                            if (response.success) {
                                                $('.select-item-departments:checked').each(function() {
                                                    department_table.row($(this).closest('tr')).remove().draw();
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
                            title: 'DEPARTMENTS',
                            footer: false,
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },
                            
                        {extend: 'print',
                            title: 'DEPARTMENTS',
                            footer: false,
                            autoPrint: false,
                            exportOptions: {columns: ':visible',rows: ':visible'}
                            }, 

                        {extend: 'excel',
                            title: 'DEPARTMENTS',
                            footer: false,
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },   

                        {extend: 'csv',
                            title: 'DEPARTMENTS',
                            footer: false,
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },

                        {extend: 'pdf',
                            title: 'DEPARTMENTS',
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
                            title: 'DEPARTMENTS',
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
                            title: 'DEPARTMENTS',
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
                            title: 'DEPARTMENTS',
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
                            title: 'DEPARTMENTS',
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
                            title: 'DEPARTMENTS',
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
                        "targets":[0,4], // Target the first column (index 0)
                        "orderable": false // Disable ordering for this column
                    }
                ],


    //table fetch data
        //ajax: '/department_data',
        ajax: {
            url: '/department_data',  // Fetch event data
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
                render: function(data, type, row) {
                    return `<input type="checkbox" class="select-item-departments" data-id="${data}">`;
                },
                title: '<input type="checkbox" id="selectAlldepartments">'
            },
            { data: 'name' },
            { data: 'year' },
            { data: 'section' },
            {data: 'id',
                render: function(data, type, row) {
                    return `
                        <button class="update-btn btn btn-warning btn-sm" 
                            data-id="${data}" 
                            data-name="${row.name}" 
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
    $(document).on("click", "#selectAlldepartments", function() {
        // Toggle all checkboxes in the table
        var isChecked = $(this).prop('checked');
        $(".select-item-departments").prop('checked', isChecked);
        department_table.rows().select(isChecked); // Select all rows if checked
    });
    // ✅ Reload table when year is changed
    $('#courseSelect,#yearSelect,#sectionSelect').change(function () {
        department_table.ajax.reload(null, false);
    });
    $("#refresh").click(function() {
        // Reset all dropdowns to the default "Not Filtered" option
        $("#courseSelect").val("");
        $("#yearSelect").val("");
        $("#sectionSelect").val("");

        // Trigger the change event to refresh the table
        $("#courseSelect, #yearSelect, #sectionSelect").trigger("change");
    });
})