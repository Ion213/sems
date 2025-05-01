$(document).ready(function() {
    let userId;

    $(document).on('click', '.view-logs-btn', function() {
        userId = $(this).data('id');
        view_logs(userId);
        $('#viewLogsModal').modal('show');
    });
    
    function view_logs(userId) {
        Swal.fire({
            title: 'Fetching logs...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });
    
        $.ajax({
            url: '/view_ssg_logs',
            data: { ssg_id: userId },
            method: 'GET',
            success: function(response) {
                Swal.close(); // Close loading no matter what happens
                $('#logsList').empty(); // Always clear the list first
    
                if (response.success && response.data.length > 0) {
                    // Append new log data to the modal as list items
                    response.data.forEach(function(log) {
                        $('#logsList').append(`
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                <div><strong>Logs details:</strong> ${log.activity_info}</div>
                                <div><strong>Date:</strong> ${log.activity_time}</div>
                            </li>
                        `);
                        
                    });
                } else {

                    // No logs available
                     $('#clearLogsBtn').prop('disabled', true)
                    $('#logsList').append(`
                        <li class="list-group-item text-center">
                            <strong>No logs available</strong>
                        </li>
                    `);
                }
            },
            error: function(xhr, status, error) {
                Swal.close();
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error fetching logs!'+ error
                });
            }
        });
    }
    

    // Clear Logs button
    $('#clearLogsBtn').on('click', function() {
        // Make AJAX request to clear the logs for the selected user
        $.ajax({
            url: '/clear_ssg_logs', // Define a route for clearing logs
            type: 'DELETE', // Correct method type
            contentType: 'application/json', // Specify content type as JSON
            data: JSON.stringify({ ssg_id: userId }), // Convert data to JSON string
            success: function(response) {
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Cleared!',
                        text: response.message,
                        timer: 1500,
                        timerProgressBar: true
                    });
                    $('#logsList').empty();  // Clear the logs list in the modal
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
