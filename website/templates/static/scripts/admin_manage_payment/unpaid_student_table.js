var unpaid_students_attendance_table;

$(document).ready(function () {
    let selected_date_Year = $('#sched_year').val();
    let selected_event;

    // Load events if a year is pre-selected
    fetchCompletedEventsData(selected_date_Year);

    // When year changes
    $('#sched_year').on('change', function () {
        selected_date_Year = $(this).val();
        fetchCompletedEventsData(selected_date_Year);
    });

    function fetchCompletedEventsData(selected_date_Year, sortBy = 'name', order = 'asc') {
        $('#eventList').empty();

        if (!selected_date_Year) {
            $('#events_label').hide();
            $('#eventSearchInput').hide();
        } else {
            $('#events_label').show();
            $('#eventSearchInput').show();
        }

        $.ajax({
            url: '/get_events_in_year_data',
            method: 'GET',
            data: { year: selected_date_Year, sort_by: sortBy, order: order },
            success: function (response) {
                if (response.data && response.data.length > 0) {
                    const list = $('<ul class="list-group"></ul>');

                    response.data.forEach(data => {
                        list.append(`
                            <button type="button" 
                                    class="list-group-item list-group-item-action event-item text-start text-truncate"
                                    style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                                    title="${data.name} - ${data.date}"
                                    data-event_name="${data.name}"
                                    data-event_date=" ${data.date}"
                                    data-id="${data.id}">
                                    <strong>${data.name}</strong> 
                                    <small class="text-muted">${data.date}</small> 

                                    <span class="badge bg-danger float-end">
                                        <i class="fa-regular fa-user"></i>: ${data.unpaid_count}
                                    </span>
                            </button>
                        `);
                    });

                    $('#eventList').append(list);

                } else {
                    $('#eventList').html('<div class="text-muted px-3">No Unpaid Students data avialable</div>');
                }
            },
            error: function (xhr) {
                console.error("Failed to fetch events:", xhr.responseText);
            }
        });
    }

    // When an event is clicked
    $(document).on('click', '.event-item', function () {
        $('.event-item').removeClass('active');
        $(this).addClass('active');
        var event_name=$(this).data('event_name')
        var event_date=$(this).data('event_date')

        selected_event = $(this).data('id');

        $('#unpaid_students_list_name').text(event_name)
        $('#unpaid_students_list_date').text(event_date)


        // Show the "Clear Selected Event" button
        $('#clearEventSelection').show();

        unpaid_students_attendance_table.ajax.reload(null, false);
    });

    function getEventTitle() {
        const name = $('#unpaid_students_list_name').text();
        const date = $('#unpaid_students_list_date').text();
        return `Unpaid Students: ${name} | ${date}`;
    }

    // Clear event selection
    $('#clearEventSelection').on('click', function () {
        selected_event = null;

        // Remove active class from any selected button
        $('.event-item').removeClass('active');
        $('#unpaid_students_list_name').text('No selected Event')
        $('#unpaid_students_list_date').text(null)

        // Hide the clear button again
        $(this).hide();

        unpaid_students_attendance_table.ajax.reload(null, false);
    });

    // Sort buttons
    $('.sort-btn').on('click', function () {
        const selectedYear = $('#sched_year').val();
        const sortBy = $(this).data('sort-by');
        const order = $(this).data('order');

        // Highlight active sort button
        $('.sort-btn').removeClass('btn-primary').addClass('btn-outline-primary');
        $(this).removeClass('btn-outline-primary').addClass('btn-primary');

        fetchCompletedEventsData(selectedYear, sortBy, order);
    });

    // Debounced search
    let debounceTimer;
    $('#eventSearchInput').on('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const search = $(this).val().toLowerCase();
            $('#eventList button').each(function () {
                const name = $(this).find('strong').text().toLowerCase();
                const date = $(this).find('small').text().toLowerCase();
                $(this).toggle(name.includes(search) || date.includes(search));
            });
        }, 200);
    });

    // Initialize DataTable
    unpaid_students_attendance_table = new DataTable('#unpaid_students_attendance_table', {
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
            top3End: {
                buttons: [
                    'colvis',
                    {
                        extend: 'collection',
                        text: 'Export',
                        buttons: [
                            {
                                extend: 'copy',
                                title: () => getEventTitle(),
                                footer: false,
                                exportOptions: { columns: ':visible', rows: ':visible' },
                            },
                            {
                                extend: 'print',
                                title:() => getEventTitle(),
                                footer: false,
                                autoPrint: false,
                                exportOptions: { columns: ':visible', rows: ':visible' }
                            },
                            {
                                extend: 'excel',
                                title: () => getEventTitle(),
                                footer: false,
                                exportOptions: { columns: ':visible', rows: ':visible' }
                            },
                            {
                                extend: 'csv',
                                title: () => getEventTitle(),
                                footer: false,
                                exportOptions: { columns: ':visible', rows: ':visible' }
                            },
                            {
                                extend: 'pdf',
                                title: () => getEventTitle(),
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
                                title: () => getEventTitle(),
                                footer: false,
                                exportOptions: {
                                    columns: ':visible',
                                    modifier: { page: 'all', search: 'none' }
                                }
                            },
                            {
                                extend: 'print',
                                title: () => getEventTitle(),
                                footer: false,
                                autoPrint: false,
                                exportOptions: {
                                    columns: ':visible',
                                    modifier: { page: 'all', search: 'none' }
                                }
                            },
                            {
                                extend: 'excel',
                                title: () => getEventTitle(),
                                footer: false,
                                exportOptions: {
                                    columns: ':visible',
                                    modifier: { page: 'all', search: 'none' }
                                }
                            },
                            {
                                extend: 'csv',
                                title: () => getEventTitle(),
                                footer: false,
                                exportOptions: {
                                    columns: ':visible',
                                    modifier: { page: 'all', search: 'none' }
                                }
                            },
                            {
                                extend: 'pdf',
                                title: () => getEventTitle(),
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

        ajax: {
            url: '/get_all_unpiad_student_attendance',
            dataSrc: 'data',
            data: function (u) {
                var selectedCourse = $('#u_courseSelect').val();
                var selectedYear = $('#u_yearSelect').val();
                var selectedSection = $('#u_sectionSelect').val();

                if (selectedCourse || selectedYear || selectedSection || selected_event) {
                    u.event = selected_event;
                    u.course = selectedCourse;
                    u.year = selectedYear;
                    u.section = selectedSection;
                }
            }
        },

        columns: [
            { data: 'student_name' },
            { data: 'department' },
            { data: 'year' },
            { data: 'section' },
            {
                data: 'id',
                render: function (data, type, row) {
                    return `
                        <button class="view-unpaid-activity-btn btn btn-dark btn-sm" 
                        data-id="${data}"
                        data-sched_activity_sched_id="${row.sched_activity_sched_id}"
                        data-schedule_name="${row.schedule_name}"
                        data-schedule_date="${row.schedule_date}"
                        data-total_fines="${row.total_fines}"
                        >
                        <i class="fa-solid fa-calendar-week"></i>
                        </button> 
                        ${row.total_fines}
                    `;
                }
            },
        ]
    });

    // Reload on filter change
    $('#u_courseSelect, #u_yearSelect, #u_sectionSelect, #sched_year').change(function () {
        unpaid_students_attendance_table.ajax.reload(null, false);
    });

    // Refresh button
    $("#u_refresh").click(function () {
        $("#u_courseSelect").val("");
        $("#u_yearSelect").val("");
        $("#u_sectionSelect").val("");
        $("#u_courseSelect, #u_yearSelect, #u_sectionSelect").trigger("change");
    });




});
