const fs = require('fs');

function updateSidebar(filePath, isDkr) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Add state
  if (!content.includes('isSidebarCollapsed')) {
    content = content.replace(
      /const \[activeTab, setActiveTab\] = useState.*?;\n/,
      match => match + `  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);\n`
    );
  }

  // Update aside tag
  content = content.replace(
    /<aside className="hidden md:flex w-64 bg-gradient-to-b (.*?) flex-col shrink-0 (.*?)">/,
    `<aside className={\`hidden md:flex \${isSidebarCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 bg-gradient-to-b $1 flex-col shrink-0 $2\`}>`
  );

  // Add toggle button next to Logo
  if (!content.includes('onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}')) {
    const logoRegex = /<div className="p-5 border-b border-white\/10 flex flex-col items-center">([\s\S]*?)<div className="text-left">([\s\S]*?)<\/div>\s*<\/div>/;
    content = content.replace(logoRegex, (match, p1, p2) => {
      return `<div className="p-5 border-b border-white/10 flex flex-col items-center">
          <div className={\`flex items-center gap-3 w-full \${isSidebarCollapsed ? 'justify-center' : 'justify-between'}\`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-emerald-400 p-1 shrink-0 shadow-sm">
                <span className="text-2xl text-[#0E9F6E] font-bold">⛺</span>
              </div>
              {!isSidebarCollapsed && (
                <div className="text-left">
                  ${p2.trim()}
                </div>
              )}
            </div>
            {!isSidebarCollapsed && (
              <button onClick={() => setIsSidebarCollapsed(true)} className="p-1 hover:bg-white/10 rounded-lg text-white">
                <PanelLeft className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {isSidebarCollapsed && (
            <button onClick={() => setIsSidebarCollapsed(false)} className="mt-4 p-2 hover:bg-white/10 rounded-lg text-white">
              <PanelLeft className="w-5 h-5" />
            </button>
          )}`;
    });
  }

  // Hide access badge if collapsed
  content = content.replace(
    /\{\/\* ACCESS BADGE AS SHOWN IN THE USER REFERENCE IMAGE \*\/\}\s*<div className="w-full bg-black\/15 border border-emerald-500\/20 rounded-2xl p-3 text-center mt-4">([\s\S]*?)<\/div>/,
    `{/* ACCESS BADGE AS SHOWN IN THE USER REFERENCE IMAGE */}
          {!isSidebarCollapsed && (
            <div className="w-full bg-black/15 border border-emerald-500/20 rounded-2xl p-3 text-center mt-4">
              $1
            </div>
          )}`
  );

  // Update categories (hide text if collapsed)
  content = content.replace(/<p className="px-4 pt-([0-3]) pb-1 text-\[9px\] font-bold text-emerald-200\/70 uppercase tracking-widest font-mono">(.*?)<\/p>/g, 
    `<p className={\`px-4 pt-$1 pb-1 text-[9px] font-bold text-emerald-200/70 uppercase tracking-widest font-mono \${isSidebarCollapsed ? 'text-center opacity-50' : ''}\`}>
            {isSidebarCollapsed ? '•' : '$2'}
          </p>`
  );

  // Update sidebar buttons to center icons and hide text when collapsed
  content = content.replace(/<button\s*onClick=\{\(\) => setActiveTab\('(.*?)'\)(.*?)\}\s*className=\{`(.*?)`\}\s*>\s*<(.*?)\s+className="(.*?)"\s*\/>\s*(.*?)\s*<\/button>/g,
    (match, tab, extra, classes, icon, iconClass, text) => {
      // Fix classes logic to add justify-center when collapsed
      const newClasses = classes.replace(
        /flex items-center gap-2.5 cursor-pointer \$\{/,
        `flex items-center gap-2.5 cursor-pointer \${isSidebarCollapsed ? 'justify-center px-0' : ''} \${`
      );
      
      return `<button 
            title={isSidebarCollapsed ? '${text.trim()}' : ''}
            onClick={() => { setActiveTab('${tab}')${extra} }}
            className={\`${newClasses}\`}
          >
            <${icon} className="${iconClass} shrink-0" />
            {!isSidebarCollapsed && <span>${text.trim()}</span>}
          </button>`;
    }
  );

  // Update Logout block
  const logoutRegex = /<div className="p-4 border-t border-white\/10 space-y-2">([\s\S]*?)<\/div>\s*<\/aside>/;
  content = content.replace(logoutRegex, (match, inner) => {
    // Hide text in the two buttons
    let updatedInner = inner.replace(
      /<button\s*onClick=\{\(\) => navigate\('\/'\)\}\s*className="(.*?) flex items-center justify-center gap-1.5 cursor-pointer"\s*>\s*Kembali ke Beranda\s*<\/button>/,
      `<button 
            title="Kembali ke Beranda"
            onClick={() => navigate('/')}
            className={\`$1 flex items-center justify-center gap-1.5 cursor-pointer \${isSidebarCollapsed ? 'px-0' : ''}\`}
          >
            {isSidebarCollapsed ? <LayoutDashboard className="w-4 h-4" /> : 'Kembali ke Beranda'}
          </button>`
    );

    updatedInner = updatedInner.replace(
      /<button\s*onClick=\{handleLogout\}\s*className="(.*?) flex items-center justify-center gap-1.5 cursor-pointer"\s*>\s*Keluar Sesi\s*<\/button>/,
      `<button 
            title="Keluar Sesi"
            onClick={handleLogout}
            className={\`$1 flex items-center justify-center gap-1.5 cursor-pointer \${isSidebarCollapsed ? 'px-0' : ''}\`}
          >
            {isSidebarCollapsed ? <Check className="w-4 h-4" /> : 'Keluar Sesi'}
          </button>`
    );

    return `<div className="p-4 border-t border-white/10 space-y-2">
          ${updatedInner}
        </div>
      </aside>`;
  });

  // Make sure PanelLeft is imported from lucide-react
  if (!content.includes('PanelLeft')) {
    content = content.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, (match, imports) => {
      return `import {${imports}, PanelLeft } from 'lucide-react';`;
    });
  }

  fs.writeFileSync(filePath, content, 'utf-8');
}

updateSidebar('./src/components/PortalAdmin.tsx', false);
updateSidebar('./src/components/PortalDkr.tsx', true);

console.log("Done");
