import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://auweathlzmvhtkseqqqs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1d2VhdGhsem12aHRrc2VxcXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNDUxNjMsImV4cCI6MjA5NTYyMTE2M30.kcTRc1l0w63HyAPt_zQMwEgvVAXpONNtZRTbl8xPjd8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
