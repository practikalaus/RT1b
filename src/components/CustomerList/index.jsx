import React, { useState, useEffect, useCallback } from 'react';
import './styles.css';
import CustomerForm from './CustomerForm';
import BookAuditModal from './BookAuditModal';
import { supabase } from '../../supabase';
import { useNavigate } from 'react-router-dom';

const CustomerList = () => {
  const [showForm, setShowForm] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    activeOnly: false,
    auditDue: false,
    autoMarketing: false
  });
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [auditHistory, setAuditHistory] = useState({});
  const navigate = useNavigate();

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);

      // Fetch audit history for all customers
      const auditHistoryData = {};
      for (const customer of data || []) {
        const { data: audits, error: auditsError } = await supabase
          .from('audits')
          .select(`
            id,
            reference_number,
            audit_date,
            auditor_name,
            red_risks,
            amber_risks,
            green_risks,
            status,
            audit_sent,
            quote_sent,
            is_invoiced
          `)
          .eq('company_name', customer.company)
          .eq('site_name', customer.name)
          .eq('status', 'Submitted')
          .order('audit_date', { ascending: false });

        if (!auditsError) {
          auditHistoryData[customer.id] = audits || [];
        }
      }
      setAuditHistory(auditHistoryData);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAddCustomerClick = () => {
    setEditingCustomer(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };

  const handleAddCustomer = async (newCustomer) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert(newCustomer)
        .select()
        .single();

      if (error) throw error;
      setCustomers(prev => [...prev, data]);
      setShowForm(false);
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleUpdateCustomer = async (updatedCustomer) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updatedCustomer)
        .eq('id', updatedCustomer.id)
        .select()
        .single();

      if (error) throw error;
      setCustomers(prev =>
        prev.map(customer =>
          customer.id === updatedCustomer.id ? data : customer
        )
      );
      setShowForm(false);
      setEditingCustomer(null);
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  const handleBookAudit = (customer) => {
    setShowBookingModal(customer);
  };

  const handleBookingClose = () => {
    setShowBookingModal(null);
  };

  const handleBookingSubmit = async (booking) => {
    try {
      const selectedDate = new Date(booking.bookingDate);
      const utcDate = new Date(
        Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), selectedDate.getUTCDate())
      );
      const formattedDate = utcDate.toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from('scheduled_audits')
        .insert({
          customer_id: booking.customer.id,
          booking_date: formattedDate,
          auditor_id: booking.auditor
        })
        .select()
        .single();

      if (error) throw error;
      setShowBookingModal(null);
    } catch (error) {
      console.error('Error booking audit:', error);
    }
  };

  const handleViewAudit = (auditId) => {
    navigate(`/audits/${auditId}`);
  };

  const toggleExpand = (customerId) => {
    setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
  };

  const filteredCustomers = customers.filter(customer => {
    // Search term filter
    const searchFields = [
      customer.name,
      customer.company,
      customer.email,
      customer.address,
      customer.phone
    ].map(field => field?.toLowerCase() || '');
    
    const matchesSearch = searchTerm === '' || 
      searchFields.some(field => field.includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Active filter
    if (filters.activeOnly && !customer.is_active) return false;

    // Audit due filter
    if (filters.auditDue) {
      const nextAuditDue = customer.next_audit_due ? new Date(customer.next_audit_due) : null;
      const today = new Date();
      if (!nextAuditDue || nextAuditDue > today) return false;
    }

    // Auto marketing filter
    if (filters.autoMarketing && !customer.auto_marketing) return false;

    return true;
  });

  if (loading) {
    return <div className="loading">Loading customers...</div>;
  }

  return (
    <div className="customer-list">
      <div className="list-header">
        <h1>Customer List</h1>
        <button className="add-customer-btn" onClick={handleAddCustomerClick}>
          Add Customer
        </button>
      </div>

      <div className="search-filter-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-options">
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filters.activeOnly}
              onChange={(e) => setFilters(prev => ({ ...prev, activeOnly: e.target.checked }))}
            />
            <span>Active Only</span>
          </label>
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filters.auditDue}
              onChange={(e) => setFilters(prev => ({ ...prev, auditDue: e.target.checked }))}
            />
            <span>Audit Due</span>
          </label>
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filters.autoMarketing}
              onChange={(e) => setFilters(prev => ({ ...prev, autoMarketing: e.target.checked }))}
            />
            <span>Auto Marketing</span>
          </label>
        </div>
      </div>

      <div className="results-summary">
        Showing {filteredCustomers.length} of {customers.length} customers
      </div>

      <div className="customer-grid">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className={`customer-card ${customer.is_active ? 'active' : 'inactive'}`}>
            <div className="customer-header">
              <h3>{customer.name}</h3>
              <span className="company-name">{customer.company}</span>
            </div>
            
            <div className="customer-details">
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <a href={`mailto:${customer.email}`} className="detail-value email-link">
                  {customer.email}
                </a>
              </div>
              <div className="detail-row">
                <span className="detail-label">Phone:</span>
                <a href={`tel:${customer.phone}`} className="detail-value phone-link">
                  {customer.phone}
                </a>
              </div>
              <div className="detail-row">
                <span className="detail-label">Address:</span>
                <span className="detail-value">{customer.address}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Next Audit:</span>
                <span className={`detail-value ${isAuditDue(customer.next_audit_due) ? 'audit-due' : ''}`}>
                  {customer.next_audit_due ? new Date(customer.next_audit_due).toLocaleDateString() : 'Not scheduled'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Default Auditor:</span>
                <span className="detail-value">{customer.default_auditor || 'Not assigned'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Audit Price:</span>
                <span className="detail-value">
                  {customer.audit_price ? `$${customer.audit_price.toLocaleString()}` : 'Not set'}
                </span>
              </div>
              {customer.notes && (
                <div className="detail-row notes-row">
                  <span className="detail-label">Notes:</span>
                  <span className="detail-value notes-value">{customer.notes}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Drawing:</span>
                <span className="detail-value">
                  {customer.has_drawing ? 'Available' : 'Not available'}
                </span>
              </div>
            </div>

            <div className="customer-status">
              {customer.is_active && <span className="status-badge active">Active</span>}
              {customer.auto_marketing && <span className="status-badge marketing">Auto Marketing</span>}
              {isAuditDue(customer.next_audit_due) && <span className="status-badge due">Audit Due</span>}
              {customer.has_drawing && <span className="status-badge drawing">Drawing</span>}
            </div>
            
            {auditHistory[customer.id]?.length > 0 && (
              <div className="audit-history">
                <button 
                  className="toggle-history-btn"
                  onClick={() => toggleExpand(customer.id)}
                >
                  {expandedCustomer === customer.id ? 'Hide Audit History' : 'Show Audit History'}
                </button>
                
                {expandedCustomer === customer.id && (
                  <div className="audit-history-list">
                    {auditHistory[customer.id].map(audit => (
                      <div key={audit.id} className="audit-history-item">
                        <div className="audit-history-header">
                          <span className="audit-date">
                            {new Date(audit.audit_date).toLocaleDateString()}
                          </span>
                          <span className="audit-ref">{audit.reference_number}</span>
                        </div>
                        <div className="audit-history-details">
                          <div className="audit-risks">
                            <span className="risk-count red">{audit.red_risks}</span>
                            <span className="risk-count amber">{audit.amber_risks}</span>
                            <span className="risk-count green">{audit.green_risks}</span>
                          </div>
                          <div className="audit-status">
                            {audit.audit_sent && <span className="status-tag">Sent</span>}
                            {audit.quote_sent && <span className="status-tag">Quoted</span>}
                            {audit.is_invoiced && <span className="status-tag">Invoiced</span>}
                          </div>
                        </div>
                        <button 
                          className="view-audit-btn"
                          onClick={() => handleViewAudit(audit.id)}
                        >
                          View Audit
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="customer-actions">
              <button
                className="edit-customer-btn"
                onClick={() => handleEditCustomer(customer)}
              >
                Edit
              </button>
              <button
                className="book-audit-btn"
                onClick={() => handleBookAudit(customer)}
              >
                Book Audit
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <CustomerForm
          onClose={handleFormClose}
          onSubmit={editingCustomer ? handleUpdateCustomer : handleAddCustomer}
          initialData={editingCustomer}
        />
      )}
      
      {showBookingModal && (
        <BookAuditModal
          customer={showBookingModal}
          onClose={handleBookingClose}
          onSubmit={handleBookingSubmit}
        />
      )}
    </div>
  );
};

// Helper function to check if audit is due
const isAuditDue = (nextAuditDue) => {
  if (!nextAuditDue) return false;
  const dueDate = new Date(nextAuditDue);
  const today = new Date();
  return dueDate <= today;
};

export default CustomerList;
