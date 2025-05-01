//add,delete,update schedule
$(document).ready(function() {
    //add schedule
    $('#add_schedule_form').submit(function(e) {
        
        e.preventDefault();
        Swal.fire({
            title: 'Adding...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        $.ajax({
            type: 'POST',
            url: '/add_schedule',
            data: $(this).serialize(),
            success: function(response) {
                if (response.success) {
                    upcoming_sched_table.ajax.reload(null, false);
                    ongoing_sched_table.ajax.reload(null, false);
                    completed_sched_table.ajax.reload(null, false);
                    Swal.fire({
                        icon: 'success',
                        title: 'Added!',
                        text: response.message,
                        timer: 1500,
                        timerProgressBar: true
                    });
                    upcoming_sched_table.ajax.reload(null, false);
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

});