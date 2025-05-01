$(document).ready(function(){
    // DELETE EVENT
    $('#department_table').on('click', '.delete-btn', function() {
        var departmentId = $(this).data('id');
        Swal.fire({
            title: 'Are you sure?',
            text: 'It will also delete students belong to this Department!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Deleting...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });
                $.ajax({
                    url: '/delete_department',
                    type: 'DELETE',
                    contentType: 'application/json',
                    data: JSON.stringify({ 'department_id': departmentId }),
                    success: function(response) {
                        if (response.success) {
                            department_table.ajax.reload(null, false);
                            Swal.fire({
                                icon: 'success',
                                title: 'Deleted!',
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
