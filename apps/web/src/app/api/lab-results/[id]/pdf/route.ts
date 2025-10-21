import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@momentum/database';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const resultId = parseInt(id);

    // Fetch the lab result with all related data
    const labResult = await prisma.labResult.findUnique({
      where: { id: resultId },
      include: {
        labOrder: {
          include: {
            patient: true,
            doctor: true,
          },
        },
        labResultValues: true,
        releaser: true,
      },
    });

    if (!labResult) {
      return NextResponse.json({ error: 'Lab result not found' }, { status: 404 });
    }

    // Check authorization
    const isPatient = session.user.role === 'patient';
    const isLabTech = session.user.role === 'lab_tech';
    const isDoctor = session.user.role === 'doctor';
    
    if (isPatient && labResult.labOrder.patient?.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!isPatient && !isLabTech && !isDoctor) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Generate printable HTML content
    const htmlContent = generatePDFHTML(labResult);

    // Return HTML that will auto-print
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

function generatePDFHTML(labResult: any): string {
  const patient = labResult.labOrder.patient;
  const doctor = labResult.labOrder.doctor;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Lab Result - ${patient?.firstName} ${patient?.lastName}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.6;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2563eb;
      margin: 0 0 10px 0;
    }
    .header p {
      margin: 5px 0;
      color: #666;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      background: #2563eb;
      color: white;
      padding: 10px 15px;
      margin-bottom: 15px;
      font-weight: bold;
      font-size: 16px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 180px 1fr;
      gap: 10px;
      margin-bottom: 15px;
    }
    .info-label {
      font-weight: bold;
      color: #555;
    }
    .info-value {
      color: #333;
    }
    .test-values {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    .test-values th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      border-bottom: 2px solid #e5e7eb;
      font-weight: 600;
    }
    .test-values td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .notes-box {
      background: #f9fafb;
      border-left: 4px solid #10b981;
      padding: 15px;
      margin-top: 15px;
    }
    .notes-box h4 {
      margin: 0 0 10px 0;
      color: #10b981;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .status-badge {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
    }
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2563eb;
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1000;
    }
    .print-button:hover {
      background: #1d4ed8;
    }
    @media print {
      body {
        padding: 20px;
      }
      .no-print, .print-button {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
  
  <div class="header">
    <h1>Laboratory Test Result</h1>
    <p><strong>City General Hospital</strong></p>
    <p>Laboratory Department</p>
    <p class="status-badge">Released</p>
  </div>

  <div class="section">
    <div class="section-title">Patient Information</div>
    <div class="info-grid">
      <div class="info-label">Patient Name:</div>
      <div class="info-value">${patient?.firstName} ${patient?.lastName}</div>
      
      <div class="info-label">Date of Birth:</div>
      <div class="info-value">${patient?.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'}</div>
      
      <div class="info-label">Gender:</div>
      <div class="info-value">${patient?.gender || 'N/A'}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Test Information</div>
    <div class="info-grid">
      <div class="info-label">Test Type:</div>
      <div class="info-value">${labResult.labOrder.orderType.replace('_', ' ').toUpperCase()}</div>
      
      <div class="info-label">Ordered By:</div>
      <div class="info-value">Dr. ${doctor.name}</div>
      
      <div class="info-label">Released Date:</div>
      <div class="info-value">${new Date(labResult.releasedAt).toLocaleString()}</div>
      
      <div class="info-label">Released By:</div>
      <div class="info-value">${labResult.releaser?.name || 'Doctor'}</div>
    </div>
  </div>

  ${labResult.labResultValues && labResult.labResultValues.length > 0 ? `
    <div class="section">
      <div class="section-title">Test Results</div>
      <table class="test-values">
        <thead>
          <tr>
            <th>Test Name</th>
            <th>Result</th>
            <th>Unit</th>
            <th>Normal Range</th>
          </tr>
        </thead>
        <tbody>
          ${labResult.labResultValues.map((value: any) => `
            <tr>
              <td><strong>${value.testName}</strong></td>
              <td>${value.resultValue}</td>
              <td>${value.unit || '-'}</td>
              <td>${value.normalRange || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : ''}

  ${labResult.doctorNote ? `
    <div class="section">
      <div class="notes-box">
        <h4>Doctor's Notes</h4>
        <p style="white-space: pre-wrap;">${labResult.doctorNote}</p>
      </div>
    </div>
  ` : ''}

  ${labResult.resultNotes ? `
    <div class="section">
      <div class="notes-box" style="border-left-color: #6b7280;">
        <h4 style="color: #6b7280;">Lab Technician Notes</h4>
        <p style="white-space: pre-wrap;">${labResult.resultNotes}</p>
      </div>
    </div>
  ` : ''}

  <div class="footer">
    <p><strong>City General Hospital</strong></p>
    <p>Laboratory Department | Tel: (555) 123-4567 | Email: lab@citygeneralhospital.com</p>
    <p>Generated on: ${new Date().toLocaleString()}</p>
    <p style="margin-top: 15px; font-size: 11px;">
      <em>This is a computer-generated document. Please consult your physician for medical interpretation.</em>
    </p>
  </div>

  <script>
    // Auto-open print dialog when page loads
    window.onload = function() { 
      setTimeout(function() {
        window.print();
      }, 500);
    }
  </script>
</body>
</html>
  `.trim();
}
