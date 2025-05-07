$(document).ready(function () {
    $('#c_user-search').on('input', function () {
        const input = $(this).val().trim();
        const userList = $('#c_user-list');

        // Clear results if input is empty
        if (input === '') {
            userList.empty().append('<li class="list-group-item text-muted">Please enter a name of user to add.</li>');
            return;
        }

        // Send AJAX request
        $.ajax({
            url: '/filter_student',
            type: 'GET',
            data: { input: input },
            success: function (response) {
                userList.empty();

                if (response.user && response.user.length) {
                    response.user.forEach(user => {
                        if (!$(`#user-${user.id}`).length) { // Prevent duplicates
                            userList.append(`
                                <li id="user-${user.id}" class="list-group-item d-flex justify-content-between align-items-center">
                                    <span>${user.first_name} ${user.last_name} - ${user.department}</span>
                                    <button class="add-btn-in btn btn-primary btn-sm" 
                                        data-id="${user.id}"
                                        >
                                        <i class="fa-solid fa-plus"></i> IN
                                    </button>
                                    <button class="add-btn-out btn btn-warning btn-sm" 
                                        data-id="${user.id}"
                                       >
                                        <i class="fa-solid fa-plus"></i> OUT
                                    </button>
                                    <button class="add-btn-absent btn btn-danger btn-sm" 
                                        data-id="${user.id}"
                                      >
                                        <i class="fa-solid fa-circle-xmark"></i> ABSENT
                                    </button>
                                </li>
                            `);
                        }
                    });
                } else {
                    userList.append('<li class="list-group-item text-muted">No users found.</li>');
                }
            },
            error: function (xhr, status, error) {
                console.error('AJAX Error:', status, error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'An error occurred while fetching users. Please try again later.',
                    confirmButtonText: 'OK'
                });
            }
        });
    });

    let activity_Id

    // Open the add attendance modal
    $(document).on('click', '.btn-add-attendance', function () {
        activity_Id = $(this).data('id');
       var activity_name=$(this).data('activity_name')
       var activity_start_time=$(this).data('activity_start_time')
       var activity_end_time=$(this).data('activity_end_time')

        $('#activity_title').text(`${activity_name} | (${activity_start_time}-${activity_end_time})`)

        $('#add_attendees_completed_activity').modal('show');
    });



    // Handle adding IN attendance
    $('#c_user-list').on('click', '.add-btn-in', function (e) {
        e.preventDefault();
        const user_Id = $(this).data('id');

        if (!activity_Id) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No Ongoing Event and Activity',
                confirmButtonText: 'OK',
                timer: 1500,
                timerProgressBar: true
            });
            return;
        }

        $.ajax({
            url: '/add_student_in',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ 'activity_id': activity_Id,'student_id' :user_Id}), 
            success: function (response) {
                if (response.success) {
                    completed_event_activity_attendance_table.ajax.reload(null, false);
                    //$('#add_attendees_completed_activity').modal('hide');
                    $('#c_add_form')[0].reset();

                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: response.message,
                        timer: 1500,
                        timerProgressBar: true
                    });

                   // $(`#user-${user_Id}`).remove(); // Remove user from list after adding
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: '',
                        text: response.message,
                        timer: 3000,
                        timerProgressBar: true
                    });
                }
            },
            error: function (xhr, status, error) {
                console.error('AJAX Error:', status, error);
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




    // Handle adding OUT attendance
    $('#c_user-list').on('click', '.add-btn-out', function (e) {
        e.preventDefault();
        const user_Id = $(this).data('id');

        if (!activity_Id) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No Ongoing Event and Activity',
                confirmButtonText: 'OK',
                timer: 1500,
                timerProgressBar: true
            });
            return;
        }

        $.ajax({
            url: '/add_student_out',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ 'activity_id': activity_Id,'student_id' :user_Id}), 
            success: function (response) {
                if (response.success) {
                    completed_event_activity_attendance_table.ajax.reload(null, false);
                    //$('#add_attendees_completed_activity').modal('hide');
                    $('#c_add_form')[0].reset();

                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: response.message,
                        timer: 1500,
                        timerProgressBar: true
                    });

                  //  $(`#user-${user_Id}`).remove(); // Remove user from list after adding
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: '',
                        text: response.message,
                        timer: 3000,
                        timerProgressBar: true
                    });
                }
            },
            error: function (xhr, status, error) {
                console.error('AJAX Error:', status, error);
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


    // Handle adding absent attendance
    $('#c_user-list').on('click', '.add-btn-absent', function (e) {
        e.preventDefault();
        const user_Id = $(this).data('id');

        if (!activity_Id) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No Ongoing Event and Activity',
                confirmButtonText: 'OK',
                timer: 1500,
                timerProgressBar: true
            });
            return;
        }

        $.ajax({
            url: '/add_student_absent_completed',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ 'activity_id': activity_Id,'student_id' :user_Id}), 
            success: function (response) {
                if (response.success) {
                    completed_event_activity_attendance_table.ajax.reload(null, false);
                   // $('#add_attendees_completed_activity').modal('hide');
                    $('#c_add_form')[0].reset();

                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: response.message,
                        timer: 1500,
                        timerProgressBar: true
                    });

                    //$(`#user-${user_Id}`).remove(); // Remove user from list after adding
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: '',
                        text: response.message,
                        timer: 3000,
                        timerProgressBar: true
                    });
                }
            },
            error: function (xhr, status, error) {
                console.error('AJAX Error:', status, error);
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



//----QR CODE 

// Load sound effects
const successSound = new Audio('/static/js_lib/sounds/success.mp3'); // Change path as needed
const failSound = new Audio('/static/js_lib/sounds/invalid.mp3'); // Change path as needed

function playSound(sound) {
    sound.pause();  // Stop the current playback
    sound.currentTime = 0;  // Reset the audio to the beginning
    sound.play();  // Play the sound
}

const html5QrCode = new Html5Qrcode("c_reader");
let selectedCameraId = null;
let isScanningIn = false;
let isScanningOut = false;
let scanCooldown = false;

// Populate camera dropdown
function populateCameraDropdown() {
    Html5Qrcode.getCameras().then(devices => {
        if (devices.length > 0) {
            let cameraSelect = $("#c_camera-select");
            cameraSelect.empty();
            devices.forEach(device => {
                cameraSelect.append(`<option value="${device.id}">${device.label || `Camera ${device.id}`}</option>`);
            });
            selectedCameraId = devices[0].id; // Default to first camera
        } else {
            alert("No cameras found.");
        }
    }).catch(err => console.error("Error fetching cameras:", err));
}

// Fetch cameras on page load
populateCameraDropdown();

// Scanner configuration
const config = {
    fps: 10,
    aspectRatio: 1,
    disableFlip: true,
    qrbox: function(viewfinderWidth, viewfinderHeight) {
        const minSize = Math.min(viewfinderWidth, viewfinderHeight);
        return { width: Math.floor(minSize * 0.9), height: Math.floor(minSize * 0.9) };
    },
};

function showNotification(type, message) {
    Swal.fire({
        toast: true,
        icon: type, // 'success', 'error', etc.
        title: message,
        position: 'center',
        showConfirmButton: false,
        timer: 3000,
        customClass: {
            popup: 'custom-swal-size'
        }
    });
}

// Common scan callback
function handleQRCode(decodedText, scanType) {
    if (scanCooldown) return;
    if (!activity_Id) {
        showNotification('danger', 'Please select an activity before scanning.');
        return;
    }

    const student_ID = decodedText; 

    scanCooldown = true; // Prevent multiple scans
    html5QrCode.pause(true, false); // Pause scanner

    let url = scanType === 'IN'
        ? `/add_student_in_QR`
        : `/add_student_out_QR`;

    //OR

    /*
    let url;
    if (scanType === 'IN') {
        url = '/add_student_in_QR';
    } else {
        url = '/add_student_out_QR';
    }
    */
    Swal.fire({
        title: 'Checking QR code ID...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ 'activity_id': activity_Id,'student_ID' :student_ID}), 
        success: function(response) {
            completed_event_activity_attendance_table.ajax.reload(null, false);
            showNotification(response.success ? 'success' : 'danger', response.message);
            if (response.success) {
                playSound(successSound);// Play success sound
            } else {
                playSound(failSound);  // Play fail sound
            }
        },
        error: function(xhr) {
            failSound.play()
            showNotification('danger', 'An error occurred: ' + xhr.responseText);
        },
        complete: function() {
            setTimeout(() => {
                scanCooldown = false;
                html5QrCode.resume();
            }, 1000);
        }
    });
}

// Function to start scanner
function startScanner(scanType) {
    if (!selectedCameraId) {
        alert("No camera selected.");
        return;
    }

    let isScanning = scanType === 'IN' ? isScanningIn : isScanningOut;
    let button = scanType === 'IN' ? $("#c_scan-btn-in") : $("#c_scan-btn-out");

    if (!isScanning) {
        html5QrCode.start(selectedCameraId, config, (decodedText) => handleQRCode(decodedText, scanType))
            .then(() => {
                if (scanType === 'IN') isScanningIn = true;
                else isScanningOut = true;
                button.html('<i class="fa-regular fa-circle-stop"></i> Scanning...');
            })
            .catch(err => console.error("Unable to start scanning:", err));
    }
}

// Function to stop scanner
function stopScanner(scanType) {
    let button = scanType === 'IN' ? $("#c_scan-btn-in") : $("#c_scan-btn-out");

    return html5QrCode.stop().then(() => {
        if (scanType === 'IN') isScanningIn = false;
        else isScanningOut = false;
        button.html(`<i class="fa-solid fa-camera"></i> ${scanType}`);
    }).catch(err => console.error("Error stopping scanner:", err));
}

// Toggle scanner when clicking buttons
$("#c_scan-btn-in").on("click", function (e) {
    e.preventDefault();
    if (isScanningIn) stopScanner('IN');
    else startScanner('IN');
});

$("#c_scan-btn-out").on("click", function (e) {
    e.preventDefault();
    if (isScanningOut) stopScanner('OUT');
    else startScanner('OUT');
});

// Restart scanner when camera is changed
$("#c_camera-select").on("change", function() {
    selectedCameraId = $(this).val();
    if (isScanningIn) stopScanner('IN').then(() => startScanner('IN'));
    if (isScanningOut) stopScanner('OUT').then(() => startScanner('OUT'));
});


$('#add_attendees_completed_activity').on('hidden.bs.modal', function () {
    if (isScanningIn) {
        stopScanner('IN');
    }
    if (isScanningOut) {
        stopScanner('OUT');
    }
});


    
});