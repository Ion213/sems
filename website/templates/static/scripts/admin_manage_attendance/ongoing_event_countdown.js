$(document).ready(function () {
    

    // === ACTIVITY COUNTDOWN LOGIC ===
    const $activitySelect = $('#activityComboBox');
    const $countdownText = $('#countdownText');
    const $countdownTimer = $('#countdownTimer');
    const $countdownBadge = $countdownTimer.parent();

    const $scanIn = $('#scan-btn-in');
    const $scanOut = $('#scan-btn-out');

    // Disable scan buttons if no valid activity
    function toggleScanButtons() {
        const isValid = !!$activitySelect.val();
        $scanIn.prop('disabled', !isValid);
        $scanOut.prop('disabled', !isValid);
    }

    function updateCountdown() {
        const selectedOption = $activitySelect.find(':selected');
        if (!selectedOption.val()) return;

        const startTime = new Date(selectedOption.data('start')).getTime();
        const endTime = new Date(selectedOption.data('end')).getTime();
        const now = new Date().getTime();

        if (now < startTime) {
            const distance = startTime - now;
            $countdownText.text('Starting in: ');
            updateTimerDisplay(distance);
        } else if (now < endTime) {
            const distance = endTime - now;
            $countdownText.text('Ends in: ');
            updateTimerDisplay(distance);
        } else {
            $countdownText.text('Activity ended');
            $countdownTimer.text('');
            $countdownBadge.removeClass('bg-warning bg-info text-warning text-info')
                           .addClass('bg-secondary bg-opacity-10 text-secondary');
        }
    }

    function updateTimerDisplay(distance) {
        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        $countdownTimer.text(
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );

        if (distance < 3600000) {
            $countdownBadge.removeClass('bg-info text-info')
                           .addClass('bg-warning bg-opacity-10 text-warning');
        } else {
            $countdownBadge.removeClass('bg-warning text-warning')
                           .addClass('bg-info bg-opacity-10 text-info');
        }
    }

    // Initialize countdown if activities exist
    if ($activitySelect.find('option').length >= 1) {
        updateCountdown();
        toggleScanButtons();
        $activitySelect.on('change', function () {
            updateCountdown();
            toggleScanButtons();
        });
        setInterval(updateCountdown, 1000);
    } else {
        $countdownText.text('No activities');
        $countdownTimer.text('');
        $activitySelect.prop('disabled', true);
        $scanIn.prop('disabled', true);
        $scanOut.prop('disabled', true);
    }
});