const fs = require('fs');

let content = fs.readFileSync('src/components/PortalAdmin.tsx', 'utf-8');

const notifVars = `
  const pendingLaporanCount = laporanList.filter(l => l.status === 'pending').length;
  const pendingBeritaCount = beritaList.filter(b => b.status === 'pending').length;
  const totalNotifs = pendingLaporanCount + pendingBeritaCount;
`;

// Insert it right before "const totalPenegak ="
content = content.replace(/const totalPenegak =/, notifVars + '\n  const totalPenegak =');

fs.writeFileSync('src/components/PortalAdmin.tsx', content);
console.log('Fixed totalNotifs in PortalAdmin');
