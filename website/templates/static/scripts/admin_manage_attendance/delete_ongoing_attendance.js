$(document).ready(function() {

    // DELETE fees
    $('#ongoing_attendance_table').on('click', '.delete-btn', function() {
        var attendance_Id = $(this).data('id');
        Swal.fire({
            title: 'Are you sure?',
            text: 'You won\'t be able to undo this!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, remove it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Deleting...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });
                $.ajax({
                    url: '/delete_attendance',
                    type: 'DELETE',
                    contentType: 'application/json',
                    data: JSON.stringify({ 'attendance_id': attendance_Id }),
                    success: function(response) {
                        if (response.success) {
                            ongoing_attendance_table.ajax.reload(null, false);
                            Swal.fire({
                                icon: 'success',
                                title: 'Removed!',
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
                            text: 'An error occurred: ' + error,
                            timer: 3000,
                            timerProgressBar: true
                        });
                    }
                });
            }
        });
    });
})