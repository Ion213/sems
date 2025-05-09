$(document).ready(function() {

    // ADD EVENT
    $('#add_event_form').submit(function(e) {
        e.preventDefault();

        Swal.fire({
            title: 'Adding...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        $.ajax({
            type: 'POST',
            url: '/add_event',
            data: $(this).serialize(),
            success: function(response) {
                if (response.success) {
                    events_table.ajax.reload(null, false);
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: 'Event added successfully!',
                        confirmButtonText: 'OK',
                        timer: 1500,
                        timerProgressBar: true
                    });
                    $('#add_event_form')[0].reset();
                } 
                else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message,
                        confirmButtonText: 'OK',
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
                    confirmButtonText: 'OK',
                    timer: 1500,
                    timerProgressBar: true
                });
            }
        });
    });


})