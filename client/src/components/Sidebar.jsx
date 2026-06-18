function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Дашборд', icon: '🏠' },
    { id: 'calendar', label: 'Расписание', icon: '📅' },
    { id: 'patients', label: 'Пациенты', icon: '👥' }
  ];

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon">+</div>
        <span>ClinicOS</span>
      </div>
      <nav className="nav-menu">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-item ${activeTab === tab.id || (activeTab === 'emr' && tab.id === 'patients') ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
