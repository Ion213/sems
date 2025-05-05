$(document).ready(function(){
    // ADD STUDENT ACCOUNT
    $('#add_student_form').submit(function(e) {
        e.preventDefault();

        // Student ID Format Validation
        const studentId = $("#student_id").val();
        const studentIdRegex = /^\d+(?:-\d+)+$/;
        if (!studentIdRegex.test(studentId)) {
            Swal.fire({
                icon: "error",
                title: "Invalid ID Format",
                text: "Student ID must contain numbers separated by hyphens (e.g., 2017-21-00062).",
                timer: 4000,
                timerProgressBar: true
            });
            return;
        }


        Swal.fire({
            title: 'Adding...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });
        $.ajax({
            type: 'POST',
            url: '/add_student_account',
            data: $(this).serialize(),
            success: function(response) {
                if (response.success) {
                    student_acount_table.ajax.reload(null, false);
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: response.message,
                        timer: 1500,
                        timerProgressBar: true
                    });
                    $('#add_student_form')[0].reset();
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