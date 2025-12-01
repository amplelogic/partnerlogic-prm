import React, { useState } from 'react';
import { Download, FileText, Loader } from 'lucide-react';

const InvoiceGenerator = ({ deal, partner }) => {
  const [generating, setGenerating] = useState(false);

  const generateInvoice = () => {
    setGenerating(true);
    
    // Create invoice HTML
    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${deal.customer_name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      padding: 40px;
      background: white;
      color: #333;
    }
    .invoice-container { 
      max-width: 800px; 
      margin: 0 auto; 
      background: white;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
      padding: 40px;
    }
    .header { 
      display: flex; 
      justify-content: space-between; 
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }
    .company-info h1 { 
      color: #2563eb; 
      font-size: 32px; 
      margin-bottom: 10px;
    }
    .company-info p { 
      color: #666; 
      line-height: 1.6;
    }
    .invoice-details { 
      text-align: right; 
    }
    .invoice-details h2 { 
      color: #2563eb; 
      font-size: 28px; 
      margin-bottom: 10px;
    }
    .invoice-details p { 
      color: #666; 
      margin: 5px 0;
    }
    .billing-info { 
      display: flex; 
      justify-content: space-between; 
      margin: 40px 0;
      gap: 40px;
    }
    .billing-section { 
      flex: 1;
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
    }
    .billing-section h3 { 
      color: #2563eb; 
      margin-bottom: 15px;
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .billing-section p { 
      margin: 8px 0; 
      color: #555;
      line-height: 1.6;
    }
    .items-table { 
      width: 100%; 
      margin: 40px 0;
      border-collapse: collapse;
    }
    .items-table th { 
      background: #2563eb; 
      color: white; 
      padding: 15px; 
      text-align: left;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.5px;
    }
    .items-table td { 
      padding: 15px; 
      border-bottom: 1px solid #e5e7eb;
    }
    .items-table tr:hover { 
      background: #f9fafb; 
    }
    .totals { 
      margin-top: 30px;
      text-align: right;
    }
    .totals-row { 
      display: flex; 
      justify-content: flex-end; 
      margin: 10px 0;
      padding: 10px 0;
    }
    .totals-row.total { 
      border-top: 2px solid #2563eb; 
      padding-top: 15px;
      margin-top: 15px;
    }
    .totals-label { 
      width: 200px; 
      text-align: right; 
      padding-right: 20px;
      color: #666;
      font-weight: 500;
    }
    .totals-value { 
      width: 150px; 
      text-align: right;
      color: #333;
      font-weight: 600;
    }
    .totals-row.total .totals-label,
    .totals-row.total .totals-value { 
      font-size: 20px; 
      color: #2563eb;
      font-weight: 700;
    }
    .footer { 
      margin-top: 60px; 
      padding-top: 30px; 
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 14px;
      line-height: 1.8;
    }
    .footer strong { 
      color: #2563eb; 
    }
    @media print {
      body { padding: 0; }
      .invoice-container { 
        box-shadow: none; 
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <h1>AMPLE LOGIC</h1>
        <p>Professional Services Invoice</p>
        <p>Email: billing@amplelogic.com</p>
        <p>Phone: +1 (555) 123-4567</p>
      </div>
      <div class="invoice-details">
        <h2>INVOICE</h2>
        <p><strong>Invoice #:</strong> INV-${deal.id.slice(0, 8).toUpperCase()}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p><strong>Deal ID:</strong> ${deal.id.slice(0, 8)}</p>
      </div>
    </div>

    <!-- Billing Information -->
    <div class="billing-info">
      <div class="billing-section">
        <h3>Bill To:</h3>
        <p><strong>${deal.customer_name}</strong></p>
        <p>${deal.customer_company || 'N/A'}</p>
        <p>${deal.customer_email}</p>
        ${deal.customer_phone ? `<p>${deal.customer_phone}</p>` : ''}
      </div>
      <div class="billing-section">
        <h3>Partner:</h3>
        <p><strong>${partner?.first_name} ${partner?.last_name}</strong></p>
        <p>${partner?.organization?.name || 'N/A'}</p>
        <p>${partner?.email}</p>
        ${partner?.phone ? `<p>${partner?.phone}</p>` : ''}
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: right; width: 150px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Service: ${deal.support_type_needed?.replace('_', ' ').toUpperCase()}</strong><br>
            <small style="color: #666; display: block; margin-top: 5px;">
              Stage: ${deal.stage?.replace('_', ' ').toUpperCase()}<br>
              Priority: ${deal.priority?.toUpperCase()}<br>
              ${deal.notes ? `Notes: ${deal.notes}` : ''}
            </small>
          </td>
          <td style="text-align: right; font-weight: 600;">
            ${formatCurrency(deal.deal_value)}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      ${deal.your_commission ? `
      <div class="totals-row">
        <div class="totals-label">Partner Commission:</div>
        <div class="totals-value">${formatCurrency(deal.your_commission)}</div>
      </div>
      ` : ''}
      
      ${deal.price_to_ample_logic ? `
      <div class="totals-row">
        <div class="totals-label">Price to Ample Logic:</div>
        <div class="totals-value">${formatCurrency(deal.price_to_ample_logic)}</div>
      </div>
      ` : ''}

      <div class="totals-row total">
        <div class="totals-label">Total Amount:</div>
        <div class="totals-value">${formatCurrency(deal.deal_value)}</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>Payment Terms:</strong> Net 30 days</p>
      <p>Please make payment to: <strong>Ample Logic Inc.</strong></p>
      <p>Thank you for your business!</p>
      <br>
      <p style="font-size: 12px; color: #999;">
        This invoice was generated on ${new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Create a blob and trigger download
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${deal.customer_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => {
      setGenerating(false);
    }, 1000);
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <button
      onClick={generateInvoice}
      disabled={generating}
      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {generating ? (
        <>
          <Loader className="h-4 w-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Generate Invoice
        </>
      )}
    </button>
  );
};

export default InvoiceGenerator;