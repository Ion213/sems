$(document).ready(function(){
    // UPDATE student aacount
    // Open the update modal
    $('#student_table').on('click', '.update-btn', function() {
        
        var selected_student_id = $(this).data('id');
        var student_id = $(this).data('student_id');
        var first_name = $(this).data('first_name');
        var last_name = $(this).data('last_name');
        var email = $(this).data('email');
        var password = $(this).data('password');
        var department = $(this).data('department');
        var year = $(this).data('year');
        var section = $(this).data('section');

        $('#selected_student_account_id').val(selected_student_id);
        $('#update_student_id').val(student_id);
        $('#update_first_name').val(first_name);
        $('#update_last_name').val(last_name);
        $('#update_email').val(email);
        $('#update_password').val(password);
        $('#update_course').val(department);
        $('#update_year').val(year);
        $('#update_section').val(section);

        // get the original value for compareson in disabling/enabling the button
        $('#update_student_id').attr('data-original', student_id);
        $('#update_first_name').attr('data-original', first_name);
        $('#update_last_name').attr('data-original', last_name);
        $('#update_email').attr('data-original', email);
        $('#update_password').attr('data-original', password);
        $('#update_course').attr('data-original', department);
        $('#update_year').attr('data-original', year);
        $('#update_section').attr('data-original', section);

        $('#update_student_account_modal').modal('show');
        // Disable "Save Changes" button initially
        $('#save_changes').prop('disabled', true).css('opacity', '0.5');
    });


    // Enable button only when changes are detected
    $(document).on('input change', '#update_student_id, #update_first_name, #update_last_name, #update_email, #update_password, #update_course,#update_year ,#update_section',function() {
        // set the original value for compareson in disabling/enabling the button
        let original_Id = $('#update_student_id').attr('data-original').trim();
        let original_Firstname= $('#update_first_name').attr('data-original').trim();
        let original_Lastname= $('#update_last_name').attr('data-original').trim();
        let original_Email = $('#update_email').attr('data-original').trim();
        let original_Password= $('#update_password').attr('data-original').trim();
        let original_Course = $('#update_course').attr('data-original').trim();
        let original_Year = $('#update_year').attr('data-original').trim();
        let original_Section = $('#update_section').attr('data-original').trim();


        //get the current input value
        let current_Id= $('#update_student_id').val().trim();
        let current_Firstname= $('#update_first_name').val().trim();
        let current_Lastname= $('#update_last_name').val().trim();
        let current_Email= $('#update_email').val().trim();
        let current_Password = $('#update_password').val().trim();
        let current_Course= $('#update_course').val().trim();
        let current_Year = $('#update_year').val().trim();
        let current_Section = $('#update_section').val().trim();


        if (current_Id !== original_Id || 
            current_Firstname !== original_Firstname || 
            current_Lastname !== original_Lastname || 
            current_Email !== original_Email || 
            current_Password !== original_Password || 
            current_Course !== original_Course || 
            current_Year !== original_Year || 
            current_Section !== original_Section ) {

        $('#save_changes').prop('disabled', false).css('opacity', '1'); // Enable button
        } else {
            $('#save_changes').prop('disabled', true).css('opacity', '0.5'); // Disable button
        }
    });


    $('#update_student_account_form').submit(function(e) {
        e.preventDefault();

        // Student ID Format Validation
        const studentId_up = $("#update_student_id").val();
        const studentIdRegex = /^\d+(?:-\d+)+$/;
        if (!studentIdRegex.test(studentId_up)) {
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
            title: 'Updating...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });
        $.ajax({
            type: 'PUT',
            url: '/update_student_account',
            data: $(this).serialize(),
            success: function(response) {
                if (response.success) {
                    $('#update_student_account_modal').modal('hide');
                    student_acount_table.ajax.reload(null, false);
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

    
})

