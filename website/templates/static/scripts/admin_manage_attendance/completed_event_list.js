var completed_event_activity_attendance_table;

$(document).ready(function () {
    populateYearSelect();
    fetchCompletedEvents();

    // Populate year select dropdown
    function populateYearSelect() {
        $.ajax({
            url: '/get_event_years',
            method: 'GET',
            success: function (response) {
                if (response.years && response.years.length > 0) {
                    const yearSelect = $('#yearSelects');
                    yearSelect.empty(); // Clear existing options

                    response.years.forEach((year, index) => {
                        const selected = index === 0 ? 'selected' : '';
                        yearSelect.append(`<option value="${year}" ${selected}>${year}</option>`);
                    });

                    // After populating, call fetchCompletedEvents with selected year
                    const selectedYear = $('#yearSelects').val();
                    fetchCompletedEvents(selectedYear);
                } else {
                    $('#yearSelect').html('<option>No years available</option>');
                }
            },
            error: function (xhr) {
                console.error("Failed to fetch years:", xhr.responseText);
            }
        });
    }

    // Refetch events on year change
    $('#yearSelects').on('change', function () {
        const selectedYear = $(this).val();
        fetchCompletedEvents(selectedYear);
    });

    function fetchCompletedEvents(selectedYear, sortBy = 'name', order = 'asc') {
        $.ajax({
            url: "/completed_events_list_data",
            method: "GET",
            data: { year: selectedYear, sort_by: sortBy, order: order },
            success: function (response) {
                const data = response.data;
                const eventsList = $("#completed-events-list");
                eventsList.empty();
    
                if (!data || data.length === 0) {
                    eventsList.append('<li class="list-group-item">No completed events.</li>');
                } else {
                    data.forEach(event => {
                        let eventItem = `
                                        <li class="list-group-item">
                                            <div class="d-flex justify-content-between align-items-center">
                                                <span><strong>${event.name}<p hidden>${event.scheduled_date}</p></strong></span>
                                                <p>${event.scheduled_date}</p>
                                                <button class="btn-events btn-sm btn-primary toggle-activities" data-event-id="${event.id}">
                                                    <i class="fa-solid fa-chevron-down icon-toggle"></i>
                                                </button>
                                            </div>
                                            <ul class="activities-list list-group ms-4 mt-2" id="activities-${event.id}" style="display: none;"></ul>
                                        </li>
                                    `;
                        eventsList.append(eventItem);
                    });

                    $('.toggle-activities').off('click').on('click', function () {
                        const button = $(this);
                        const icon = button.find('.icon-toggle');
                        const eventId = button.data('event-id');
                        const activitiesList = $(`#activities-${eventId}`);
                    
                        // Hide all other activity lists and reset their icons
                        $('.activities-list').not(activitiesList).slideUp();
                        $('.icon-toggle').not(icon).removeClass('fa-chevron-up').addClass('fa-chevron-down');
                    
                        // Toggle selected activity list
                        activitiesList.slideToggle();
                    
                        // Toggle icon for current one
                        icon.toggleClass('fa-chevron-down fa-chevron-up');
                    
                        // Fetch activities only if list is empty
                        if (activitiesList.is(':visible') && activitiesList.children().length === 0) {
                            $.ajax({
                                url: '/completed_activities_list_data',
                                method: 'GET',
                                data: { event_id: eventId },
                                success: function (response) {
                                    const activities = response.data;
                                    if (!activities || activities.length === 0) {
                                        activitiesList.append('<li class="list-group-item">No activities found.</li>');
                                    } else {
                                        activities.forEach(activity => {
                                            activitiesList.append(`
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    <span>${activity.name} | ${activity.start_time} - ${activity.end_time}</span>
                                                    <button class="btn-view-attendance btn btn-sm btn-secondary"
                                                        data-id="${activity.id}"
                                                        data-event_name="${activity.event_name}"
                                                        data-event_date="${activity.event_date}"
                                                        data-name="${activity.name}"
                                                        data-activity_start_time="${activity.start_time}"
                                                        data-activity_end_time="${activity.end_time}">
                                                        <i class="fa-solid fa-eye"></i>
                                                    </button>
                                                    <button hidden class="btn-add-attendance btn btn-sm btn-primary"
                                                        data-id="${activity.id}"
                                                        data-activity_name="${activity.name}"
                                                        data-activity_start_time="${activity.start_time}"
                                                        data-activity_end_time="${activity.end_time}"
                                                        >
                                                        <i class="fa-solid fa-eye"></i> <!-- This will change to fa-plus -->
                                                    </button>
                                                </li>
                                            `);
                                        });
                                    }
                                },
                                error: function (xhr) {
                                    console.error("Failed to fetch activities:", xhr.responseText);
                                }
                            });
                        }
                    });
                    
                }
            },
            error: function (xhr) {
                console.error("Failed to fetch events:", xhr.responseText);
            }
        });
    }


    // Hook up the buttons
    $('#sortNameAsc').on('click', function () {
        const selectedYear = $('#yearSelects').val();
        fetchCompletedEvents(selectedYear, 'name', 'asc');
    });

    $('#sortNameDesc').on('click', function () {
        const selectedYear = $('#yearSelects').val();
        fetchCompletedEvents(selectedYear, 'name', 'desc');
    });

    $('#eventSearchInput').on('input', function () {
        const searchTerm = $(this).val().toLowerCase();
    
        $('#completed-events-list li').each(function () {
            const text = $(this).find('strong').text().toLowerCase();
            $(this).toggle(text.includes(searchTerm));
        });
    });


    // Delegate click for dynamically added view attendance buttons
    $(document).on('click', '.btn-view-attendance', function () {
        
        var button = $(this);
        var icon = button.find('i');
    
        // Get the matching .btn-add-attendance sibling
        var button2 = button.siblings('.btn-add-attendance');
        var icon2 = button2.find('i');
    
        // Reset all other buttons and icons
        $('.btn-view-attendance').not(button).prop('disabled', false)
            .find('i').removeClass('fa-chevron-right').addClass('fa-eye');
    
        $('.btn-add-attendance').not(button2).prop('hidden', true)
            .find('i').removeClass('fa-solid fa-plus').addClass('fa-eye');
    
        // Toggle the clicked one
        if (icon.hasClass('fa-eye')) {
            icon.removeClass('fa-eye').addClass('fa-chevron-right');
            button.prop('disabled', true);
    
            icon2.removeClass('fa-eye').addClass('fa-solid fa-plus');
            button2.prop('hidden', false);
        } else {
            icon.removeClass('fa-chevron-right').addClass('fa-eye');
            button.prop('disabled', false);
    
            icon2.removeClass('fa-solid fa-plus').addClass('fa-eye');
            button2.prop('hidden', true);
        }

        var activity_id = $(this).data('id');
        var activity_name = $(this).data('name');
        var event_name = $(this).data('event_name');
        var event_date = $(this).data('event_date');
        var activity_start_time = $(this).data('activity_start_time');
        var activity_end_time = $(this).data('activity_end_time');

        // Update the heading or display area
        $('#attendance_name').text(`${event_name} : ${activity_name} (${event_date}|${activity_start_time}-${activity_end_time})`);
        var selected_event_and_activity=$('#attendance_name').text()
       
        query_attendance_table(activity_id, selected_event_and_activity);
        
        // Close Swal after loading data

    });

    function query_attendance_table(activity_id, selected_event_and_activity) {
        // Destroy existing DataTable if it exists
        if ($.fn.DataTable.isDataTable('#completed_event_activity_attendance_table')) {
            $('#completed_event_activity_attendance_table').DataTable().clear().destroy();
        }

        completed_event_activity_attendance_table = new DataTable('#completed_event_activity_attendance_table', {
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
                            text: '☑ Delete selected records',
                            action: function () {
                                let selectedIds = $('.select-item-completed_attendances:checked').map(function () {
                                    return $(this).data('id');
                                }).get();
                                if (selectedIds.length === 0) {
                                    Swal.fire('No items selected', 'Please select at least one item to remove.', 'warning');
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
                                            url: '/delete_selected_completed_attendance',
                                            type: 'DELETE',
                                            contentType: 'application/json',
                                            data: JSON.stringify({ 'attendance_ids': selectedIds }),
                                            success: function (response) {
                                                if (response.success) {
                                                    $('.select-item-completed_attendances:checked').each(function () {
                                                        query_attendance_table(activity_id, selected_event_and_activity);
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
                                    title: selected_event_and_activity,
                                    footer: false,
                                    exportOptions: { columns: ':visible', rows: ':visible' },
                                },
                                {
                                    extend: 'print',
                                    title: selected_event_and_activity,
                                    footer: false,
                                    autoPrint: false,
                                    exportOptions: { columns: ':visible', rows: ':visible' }
                                },
                                {
                                    extend: 'excel',
                                    title: selected_event_and_activity,
                                    footer: false,
                                    exportOptions: { columns: ':visible', rows: ':visible' }
                                },
                                {
                                    extend: 'csv',
                                    title: selected_event_and_activity,
                                    footer: false,
                                    exportOptions: { columns: ':visible', rows: ':visible' }
                                },
                                {
                                    extend: 'pdf',
                                    title:selected_event_and_activity,
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
                                    title:selected_event_and_activity,
                                    footer: false,
                                    exportOptions: {
                                        columns: ':visible',
                                        modifier: { page: 'all', search: 'none' }
                                    }
                                },
                                {
                                    extend: 'print',
                                    title: selected_event_and_activity,
                                    footer: false,
                                    autoPrint: false,
                                    exportOptions: {
                                        columns: ':visible',
                                        modifier: { page: 'all', search: 'none' }
                                    }
                                },
                                {
                                    extend: 'excel',
                                    title: selected_event_and_activity,
                                    footer: false,
                                    exportOptions: {
                                        columns: ':visible',
                                        modifier: { page: 'all', search: 'none' }
                                    }
                                },
                                {
                                    extend: 'csv',
                                    title:selected_event_and_activity,
                                    footer: false,
                                    exportOptions: {
                                        columns: ':visible',
                                        modifier: { page: 'all', search: 'none' }
                                    }
                                },
                                {
                                    extend: 'pdf',
                                    title:selected_event_and_activity,
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
                    targets: [0,8],
                    orderable: false
                }
            ],
            
            ajax: {
                url: '/completed_attendances_data',
                dataSrc: 'data',
                data: function (d) {
                    var selected_activity=activity_id
                    var selectedCourse = $('#c_courseSelect').val();
                    var selectedYear = $('#c_yearSelect').val();
                    var selectedSection = $('#c_sectionSelect').val();
                    var statusSelect = $('#c_statusSelect').val();
                    if (selectedCourse || selectedYear || selectedSection || selected_activity||statusSelect) {
                        d.activity = selected_activity;
                        d.course = selectedCourse;
                        d.year = selectedYear;
                        d.section = selectedSection;
                        d.status = statusSelect;
                    }
                }
            },
            columns: [
                {
                    data: 'id',
                    render: function (data) {
                        return `<input type="checkbox" class="select-item-completed_attendances" data-id="${data}">`;
                    },
                    title: '<input type="checkbox" id="selectAllcompleted_attendances">'
                },
                { data: 'student_name' },
                { data: 'department' },
                { data: 'year' },
                { data: 'section' },
                { data: 'time_in' },
                { data: 'time_out' },
                { data: 'status' },
                {
                    data: 'id',
                    render: function (data, type, row) {
                        return `
                            <button class="update-btn btn btn-warning btn-sm" 
                                data-id="${data}" 
                                data-student_name="${row.student_name}" 
                                data-status="${row.status}" 
                                 style="display:inline;">
                                <i class="fa-solid fa-edit"></i>
                            </button>
                            <button class="delete-btn btn btn-danger btn-sm" 
                                data-id="${data}" 
                                style="display:inline;">
                                    <i class="fa-solid fa-trash"></i>
                            </button>
                        `;
                    }
                },
                
            ]
        });


        $(document).on("click", "#selectAllcompleted_attendances", function () {
            var isChecked = $(this).prop('checked');
            $(".select-item-completed_attendances").prop('checked', isChecked);
            completed_event_activity_attendance_table.rows().select(isChecked);
        });
    
        $('#c_courseSelect,#c_yearSelect,#c_sectionSelect,#c_activityComboBox,#c_statusSelect').change(function () {
            completed_event_activity_attendance_table.ajax.reload(null, false);
        });
    
        $("#c_refresh").click(function () {
            $("#c_courseSelect").val("");
            $("#c_yearSelect").val("");
            $("#c_sectionSelect").val("");
            $("#c_statusSelect").val("");
            $("#c_courseSelect, #c_yearSelect, #c_sectionSelect,#c_statusSelect").trigger("change");
        });


    }
});

