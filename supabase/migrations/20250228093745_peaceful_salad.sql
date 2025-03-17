-- Function to get auditor statistics
CREATE OR REPLACE FUNCTION get_auditor_stats()
RETURNS TABLE (
  auditor_id UUID,
  auditor_name TEXT,
  completed_audits INTEGER,
  booked_audits INTEGER,
  outstanding_audits INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH completed_counts AS (
    -- Count completed audits (status = 'Submitted')
    SELECT 
      a.auditor_name,
      COUNT(*) as count
    FROM audits a
    WHERE a.status = 'Submitted'
    GROUP BY a.auditor_name
  ),
  booked_counts AS (
    -- Count future scheduled audits
    SELECT
      aud.name as auditor_name,
      COUNT(*) as count
    FROM scheduled_audits sa
    JOIN auditors aud ON sa.auditor_id = aud.id
    WHERE sa.booking_date >= CURRENT_DATE
    GROUP BY aud.name
  ),
  outstanding_counts AS (
    -- Count past scheduled audits without completed audit records
    SELECT
      aud.name as auditor_name,
      COUNT(*) as count
    FROM scheduled_audits sa
    JOIN auditors aud ON sa.auditor_id = aud.id
    LEFT JOIN audits a ON 
      a.auditor_name = aud.name AND
      a.audit_date::date = sa.booking_date::date AND
      a.status = 'Submitted'
    WHERE 
      sa.booking_date < CURRENT_DATE AND
      a.id IS NULL
    GROUP BY aud.name
  )
  SELECT
    a.id as auditor_id,
    a.name as auditor_name,
    COALESCE(cc.count, 0) as completed_audits,
    COALESCE(bc.count, 0) as booked_audits,
    COALESCE(oc.count, 0) as outstanding_audits
  FROM
    auditors a
    LEFT JOIN completed_counts cc ON a.name = cc.auditor_name
    LEFT JOIN booked_counts bc ON a.name = bc.auditor_name
    LEFT JOIN outstanding_counts oc ON a.name = oc.auditor_name
  ORDER BY
    a.name;
END;
$$ LANGUAGE plpgsql;
