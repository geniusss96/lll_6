import React, { useState, useEffect } from 'react';

function Patients({ patients, setPatients, activeTab, setActiveTab }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState({ name: '', dob: '', phone: '', allergies: '' });
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // EMR state
  const [emrHistory, setEmrHistory] = useState([]);
  const [emrForm, setEmrForm] = useState({ complaints: '', diagnosis: '', prescriptions: '', notes: '' });
  const [isSavingEmr, setIsSavingEmr] = useState(false);

  // Load EMR history when patient is selected
  useEffect(() => {
    if (activeTab === 'emr' && selectedPatient) {
      fetch(`/api/medical_records/${selectedPatient.id}`)
        .then(res => res.json())
        .then(data => setEmrHistory(data))
        .catch(err => console.error('Ошибка загрузки истории ЭМК', err));
    }
  }, [activeTab, selectedPatient]);

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

  const handleSaveEmr = async (e) => {
    e.preventDefault();
    if (!emrForm.complaints || !emrForm.diagnosis) {
      alert('Пожалуйста, заполните обязательные поля (Жалобы и Диагноз)');
      return;
    }
    
    setIsSavingEmr(true);
    try {
      const payload = {
        patient_id: selectedPatient.id,
        doctor_id: null, // Идеально было бы брать из сессии/контекста врача
        ...emrForm
      };

      const res = await fetch('/api/medical_records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setEmrHistory([data.record, ...emrHistory]);
        setEmrForm({ complaints: '', diagnosis: '', prescriptions: '', notes: '' });
      } else {
        const err = await res.json();
        alert('Ошибка сохранения: ' + err.error);
      }
    } catch (err) {
      alert('Ошибка сети при сохранении записи');
    } finally {
      setIsSavingEmr(false);
    }
  };

  const openEMR = (patient) => {
    setSelectedPatient(patient);
    setActiveTab('emr');
  };

  // Filter patients based on search query
  const filteredPatients = patients.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || 
           (p.phone && p.phone.includes(q)) || 
           p.id.toLowerCase().includes(q);
  });

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
                {emrHistory.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Нет предыдущих записей</p>
                ) : (
                  emrHistory.map(record => (
                    <div className="timeline-item" key={record.id}>
                      <div className="timeline-date">{new Date(record.record_date).toLocaleDateString('ru-RU')}</div>
                      <div className="timeline-content">
                        <strong>Врач:</strong> {record.doctor_spec || 'Врач'} <br/>
                        <strong>Жалобы:</strong> {record.complaints} <br/>
                        <strong>Диагноз:</strong> {record.diagnosis}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="emr-main">
            <div className="emr-card">
              <h3>Новый осмотр</h3>
              <form onSubmit={handleSaveEmr}>
                <div className="form-group">
                  <label>Жалобы *</label>
                  <textarea 
                    rows="3" 
                    value={emrForm.complaints} 
                    onChange={e => setEmrForm({...emrForm, complaints: e.target.value})}
                    required
                  ></textarea>
                </div>
                <div className="form-group">
                  <label>Диагноз по МКБ-10 *</label>
                  <select 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                    value={emrForm.diagnosis}
                    onChange={e => setEmrForm({...emrForm, diagnosis: e.target.value})}
                    required
                  >
                    <option value="">Выберите диагноз...</option>
                    <option value="J06.9">J06.9 - Острая инфекция верхних дыхательных путей</option>
                    <option value="I10">I10 - Эссенциальная [первичная] гипертензия</option>
                    <option value="E11.9">E11.9 - Инсулинонезависимый сахарный диабет</option>
                    <option value="M54.5">M54.5 - Боль внизу спины</option>
                    <option value="K29.7">K29.7 - Гастрит неуточненный</option>
                    <option value="Z00.0">Z00.0 - Общий медицинский осмотр</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Назначения</label>
                  <textarea 
                    rows="3"
                    value={emrForm.prescriptions}
                    onChange={e => setEmrForm({...emrForm, prescriptions: e.target.value})}
                  ></textarea>
                </div>
                <div className="form-group">
                  <label>Дополнительные заметки</label>
                  <textarea 
                    rows="2"
                    value={emrForm.notes}
                    onChange={e => setEmrForm({...emrForm, notes: e.target.value})}
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary" disabled={isSavingEmr}>
                  {isSavingEmr ? 'Сохранение...' : 'Сохранить запись'}
                </button>
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
        <input 
          type="text" 
          className="search-input" 
          placeholder="Поиск по ФИО, ID или тел..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
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
          {filteredPatients.map(p => (
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
          {filteredPatients.length === 0 && (
            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Пациентов не найдено</td></tr>
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
