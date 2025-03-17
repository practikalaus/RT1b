import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export const useAuditView = (auditId) => {
  const [audit, setAudit] = useState(null);
  const [damageRecords, setDamageRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAudit, setEditedAudit] = useState(null);
  const [auditorDetails, setAuditorDetails] = useState(null);

  const calculateRiskCounts = (records) => {
    return records.reduce((acc, record) => {
      const riskKey = `${record.risk_level.toLowerCase()}_risks`;
      acc[riskKey] = (acc[riskKey] || 0) + 1;
      return acc;
    }, {
      red_risks: 0,
      amber_risks: 0,
      green_risks: 0
    });
  };

  const updateAuditRiskCounts = async (auditId, riskCounts) => {
    try {
      const { error } = await supabase
        .from('audits')
        .update(riskCounts)
        .eq('id', auditId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating audit risk counts:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchAuditData = async () => {
      if (!auditId) return;

      try {
        setLoading(true);
        
        // Fetch audit details
        const { data: auditData, error: auditError } = await supabase
          .from('audits')
          .select('*')
          .eq('id', auditId)
          .single();

        if (auditError) throw auditError;

        // Fetch damage records
        const { data: records, error: recordsError } = await supabase
          .from('damage_records')
          .select(`
            id,
            audit_id,
            damage_type,
            risk_level,
            location_details,
            building_area,
            photo_url,
            notes,
            recommendation,
            brand,
            reference_number,
            created_at,
            updated_at
          `)
          .eq('audit_id', auditId)
          .order('created_at', { ascending: true });

        if (recordsError) throw recordsError;

        // Calculate risk counts from actual records
        const riskCounts = calculateRiskCounts(records || []);
        
        // Update audit with recalculated risk counts
        const updatedAudit = {
          ...auditData,
          ...riskCounts
        };

        // Update database with correct counts
        await updateAuditRiskCounts(auditId, riskCounts);
        
        // Fetch auditor details if available
        if (auditData.auditor_name) {
          const { data: auditorData, error: auditorError } = await supabase
            .from('auditors')
            .select('*')
            .eq('name', auditData.auditor_name)
            .single();
            
          if (!auditorError && auditorData) {
            setAuditorDetails(auditorData);
          }
        }

        setAudit(updatedAudit);
        setEditedAudit(updatedAudit);
        setDamageRecords(records || []);
      } catch (error) {
        console.error('Error fetching audit data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditData();
  }, [auditId]);

  const refreshDamageRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('damage_records')
        .select(`
          id,
          audit_id,
          damage_type,
          risk_level,
          location_details,
          building_area,
          photo_url,
          notes,
          recommendation,
          brand,
          reference_number,
          created_at,
          updated_at
        `)
        .eq('audit_id', auditId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Recalculate risk counts
      const riskCounts = calculateRiskCounts(data || []);

      // Update audit with new counts
      await updateAuditRiskCounts(auditId, riskCounts);

      setAudit(prev => ({
        ...prev,
        ...riskCounts
      }));
      setEditedAudit(prev => ({
        ...prev,
        ...riskCounts
      }));
      setDamageRecords(data || []);
      return data;
    } catch (error) {
      console.error('Error refreshing damage records:', error);
      return [];
    }
  };

  const handleAuditChange = (e) => {
    const { name, value } = e.target;
    setEditedAudit(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveAudit = async () => {
    try {
      const { error } = await supabase
        .from('audits')
        .update(editedAudit)
        .eq('id', auditId);

      if (error) throw error;
      
      setAudit(editedAudit);
      setIsEditing(false);
      
      // If auditor name changed, fetch new auditor details
      if (editedAudit.auditor_name !== audit.auditor_name) {
        const { data: auditorData, error: auditorError } = await supabase
          .from('auditors')
          .select('*')
          .eq('name', editedAudit.auditor_name)
          .single();
          
        if (!auditorError && auditorData) {
          setAuditorDetails(auditorData);
        } else {
          setAuditorDetails(null);
        }
      }
    } catch (error) {
      console.error('Error updating audit:', error);
      alert('Failed to save changes: ' + error.message);
    }
  };

  const handleAddDamageRecord = async (record) => {
    try {
      const { data, error } = await supabase
        .from('damage_records')
        .insert({
          ...record,
          audit_id: auditId
        })
        .select()
        .single();

      if (error) throw error;

      await refreshDamageRecords();
      return data;
    } catch (error) {
      console.error('Error adding damage record:', error);
      alert('Failed to add damage record: ' + error.message);
      return null;
    }
  };

  const handleEditDamageRecord = async (recordId, updatedRecord) => {
    try {
      const { error } = await supabase
        .from('damage_records')
        .update(updatedRecord)
        .eq('id', recordId);

      if (error) throw error;

      await refreshDamageRecords();
    } catch (error) {
      console.error('Error updating damage record:', error);
      alert('Failed to update damage record: ' + error.message);
    }
  };

  const handleDeleteDamageRecord = async (recordId) => {
    try {
      const { error } = await supabase
        .from('damage_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      await refreshDamageRecords();
    } catch (error) {
      console.error('Error deleting damage record:', error);
      alert('Failed to delete damage record: ' + error.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return {
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
  };
};

export default useAuditView;
