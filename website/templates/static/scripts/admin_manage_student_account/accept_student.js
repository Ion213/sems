//accept or verify student
$(document).ready(function(){

    // Verify student
    $('#unverified_student_table').on('click', '.verify-btn', function() {
        var student_id = $(this).data('id');
        Swal.fire({
            title: 'Are you sure?',
            text: 'You won\'t be able to undo this!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, accept Sign Up request?',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Verifying...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });
                $.ajax({
                    url: '/verify_student_account',
                    type: 'PUT',
                    contentType: 'application/json',
                    data: JSON.stringify({ 'student_id': student_id }),
                    success: function(response) {
                        if (response.success) {
                            uverified_student_table.ajax.reload(null, false);
                            Swal.fire({
                                icon: 'success',
                                title: 'Account Verified!',
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