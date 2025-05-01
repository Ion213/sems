
$(document).ready(function() {

    $('#user-search').on('input', function () {
      const input = $(this).val().trim();

      // Clear results if input is empty
      if (input === '') {
          $('#user-list').empty().append('<li class="list-group-item text-muted">Please input student name to add a payment.</li>');
          return;
      }
      

      // Send AJAX request
      $.ajax({
          url: '/filter_student',
          type: 'GET',
          data: { input: input },
          success: function (response) {
              const userList = $('#user-list');
              userList.empty();

              if (response.user && response.user.length) {
                  response.user.forEach(user => {
                      userList.append(`
                          <li id="user-${user.id}" class="list-group-item d-flex justify-content-between align-items-center">
                              ${user.first_name} ${user.last_name} ${user.department}
                              <button class="select-student-button btn btn-success btn-sm" 
                                  data-id="${user.id}"
                                  data-first_name="${user.first_name}"
                                  data-last_name="${user.last_name}"
                                  data-department="${user.department}"
                                  style="display:inline;">
                                  <i class="fa-solid fa-user"></i> select student
                              </button>
                          </li>
                      `);
                  });
              } else {
                  userList.append('<li class="list-group-item text-muted">No Student found.</li>');
              }
          },
          error: function (xhr, status, error) {
              console.error('Error:', error);
              Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: 'An error occurred while fetching users. Please try again later.',
                  confirmButtonText: 'OK'
              });
          }
      });
  });

//get fines list
      $(document).on('click', '.select-student-button', function() {
          const userId = $(this).data('id');
          const first_name = $(this).data('first_name');
          const last_name = $(this).data('last_name');
          const department = $(this).data('department');
          $('#selected_student').val(userId);
          $('#selected_student_name').text(`🧑‍🎓 ${first_name} ${last_name} | ${department}`);
          var selected_student_id = $('#selected_student').val(); // ✅ Fix here

          if (selected_student_id) {
              $('#user-search').val("");
              $('#user-list').empty();

              $.ajax({
                  url: '/get_student_unpaid_attendance_fines',
                  type: 'GET',
                  data: { user_id: selected_student_id },
                  success: function(response) {
                      const data = response.data || [];
                      const container = $('#attendanceContainer');
                      container.empty();

                      let totalFine = 0;
                      if (data.length === 0) {
                          container.html('<em class="text-muted">No unpaid attendance fines</em>');
                      } else {
                          data.forEach(att => {
                              totalFine += att.fines;
                              container.append(`
                                  <div class="form-check">

                                      <input class="form-check-input attendance-check" type="checkbox" 
                                      name="attendance_ids" 
                                      value="${att.id}" 
                                      data-fine="${att.fines}" 
                                      data-id="${att.id}" 
                                      checked>
                                      
                                      <label class="form-check-label">
                                          <strong>
                                          ${att.schedule_name}</strong> 
                                          - ${att.activity_name} (${att.status}) 
                                          - ₱${att.fines.toFixed(2)}
                                      </label>

                                  </div>
                              `);
                          });
                      }

                      $('#total_fines').val(totalFine.toFixed(2));
                      updateChange();
                  },
                  error: function(xhr, status, error) {
                      console.error('Error fetching attendances:', error);
                      Swal.fire('Error', 'Failed to fetch attendance fines.', 'error');
                  }
              });
          }
      });

//reset when modal closed
      $('#addPaymentModal').on('click','.btn-close',function(){
        $('#selected_student').val(null)
        $('#selected_student_name').text(null)

        $('#total_fines').val(null)
        $('#cash_amount').val(null)
        $('#change').val(null)
        $('#notes').val(null)
        $('#attendanceContainer').empty()

        $('#user-search').val(null);
        $('#user-list').empty();
      })


      $('#cash_amount').on('input', function() {
        updateChange();
      });

      $(document).on('change', '.attendance-check', function() {
        let total = 0;
        $('.attendance-check:checked').each(function() {
          total += parseFloat($(this).data('fine'));
        });
        $('#total_fines').val(total.toFixed(2));
        updateChange();
      });

      function updateChange() {
        const cash = parseFloat($('#cash_amount').val()) || 0;
        const total = parseFloat($('#total_fines').val()) || 0;
        const change = Math.max(cash - total, 0);
        $('#change').val(change.toFixed(2));
      }

//payment submit
      $('#addPaymentForm').on('submit', function(e) {
        e.preventDefault();
        let selected_attendance_id = $('.attendance-check:checked').map(function () {
            return $(this).data('id');
          }).get();
        if (selected_attendance_id.length === 0) {
              Swal.fire('No items selected', 'Please select at least one item to pay.', 'warning');
                return;
              }
      Swal.fire({
          title: 'Proccessing payment...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
      });

      $.ajax({
          type: 'POST',
          url: '/add_payment',
          data: $(this).serialize(),
          success: function(response) {
              if (response.success) {
                  transaction_history.ajax.reload(null, false);
                  Swal.fire({
                      icon: 'success',
                      title: 'Success',
                      text: response.message,
                      timer: 1500,
                      timerProgressBar: true
                  });

                   $('.attendance-check:checked').closest('.form-check').remove();
                   $('#total_fines').val(null)
                    $('#cash_amount').val(null)
                    $('#change').val(null)
                    $('#notes').val(null)

                    // Close add payment modal
                    $('#addPaymentModal').modal('hide');
                    

                    // Fetch and show receipt
        $.get(`/get_receipt/${response.transaction_id}`, function(data) {
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
                    
              } 
              else {
                  Swal.fire({
                      icon: 'error',
                      title: 'Invalid',
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
