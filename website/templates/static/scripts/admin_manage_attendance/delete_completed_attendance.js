$(document).ready(function() {

    // DELETE EVENT
    $('#completed_event_activity_attendance_table').on('click', '.delete-btn', function() {
        var attendance_id = $(this).data('id');
        Swal.fire({
            title: 'Are you sure?',
            text: 'Delete this record?!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Deleting...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });
                $.ajax({
                    url: '/delete_completed_attendance',
                    type: 'DELETE',
                    contentType: 'application/json',
                    data: JSON.stringify({ 'attendance_id': attendance_id }),
                    success: function(response) {
                        if (response.success) {
                            completed_event_activity_attendance_table.ajax.reload(null, false);
                            Swal.fire({
                                icon: 'success',
                                title: 'Deleted!',
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
            }
        });
    }); 

})
