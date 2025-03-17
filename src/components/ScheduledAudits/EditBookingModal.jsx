import React, { useState, useEffect } from 'react';
import './styles.css';

const EditBookingModal = ({ booking, onClose, onSubmit, onDelete, auditors }) => {
  const [formData, setFormData] = useState({
    bookingDate: '',
    selectedAuditor: ''
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (booking?.id) {
      setFormData({
        bookingDate: booking.booking_date || '',
        selectedAuditor: booking.auditor_id || ''
      });
    }
  }, [booking]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.bookingDate || !formData.selectedAuditor) {
      setError('Please fill in all required fields');
      return;
    }

    if (!booking?.id) {
      setError('Invalid booking data');
      return;
    }

    const selectedDate = new Date(formData.bookingDate);
    const utcDate = new Date(
      Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), selectedDate.getUTCDate())
    );
    const formattedDate = utcDate.toISOString().slice(0, 10);

    onSubmit({
      ...booking,
      booking_date: formattedDate,
      auditor_id: formData.selectedAuditor
    });
  };

  const handleDelete = () => {
    if (!booking?.id) {
      setError('Invalid booking ID');
      return;
    }

    if (window.confirm('Are you sure you want to delete this booking?')) {
      onDelete(booking.id);
    }
  };

  return (
    <div className="edit-booking-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Booking</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Select Date</label>
            <input
              type="date"
              name="bookingDate"
              value={formData.bookingDate}
              onChange={(e) => setFormData(prev => ({ ...prev, bookingDate: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Auditor</label>
            <select
              name="selectedAuditor"
              value={formData.selectedAuditor}
              onChange={(e) => setFormData(prev => ({ ...prev, selectedAuditor: e.target.value }))}
              required
            >
              <option value="">Select Auditor</option>
              {auditors.map(auditor => (
                <option key={auditor.id} value={auditor.id}>{auditor.name}</option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button type="submit" className="submit-btn">Update Booking</button>
            <button type="button" onClick={handleDelete} className="delete-btn">Delete Booking</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBookingModal;
