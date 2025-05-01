$(document).ready(function() {
    //update upcoming/ongoing
    $(document).on('click', '.update_schedule-btn', function() {
        var schedule_id = $(this).data('id');
        var schedule_name = $(this).data('schedule_name');
        var scheduled_date = $(this).data('scheduled_date');


        var monthMap = {
            January: '01', February: '02', March: '03', April: '04', May: '05', June: '06',
                July: '07', August: '08', September: '09', October: '10', November: '11', December: '12'
            };
        var formattedDate = scheduled_date
            .replace(/-\w+$/, '') // Remove the weekday name
            .replace(/-\w+-/, (match) => `-${monthMap[match.slice(1, -1)]}-`);

        $('#update_selected_schedule_id').val(schedule_id);
        $('#update_schedule_name').text(schedule_name); 
        $('#update_schedule_date').val(formattedDate);


        // get the original value for compareson in disabling/enabling the button
        $('#update_schedule_date').attr('data-original', formattedDate);

        $('#update_schedule_modal').modal('show');
        $('#save_changes').prop('disabled', true).css('opacity', '0.5');
    });

        // Enable button only when changes are detected
        $(document).on('input change', '#update_schedule_date', function() {
            
            // set the original value for compareson in disabling/enabling the button
            let originalDate = $('#update_schedule_date').attr('data-original').trim();
            //get the current input value
            let currentDate = $('#update_schedule_date').val().trim();
    
            if (currentDate !== originalDate) {
                $('#save_changes').prop('disabled', false).css('opacity', '1'); // Enable button
            } else {
                $('#save_changes').prop('disabled', true).css('opacity', '0.5'); // Disable button
            }
        });

    $('#update_schedule_form').submit(function(e) {
        e.preventDefault();

        Swal.fire({
            title: 'Updating...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        $.ajax({
            type: 'PUT',
            url: '/update_schedule',
            data: $(this).serialize(),
            success: function(response) {
                if (response.success) {
                    $('#update_schedule_modal').modal('hide');
                    upcoming_sched_table.ajax.reload(null, false);
                    Swal.fire({
                        icon: 'success',
                        title: 'Updated!',
                        text: response.message,
                        timer: 1500,
                        timerProgressBar: true
                    });
                } 
                else {
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
    });

});



