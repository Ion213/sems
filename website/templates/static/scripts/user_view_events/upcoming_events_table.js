var upcoming_sched_table;

$(document).ready(function () {
        // Force the "Upcoming Events" tab to be active on page load
    $('#upcoming-tab').addClass('active').attr('aria-selected', 'true');
    $('#upcoming').addClass('show active');

    upcoming_sched_table = new DataTable('#upcoming_sched_table', {
        //table tools
        responsive:true,
        stateSave: true,
        paging: true,
        scrollCollapse: true,
        scrollX: true,
        scrollY: '50vh',

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
            top3End: {
                buttons: [
                    'colvis',  // Fixed comma issue
                    {
                        extend: 'collection',
                        text: 'Export',
                        buttons: [
                            {
                                extend: 'pdf',
                                title: 'UPCOMING EVENTS SCHEDULE',
                                footer: false,
                                orientation: 'portrait',  // Fixed typo
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
                                extend: 'pdf',
                                title: 'UPCOMING EVENTS SCHEDULE',
                                footer: false,
                                orientation: 'portrait',  // Fixed typo
                                pageSize: 'LEGAL',
                                exportOptions: {
                                    columns: ':visible',
                                    modifier: { page: 'all', search: 'none' }
                                }
                            }
                        ]
                    }
                ]
            }
        },

        //table fetch data
        ajax: '/upcoming_events_data', 
        columns: [
            { data: 'name' },
            { data: 'scheduled_date'},
            
            { data: 'id', 
                    render: function(data, type, row) {
                        return `
                            <button class="view_activities-btn btn btn-light btn-sm" 
                                data-id="${data}"
                                data-schedule_name="${row.name}"
                                data-schedule_date="${row.scheduled_date}"  
                                style="display:inline;">
                                <i class="fa-regular fa-clock"></i>
                            </button>
                            <p style="display:inline;">${row.activity_count}</p> |
                            <p style="display:inline;">${row.total_fines}</p>
                        `;
                    } 
            },
            { data: 'status'}, 
        ]
    });


});

