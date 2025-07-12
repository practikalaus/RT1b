export const sampleTemplate = {
  name: "Default Rack Audit Template",
  content: `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* ... (keep existing styles) ... */
    @page {
      size: A4;
      margin: 20mm;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      page-break-after: always;
      position: relative;
    }

    .page-footer {
      position: absolute;
      bottom: 10mm;
      right: 10mm;
      font-size: 12px;
    }

    .header-logo {
      display: block;
      width: auto;
      height: 60px;
      margin: 0 auto 1.5rem;
      object-fit: contain;
    }
 
    @media print {
      body { margin: 0; padding: 20mm; counter-reset: page; }
      .page-number::after { counter-increment: page; content: "Page " counter(page); }
    }
  </style>
</head>
<body>
 <div class="page">
  <div class="header">
    <img src="https://fvvdqinsqguilxjjszcz.supabase.co/storage/v1/object/public/audit-photos/asset/logo1.png" alt="Company Logo" class="header-logo" />
    <h1>Rack Audit Report</h1>
    <div class="meta">
      <p><strong>Reference:</strong> {{reference_number}}</p>
      <p><strong>Date:</strong> {{audit_date}}</p>
    </div>
  </div>

  <!-- ... (rest of the template remains the same) ... -->
<div class="page-footer"><span class="page-number"></span></div>
  </div>
</body>
</html>`
};
