$(document).ready(function(){
    // Load sound effects
    const successSound = new Audio('/static/js_lib/sounds/success.mp3'); // Change path as needed
    const failSound = new Audio('/static/js_lib/sounds/invalid.mp3'); // Change path as needed

    function playSound(sound) {
        sound.pause();  // Stop the current playback
        sound.currentTime = 0;  // Reset the audio to the beginning
        sound.play();  // Play the sound
    }

    const html5QrCode = new Html5Qrcode("reader");
    let selectedCameraId = null;
    let isScanningIn = false;
    let isScanningOut = false;
    let scanCooldown = false;

    // Populate camera dropdown
    function populateCameraDropdown() {
        Html5Qrcode.getCameras().then(devices => {
            if (devices.length > 0) {
                let cameraSelect = $("#camera-select");
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
        
        let activity_Id = $("#activityComboBox").val();
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
                ongoing_attendance_table.ajax.reload(null, false);
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
        let button = scanType === 'IN' ? $("#scan-btn-in") : $("#scan-btn-out");

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
        let button = scanType === 'IN' ? $("#scan-btn-in") : $("#scan-btn-out");

        return html5QrCode.stop().then(() => {
            if (scanType === 'IN') isScanningIn = false;
            else isScanningOut = false;
            button.html(`<i class="fa-solid fa-camera"></i> ${scanType}`);
        }).catch(err => console.error("Error stopping scanner:", err));
    }

    // Toggle scanner when clicking buttons
    $("#scan-btn-in").on("click", function () {
        if (isScanningIn) stopScanner('IN');
        else startScanner('IN');
    });

    $("#scan-btn-out").on("click", function () {
        if (isScanningOut) stopScanner('OUT');
        else startScanner('OUT');
    });

    // Restart scanner when camera is changed
    $("#camera-select").on("change", function() {
        selectedCameraId = $(this).val();
        if (isScanningIn) stopScanner('IN').then(() => startScanner('IN'));
        if (isScanningOut) stopScanner('OUT').then(() => startScanner('OUT'));
    });
});