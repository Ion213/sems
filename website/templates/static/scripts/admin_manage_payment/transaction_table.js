var transaction_history;

let date_year_now=$('#date_yearSelect').val()

$(document).ready(function () {
    transaction_history = new DataTable('#transaction_history', {
        //table tools
        responsive:true,
        stateSave: true,
        paging: true,
        scrollCollapse: true,
        scrollX: true,
        scrollY: '120vh',
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
                            let selectedIds = $('.select-item-transaction:checked').map(function() {
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
                                        url: '/delete_selected_transactions',
                                        type: 'DELETE',
                                        contentType: 'application/json',
                                        data: JSON.stringify({ 'transaction_ids': selectedIds }),
                                        success: function(response) {
                                            if (response.success) {
                                                $('.select-item-transaction:checked').closest('tr').each(function() {
                                                    transaction_history.row($(this)).remove().draw();
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
                                                text: 'Failed to delete transaction.'+ error,
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
                            title: 'Transaction History ' + date_year_now,
                            footer: false,
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },
                            
                        {extend: 'print',
                            title: 'Transaction History ' + date_year_now,
                            footer: false,
                            autoPrint: false,
                            exportOptions: {columns: ':visible',rows: ':visible'}
                            }, 

                        {extend: 'excel',
                            title: 'Transaction History ' + date_year_now,
                            footer: false,
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },   

                        {extend: 'csv',
                            title: 'Transaction History ' + date_year_now,
                            footer: false,
                            exportOptions: {columns: ':visible',rows: ':visible'},
                            },

                        {extend: 'pdf',
                            title: 'Transaction History ' + date_year_now,
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
                            title: 'Transaction History '  + date_year_now,
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
                            title: 'Transaction History '  + date_year_now,
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
                            title: 'Transaction History '  + date_year_now,
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
                            title: 'Transaction History '  + date_year_now,
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
                            title: 'Transaction History '  + date_year_now,
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
                targets: [0,7], // Disable ordering for specific columns
                orderable: false
            }
        ],

        //table fetch data
        ajax: {
            url: '/transaction_history_data',  // Fetch event data
            dataSrc: 'data',  // Specify that data is under the 'data' key
            data: function(d) {
                var selected_dateYear = $('#date_yearSelect').val();
                var selectedCourse = $('#courseSelect').val();
                var selectedYear = $('#yearSelect').val();
                var selectedSection = $('#sectionSelect').val();
                if (selectedCourse ||selectedYear||selectedSection||selected_dateYear) {
                    d.date_year=selected_dateYear
                    d.course = selectedCourse; 
                    d.year = selectedYear;  
                    d.section = selectedSection;  
                }
            },
        },
        columns: [
            { data: 'id',
                render: function(data, type, row) {
                    return `<input type="checkbox" class="select-item-transaction" data-id="${data}">`;
                },
                title: '<input type="checkbox" id="selectAlltransaction">'
            },
            { data: 'transaction_code' },
            { data: 'name'},
            { data: 'department'},
            { data: 'year'},
            { data: 'section'},

            //{ data: 'total_fines'},
            //{ data: 'cash_amount'},
            //{ data: 'amount_paid'},
            //{ data: 'change'},
            //{ 
              //  data: 'note',
              //  render: function(data, type, row) {
              //    return `<button class="view-note btn btn-sm btn-info" data-note="${data}">View</button>`;
              //  }
             // },
            { data: 'date'},
            {
                data: 'id', // Maps to the key 'id' in the JSON
                render: function(data, type, row) {
                    return `
                        <button class="btn-view-receipt btn btn-success btn-sm" 
                             data-id="${data}" 
                            style="display:inline;">
                            <i class="fa-solid fa-receipt"></i>
                         </button>

                         <button class="btn-view-transaction-details btn btn-dark btn-sm" 
                             data-id="${data}" 
                             data-student_name="${row.name}"
                             data-transaction_code="${row.transaction_code}"
                             data-date="${row.date}"
                            style="display:inline;">
                           <i class="fa-solid fa-calendar-week"></i>
                         </button>

                        <button class="btn-transaction-delete btn btn-danger btn-sm" 
                            data-id="${data}" style="display:inline;">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    `;
                }
            },   
        ]
    });

    $(document).on('click', '.view-note', function() {
        const note = $(this).data('note');
        $('#noteModal .modal-body').text(note);
        $('#noteModal').modal('show');
      });
      

     // Select All checkbox functionality
     $(document).on("click", "#selectAlltransaction", function() {
        // Toggle all checkboxes in the table
        var isChecked = $(this).prop('checked');
        $(".select-item-transaction").prop('checked', isChecked);
        transaction_history.rows().select(isChecked); // Select all rows if checked
    });

    // ✅ Reload table when year is changed
    $('#date_yearSelect').change(function () {
        transaction_history.ajax.reload(null, false);
        // Update your tracking variable (if used elsewhere)
        date_year_now = $(this).val();
    });

    // ✅ Reload table when year is changed
    $('#courseSelect,#yearSelect,#sectionSelect').change(function () {
        transaction_history.ajax.reload(null, false);
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
