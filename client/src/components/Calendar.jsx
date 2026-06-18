function Calendar({ doctors, appointments }) {
  const times = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];

  if (!doctors.length) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Врачи не найдены
      </div>
    );
  }

  return (
    <div>
      <div className="calendar-header">
        <h2 style={{ fontSize: '1.125rem' }}>Расписание врачей</h2>
        <input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
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
                <div key={doc.id + time} className="cal-slot" onClick={() => alert(`Запись на ${time} к врачу: ${doc.specialization} пока не реализована`)}>
                  + Свободно
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

import React from 'react';
export default Calendar;
