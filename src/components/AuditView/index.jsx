import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuditView } from './useAuditView';
import DamageRecordForm from '../AuditForm/DamageRecordForm';
import PrintableAudit from './PrintableAudit';
import RepairQuoteModal from './RepairQuoteModal';
import './styles.css';

const AuditView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    audit,
    damageRecords,
    loading,
    isEditing,
    editedAudit,
    auditorDetails,
    setIsEditing,
    handleAuditChange,
    handleSaveAudit,
    handleAddDamageRecord,
    handleDeleteDamageRecord,
    handleEditDamageRecord,
    handlePrint
  } = useAuditView(id);

  const [showDamageForm, setShowDamageForm] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showRepairQuote, setShowRepairQuote] = useState(false);
  const [editingDamageRecord, setEditingDamageRecord] = useState(null);
  const [expandedPhoto, setExpandedPhoto] = useState(null);

  if (loading) {
    return <div className="loading">Loading audit details...</div>;
  }

  if (!audit) {
    return <div className="error">Audit not found</div>;
  }

  if (showPrintPreview) {
    return (
      <PrintableAudit 
        audit={audit} 
        damageRecords={damageRecords}
        auditorDetails={auditorDetails}
        onClose={() => setShowPrintPreview(false)}
        onPrint={handlePrint}
      />
    );
  }

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handlePhotoClick = (photoUrl) => {
    setExpandedPhoto(photoUrl);
  };

  const closeExpandedPhoto = () => {
    setExpandedPhoto(null);
  };

  return (
    <div className="audit-view">
      <div className="view-header">
        <div className="header-content">
          <h1>{audit.site_name}</h1>
          <span className="reference">{audit.reference_number}</span>
        </div>
        <div className="header-actions">
          {isEditing ? (
            <>
              <button onClick={handleSaveAudit} className="save-btn">
                Save Changes
              </button>
              <button onClick={() => setIsEditing(false)} className="cancel-btn">
                Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={handleEditClick} className="edit-btn">
                Edit Audit
              </button>
              <button onClick={() => setShowPrintPreview(true)} className="print-btn">
                Print Audit
              </button>
              <button onClick={() => setShowRepairQuote(true)} className="repair-btn">
                Create Repair Quote
              </button>
              <button onClick={() => navigate('/audits')} className="back-btn">
                Back to List
              </button>
            </>
          )}
        </div>
      </div>

      <div className="audit-content">
        <div className="audit-section">
          <h2>Basic Information</h2>
          <div className="form-grid">
            <div className="form-field">
              <label>Auditor Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="auditor_name"
                  value={editedAudit.auditor_name}
                  onChange={handleAuditChange}
                />
              ) : (
                <div className="field-value">{audit.auditor_name}</div>
              )}
            </div>

            <div className="form-field">
              <label>Site Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="site_name"
                  value={editedAudit.site_name}
                  onChange={handleAuditChange}
                />
              ) : (
                <div className="field-value">{audit.site_name}</div>
              )}
            </div>

            <div className="form-field">
              <label>Company Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="company_name"
                  value={editedAudit.company_name}
                  onChange={handleAuditChange}
                />
              ) : (
                <div className="field-value">{audit.company_name}</div>
              )}
            </div>

            <div className="form-field">
              <label>Audit Date</label>
              {isEditing ? (
                <input
                  type="date"
                  name="audit_date"
                  value={editedAudit.audit_date}
                  onChange={handleAuditChange}
                />
              ) : (
                <div className="field-value">
                  {new Date(audit.audit_date).toLocaleDateString()}
                </div>
              )}
            </div>

            {auditorDetails && (
              <>
                {auditorDetails.email && (
                  <div className="form-field">
                    <label>Auditor Email</label>
                    <div className="field-value">{auditorDetails.email}</div>
                  </div>
                )}
                {auditorDetails.phone && (
                  <div className="form-field">
                    <label>Auditor Phone</label>
                    <div className="field-value">{auditorDetails.phone}</div>
                  </div>
                )}
              </>
            )}

            <div className="form-field full-width">
              <label>Notes</label>
              {isEditing ? (
                <textarea
                  name="notes"
                  value={editedAudit.notes || ''}
                  onChange={handleAuditChange}
                  rows={3}
                />
              ) : (
                <div className="field-value">{audit.notes}</div>
              )}
            </div>
          </div>

          <div className="risk-summary">
            <div className="risk-count red">
              <span className="count">{audit.red_risks || 0}</span>
              <span className="label">Red Risks</span>
            </div>
            <div className="risk-count amber">
              <span className="count">{audit.amber_risks || 0}</span>
              <span className="label">Amber Risks</span>
            </div>
            <div className="risk-count green">
              <span className="count">{audit.green_risks || 0}</span>
              <span className="label">Green Risks</span>
            </div>
          </div>
        </div>

        <div className="audit-section">
          <div className="section-header">
            <h2>Damage Records</h2>
            <button 
              type="button"
              onClick={() => {
                setEditingDamageRecord(null);
                setShowDamageForm(true);
              }}
              className="add-damage-btn"
            >
              Add Damage Record
            </button>
          </div>

          {showDamageForm && (
            <DamageRecordForm
              onSubmit={(record) => {
                if (editingDamageRecord) {
                  handleEditDamageRecord(editingDamageRecord.id, record);
                } else {
                  handleAddDamageRecord(record);
                }
                setShowDamageForm(false);
                setEditingDamageRecord(null);
              }}
              onCancel={() => {
                setShowDamageForm(false);
                setEditingDamageRecord(null);
              }}
              initialData={editingDamageRecord}
            />
          )}

          <div className="damage-records">
            {damageRecords.map((record) => (
              <div key={record.id} className={`damage-record ${record.risk_level.toLowerCase()}`}>
                <div className="damage-header">
                  <div className="damage-header-content">
                    <div className="damage-title-row">
                      <h3>{record.damage_type}</h3>
                      <span className={`risk-badge ${record.risk_level.toLowerCase()}`}>
                        {record.risk_level}
                      </span>
                    </div>
                    <span className="reference-number">
                      <strong>Reference:</strong> {record.reference_number || 'Not assigned'}
                    </span>
                  </div>
                </div>
                
                <div className="damage-content">
                  <div className="damage-details">
                    <p><strong>Location:</strong> {record.location_details}</p>
                    {record.building_area && (
                      <p><strong>Building/Area:</strong> {record.building_area}</p>
                    )}
                    <p><strong>Brand:</strong> {record.brand || 'Not specified'}</p>
                    <p><strong>Recommendation:</strong> {record.recommendation}</p>
                    {record.notes && <p><strong>Notes:</strong> {record.notes}</p>}
                  </div>

                  {record.photo_url && (
                    <div className="damage-photo">
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

                <div className="damage-actions">
                  <button
                    onClick={() => {
                      setEditingDamageRecord(record);
                      setShowDamageForm(true);
                    }}
                    className="edit-record-btn"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteDamageRecord(record.id)}
                    className="remove-record-btn"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {showRepairQuote && (
        <RepairQuoteModal
          audit={audit}
          damageRecords={damageRecords}
          auditorDetails={auditorDetails}
          onClose={() => setShowRepairQuote(false)}
        />
      )}

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

export default AuditView;
