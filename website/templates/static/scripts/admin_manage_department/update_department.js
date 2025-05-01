$(document).ready(function(){
    // UPDATE department
        // Open the update modal
        $('#department_table').on('click', '.update-btn', function() {
            var update_selected_department_id = $(this).data('id');
            var update_department_name = $(this).data('name');
            var update_department_year = $(this).data('year');
            var update_department_section = $(this).data('section');

            $('#update_selected_department_id').val(update_selected_department_id);
            $('#update_department_name').val(update_department_name);
            $('#update_year').val(update_department_year);
            $('#update_section').val(update_department_section);


            // get the original value for compareson in disabling/enabling the button
            $('#update_department_name').attr('data-original', update_department_name);
            $('#update_year').attr('data-original', update_department_year);
            $('#update_section').attr('data-original', update_department_section);

            $('#update_department_modal').modal('show');

            // Disable "Save Changes" button initially
            $('#save_changes').prop('disabled', true).css('opacity', '0.5');

        });

         // Enable button only when changes are detected
        $(document).on('input change', '#update_department_name, #update_year, #update_section', function() {
            // set the original value for compareson in disabling/enabling the button
            let originalName = $('#update_department_name').attr('data-original').trim();
            let originalYear= $('#update_year').attr('data-original').trim();
            let originalSection = $('#update_section').attr('data-original').trim();

            //get the current input value
            let currentName = $('#update_department_name').val().trim();
            let currentYear = $('#update_year').val().trim();
            let currentSection = $('#update_section').val().trim();

            if (currentName !== originalName || 
                currentYear !== originalYear ||
                currentSection !==originalSection
            ) {
                $('#save_changes').prop('disabled', false).css('opacity', '1'); // Enable button
            } else {
                $('#save_changes').prop('disabled', true).css('opacity', '0.5'); // Disable button
            }
        });

        $('#update_department_form').submit(function(e) {
            e.preventDefault();
            Swal.fire({
                title: 'Updating...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });
            $.ajax({
                type: 'PUT',
                url: '/update_department',
                data: $(this).serialize(),
                success: function(response) {
                    if (response.success) {
                        $('#update_department_modal').modal('hide');
                        department_table.ajax.reload(null, false);
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


   