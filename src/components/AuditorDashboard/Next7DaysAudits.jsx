import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useNavigate } from 'react-router-dom';

const Next7DaysAudits = () => {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timePeriod, setTimePeriod] = useState('7');
  const [selectedAuditor, setSelectedAuditor] = useState('all');
  const [auditors, setAuditors] = useState([]);
  const navigate = useNavigate();

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
        setError('Failed to fetch auditors');
      }
    };

    fetchAuditors();
  }, []);

  useEffect(() => {
    const fetchUpcomingAudits = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get today's date at the start of the day in local timezone
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Set end date based on time period
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + parseInt(timePeriod));
        endDate.setHours(23, 59, 59, 999);

        // Convert dates to ISO string format for Supabase
        const todayStr = today.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        let query = supabase
          .from('scheduled_audits')
          .select(`
            id,
            booking_date,
            customers!inner (id, name, company, email, address, phone, next_audit_due, default_auditor, is_active, auto_marketing),
            auditors!inner (id, name, color)
          `)
          .gte('booking_date', todayStr)
          .lte('booking_date', endDateStr)
          .order('booking_date', { ascending: true });

        // Add auditor filter if one is selected
        if (selectedAuditor !== 'all') {
          query = query.eq('auditor_id', selectedAuditor);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Filter out audits that have been completed
        const filteredAudits = await Promise.all(
          (data || []).map(async (audit) => {
            try {
              const { data: completedAudits, error: completedError } = await supabase
                .from('audits')
                .select('id')
                .eq('site_name', audit.customers.name)
                .eq('company_name', audit.customers.company)
                .eq('audit_date', audit.booking_date)
                .eq('status', 'Submitted');

              if (completedError && completedError.code !== 'PGRST116') {
                console.error('Error checking completed audit:', completedError);
                return audit;
              }

              return completedAudits && completedAudits.length > 0 ? null : audit;
            } catch (err) {
              console.error('Error processing audit:', err);
              return audit;
            }
          })
        );

        // Filter out null values and sort by date
        const validAudits = filteredAudits
          .filter(Boolean)
          .sort((a, b) => new Date(a.booking_date) - new Date(b.booking_date));

        setAudits(validAudits);
      } catch (error) {
        console.error('Error fetching upcoming audits:', error);
        setError('Failed to fetch upcoming audits');
        setAudits([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingAudits();
  }, [timePeriod, selectedAuditor]);

  const handleStartAudit = (audit) => {
    const auditDataToPass = {
      auditor_name: audit.auditors?.name || '',
      site_name: audit.customers?.name || '',
      company_name: audit.customers?.company || '',
      audit_date: audit.booking_date ? String(audit.booking_date) : new Date().toISOString().split('T')[0],
      customer_id: audit.customers?.id ? String(audit.customers.id) : null
    };

    navigate('/form', {
      state: { auditData: auditDataToPass }
    });
  };

  if (loading) {
    return <div className="loading">Loading upcoming audits...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="next-days-audits">
      <div className="audits-header">
        <h2>Upcoming Audits</h2>
        <div className="filter-controls">
          <div className="filter-group">
            <label>Time Period:</label>
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              className="time-period-select"
            >
              <option value="1">Today</option>
              <option value="7">Next 7 Days</option>
              <option value="14">Next 14 Days</option>
              <option value="30">Next 30 Days</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Auditor:</label>
            <select
              value={selectedAuditor}
              onChange={(e) => setSelectedAuditor(e.target.value)}
              className="auditor-select"
            >
              <option value="all">All Auditors</option>
              {auditors.map(auditor => (
                <option key={auditor.id} value={auditor.id}>{auditor.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {audits.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer Name</th>
              <th>Company</th>
              <th>Auditor</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {audits.map(audit => (
              <tr key={audit.id}>
                <td>{new Date(audit.booking_date).toLocaleDateString()}</td>
                <td>{audit.customers.name}</td>
                <td>{audit.customers.company}</td>
                <td style={{ color: audit.auditors.color }}>{audit.auditors.name}</td>
                <td>
                  <button onClick={() => handleStartAudit(audit)}>
                    Start Audit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No upcoming audits in the selected time period.</p>
      )}
    </div>
  );
};

export default Next7DaysAudits;
