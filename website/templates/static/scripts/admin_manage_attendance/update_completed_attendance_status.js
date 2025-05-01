$(document).ready(function() {
    // Open the update modal
    $('#completed_event_activity_attendance_table').on('click', '.update-btn', function() {
       let attendance_id = $(this).data('id');
       let student_name = $(this).data('student_name');
       let status=$(this).data('status')


       $('#attendance_id').val(attendance_id);
       $('#student_name').val(student_name);
       $('#update_status').val(status);

       // get the original value for compareson in disabling/enabling the button
       $('#update_status').attr('data-original', status);

       $('#update_attendance_modal').modal('show');
       // Disable "Save Changes" button initially
       $('#confirm_button').prop('disabled', true).css('opacity', '0.5');
   });

   // Enable button only when changes are detected
   $(document).on('input change', '#update_status', function() {
       // set the original value for compareson in disabling/enabling the button
       let original_status = $('#update_status').attr('data-original').trim();


       //get the current input value
       let current_status = $('#update_status').val().trim();


       if (current_status !== original_status ) {
           $('#confirm_button').prop('disabled', false).css('opacity', '1'); // Enable button
       } else {
           $('#confirm_button').prop('disabled', true).css('opacity', '0.5'); // Disable button
       }
   });

   // Handle form submission
   $('#update_attendance_form').submit(function(e) { // Fix: Correct form selector
       e.preventDefault();
       Swal.fire({
           title: 'Updating...',
           allowOutsideClick: false,
           didOpen: () => Swal.showLoading()
       });

       $.ajax({
           type: 'PUT',
           url: '/update_attendance_status',
           data: $(this).serialize(),
           success: function(response) {
               if (response.success) {
                   $('#update_attendance_modal').modal('hide'); // Fix: Correct modal ID
                   completed_event_activity_attendance_table.ajax.reload(null, false);
                   Swal.fire({
                       icon: 'success',
                       title: 'Updated!',
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
   });
});
