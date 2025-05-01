$(document).ready(function() {


    // Your time converter function
    function convertTo24HourFormat(timeStr) {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');

        hours = parseInt(hours, 10);

        if (modifier.toUpperCase() === 'PM' && hours !== 12) {
            hours += 12;
        }
        if (modifier.toUpperCase() === 'AM' && hours === 12) {
            hours = 0;
        }

        return (hours < 10 ? '0' : '') + hours + ':' + minutes;
    }

    // UPDATE activity
            // Open update modal
    $('#activity_table').on('click', '.update-btn', function() {
        var selected_activity_id = $(this).data('id');
        var activity_name = $(this).data('activity_name');
        var start_time = $(this).data('start_time');
        var end_time = $(this).data('end_time');
        var fines = $(this).data('fines');

        // Convert properly
        var formattedStartTime = convertTo24HourFormat(start_time);
        var formattedEndTime = convertTo24HourFormat(end_time);

        // Populate modal fields
        $('#update_selected_activity_id').val(selected_activity_id);
        $('#update_activity_name').val(activity_name);
        $('#update_activity_start_T').val(formattedStartTime);
        $('#update_activity_end_T').val(formattedEndTime);
        $('#update_fines').val(fines);

        // Store original values using `.attr()` instead of `.data()`
        $('#update_activity_name').attr('data-original', activity_name);
        $('#update_activity_start_T').attr('data-original', formattedStartTime);
        $('#update_activity_end_T').attr('data-original', formattedEndTime);
        $('#update_fines').attr('data-original', fines);

        // Disable "Save Changes" button initially
        $('#save_changes').prop('disabled', true).css('opacity', '0.5');

        $('#update_activity_modal').modal('show');
    });

    // Enable button only when changes are detected
    $(document).on('input change', '#update_activity_name, #update_activity_start_T, #update_activity_end_T, #update_fines', function() {
        let originalName = $('#update_activity_name').attr('data-original').trim();
        let originalStart = $('#update_activity_start_T').attr('data-original').trim();
        let originalEnd = $('#update_activity_end_T').attr('data-original').trim();
        let originalFines = $('#update_fines').attr('data-original').trim();

        let currentName = $('#update_activity_name').val().trim();
        let currentStart = $('#update_activity_start_T').val().trim();
        let currentEnd = $('#update_activity_end_T').val().trim();
        let currentFines = $('#update_fines').val().trim();

        console.log("Original:", originalName, originalStart, originalEnd, originalFines);
        console.log("Current:", currentName, currentStart, currentEnd, currentFines);

        if (
            currentName !== originalName ||
            currentStart !== originalStart ||
            currentEnd !== originalEnd ||
            currentFines !== originalFines
        ) {
            $('#save_changes').prop('disabled', false).css('opacity', '1'); // Enable button
        } else {
            $('#save_changes').prop('disabled', true).css('opacity', '0.5'); // Disable button
        }
    });
    
            $('#update_activity_form').submit(function(e) {
                e.preventDefault();

                Swal.fire({
                    title: 'Updating...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });

                $.ajax({
                    type: 'PUT',
                    url: '/update_activities',
                    data: $(this).serialize(),
                    success: function(response) {
                        if (response.success) {
                            $('#update_activity_modal').modal('hide');
                            activity_table.ajax.reload(null, false);
                            Swal.fire({
                                icon: 'success',
                                title: 'Updated!',
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
            });
    
    })