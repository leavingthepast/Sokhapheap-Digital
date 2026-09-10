const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://bzmulqaarhwcnazkzdev.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bXVscWFhcmh3Y25hemt6ZGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NTQyNjIsImV4cCI6MjEwNDQzMDI2Mn0.I9_Wptt5o6ZuSSMydMmsHOdmgVED5z40arHhKzhS-wE');

async function test() {
  const { data, error } = await supabase.rpc('get_schema_info', {}).select('*');
  console.log('rpc error:', error);
  // Alternative to get column types
  const { data: cols, error: err } = await supabase
    .from('patients')
    .select('user_id')
    .limit(1);
  console.log('test:', cols, err);
}
test();
