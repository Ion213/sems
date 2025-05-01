$(document).ready(function(){

// Handle the print button click in receipt modal
$('#printReceiptBtn').click(function () {
    const printContents = $('#receiptModal .modal-body').html(); // Capture the receipt content
    const printWindow = window.open('', '', 'width=800,height=600');  // Open a new print window

    // Add custom styles to the print window for better layout
    printWindow.document.write('<html><head><title>Print Receipt</title>');
    printWindow.document.write('<style>body { font-family: Arial, sans-serif; font-size: 14px; }</style>');  // Optional: Add custom CSS
    printWindow.document.write('</head><body>');
    
    // Write the receipt content to the print window
    printWindow.document.write(printContents);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();

    // Print after a slight delay to ensure the window is fully loaded
    setTimeout(() => {
      printWindow.print();
      printWindow.close();  // Close the print window after printing
    }, 500);
  });

  // Handle the export to Word button click
  $('#exportWordBtn').click(function () {
    const receiptHtml = $('#receiptModal .modal-body')[0].outerHTML;  // Get the receipt content as HTML

    // Add necessary styles to the Word file to ensure it looks good
    const htmlWithStyles = `
        <html xmlns:w="urn:schemas-microsoft-com:office:word">
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <style>
                body { font-family: Arial, sans-serif; font-size: 14px; }
                .receipt { border: 1px solid #000; padding: 15px; }
            </style>
        </head>
        <body>
            ${receiptHtml}
        </body>
        </html>`;

    // Create a Blob with the necessary MIME type for Word
    const blob = new Blob(['\ufeff' + htmlWithStyles], {
        type: 'application/msword'  // MIME type for Word document
    });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create a hidden link to trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.download = 'receipt.doc';  // Name of the exported Word file
    document.body.appendChild(link);
    link.click();  // Trigger download
    document.body.removeChild(link);  // Clean up the DOM
  });
})