$(document).ready(function(){
    $('#generate-btn').click(function () {
        $.ajax({
            url: '/generate_student_id',
            method: 'GET',
                    success: function (data) {
                            $('#student_idT').val(data.random_id); // Set the generated ID in the input field
                    },
                    error: function () {
                            alert('Failed to generate student ID. Please try again.');
                    }
            });
        });
    
    $('#update_student_account_modal').on('click', '#generate-btn', function() {
            $.ajax({
                url: '/generate_student_id',
                method: 'GET',
            success: function (data) {
                    $('#update_student_id').val(data.random_id); // Set the generated ID in the input field
            },
            error: function () {
                    alert('Failed to generate Access ID. Please try again.');
            }
        });
    });
})

