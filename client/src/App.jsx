import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Patients from './components/Patients';
import Calendar from './components/Calendar';
import Sidebar from './components/Sidebar';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, dRes, aRes] = await Promise.all([
        fetch('/api/patients'),
        fetch('/api/doctors'),
        fetch('/api/appointments')
      ]);

      if (!pRes.ok || !dRes.ok || !aRes.ok) throw new Error('Ошибка сети');

      const pData = await pRes.json();
      const dData = await dRes.json();
      const aData = await aRes.json();

      setPatients(pData);
      setDoctors(dData);
      setAppointments(aData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Ошибка подключения к серверу или базе данных. Проверьте логи сервера.');
    } finally {
      setLoading(false);
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Дашборд';
      case 'calendar': return 'Расписание';
      case 'patients': return 'Пациенты';
      case 'emr': return 'Электронная Медицинская Карта';
      default: return 'ClinicOS';
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        <header className="topbar">
          <h1>{getPageTitle()}</h1>
          <div className="user-profile">
            <div className="avatar">АВ</div>
            <span>Д-р. Александр В.</span>
          </div>
        </header>

        {error && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)', fontWeight: 500 }}>
            {error}
          </div>
        )}

        {loading && !error && (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка данных...</div>
        )}

        {!loading && !error && (
          <div style={{ flex: 1, position: 'relative' }}>
            <div className={`page-view ${activeTab === 'dashboard' ? 'active' : ''}`}>
              <Dashboard patients={patients} appointments={appointments} />
            </div>
            
            <div className={`page-view ${activeTab === 'calendar' ? 'active' : ''}`}>
              <Calendar doctors={doctors} appointments={appointments} />
            </div>
            
            <div className={`page-view ${activeTab === 'patients' || activeTab === 'emr' ? 'active' : ''}`}>
              <Patients 
                patients={patients} 
                setPatients={setPatients} 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
