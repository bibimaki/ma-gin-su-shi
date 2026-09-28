-- FIX: staff_requests RLS without disabling RLS
-- Run this ONCE in Supabase SQL Editor.
--
-- This version avoids the PostgreSQL "column reference type is ambiguous"
-- error by returning the table row directly instead of using RETURNS TABLE
-- output variables named id/type/status.

DROP FUNCTION IF EXISTS public.create_staff_request(text, text);

CREATE FUNCTION public.create_staff_request(
  p_token text,
  p_type text
)
RETURNS SETOF public.staff_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_session_id uuid;
  v_row public.staff_requests%ROWTYPE;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) = 0 THEN
    RAISE EXCEPTION 'ไม่พบ Session Token';
  END IF;

  IF p_type IS NULL OR p_type NOT IN ('staff', 'bill') THEN
    RAISE EXCEPTION 'ประเภทคำขอไม่ถูกต้อง';
  END IF;

  SELECT s.id
    INTO v_session_id
  FROM public.sessions AS s
  WHERE s.token = p_token
    AND s.status = 'open'
  LIMIT 1;

  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Session หมดอายุหรือโต๊ะถูกปิดแล้ว';
  END IF;

  INSERT INTO public.staff_requests AS sr (session_id, type, status)
  VALUES (v_session_id, p_type, 'pending')
  ON CONFLICT (session_id, type) WHERE sr.status = 'pending'
  DO NOTHING
  RETURNING sr.* INTO v_row;

  IF v_row.id IS NOT NULL THEN
    RETURN NEXT v_row;
    RETURN;
  END IF;

  SELECT r.*
    INTO v_row
  FROM public.staff_requests AS r
  WHERE r.session_id = v_session_id
    AND r.type = p_type
    AND r.status = 'pending'
  ORDER BY r.created_at DESC
  LIMIT 1;

  IF v_row.id IS NOT NULL THEN
    RETURN NEXT v_row;
  END IF;

  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.create_staff_request(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_staff_request(text, text)
TO anon, authenticated, service_role;

-- Verify the function exists.
SELECT p.oid::regprocedure AS function_name
FROM pg_proc AS p
JOIN pg_namespace AS n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'create_staff_request';
