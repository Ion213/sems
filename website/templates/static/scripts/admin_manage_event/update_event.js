$(document).ready(function() {
     // Open the update modal
     $('#event_table').on('click', '.update-btn', function() {
        let eventId = $(this).data('id');
        let eventName = $(this).data('name') || "";
        let eventDescription = $(this).data('description') || "";

        $('#selected_event_id').val(eventId);
        $('#update_name').val(eventName);
        $('#update_description').val(eventDescription);

        // get the original value for compareson in disabling/enabling the button
        $('#update_name').attr('data-original', eventName);
        $('#update_description').attr('data-original', eventDescription);

        $('#update_event_modal').modal('show');

        // Disable "Save Changes" button initially
        $('#save_changes').prop('disabled', true).css('opacity', '0.5');
    });

    // Enable button only when changes are detected
    $(document).on('input change', '#update_name, #update_description', function() {
        // set the original value for compareson in disabling/enabling the button
        let originalName = $('#update_name').attr('data-original').trim();
        let originalDescription = $('#update_description').attr('data-original').trim();

        //get the current input value
        let currentName = $('#update_name').val().trim();
        let currentDescription = $('#update_description').val().trim();

        if (currentName !== originalName || currentDescription !== originalDescription) {
            $('#save_changes').prop('disabled', false).css('opacity', '1'); // Enable button
        } else {
            $('#save_changes').prop('disabled', true).css('opacity', '0.5'); // Disable button
        }
    });

    // Handle form submission
    $('#update_event_form').submit(function(e) { // Fix: Correct form selector
        e.preventDefault();
        Swal.fire({
            title: 'Updating...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        $.ajax({
            type: 'PUT',
            url: '/update_event',
            data: $(this).serialize(),
            success: function(response) {
                if (response.success) {
                    $('#update_event_modal').modal('hide'); // Fix: Correct modal ID
                    events_table.ajax.reload(null, false);
                    Swal.fire({
                        icon: 'success',
                        title: 'Updated!',
                        text: response.message,
                        timer: 3000,
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
    });
});
