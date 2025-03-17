import React from 'react';
import { useNavigate } from 'react-router-dom';

const PastBookedAudits = ({ audits }) => {
  const navigate = useNavigate();

  const handleRebookAudit = (audit) => {
    navigate('/scheduled-audits', { state: { editBooking: audit } });
  };

  // Filter to only show audits with booking dates before today
  // and that haven't been completed
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const pastAudits = audits.filter(audit => {
    const bookingDate = new Date(audit.booking_date);
    bookingDate.setHours(0, 0, 0, 0);
    
    // Only include audits that:
    // 1. Have a booking date before today
    // 2. Haven't been completed (no matching audit record)
    return bookingDate < today;
  }).sort((a, b) => new Date(b.booking_date) - new Date(a.booking_date)); // Sort by date descending

  if (!pastAudits.length) {
    return (
      <div className="past-booked-audits">
        <h2>Past Booked Audits</h2>
        <p>No past booked audits found.</p>
      </div>
    );
  }

  return (
    <div className="past-booked-audits">
      <h2>Past Booked Audits</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Customer Name</th>
            <th>Company</th>
            <th>Auditor</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pastAudits.map(audit => (
            <tr key={audit.id} className="past-audit-row">
              <td>{new Date(audit.booking_date).toLocaleDateString()}</td>
              <td>{audit.customers.name}</td>
              <td>{audit.customers.company}</td>
              <td style={{ color: audit.auditors.color }}>{audit.auditors.name}</td>
              <td>
                <button onClick={() => handleRebookAudit(audit)}>
                  Rebook
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PastBookedAudits;
