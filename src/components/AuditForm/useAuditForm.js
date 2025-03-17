import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '../../supabase';

const useAuditForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draft');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [auditData, setAuditData] = useState({
    reference_number: '',
    auditor_name: '',
    site_name: '',
    company_name: '',
    audit_date: new Date().toISOString().split('T')[0],
    notes: '',
    red_risks: 0,
    amber_risks: 0,
    green_risks: 0,
    status: 'Draft'
  });
  const [damageRecords, setDamageRecords] = useState([]);
  const [draftAuditId, setDraftAuditId] = useState(null);

  useEffect(() => {
    const counts = damageRecords.reduce((acc, record) => {
      const key = `${record.risk_level.toLowerCase()}_risks`;
      return {
        ...acc,
        [key]: (acc[key] || 0) + 1
      };
    }, {
      red_risks: 0,
      amber_risks: 0,
      green_risks: 0
    });

    setAuditData(prev => ({
      ...prev,
      ...counts
    }));
  }, [damageRecords]);

  useEffect(() => {
    console.log("Data received in useAuditForm:", location.state);
    
    if (draftId) {
      loadDraftAudit(draftId);
      return;
    }
    
    const initializeReferenceNumber = async () => {
      try {
        const { data, error } = await supabase
          .from('audits')
          .select('reference_number')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');

        const datePrefix = `RA${year}${month}${day}`;
        let sequence = '001';

        if (data && data.length > 0) {
          const lastRef = data[0].reference_number;
          if (lastRef.startsWith(datePrefix)) {
            const lastSeq = parseInt(lastRef.slice(-3));
            sequence = (lastSeq + 1).toString().padStart(3, '0');
          }
        }

        setAuditData(prev => ({
          ...prev,
          reference_number: `${datePrefix}${sequence}`
        }));
      } catch (error) {
        console.error('Error initializing reference number:', error);
      }
    };

    if (location.state?.auditData) {
      const { auditData: initialAuditData } = location.state;
      console.log("Initial audit data from location state:", initialAuditData);
      setAuditData(prev => ({
        ...prev,
        auditor_name: initialAuditData.auditor_name || '',
        site_name: initialAuditData.site_name || '',
        company_name: initialAuditData.company_name || '',
        audit_date: initialAuditData.audit_date || new Date().toISOString().split('T')[0],
        status: 'Draft'
      }));
      
      createDraftAudit({
        auditor_name: initialAuditData.auditor_name || '',
        site_name: initialAuditData.site_name || '',
        company_name: initialAuditData.company_name || '',
        audit_date: initialAuditData.audit_date || new Date().toISOString().split('T')[0],
      });
    } else {
      initializeReferenceNumber();
    }
  }, [location.state, draftId]);

  const loadDraftAudit = async (id) => {
    try {
      const { data: audit, error } = await supabase
        .from('audits')
        .select('*')
        .eq('id', id)
        .eq('status', 'Draft')
        .single();

      if (error) {
        console.error('Error loading draft audit:', error);
        return;
      }

      if (audit) {
        setDraftAuditId(audit.id);
        setAuditData(audit);

        const { data: records, error: recordsError } = await supabase
          .from('damage_records')
          .select('*')
          .eq('audit_id', audit.id)
          .order('created_at', { ascending: true });

        if (recordsError) {
          console.error('Error loading damage records:', recordsError);
        } else {
          setDamageRecords(records || []);
        }
      }
    } catch (error) {
      console.error('Error loading draft audit:', error);
    }
  };

  const createDraftAudit = async (initialData = {}) => {
    try {
      const draftData = {
        ...auditData,
        ...initialData,
        status: 'Draft'
      };

      const { data, error } = await supabase
        .from('audits')
        .insert([draftData])
        .select()
        .single();

      if (error) throw error;

      setDraftAuditId(data.id);
      setAuditData(data);
      return data.id;
    } catch (error) {
      console.error('Error creating draft audit:', error);
      return null;
    }
  };

  const updateDraftAudit = async () => {
    if (!draftAuditId) return;

    try {
      const { error } = await supabase
        .from('audits')
        .update(auditData)
        .eq('id', auditId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating draft audit:', error);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    try {
      setIsSubmitting(true);

      const riskCounts = damageRecords.reduce((acc, record) => {
        const key = `${record.risk_level.toLowerCase()}_risks`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, { red_risks: 0, amber_risks: 0, green_risks: 0 });

      let auditId = draftAuditId;
      
      if (auditId) {
        const { error: auditError } = await supabase
          .from('audits')
          .update({
            ...auditData,
            ...riskCounts,
            status: 'Submitted'
          })
          .eq('id', auditId);

        if (auditError) throw auditError;
      } else {
        const { data: audit, error: auditError } = await supabase
          .from('audits')
          .insert([{
            ...auditData,
            ...riskCounts,
            status: 'Submitted'
          }])
          .select()
          .single();

        if (auditError) throw auditError;
        auditId = audit.id;
      }

      if (auditId) {
        const { data: existingRecords } = await supabase
          .from('damage_records')
          .select('id, reference_number')
          .eq('audit_id', auditId);

        const existingRecordMap = new Map(
          existingRecords?.map(record => [record.id, record]) || []
        );

        const recordsToUpsert = damageRecords.map(record => ({
          ...record,
          audit_id: auditId,
          reference_number: existingRecordMap.get(record.id)?.reference_number || null
        }));

        const { error: damageError } = await supabase
          .from('damage_records')
          .upsert(recordsToUpsert, {
            onConflict: 'id',
            ignoreDuplicates: false
          });

        if (damageError) throw damageError;
      }

      if (location.state?.auditData) {
        const { auditData: scheduledAudit } = location.state;

        if (scheduledAudit.customer_id) {
          const nextAuditDue = new Date(auditData.audit_date);
          nextAuditDue.setFullYear(nextAuditDue.getFullYear() + 1);

          await supabase
            .from('customers')
            .update({
              next_audit_due: nextAuditDue.toISOString().split('T')[0]
            })
            .eq('id', scheduledAudit.customer_id);

          await supabase
            .from('scheduled_audits')
            .delete()
            .eq('id', scheduledAudit.id);
        }
      }

      navigate('/audits');
    } catch (error) {
      console.error('Error submitting audit:', error);
      alert('Error submitting audit: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuditChange = (e) => {
    const { name, value } = e.target;
    setAuditData(prev => ({
      ...prev,
      [name]: value
    }));
    
    setTimeout(() => {
      updateDraftAudit();
    }, 500);
  };

  const handleAddDamage = async (record) => {
    try {
      let auditId = draftAuditId;
      if (!auditId) {
        auditId = await createDraftAudit();
        if (!auditId) throw new Error('Failed to create draft audit');
      }

      const { data, error } = await supabase
        .from('damage_records')
        .insert({
          ...record,
          audit_id: auditId,
          reference_number: null
        })
        .select()
        .single();

      if (error) throw error;

      setDamageRecords(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error adding damage record:', error);
      alert('Failed to add damage record: ' + error.message);
      return null;
    }
  };

  const handleRemoveDamage = async (recordId) => {
    if (!draftAuditId) return;

    try {
      const { error } = await supabase
        .from('damage_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      setDamageRecords(prev => prev.filter(record => record.id !== recordId));
    } catch (error) {
      console.error('Error removing damage record:', error);
      alert('Failed to remove damage record: ' + error.message);
    }
  };

  const handleEditDamage = async (recordId, updatedRecord) => {
    if (!draftAuditId) return;

    try {
      const { data, error } = await supabase
        .from('damage_records')
        .update({
          ...updatedRecord,
          audit_id: draftAuditId
        })
        .eq('id', recordId)
        .select()
        .single();

      if (error) throw error;

      setDamageRecords(prev => 
        prev.map(record => record.id === recordId ? data : record)
      );
      
      return data;
    } catch (error) {
      console.error('Error updating damage record:', error);
      alert('Failed to update damage record: ' + error.message);
      return null;
    }
  };

  return {
    auditData,
    setAuditData,
    damageRecords,
    draftAuditId,
    handleAuditChange,
    handleAddDamage,
    handleRemoveDamage,
    handleEditDamage,
    handleSubmit,
    isSubmitting
  };
};

export default useAuditForm;
