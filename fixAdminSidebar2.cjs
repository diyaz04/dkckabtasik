const fs = require('fs');
const filePath = './src/components/PortalAdmin.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const asideStart = content.indexOf('<aside className={`hidden md:flex');
const asideEnd = content.indexOf('</aside>', asideStart);

if (asideStart !== -1 && asideEnd !== -1) {
  let asideContent = content.substring(asideStart, asideEnd + 8);
  
  // A simpler regex to find all buttons with setActiveTab in aside
  // We'll replace it chunk by chunk
  
  let chunks = asideContent.split('</button>');
  for (let i = 0; i < chunks.length; i++) {
    let chunk = chunks[i];
    if (chunk.includes('setActiveTab') || chunk.includes('handleLogout') || chunk.includes('navigate(\'/\')')) {
      if (chunk.includes('title={isSidebarCollapsed')) {
        // already processed
        continue;
      }

      // Check if it's the logout or navigate home which was processed in previous step
      if (chunk.includes('isSidebarCollapsed ? <LayoutDashboard') || chunk.includes('isSidebarCollapsed ? <Check')) {
        continue;
      }

      // Extract icon and text
      let iconMatch = chunk.match(/<([A-Z][a-zA-Z0-9_]+)\s+className="([^"]+)"\s*\/>\s*([^<]+)$/);
      if (iconMatch) {
        let iconName = iconMatch[1];
        let iconClass = iconMatch[2];
        let text = iconMatch[3].trim();
        
        // Add justify-center px-0 to className
        chunk = chunk.replace(/flex items-center gap-2\.5 cursor-pointer/, "flex items-center gap-2.5 cursor-pointer ${isSidebarCollapsed ? 'justify-center px-0' : ''}");
        
        // Add title and wrap text
        chunk = chunk.replace(/<button/, `<button \n            title={isSidebarCollapsed ? '${text}' : ''}`);
        
        // replace icon and text
        chunk = chunk.replace(/<([A-Z][a-zA-Z0-9_]+)\s+className="([^"]+)"\s*\/>\s*([^<]+)$/, `<$1 className="$2 shrink-0" />\n            {!isSidebarCollapsed && <span>${text}</span>}`);
        
        chunks[i] = chunk;
      }
    }
  }
  
  asideContent = chunks.join('</button>');
  content = content.substring(0, asideStart) + asideContent + content.substring(asideEnd + 8);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log("PortalAdmin updated successfully");
} else {
  console.log("aside not found");
}

