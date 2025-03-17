import React, { useState, useEffect } from 'react';
import './styles.css';
import { supabase } from '../../supabase';

const CustomerForm = ({ onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    company: '',
    email: '',
    address: '',
    phone: '',
    next_audit_due: '',
    default_auditor: '',
    is_active: false,
    auto_marketing: false,
    audit_price: '',
    notes: '', // Initialize notes as empty string
    has_drawing: false
  });
  const [loading, setLoading] = useState(false);
  const [auditors, setAuditors] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        audit_price: initialData.audit_price?.toString() || '',
        next_audit_due: initialData.next_audit_due || '',
        notes: initialData.notes || '', // Ensure notes is never null
        is_active: initialData.is_active || false,
        auto_marketing: initialData.auto_marketing || false,
        has_drawing: initialData.has_drawing || false
      });
    }
  }, [initialData]);

  useEffect(() => {
    const fetchAuditors = async () => {
      try {
        const { data, error } = await supabase
          .from('auditors')
          .select('*')
          .order('name');

        if (error) throw error;
        setAuditors(data || []);
      } catch (error) {
        console.error('Error fetching auditors:', error);
        setError('Failed to load auditors');
      }
    };

    fetchAuditors();
  }, []);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Format audit price as number if provided
      const formattedData = {
        ...formData,
        audit_price: formData.audit_price ? parseFloat(formData.audit_price) : null,
        notes: formData.notes || '' // Ensure notes is never null
      };

      await onSubmit(formattedData);
      onClose();
    } catch (error) {
      console.error('Error submitting customer:', error);
      setError('Failed to save customer: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-form-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{initialData ? 'Edit Customer' : 'Add New Customer'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Customer Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Company</label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Next Audit Due</label>
            <input
              type="date"
              name="next_audit_due"
              value={formData.next_audit_due}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Default Auditor</label>
            <select
              name="default_auditor"
              value={formData.default_auditor}
              onChange={handleChange}
            >
              <option value="">Select Auditor</option>
              {auditors.map(auditor => (
                <option key={auditor.id} value={auditor.name}>{auditor.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Audit Price ($)</label>
            <input
              type="number"
              name="audit_price"
              value={formData.audit_price}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="Enter audit price"
            />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Add any notes about this customer"
            />
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              Active Customer
            </label>
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="auto_marketing"
                checked={formData.auto_marketing}
                onChange={handleChange}
              />
              Auto Marketing
            </label>
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="has_drawing"
                checked={formData.has_drawing}
                onChange={handleChange}
              />
              Drawing Available
            </label>
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Saving...' : initialData ? 'Update Customer' : 'Add Customer'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;
