$(document).ready(function(){

    // Declined student
    $('#unverified_student_table').on('click', '.decline-btn', function() {
        var student_id = $(this).data('id');
        Swal.fire({
            title: 'Are you sure?',
            text: 'You won\'t be able to undo this!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Decline Sign Up!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Rejecting...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });
                $.ajax({
                    url: '/decline_student_account',
                    type: 'DELETE',
                    contentType: 'application/json',
                    data: JSON.stringify({ 'student_id': student_id }),

                    success: function(response) {
                        if (response.success) {
                            uverified_student_table.ajax.reload(null, false);
                            Swal.fire({
                                icon: 'success',
                                title: 'Account Rejected!',
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
})

