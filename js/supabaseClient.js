import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// URL do projeto e chave pública do Supabase
const supabaseUrl = 'https://kahnknadtbtacghxjgrk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthaG5rbmFkdGJ0YWNnaHhqZ3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNTkwMDksImV4cCI6MjA3OTkzNTAwOX0.CAP-39Sd7gv2uR7Sh_dt0WN2PfZsetcgimEa--V8tgs'

export const supabase = createClient(supabaseUrl, supabaseKey)
