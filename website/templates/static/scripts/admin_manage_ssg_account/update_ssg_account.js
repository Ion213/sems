$(document).ready(function(){
    // UPDATE student aacount
    // Open the update modal
    $('#ssg_table').on('click', '.update-btn', function() {
        
        var selected_ssg_id = $(this).data('id');
        var name= $(this).data('name');
        var email= $(this).data('email');
        var password = $(this).data('password');


        $('#selected_ssg_account_id').val(selected_ssg_id);
        $('#update_ssg_name').val(name);
        $('#update_email').val(email);
        $('#update_password').val(password);


        // get the original value for compareson in disabling/enabling the button
        $('#update_ssg_name').attr('data-original', name);
        $('#update_email').attr('data-original', email);
        $('#update_password').attr('data-original', password);

        $('#update_ssg_account_modal').modal('show');
        // Disable "Save Changes" button initially
        $('#save_changes').prop('disabled', true).css('opacity', '0.5');
    });


    // Enable button only when changes are detected
    $(document).on('input change', '#update_ssg_name, #update_email, #update_password',function() {
        // set the original value for compareson in disabling/enabling the button
        let originalName = $('#update_ssg_name').attr('data-original').trim();
        let originalEmail = $('#update_email').attr('data-original').trim();
        let originalPassword = $('#update_password').attr('data-original').trim();

        //get the current input value
        let currentName = $('#update_ssg_name').val().trim();
        let currentEmail = $('#update_email').val().trim();
        let currentPassword= $('#update_password').val().trim();

        if (currentName !== originalName || 
            currentEmail !== originalEmail || 
            currentPassword !== originalPassword ) {

        $('#save_changes').prop('disabled', false).css('opacity', '1'); // Enable button
        } else {
            $('#save_changes').prop('disabled', true).css('opacity', '0.5'); // Disable button
        }
    });


    $('#update_ssg_account_form').submit(function(e) {
        e.preventDefault();
        Swal.fire({
            title: 'Updating...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });
        $.ajax({
            type: 'PUT',
            url: '/update_ssg_account',
            data: $(this).serialize(),
            success: function(response) {
                if (response.success) {
                    $('#update_ssg_account_modal').modal('hide');
                    ssg_acount_table.ajax.reload(null, false);
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

    