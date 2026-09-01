const fs = require('fs');

let content = fs.readFileSync('src/components/PortalAdmin.tsx', 'utf-8');

const injectStates = `  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);`;

if (!content.includes('const [isNotifMenuOpen')) {
  content = content.replace(
    /const \[isMobileMenuOpen, setIsMobileMenuOpen\] = useState\(false\);/,
    "const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);\n" + injectStates
  );
  fs.writeFileSync('src/components/PortalAdmin.tsx', content);
  console.log('Fixed states in PortalAdmin');
}

let contentDkr = fs.readFileSync('src/components/PortalDkr.tsx', 'utf-8');
if (!contentDkr.includes('const [isNotifMenuOpen')) {
  contentDkr = contentDkr.replace(
    /const \[isMobileMenuOpen, setIsMobileMenuOpen\] = useState\(false\);/,
    "const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);\n" + injectStates
  );
  fs.writeFileSync('src/components/PortalDkr.tsx', contentDkr);
  console.log('Fixed states in PortalDkr');
}
