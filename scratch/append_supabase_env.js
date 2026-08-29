const fs = require('fs');

const extra = `
NEXT_PUBLIC_SUPABASE_URL=https://pfgjmvcvxegsnllepqgf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZ2ptdmN2eGVnc25sbGVwcWdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MjI2MTgsImV4cCI6MjEwMzQ5ODYxOH0.2FkRHWoTmFAgBBTlNognyi80pkOz1TUNTfrBiRsjcGk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZ2ptdmN2eGVnc25sbGVwcWdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzkyMjYxOCwiZXhwIjoyMTAzNDk4NjE4fQ.ShiawNmYCsXrE5yDbpSqgeIxfgAm4OKodKrx7mnCR-A
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

['env.local', '.env.local'].forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    if (!content.includes('NEXT_PUBLIC_SUPABASE_URL')) {
      content = content.trim() + '\n' + extra.trim() + '\n';
      fs.writeFileSync(f, content, 'utf8');
      console.log('Appended Supabase keys to', f);
    }
  }
});
