import React, { useState } from 'react';

function Patients({ patients, setPatients, activeTab, setActiveTab }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState({ name: '', dob: '', phone: '', allergies: '' });

  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const data = await res.json();
        setPatients([data.patient, ...patients]);
        setIsModalOpen(false);
        setFormData({ name: '', dob: '', phone: '', allergies: '' });
      } else {
        const err = await res.json();
        alert('Ошибка: ' + err.error);
      }
    } catch (err) {
      alert('Ошибка сети при сохранении пациента');
    }
  };

  const openEMR = (patient) => {
    setSelectedPatient(patient);
    setActiveTab('emr');
  };

  if (activeTab === 'emr' && selectedPatient) {
    const age = new Date().getFullYear() - new Date(selectedPatient.dob).getFullYear();
    return (
      <div>
        <div className="emr-header">
          <button className="btn" onClick={() => setActiveTab('patients')}>← К списку</button>
          <h2>{selectedPatient.name}</h2>
          <span style={{ color: 'var(--text-muted)' }}>ID: {selectedPatient.id.substring(0,8)}</span>
        </div>
        <div className="emr-grid">
          <div className="emr-sidebar">
            <div className="emr-card" style={{ marginBottom: '1rem' }}>
              <h3>Данные пациента</h3>
              <p><strong>Возраст:</strong> {age} лет ({selectedPatient.dob})</p>
              <p><strong>Аллергии:</strong> {selectedPatient.allergies || 'Нет данных'}</p>
            </div>
            <div className="emr-card">
              <h3>История приемов</h3>
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-date">10 Июня 2026</div>
                  <div className="timeline-content">Прием терапевта. Жалобы на общую слабость.</div>
                </div>
              </div>
            </div>
          </div>
          <div className="emr-main">
            <div className="emr-card">
              <h3>Новый осмотр</h3>
              <form>
                <div className="form-group">
                  <label>Жалобы</label>
                  <textarea rows="3"></textarea>
                </div>
                <div className="form-group">
                  <label>Диагноз по МКБ-10</label>
                  <select style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <option value="">Выберите диагноз...</option>
                    <option value="J06.9">J06.9 - Острая инфекция верхних дыхательных путей</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Назначения</label>
                  <textarea rows="3"></textarea>
                </div>
                <button type="button" className="btn btn-primary">Сохранить запись</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="patients-header">
        <input type="text" className="search-input" placeholder="Поиск по ФИО или ID..." />
        <div className="actions">
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Новый пациент</button>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>ФИО</th>
            <th>Дата рождения</th>
            <th>Телефон</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {patients.map(p => (
            <tr key={p.id}>
              <td><strong>{p.id.substring(0,8)}</strong></td>
              <td>{p.name}</td>
              <td>{p.dob}</td>
              <td>{p.phone}</td>
              <td>
                <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => openEMR(p)}>ЭМК</button>
              </td>
            </tr>
          ))}
          {patients.length === 0 && (
            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Пациентов не найдено</td></tr>
          )}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="modal-overlay active">
          <div className="modal">
            <div className="modal-header">
              <h2>Новая медицинская карта</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddPatient}>
                <div className="form-group">
                  <label>ФИО пациента *</label>
                  <input type="text" className="search-input" style={{ width: '100%' }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Дата рождения</label>
                  <input type="date" style={{ width: '100%' }} value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Контактный телефон</label>
                  <input type="tel" className="search-input" style={{ width: '100%' }} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Аллергические реакции</label>
                  <textarea rows="2" value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})}></textarea>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Отмена</button>
                  <button type="submit" className="btn btn-primary">Создать карту</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Patients;
