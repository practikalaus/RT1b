import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export const useAuditList = () => {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  const calculateRiskCounts = (damageRecords) => {
    return damageRecords.reduce((acc, record) => {
      const riskKey = `${record.risk_level.toLowerCase()}_risks`;
      acc[riskKey] = (acc[riskKey] || 0) + 1;
      return acc;
    }, {
      red_risks: 0,
      amber_risks: 0,
      green_risks: 0
    });
  };

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        setLoading(true);
        
        // First fetch all audits
        const { data: auditData, error: auditError } = await supabase
          .from('audits')
          .select('*')
          .order('created_at', { ascending: false });

        if (auditError) throw auditError;
        
        // Then fetch damage records for each audit and recalculate risk counts
        const auditsWithRecords = await Promise.all(
          auditData.map(async (audit) => {
            const { data: damageRecords, error: damageError } = await supabase
              .from('damage_records')
              .select('*')
              .eq('audit_id', audit.id);
              
            if (damageError) {
              console.error('Error fetching damage records:', damageError);
              return { ...audit, damage_records: [] };
            }

            // Calculate actual risk counts from damage records
            const riskCounts = calculateRiskCounts(damageRecords || []);

            // Update the audit record with recalculated counts
            const { error: updateError } = await supabase
              .from('audits')
              .update(riskCounts)
              .eq('id', audit.id);

            if (updateError) {
              console.error('Error updating audit risk counts:', updateError);
            }
            
            return { 
              ...audit, 
              ...riskCounts,
              damage_records: damageRecords || [] 
            };
          })
        );
        
        setAudits(auditsWithRecords);
      } catch (error) {
        console.error('Error fetching audits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAudits();
  }, []);

  const updateAuditStatus = async (auditId, field, value) => {
    try {
      const { error } = await supabase
        .from('audits')
        .update({ [field]: value })
        .eq('id', auditId);

      if (error) throw error;

      // Update local state
      setAudits(prevAudits => 
        prevAudits.map(audit => 
          audit.id === auditId 
            ? { ...audit, [field]: value } 
            : audit
        )
      );

      return true;
    } catch (error) {
      console.error(`Error updating audit ${field}:`, error);
      return false;
    }
  };

  return { audits, loading, updateAuditStatus };
};
