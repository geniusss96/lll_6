function Dashboard({ patients, appointments }) {
  const bookedCount = appointments.filter(a => a.status === 'scheduled').length;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Пациентов всего</h3>
          <div className="value">{patients.length}</div>
          <div className="trend positive">↑ Актуальные данные</div>
        </div>
        <div className="stat-card">
          <h3>Запланировано приемов</h3>
          <div className="value">{bookedCount}</div>
          <div className="trend">Ожидают визита</div>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>Ближайшие приемы</h3>
        <div style={{ marginTop: '1rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          {appointments.filter(a => a.status === 'scheduled').length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '1rem' }}>Нет запланированных приемов</p>
          ) : (
            appointments.filter(a => a.status === 'scheduled').map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <strong>{b.patient}</strong>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Врач: {b.doctor}</div>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{b.time}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
