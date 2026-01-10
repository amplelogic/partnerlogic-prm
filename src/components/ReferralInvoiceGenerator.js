import React, { useState } from 'react';
import { Download, FileText, Loader } from 'lucide-react';

const ReferralInvoiceGenerator = ({ referralOrder, partner }) => {
  const [generating, setGenerating] = useState(false);

  const generateInvoice = () => {
    setGenerating(true);
    
    // Create invoice HTML
    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Referral Order Invoice - ${referralOrder.client_name}</title>
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
      border-bottom: 3px solid #16a34a;
    }
    .company-info h1 { 
      color: #16a34a; 
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
      color: #16a34a; 
      font-size: 24px; 
      margin-bottom: 10px;
    }
    .referral-badge {
      display: inline-block;
      background: #16a34a;
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .invoice-details p { 
      color: #666; 
      margin: 5px 0;
    }
    .section { 
      margin: 30px 0; 
    }
    .section-title { 
      font-size: 18px; 
      color: #16a34a; 
      margin-bottom: 15px; 
      font-weight: 600;
    }
    .info-grid { 
      margin-bottom: 30px;
      max-width: 400px;
    }
    .info-block h3 { 
      font-size: 14px; 
      color: #888; 
      margin-bottom: 8px; 
      text-transform: uppercase; 
      letter-spacing: 0.5px;
    }
    .info-block p { 
      color: #333; 
      line-height: 1.6;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 20px 0;
    }
    th { 
      background: #f8fafc; 
      padding: 12px; 
      text-align: left; 
      font-weight: 600; 
      color: #475569;
      border-bottom: 2px solid #e2e8f0;
    }
    td { 
      padding: 12px; 
      border-bottom: 1px solid #e2e8f0;
    }
    .total-row { 
      background: #f8fafc; 
      font-weight: 600;
    }
    .total-row td { 
      padding: 15px 12px; 
      font-size: 18px;
      color: #16a34a;
    }
    .commission-section {
      background: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #16a34a;
      margin: 20px 0;
    }
    .commission-section h3 {
      color: #16a34a;
      margin-bottom: 10px;
      font-size: 16px;
    }
    .commission-amount {
      font-size: 24px;
      font-weight: 700;
      color: #16a34a;
    }
    .footer { 
      margin-top: 40px; 
      padding-top: 20px; 
      border-top: 1px solid #e2e8f0; 
      text-align: center; 
      color: #888; 
      font-size: 12px;
    }
    .notes { 
      background: #f8fafc; 
      padding: 15px; 
      border-radius: 6px; 
      margin: 20px 0;
    }
    .notes h3 { 
      color: #475569; 
      margin-bottom: 8px; 
      font-size: 14px;
    }
    .notes p { 
      color: #64748b; 
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        <h1>PartnerLogic PRM</h1>
        <p>Partner Referral Management</p>
        <p>Email: support@partnerlogic.com</p>
        <p>Phone: +1 (555) 123-4567</p>
      </div>
      <div class="invoice-details">
        <div class="referral-badge">REFERRAL ORDER INVOICE</div>
        <h2>Invoice #RO-${referralOrder.id.toString().slice(0, 8).toUpperCase()}</h2>
        <p><strong>Order Date:</strong> ${new Date(referralOrder.created_at).toLocaleDateString()}</p>
        ${referralOrder.expected_delivery_date ? `<p><strong>Expected Delivery:</strong> ${new Date(referralOrder.expected_delivery_date).toLocaleDateString()}</p>` : ''}
        <p><strong>Status:</strong> ${referralOrder.status.toUpperCase()}</p>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-block">
        <h3>Referring Partner</h3>
        <p><strong>${partner?.organization?.name || partner?.first_name && partner?.last_name ? `${partner.first_name} ${partner.last_name}` : 'Partner'}</strong></p>
        ${partner?.email ? `<p>${partner.email}</p>` : ''}
        ${partner?.organization?.name && partner?.first_name && partner?.last_name ? `<p>Contact: ${partner.first_name} ${partner.last_name}</p>` : ''}
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">Referral Order Details</h2>
      <table>
        <thead>
          <tr>
            <th>Product/Service</th>
            <th>Description</th>
            <th style="text-align: right;">Order Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>${referralOrder.product_name || 'Product/Service'}</strong></td>
            <td>${referralOrder.product_description || '-'}</td>
            <td style="text-align: right; font-weight: 600;">
              ${referralOrder.order_value ? `${referralOrder.currency || 'USD'} ${referralOrder.order_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
            </td>
          </tr>
          <tr class="total-row">
            <td colspan="2"><strong>Total Order Value</strong></td>
            <td style="text-align: right;">
              ${referralOrder.order_value ? `${referralOrder.currency || 'USD'} ${referralOrder.order_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="commission-section">
      <h3>Referral Commission</h3>
      <p style="margin-bottom: 8px;">Commission Rate: <strong>${referralOrder.commission_percentage || 0}%</strong></p>
      <div class="commission-amount">
        ${referralOrder.commission_amount ? `${referralOrder.currency || 'USD'} ${referralOrder.commission_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
      </div>
      <p style="margin-top: 8px; font-size: 12px; color: #666;">
        This commission is payable to the referring partner upon successful completion of the referral order.
      </p>
    </div>

    ${referralOrder.notes ? `
    <div class="notes">
      <h3>Additional Notes</h3>
      <p>${referralOrder.notes}</p>
    </div>
    ` : ''}

    <div class="footer">
      <p><strong>Thank you for your referral partnership!</strong></p>
      <p>This is a system-generated referral order invoice from PartnerLogic PRM</p>
      <p>For any queries, please contact our partner support team</p>
    </div>
  </div>
  
  <script>
    // Auto-trigger print dialog when page loads
    setTimeout(function() {
      window.print();
      // Close window after print dialog is dismissed (optional)
      window.onafterprint = function() {
        window.close();
      };
    }, 500);
  </script>
</body>
</html>
    `;

    // Open in new window to trigger print dialog (allows Save as PDF)
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate invoice');
      setGenerating(false);
      return;
    }
    
    printWindow.document.open();
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();

    setGenerating(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <FileText className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Referral Order Invoice</h3>
            <p className="text-sm text-gray-500">
              Generate a professional invoice for this referral order
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Client</dt>
            <dd className="mt-1 text-sm text-gray-900">{referralOrder.client_name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Order Value</dt>
            <dd className="mt-1 text-sm font-bold text-gray-900">
              {referralOrder.order_value 
                ? `${referralOrder.currency || 'USD'} ${referralOrder.order_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '-'
              }
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Commission</dt>
            <dd className="mt-1 text-sm font-bold text-green-600">
              {referralOrder.commission_amount 
                ? `${referralOrder.currency || 'USD'} ${referralOrder.commission_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${referralOrder.commission_percentage}%)`
                : '-'
              }
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                referralOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                referralOrder.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                referralOrder.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {referralOrder.status}
              </span>
            </dd>
          </div>
        </dl>

        <div className="mt-6">
          <button
            onClick={generateInvoice}
            disabled={generating}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Generating Invoice...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate & Download Invoice
              </>
            )}
          </button>
          <p className="mt-2 text-xs text-center text-gray-500">
            Click to open print dialog and save as PDF
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReferralInvoiceGenerator;
