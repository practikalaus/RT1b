import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../supabase';
import AuditBasicInfo from './AuditBasicInfo';
import DamageRecordForm from './DamageRecordForm';
import DamageList from './DamageList';
import useAuditForm from './useAuditForm';
import './styles.css';

const AuditForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draft');
  
  const {
    auditData,
    damageRecords,
    draftAuditId,
    handleAuditChange,
    handleAddDamage,
    handleRemoveDamage,
    handleEditDamage,
    handleSubmit,
    isSubmitting
  } = useAuditForm();

  const [showDamageForm, setShowDamageForm] = useState(false);
  const [auditors, setAuditors] = useState([]);
  const [lastUsedBrand, setLastUsedBrand] = useState('');
  const [lastUsedBuildingArea, setLastUsedBuildingArea] = useState('');
  const [editingDamageRecord, setEditingDamageRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAuditors = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('auditors')
          .select('*')
          .order('name');

        if (error) throw error;
        setAuditors(data || []);
        setError(null);
      } catch (error) {
        console.error('Error fetching auditors:', error);
        setError('Failed to load auditors. Please try refreshing the page.');
        setAuditors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditors();
  }, []);

  const handleDamageSubmit = (record) => {
    setLastUsedBrand(record.brand);
    setLastUsedBuildingArea(record.building_area);
    
    if (editingDamageRecord) {
      handleEditDamage(editingDamageRecord.id, record);
      setEditingDamageRecord(null);
    } else {
      handleAddDamage(record);
    }
    
    setShowDamageForm(false);
  };

  const handleEditClick = (record) => {
    setEditingDamageRecord(record);
    setShowDamageForm(true);
    // Scroll to the top where the form will be
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <div className="loading">Loading form...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="audit-form">
      <h1>Pallet Rack Audit</h1>
      
      {draftId && (
        <div className="draft-notification">
          <p>You are working on a draft audit. Your changes are being saved automatically.</p>
        </div>
      )}
      
      <AuditBasicInfo 
        data={auditData}
        onChange={handleAuditChange}
        damageRecords={damageRecords}
        auditors={auditors}
      />

      <div className="damage-records-section">
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
          <div className="damage-form-container">
            <DamageRecordForm
              onSubmit={handleDamageSubmit}
              onCancel={() => {
                setShowDamageForm(false);
                setEditingDamageRecord(null);
              }}
              lastUsedBrand={lastUsedBrand}
              lastUsedBuildingArea={lastUsedBuildingArea}
              initialData={editingDamageRecord}
            />
          </div>
        )}

        <DamageList
          records={damageRecords}
          onRemove={handleRemoveDamage}
          onEdit={handleEditClick}
        />
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={() => navigate('/audits')}
          className="cancel-btn"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="submit-btn"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Audit'}
        </button>
      </div>
    </div>
  );
};

export default AuditForm;
