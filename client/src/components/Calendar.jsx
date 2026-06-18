import React, { useState } from 'react';

function Calendar({ doctors, appointments, patients, setAppointments }) {
  const times = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!doctors.length) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Врачи не найдены
      </div>
    );
  }

  const handleBookSlot = (time, doctor) => {
    setSelectedSlot({ time, doctor });
    setSelectedPatientId('');
  };

  const submitAppointment = async (e) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedSlot) return;

    try {
      const payload = {
        patient_id: selectedPatientId,
        doctor_id: selectedSlot.doctor.id,
        appointment_date: date,
        time_slot: selectedSlot.time + ':00' // Server expects time format HH:mm:ss
      };

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Чтобы не делать новый GET запрос, добавим локально для UI
        // Но нам нужно имя пациента и специальность врача для красивого отображения
        const p = patients.find(p => p.id === selectedPatientId);
        const newApt = {
          id: Math.random().toString(), // Временный ID до перезагрузки
          time: selectedSlot.time,
          status: 'scheduled',
          doctor: selectedSlot.doctor.specialization,
          patient: p.name
        };
        setAppointments([...appointments, newApt]);
        setSelectedSlot(null);
      } else {
        const err = await res.json();
        alert('Ошибка записи: ' + err.error);
      }
    } catch (err) {
      alert('Ошибка сети при записи на прием');
    }
  };

  return (
    <div>
      <div className="calendar-header">
        <h2 style={{ fontSize: '1.125rem' }}>Расписание врачей</h2>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="calendar-grid" style={{ gridTemplateColumns: `80px repeat(${doctors.length}, 1fr)` }}>
        <div></div>
        {doctors.map(doc => (
          <div key={doc.id} style={{ fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>
            {doc.specialization}
            <br />
            <small style={{ fontSize: '0.7em', fontWeight: 400 }}>{doc.name}</small>
          </div>
        ))}

        {times.map(time => (
          <React.Fragment key={time}>
            <div className="cal-time">{time}</div>
            {doctors.map(doc => {
              const apt = appointments.find(a => a.time === time && a.doctor === doc.specialization);
              if (apt && apt.status === 'scheduled') {
                return <div key={doc.id + time} className="cal-slot booked">{apt.patient}</div>;
              }
              return (
                <div key={doc.id + time} className="cal-slot" onClick={() => handleBookSlot(time, doc)}>
                  + Свободно
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {selectedSlot && (
        <div className="modal-overlay active">
          <div className="modal">
            <div className="modal-header">
              <h2>Запись к врачу</h2>
              <button className="close-btn" onClick={() => setSelectedSlot(null)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={submitAppointment}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <p><strong>Врач:</strong> {selectedSlot.doctor.specialization} ({selectedSlot.doctor.name})</p>
                  <p><strong>Время:</strong> {date} в {selectedSlot.time}</p>
                </div>
                <div className="form-group">
                  <label>Выберите пациента *</label>
                  <select 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                    value={selectedPatientId}
                    onChange={e => setSelectedPatientId(e.target.value)}
                    required
                  >
                    <option value="">-- Выберите из списка --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (тел: {p.phone || 'нет'})</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn" onClick={() => setSelectedSlot(null)}>Отмена</button>
                  <button type="submit" className="btn btn-primary" disabled={!selectedPatientId}>Подтвердить запись</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;
