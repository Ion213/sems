var ongoing_attendance_table;

$(document).ready(function () {

    $('#ongoing-tab').addClass('active').attr('aria-selected', 'true');
    $('#ongoing').addClass('show active');

    var selected_event_Name = document.getElementById('ongoing_attendance_table').dataset.attendanceName;

    ongoing_attendance_table = new DataTable('#ongoing_attendance_table', {
        responsive: true,
        stateSave: true,
        paging: true,
        scrollCollapse: true,
        scrollX: true,
        scrollY: '120vh',
        select: {
            style: 'multi'
        },
        layout: {
            top1Start: 'pageLength',
            top1End: 'search',
            topStart: 'info',
            topEnd: 'paging',
            top3start: {
                buttons: [
                    {
                        text: '☑ Remove Selected',
                        action: function () {
                            let selectedIds = $('.select-item-attendances:checked').map(function () {
                                return $(this).data('id');
                            }).get();
                            if (selectedIds.length === 0) {
                                Swal.fire('No items selected', 'Please select at least one item to remove.', 'warning');
                                return;
                            }
                            Swal.fire({
                                title: 'Are you sure?',
                                text: `You are about to remove ${selectedIds.length} items. This cannot be undone!`,
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonText: 'Yes, remove them!',
                                cancelButtonText: 'Cancel'
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    Swal.fire({
                                        title: 'Deleting...',
                                        allowOutsideClick: false,
                                        didOpen: () => Swal.showLoading()
                                    });
                                    $.ajax({
                                        url: '/delete_selected_attendance',
                                        type: 'DELETE',
                                        contentType: 'application/json',
                                        data: JSON.stringify({ 'attendance_ids': selectedIds }),
                                        success: function (response) {
                                            if (response.success) {
                                                $('.select-item-attendances:checked').each(function () {
                                                    ongoing_attendance_table.row($(this).closest('tr')).remove().draw();
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
                                        error: function (xhr, status, error) {
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
                ]
            },
            top3End: {
                buttons: [
                    'colvis',
                    {
                        extend: 'collection',
                        text: 'Export',
                        buttons: [
                            {
                                extend: 'copy',
                                title: function () {
                                    return selected_event_Name + " - " + ($('#activityComboBox option:selected').text() || "All Activities");
                                },
                                footer: false,
                                exportOptions: { columns: ':visible', rows: ':visible' },
                            },
                            {
                                extend: 'print',
                                title: function () {
                                    return selected_event_Name + " - " + ($('#activityComboBox option:selected').text() || "All Activities");
                                },
                                footer: false,
                                autoPrint: false,
                                exportOptions: { columns: ':visible', rows: ':visible' }
                            },
                            {
                                extend: 'excel',
                                title: function () {
                                    return selected_event_Name + " - " + ($('#activityComboBox option:selected').text() || "All Activities");
                                },
                                footer: false,
                                exportOptions: { columns: ':visible', rows: ':visible' }
                            },
                            {
                                extend: 'csv',
                                title: function () {
                                    return selected_event_Name + " - " + ($('#activityComboBox option:selected').text() || "All Activities");
                                },
                                footer: false,
                                exportOptions: { columns: ':visible', rows: ':visible' }
                            },
                            {
                                extend: 'pdf',
                                title: function () {
                                    return selected_event_Name + " - " + ($('#activityComboBox option:selected').text() || "All Activities");
                                },
                                footer: false,
                                orientation: 'portrait',
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
                                title: function () {
                                    return selected_event_Name + " - " + ($('#activityComboBox option:selected').text() || "All Activities");
                                },
                                footer: false,
                                exportOptions: {
                                    columns: ':visible',
                                    modifier: { page: 'all', search: 'none' }
                                }
                            },
                            {
                                extend: 'print',
                                title: function () {
                                    return selected_event_Name + " - " + ($('#activityComboBox option:selected').text() || "All Activities");
                                },
                                footer: false,
                                autoPrint: false,
                                exportOptions: {
                                    columns: ':visible',
                                    modifier: { page: 'all', search: 'none' }
                                }
                            },
                            {
                                extend: 'excel',
                                title: function () {
                                    return selected_event_Name + " - " + ($('#activityComboBox option:selected').text() || "All Activities");
                                },
                                footer: false,
                                exportOptions: {
                                    columns: ':visible',
                                    modifier: { page: 'all', search: 'none' }
                                }
                            },
                            {
                                extend: 'csv',
                                title: function () {
                                    return selected_event_Name + " - " + ($('#activityComboBox option:selected').text() || "All Activities");
                                },
                                footer: false,
                                exportOptions: {
                                    columns: ':visible',
                                    modifier: { page: 'all', search: 'none' }
                                }
                            },
                            {
                                extend: 'pdf',
                                title: function () {
                                    return selected_event_Name + " - " + ($('#activityComboBox option:selected').text() || "All Activities");
                                },
                                footer: false,
                                orientation: 'portrait',
                                pageSize: 'LEGAL',
                                exportOptions: {
                                    columns: ':visible',
                                    modifier: { page: 'all', search: 'none' }
                                }
                            }
                        ]
                    },
                ]
            }
        },
        columnDefs: [
            {
                targets: [0,7],
                orderable: false
            }
        ],
        ajax: {
            url: '/ongoing_attendance_data',
            dataSrc: 'data',
            data: function (d) {
                var selected_activity = $('#activityComboBox').val();
                var selectedCourse = $('#courseSelect').val();
                var selectedYear = $('#yearSelect').val();
                var selectedSection = $('#sectionSelect').val();
                if (selectedCourse || selectedYear || selectedSection || selected_activity) {
                    d.activity = selected_activity;
                    d.course = selectedCourse;
                    d.year = selectedYear;
                    d.section = selectedSection;
                }
            },
        },
        columns: [
            {
                data: 'id',
                render: function (data) {
                    return `<input type="checkbox" class="select-item-attendances" data-id="${data}">`;
                },
                title: '<input type="checkbox" id="selectAllattendances">'
            },
            { data: 'student_name' },
            { data: 'department' },
            { data: 'year' },
            { data: 'section' },
            { data: 'time_in' },
            { data: 'time_out' },
            {
                data: 'id',
                render: function (data) {
                    return `
                        <button class="delete-btn btn btn-danger btn-sm" 
                            data-id="${data}"
                             style="display:inline;">
                            <i class="fa-solid fa-user-minus"></i>
                        </button>
                    `;
                }
            }
        ]
    });


    $(document).on("click", "#selectAllattendances", function () {
        var isChecked = $(this).prop('checked');
        $(".select-item-attendances").prop('checked', isChecked);
        ongoing_attendance_table.rows().select(isChecked);
    });

    $('#courseSelect,#yearSelect,#sectionSelect,#activityComboBox').change(function () {
        ongoing_attendance_table.ajax.reload(null, false);
    });

    $("#refresh").click(function () {
        $("#courseSelect").val("");
        $("#yearSelect").val("");
        $("#sectionSelect").val("");
        $("#courseSelect, #yearSelect, #sectionSelect").trigger("change");
    });

    
});
