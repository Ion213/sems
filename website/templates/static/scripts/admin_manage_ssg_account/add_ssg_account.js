$(document).ready(function(){

    // ADD STUDENT ACCOUNT
    $('#add_ssg_form').submit(function(e) {
        e.preventDefault();
        Swal.fire({
            title: 'Adding...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });
        $.ajax({
            type: 'POST',
            url: '/add_ssg_account',
            data: $(this).serialize(),
            success: function(response) {
                if (response.success) {
                    ssg_acount_table.ajax.reload(null, false);
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text:  response.message,
                        timer: 1500,
                        timerProgressBar: true
                    });
                    $('#add_ssg_form')[0].reset();
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
})