const fs = require('fs');

let content = fs.readFileSync('src/components/PortalAdmin.tsx', 'utf-8');

// 1. Add isMobileMenuOpen state
if (!content.includes('const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);')) {
  content = content.replace(
    /const \[isSidebarCollapsed, setIsSidebarCollapsed\] = useState\(false\);/,
    "const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);\n  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);"
  );
}

// 2. Add Search icon import if missing
if (!content.includes('Search,')) {
  content = content.replace(/LayoutDashboard,/, 'LayoutDashboard, Search, Bell, Menu,');
}

// 3. Replace Mobile Header
const oldMobileHeaderRegex = /\{\/\* Mobile Top Header \& Swipeable Tab-bar \(Mobile Only\) \*\/\}[\s\S]*?(?=\{\/\* Desktop Sidebar)/;

const newMobileHeader = `{/* 1. TOP APP BAR (Mobile Only) */}
      <div className="md:hidden bg-white flex items-center justify-between px-4 py-3 shrink-0 sticky top-0 z-40 shadow-sm border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-800 p-1">
            <Menu className="w-6 h-6" />
          </button>
          <h2 className="font-black text-sm tracking-widest font-mono text-gray-800 uppercase">ESKAHADE</h2>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative text-gray-500">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center text-white text-xs font-bold shadow-md">
            AD
          </div>
        </div>
      </div>

      {/* 2. SIDEBAR BACKDROP (Mobile Only) */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-[45] backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      `;

content = content.replace(oldMobileHeaderRegex, newMobileHeader);

// 4. Update Desktop Sidebar to act as drawer on mobile
// Current: <aside className={`hidden md:flex ${isSidebarCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 bg-gradient-to-b from-[#0E9F6E] via-[#10B981] to-[#065F46] text-white flex-col shrink-0 border-r border-[#064E3B]`}>
const oldAside = /<aside className=\{`hidden md:flex \$\{isSidebarCollapsed \? 'w-20' : 'w-64'\} transition-all duration-300 bg-gradient-to-b from-\[#0E9F6E\] via-\[#10B981\] to-\[#065F46\] text-white flex-col shrink-0 border-r border-\[#064E3B\]`\}>/;
const newAside = `<aside className={\`fixed md:relative inset-y-0 left-0 z-50 transform \${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex \${isSidebarCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 bg-gradient-to-b from-[#0E9F6E] via-[#10B981] to-[#065F46] text-white flex-col shrink-0 border-r border-[#064E3B] shadow-2xl md:shadow-none\`}>`;

content = content.replace(oldAside, newAside);

// 5. Wrap onClick inside sidebar to also close mobile menu
content = content.replace(/onClick=\{\(\) => setActiveTab\('([a-zA-Z_]+)'\)\}/g, "onClick={() => { setActiveTab('$1'); setIsMobileMenuOpen(false); }}");
content = content.replace(/onClick=\{\(\) => \{ setActiveTab\('users_dkr'\); setNewRole\('user'\); \}\}/g, "onClick={() => { setActiveTab('users_dkr'); setNewRole('user'); setIsMobileMenuOpen(false); }}");
content = content.replace(/onClick=\{\(\) => \{ setActiveTab\('users_saka'\); setNewRole\('saka'\); \}\}/g, "onClick={() => { setActiveTab('users_saka'); setNewRole('saka'); setIsMobileMenuOpen(false); }}");


// 6. Add Search Bar below GreetingBanner and Bottom Nav at the end of <main>
// First, find <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
// Or rather: change it to pb-24 on mobile
content = content.replace(
  /<main className="flex-1 p-6 sm:p-10 overflow-y-auto">/,
  `<main className="flex-1 p-4 sm:p-10 pb-28 md:pb-10 overflow-y-auto">`
);

// Add Search bar after GreetingBanner
const oldGreeting = /<GreetingBanner name=\{user\?\.nama \|\| 'Administrator'\} role=\{user\?\.role\} \/>/;
const newGreeting = `<GreetingBanner name={user?.nama || 'Administrator'} role={user?.role} />

          {/* Search Bar (Mobile Style) */}
          <div className="mt-6 mb-8 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="Cari menu atau layanan di sini..." 
              className="w-full bg-white border border-gray-200/60 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
            />
          </div>`;

content = content.replace(oldGreeting, newGreeting);

// 7. Add bottom navigation right before </main> or at the end of the return
// Let's add it right after </main>
const bottomNavStr = `
      {/* 3. BOTTOM NAVIGATION (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 px-6 py-2 pb-4 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] rounded-t-3xl">
        <div className="flex justify-between items-center relative mt-2">
          
          <button onClick={() => setActiveTab('dashboard')} className={\`flex flex-col items-center gap-1.5 \${activeTab === 'dashboard' ? 'text-brand-green' : 'text-gray-400'}\`}>
            <LayoutDashboard className={\`\${activeTab === 'dashboard' ? 'w-6 h-6' : 'w-5 h-5'}\`} />
            <span className="text-[10px] font-bold">Beranda</span>
          </button>
          
          <button onClick={() => setActiveTab('berita')} className={\`flex flex-col items-center gap-1.5 \${activeTab === 'berita' ? 'text-brand-green' : 'text-gray-400'}\`}>
            <FileText className={\`\${activeTab === 'berita' ? 'w-6 h-6' : 'w-5 h-5'}\`} />
            <span className="text-[10px] font-bold">Warta</span>
          </button>
          
          {/* Floating Center Button */}
          <div className="relative -top-8 flex flex-col items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-14 h-14 bg-brand-green rounded-full flex items-center justify-center text-white shadow-xl border-4 border-white/80 transform hover:scale-105 active:scale-95 transition-all"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-[10px] font-bold text-brand-green mt-1.5">Menu</span>
          </div>

          <button onClick={() => setActiveTab('agenda')} className={\`flex flex-col items-center gap-1.5 \${activeTab === 'agenda' ? 'text-brand-green' : 'text-gray-400'}\`}>
            <Calendar className={\`\${activeTab === 'agenda' ? 'w-6 h-6' : 'w-5 h-5'}\`} />
            <span className="text-[10px] font-bold">Kegiatan</span>
          </button>
          
          <button onClick={() => setActiveTab('laporan')} className={\`flex flex-col items-center gap-1.5 \${activeTab === 'laporan' ? 'text-brand-green' : 'text-gray-400'}\`}>
            <Award className={\`\${activeTab === 'laporan' ? 'w-6 h-6' : 'w-5 h-5'}\`} />
            <span className="text-[10px] font-bold">Laporan</span>
          </button>
          
        </div>
      </div>
      `;

content = content.replace(/(<\/main>\s*)<\/div>\s*\)\;/g, `$1${bottomNavStr}\n      </div>\n  );`);

fs.writeFileSync('src/components/PortalAdmin.tsx', content);
console.log('Done redesigning PortalAdmin mobile');
