// Live data for the deployed site. Projects that administrators upload are stored in Supabase
// (database, file storage and administrator sign-in); see supabase/schema.sql.
// Both values come from the Supabase dashboard: Project Settings -> API. The anon key is public by
// design: the database's row-level security decides what it may read and write. Never put the
// service_role key here.
window.CHARTER_SUPABASE_URL = "https://gzpehxnpswhaonhimbhu.supabase.co";
window.CHARTER_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cGVoeG5wc3doYW9uaGltYmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2MzcxNzIsImV4cCI6MjEwOTIxMzE3Mn0.FDFVOfUt2iPMqGh-GaA8wcEJ7Tm_G63pXNUY2ynJ1SI";
