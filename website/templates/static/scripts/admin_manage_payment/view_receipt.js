$(document).ready(function(){


$('#transaction_history').on('click', '.btn-view-receipt ',function(){
    let transaction_id=$(this).data('id')
    $.get(`/get_receipt/${transaction_id}`, function(data) {
        if (data.success) {
            const r = data.receipt;
            // fill receipt modal content dynamically
            $('#receiptModal .modal-body').html(`
                <h4>Transaction Code: ${r.transaction_code}</h4>
                <p><strong>Name:</strong> ${r.student_name}</p>
                <p><strong>Department:</strong> ${r.department}</p>
                <p><strong>Year:</strong> ${r.year}</p>
                <p><strong>Section:</strong> ${r.section}</p>
                <p><strong>Total Fines:</strong> ₱${r.total_fines}</p>
                <p><strong>Cash Amount:</strong> ₱${r.cash_amount}</p>
                <p><strong>Amount Paid:</strong> ₱${r.amount_paid}</p>
                <p><strong>Change:</strong> ₱${r.change}</p>
                <p><strong>Note:</strong> ${r.note || 'None'}</p>
                <p><strong>Date:</strong> ${r.date}</p>
            `);

            // Show the modal
            $('#receiptModal').modal('show');
        }
    });
})

})
