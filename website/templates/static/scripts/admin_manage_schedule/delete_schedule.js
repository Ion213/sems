
$(document).ready(function() {

    // DELETE schedule upcoming/ongoing/completed
    $(document).on('click', '.delete_schedule-btn', function() {
        var sched_id = $(this).data('id');
        Swal.fire({
            title: 'Are you sure to cancel this schedule?',
            text: 'You won\'t be able to undo this!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Cancel it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {

                Swal.fire({
                    title: 'Deleting...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });

                $.ajax({
                    url: '/delete_schedule',
                    type: 'DELETE',
                    contentType: 'application/json',
                    data: JSON.stringify({ 'sched_id': sched_id }),
                    success: function(response) {
                        if (response.success) {

                            upcoming_sched_table.ajax.reload(null, false);
                            ongoing_sched_table.ajax.reload(null, false);
                            completed_sched_table.ajax.reload(null, false);

                            Swal.fire({
                                icon: 'success',
                                title: 'Canceled!',
                                text: response.message,
                                confirmButtonText: 'OK',
                                timer: 1500,
                                timerProgressBar: true
                            });
                        } 
                        else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: response.message,
                                confirmButtonText: 'OK',
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
                            confirmButtonText: 'OK',
                            timer: 3000,
                            timerProgressBar: true
                        });
                    }
                });
            }
        });
    });
    
});
