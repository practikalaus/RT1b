import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase';
import './styles.css';
import Next7DaysAudits from './Next7DaysAudits';
import PastBookedAudits from './PastBookedAudits';
import { useNavigate } from 'react-router-dom';

const AuditorDashboard = () => {
  const [auditors, setAuditors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pastBookedAudits, setPastBookedAudits] = useState([]);
  const [draftAudits, setDraftAudits] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAuditorStats = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_auditor_stats').select('*');

        if (error) {
          console.error('Error fetching auditor stats:', error);
          setAuditors([]);
        } else {
          const sortedData = data.sort((a, b) => b.completed_audits - a.completed_audits);
          setAuditors(sortedData);
        }
      } catch (error) {
        console.error('Error fetching auditor stats:', error);
        setError('Failed to fetch auditor stats.');
        setAuditors([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchPastBookedAudits = async () => {
      try {
        const today = new Date();

        const { data, error } = await supabase
          .from('scheduled_audits')
          .select(`
            id,
            booking_date,
            customers!customer_id (id, name, company, email, address, phone, next_audit_due, default_auditor, is_active, auto_marketing),
            auditors!auditor_id (name)
          `)
          .lt('booking_date', today.toISOString().split('T')[0])
          .order('booking_date', { ascending: true });

        if (error) {
          console.error('Error fetching past booked audits:', error);
          setPastBookedAudits([]);
          return;
        }

        // Filter out audits that have been completed
        const filteredAudits = await Promise .all(
          data.map(async (audit) => {
            try {
              const { data: completedAudit, error: completedError } = await supabase
                .from('audits')
                .select('id')
                .eq('site_name', audit.customers.name)
                .eq('company_name', audit.customers.company)
                .eq('audit_date', audit.booking_date);

              // Ignore PGRST116 errors (no rows returned)
              if (completedError && completedError.code !== 'PGRST116') {
                console.error('Error checking for completed audit:', completedError);
              }

              // Return null if completed (has records), otherwise return the audit
              return completedAudit && completedAudit.length > 0 ? null : audit;
            } catch (error) {
              console.error('Error checking for completed audit:', error);
              return audit; // Return the audit if there's an error
            }
          })
        );

        setPastBookedAudits(filteredAudits.filter(audit => audit));
      } catch (error) {
        console.error('Error fetching past booked audits:', error);
        setError('Failed to fetch past booked audits.');
        setPastBookedAudits([]);
      }
    };

    const fetchDraftAudits = async () => {
      try {
        const { data, error } = await supabase
          .from('audits')
          .select('*')
          .eq('status', 'Draft')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDraftAudits(data || []);
      } catch (error) {
        console.error('Error fetching draft audits:', error);
        setDraftAudits([]);
      }
    };

    fetchAuditorStats();
    fetchPastBookedAudits();
    fetchDraftAudits();
  }, []);

  const handleContinueAudit = (auditId) => {
    navigate(`/form?draft=${auditId}`);
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="auditor-dashboard">
      <h1>Auditor Dashboard</h1>

      {draftAudits.length > 0 && (
        <div className="dashboard-section draft-audits-section">
          <h2>Continue Draft Audits</h2>
          <div className="draft-audits-grid">
            {draftAudits.map(audit => (
              <div key={audit.id} className="draft-audit-card">
                <div className="draft-audit-info">
                  <h3>{audit.site_name || 'Unnamed Site'}</h3>
                  <p><strong>Company:</strong> {audit.company_name || 'Not specified'}</p>
                  <p><strong>Started:</strong> {new Date(audit.created_at).toLocaleDateString()}</p>
                </div>
                <div className="draft-audit-actions">
                  <button 
                    onClick={() => handleContinueAudit(audit.id)}
                    className="continue-audit-btn"
                  >
                    Continue Audit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="scoreboard">
        <table>
          <thead>
            <tr>
              <th>Auditor</th>
              <th>Completed</th>
              <th>Booked</th>
              <th>Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {auditors.map(auditor => (
              <tr key={auditor.auditor_id}>
                <td>{auditor.auditor_name}</td>
                <td>{auditor.completed_audits}</td>
                <td>{auditor.booked_audits}</td>
                <td>{pastBookedAudits.filter(audit => audit?.auditors?.name === auditor.auditor_name).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Next7DaysAudits />
      <PastBookedAudits audits={pastBookedAudits} />
    </div>
  );
};

export default AuditorDashboard;
