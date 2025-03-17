import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuditList } from './useAuditList';
import './styles.css';

const AuditList = () => {
  const navigate = useNavigate();
  const { audits, loading, updateAuditStatus } = useAuditList();
  const [expandedAudit, setExpandedAudit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    auditSent: false,
    quoteSent: false,
    invoiced: false,
    archived: false,
    includeArchived: false,
    dateFrom: '',
    dateTo: ''
  });
  const [expandedPhoto, setExpandedPhoto] = useState(null);

  if (loading) {
    return <div className="loading">Loading audits...</div>;
  }

  const toggleExpand = (auditId) => {
    if (expandedAudit === auditId) {
      setExpandedAudit(null);
    } else {
      setExpandedAudit(auditId);
    }
  };

  const handleStatusChange = async (auditId, field, value) => {
    await updateAuditStatus(auditId, field, value);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      auditSent: false,
      quoteSent: false,
      invoiced: false,
      archived: false,
      includeArchived: false,
      dateFrom: '',
      dateTo: ''
    });
    setSearchTerm('');
  };

  const handlePhotoClick = (photoUrl) => {
    setExpandedPhoto(photoUrl);
  };

  const closeExpandedPhoto = () => {
    setExpandedPhoto(null);
  };

  const filteredAudits = audits.filter(audit => {
    // Hide archived audits unless includeArchived is checked
    if (audit.is_archived && !filters.includeArchived) {
      return false;
    }
    
    // Search term filter
    const searchFields = [
      audit.site_name,
      audit.company_name,
      audit.auditor_name,
      audit.reference_number
    ].map(field => field?.toLowerCase() || '');
    
    const matchesSearch = searchTerm === '' || 
      searchFields.some(field => field.includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    // Status filters
    if (filters.auditSent && !audit.audit_sent) return false;
    if (filters.quoteSent && !audit.quote_sent) return false;
    if (filters.invoiced && !audit.is_invoiced) return false;
    if (filters.archived && !audit.is_archived) return false;
    
    // Date range filters
    const auditDate = new Date(audit.audit_date);
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      if (auditDate < fromDate) return false;
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59); // End of day
      if (auditDate > toDate) return false;
    }
    
    return true;
  });

  return (
    <div className="audit-list">
      <div className="list-header">
        <h1>Rack Audits</h1>
        <button onClick={() => navigate('/form')} className="new-audit-btn">
          New Audit
        </button>
      </div>

      <div className="search-filter-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search audits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <label className="include-archived-checkbox">
            <input 
              type="checkbox" 
              checked={filters.includeArchived}
              onChange={(e) => handleFilterChange('includeArchived', e.target.checked)}
            />
            <span>Include archived audits in search</span>
          </label>
        </div>
        
        <div className="filter-options">
          <div className="filter-group">
            <h3>Status Filters</h3>
            <div className="filter-checkboxes">
              <label className="filter-checkbox">
                <input 
                  type="checkbox" 
                  checked={filters.auditSent}
                  onChange={(e) => handleFilterChange('auditSent', e.target.checked)}
                />
                <span>Audit Sent</span>
              </label>
              <label className="filter-checkbox">
                <input 
                  type="checkbox" 
                  checked={filters.quoteSent}
                  onChange={(e) => handleFilterChange('quoteSent', e.target.checked)}
                />
                <span>Quote Sent</span>
              </label>
              <label className="filter-checkbox">
                <input 
                  type="checkbox" 
                  checked={filters.invoiced}
                  onChange={(e) => handleFilterChange('invoiced', e.target.checked)}
                />
                <span>Invoiced</span>
              </label>
              <label className="filter-checkbox">
                <input 
                  type="checkbox" 
                  checked={filters.archived}
                  onChange={(e) => handleFilterChange('archived', e.target.checked)}
                />
                <span>Archived</span>
              </label>
            </div>
          </div>
          
          <div className="filter-group">
            <h3>Date Range</h3>
            <div className="date-filters">
              <div className="date-filter">
                <label>From:</label>
                <input 
                  type="date" 
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>
              <div className="date-filter">
                <label>To:</label>
                <input 
                  type="date" 
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <button className="reset-filters-btn" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      </div>
      
      <div className="results-summary">
        {filters.includeArchived ? (
          <p>Showing {filteredAudits.length} of {audits.length} audits (including archived)</p>
        ) : (
          <p>Showing {filteredAudits.length} of {audits.filter(a => !a.is_archived).length} active audits</p>
        )}
      </div>

      <div className="audit-grid">
        {filteredAudits.map(audit => (
          <div key={audit.id} className={`audit-card ${audit.is_archived ? 'archived' : ''}`}>
            <div className="audit-header">
              <h3>{audit.site_name}</h3>
              <span className="reference">{audit.reference_number}</span>
            </div>
            
            <div className="audit-details">
              <p><strong>Company:</strong> {audit.company_name}</p>
              <p><strong>Date:</strong> {new Date(audit.audit_date).toLocaleDateString()}</p>
              <p><strong>Auditor:</strong> {audit.auditor_name}</p>
            </div>

            <div className="audit-status-checkboxes">
              <label className="status-checkbox">
                <input 
                  type="checkbox" 
                  checked={audit.audit_sent || false}
                  onChange={(e) => handleStatusChange(audit.id, 'audit_sent', e.target.checked)}
                />
                <span>Audit Sent</span>
              </label>
              <label className="status-checkbox">
                <input 
                  type="checkbox" 
                  checked={audit.quote_sent || false}
                  onChange={(e) => handleStatusChange(audit.id, 'quote_sent', e.target.checked)}
                />
                <span>Quote Sent</span>
              </label>
              <label className="status-checkbox">
                <input 
                  type="checkbox" 
                  checked={audit.is_invoiced || false}
                  onChange={(e) => handleStatusChange(audit.id, 'is_invoiced', e.target.checked)}
                />
                <span>Invoiced</span>
              </label>
              <label className="status-checkbox">
                <input 
                  type="checkbox" 
                  checked={audit.is_archived || false}
                  onChange={(e) => handleStatusChange(audit.id, 'is_archived', e.target.checked)}
                />
                <span>Archived</span>
              </label>
            </div>

            <div className="risk-counts">
              <span className="risk red">{audit.red_risks || 0}</span>
              <span className="risk amber">{audit.amber_risks || 0}</span>
              <span className="risk green">{audit.green_risks || 0}</span>
            </div>

            <div className="audit-actions">
              <button 
                onClick={() => toggleExpand(audit.id)} 
                className="expand-btn"
              >
                {expandedAudit === audit.id ? 'Hide Details' : 'Show Details'}
              </button>
              <button onClick={() => navigate(`/audits/${audit.id}`)}>
                View Full Audit
              </button>
            </div>

            {expandedAudit === audit.id && audit.damage_records && audit.damage_records.length > 0 && (
              <div className="damage-records-preview">
                <h4>Damage Records</h4>
                {audit.damage_records.map((record, index) => (
                  <div key={index} className={`damage-record-summary ${record.risk_level.toLowerCase()}`}>
                    <div className="damage-record-header">
                      <span className="damage-type">{record.damage_type}</span>
                      <span className={`risk-badge ${record.risk_level.toLowerCase()}`}>
                        {record.risk_level}
                      </span>
                    </div>
                    <div className="damage-record-details">
                      <p><strong>Reference:</strong> {record.reference_number}</p>
                      <p><strong>Location:</strong> {record.location_details}</p>
                      {record.building_area && (
                        <p><strong>Building/Area:</strong> {record.building_area}</p>
                      )}
                      <p><strong>Brand:</strong> {record.brand || 'Not specified'}</p>
                      {record.photo_url && (
                        <div className="damage-record-photo">
                          <div className="thumbnail-container" onClick={() => handlePhotoClick(record.photo_url)}>
                            <img 
                              src={record.photo_url} 
                              alt="Damage" 
                              className="damage-thumbnail" 
                            />
                            <div className="thumbnail-overlay">
                              <span>Click to enlarge</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {expandedPhoto && (
        <div className="photo-modal" onClick={closeExpandedPhoto}>
          <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={closeExpandedPhoto}>×</button>
            <img src={expandedPhoto} alt="Enlarged damage" className="enlarged-photo" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditList;
