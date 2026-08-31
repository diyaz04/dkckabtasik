const fs = require('fs');
const filePath = './src/components/PortalDkr.tsx';
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
  /<aside className="hidden md:flex w-64 (.*?) flex-col shrink-0">/,
  `<aside className={\`hidden md:flex \${isSidebarCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 $1 flex-col shrink-0\`}>`
);

// Update logo area and toggle button
const logoRegex = /<div className="p-6 border-b border-white\/10 text-center">([\s\S]*?)<p className="text-\[10px\] text-gray-300 font-mono mt-1">Kec\. \{kecamatan\?\.nama_kecamatan \|\| '\.\.\.'\}<\/p>\s*<\/div>/;
content = content.replace(logoRegex, (match) => {
  return `<div className="p-5 border-b border-white/10 flex flex-col items-center relative">
          <div className={\`flex items-center gap-3 w-full \${isSidebarCollapsed ? 'justify-center' : 'justify-between'}\`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-brand-green p-1 shrink-0 shadow-sm overflow-hidden">
                {profile?.logo_url ? (
                  <img src={profile.logo_url} alt="Logo DKR" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl text-brand-green font-bold">⛺</span>
                )}
              </div>
              {!isSidebarCollapsed && (
                <div className="text-left">
                  <h2 className="font-display font-extrabold text-xs tracking-wider text-brand-green uppercase leading-tight">Portal DKR Ranting</h2>
                  <p className="text-[10px] text-gray-300 font-mono mt-0.5 tracking-wider uppercase leading-none">Kec. {kecamatan?.nama_kecamatan || '...'}</p>
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
          )}
        </div>`;
});

// Update categories
content = content.replace(/<p className="px-4 pt-([0-3]) pb-1 text-\[9px\] font-bold text-gray-400 uppercase tracking-widest font-mono">(.*?)<\/p>/g, 
  `<p className={\`px-4 pt-$1 pb-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono \${isSidebarCollapsed ? 'text-center opacity-50' : ''}\`}>
            {isSidebarCollapsed ? '•' : '$2'}
          </p>`
);

// Update sidebar buttons
content = content.replace(/<button\s*onClick=\{\(\) => setActiveTab\('(.*?)'\)\}\s*className=\{`(.*?)flex items-center gap-2\.5 cursor-pointer \$\{(.*?)\}`\}\s*>\s*<(.*?)\s+className="(.*?)"\s*\/>\s*(.*?)\s*<\/button>/g,
  (match, tab, classesPart1, classesPart2, icon, iconClass, text) => {
    return `<button 
            title={isSidebarCollapsed ? '${text.trim()}' : ''}
            onClick={() => setActiveTab('${tab}')}
            className={\`${classesPart1}flex items-center gap-2.5 cursor-pointer \${isSidebarCollapsed ? 'justify-center px-0' : ''} \${${classesPart2}}\`}
          >
            <${icon} className="${iconClass} shrink-0" />
            {!isSidebarCollapsed && <span>${text.trim()}</span>}
          </button>`;
  }
);


// Check if PanelLeft is imported
if (!content.includes('PanelLeft')) {
  content = content.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, (match, imports) => {
    return `import {${imports}, PanelLeft } from 'lucide-react';`;
  });
}

// Write the file
fs.writeFileSync(filePath, content, 'utf-8');
console.log("PortalDkr updated successfully");
