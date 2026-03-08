import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://mpmigazvfcdvqrkefvxb.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbWlnYXp2ZmNkdnFya2VmdnhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Nzk2OTYsImV4cCI6MjA4ODU1NTY5Nn0.jCFwIKmKdk4Wxz6NNITbiDuBSR2RZ8GYLuQ1Z2x94ZA'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
