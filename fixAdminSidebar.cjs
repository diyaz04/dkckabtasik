const fs = require('fs');
const filePath = './src/components/PortalAdmin.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// The sidebar nav is within <nav className="p-4 space-y-1.5 flex-1 font-sans overflow-y-auto"> ... </nav>
// We need to replace all `<button ...> <Icon /> text </button>` in the `<aside className="hidden md:flex...` block.

const asideStart = content.indexOf('<aside className={`hidden md:flex');
const asideEnd = content.indexOf('</aside>', asideStart);

if (asideStart !== -1 && asideEnd !== -1) {
  let asideContent = content.substring(asideStart, asideEnd + 8);
  
  // Replace buttons
  asideContent = asideContent.replace(/<button\s+onClick=\{\(\) => \{? setActiveTab\('(.*?)'\)[^\}]*\}?\}\s+className=\{`([\s\S]*?)`\}\s*>\s*<([a-zA-Z0-9_]+)\s+className="([^"]+)"\s*\/>\s*([^<]+)\s*<\/button>/g,
    (match, tab, classes, icon, iconClass, text) => {
      
      // Inject justify-center and px-0 if collapsed
      let newClasses = classes;
      if (!newClasses.includes('isSidebarCollapsed')) {
        newClasses = newClasses.replace(/flex items-center gap-2\.5 cursor-pointer/, "flex items-center gap-2.5 cursor-pointer ${isSidebarCollapsed ? 'justify-center px-0' : ''}");
      }
      
      let cleanText = text.trim();

      return `<button 
            title={isSidebarCollapsed ? '${cleanText}' : ''}
            onClick={() => setActiveTab('${tab}')}
            className={\`${newClasses}\`}
          >
            <${icon} className="${iconClass} shrink-0" />
            {!isSidebarCollapsed && <span>${cleanText}</span>}
          </button>`;
    }
  );

  // Users buttons are a bit different: `onClick={() => { setActiveTab('users_dkr'); setNewRole('user'); }}`
  asideContent = asideContent.replace(/<button\s+onClick=\{\(\) => \{ setActiveTab\('(.*?)'\); setNewRole\('(.*?)'\); \}\}\s+className=\{`([\s\S]*?)`\}\s*>\s*<([a-zA-Z0-9_]+)\s+className="([^"]+)"\s*\/>\s*([^<]+)\s*<\/button>/g,
    (match, tab, role, classes, icon, iconClass, text) => {
      let newClasses = classes;
      if (!newClasses.includes('isSidebarCollapsed')) {
        newClasses = newClasses.replace(/flex items-center gap-2\.5 cursor-pointer/, "flex items-center gap-2.5 cursor-pointer ${isSidebarCollapsed ? 'justify-center px-0' : ''}");
      }
      let cleanText = text.trim();

      return `<button 
            title={isSidebarCollapsed ? '${cleanText}' : ''}
            onClick={() => { setActiveTab('${tab}'); setNewRole('${role}'); }}
            className={\`${newClasses}\`}
          >
            <${icon} className="${iconClass} shrink-0" />
            {!isSidebarCollapsed && <span>${cleanText}</span>}
          </button>`;
    }
  );

  content = content.substring(0, asideStart) + asideContent + content.substring(asideEnd + 8);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log("PortalAdmin updated successfully");
} else {
  console.log("aside not found");
}

