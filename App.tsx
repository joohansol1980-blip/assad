import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Patient, AppSettings, ViewMode } from './types';
import DeskView from './components/DeskView';
import BoardView from './components/BoardView';
import SettingsModal from './components/SettingsModal';
import Toast from './components/Toast';
import { initSupabase, getSupabaseClient, getLocalPatients, saveLocalPatients } from './services/supabaseService';
import { RealtimeChannel } from '@supabase/supabase-js';

// Simple "Ding" sound in Base64 to avoid external dependencies
const NOTIFICATION_SOUND = "data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; // Shortened placeholder, will use a real simple beep logic or full base64 in real app. 
// Using a slightly longer valid base64 for a chime sound (Glass Ping)
const CHIME_SOUND = "data:audio/mp3;base64,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";

const DEFAULT_SETTINGS: AppSettings = {
  supabaseUrl: 'https://lvxusbagwcovuxwfdxld.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2eHVzYmFnd2NvdnV4d2ZkeGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMDUxODYsImV4cCI6MjA4NjU4MTE4Nn0.Q6TgvcxBCK6WQn1x_00XXnYaMPUIZ3-Jv9vja7cRysI',
  geminiApiKey: '',
  useSupabase: true,
};

function App() {
  // --- State ---
  const [patients, setPatients] = useState<Patient[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DESK);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Notification State
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' | 'alert'; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false,
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Helpers ---
  const triggerNotification = useCallback((message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    setNotification({ message, type, isVisible: true });
    
    // Play sound
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.warn("Audio play blocked", e));
    }
  }, []);

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  // --- Initialization ---
  useEffect(() => {
    // Initialize Audio
    audioRef.current = new Audio(CHIME_SOUND);
    audioRef.current.volume = 0.5;

    // Load Settings
    const savedSettings = localStorage.getItem('app_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      
      // Auto-fill defaults
      if (!parsed.supabaseUrl) parsed.supabaseUrl = DEFAULT_SETTINGS.supabaseUrl;
      if (!parsed.supabaseKey) parsed.supabaseKey = DEFAULT_SETTINGS.supabaseKey;
      if (parsed.useSupabase === undefined) parsed.useSupabase = true;

      setSettings(parsed);
    } else {
      setSettings(DEFAULT_SETTINGS);
    }

    // Load Theme
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }

    // Load Local Data
    setPatients(getLocalPatients());
  }, []);

  // --- Supabase Connection & Subscription ---
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const connectSupabase = async () => {
      if (settings.useSupabase && settings.supabaseUrl && settings.supabaseKey) {
        const success = initSupabase(settings.supabaseUrl, settings.supabaseKey);
        setIsSupabaseConnected(success);

        if (success) {
          const supabase = getSupabaseClient();
          if (supabase) {
            // Fetch Initial Data
            const { data, error } = await supabase
              .from('patients')
              .select('*')
              .order('created_at', { ascending: true });
            
            if (!error && data) {
              setPatients(data as Patient[]);
            }

            // Realtime Subscription
            channel = supabase
              .channel('schema-db-changes')
              .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'patients' },
                (payload) => {
                  if (payload.eventType === 'INSERT') {
                    const newPatient = payload.new as Patient;
                    setPatients(prev => [...prev, newPatient]);
                    triggerNotification(`새 메모: ${newPatient.name}`, 'alert');
                  } else if (payload.eventType === 'UPDATE') {
                    const updatedPatient = payload.new as Patient;
                    setPatients(prev => prev.map(p => p.id === payload.new.id ? updatedPatient : p));
                    
                    if (updatedPatient.status === 'in-progress') {
                       triggerNotification(`확인 중: ${updatedPatient.name}`, 'success');
                    } else if (updatedPatient.status === 'waiting') {
                       triggerNotification(`대기 이동: ${updatedPatient.name}`, 'info');
                    }
                  } else if (payload.eventType === 'DELETE') {
                     setPatients(prev => prev.filter(p => p.id !== payload.old.id));
                  }
                }
              )
              .subscribe();
          }
        }
      } else {
        setIsSupabaseConnected(false);
        setPatients(getLocalPatients());
      }
    };

    connectSupabase();

    return () => {
      const supabase = getSupabaseClient();
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, [settings.useSupabase, settings.supabaseUrl, settings.supabaseKey, triggerNotification]);

  // --- Handlers ---

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('app_settings', JSON.stringify(newSettings));
  };

  const addPatient = async (name: string, treatment: string) => {
    const newPatient: Patient = {
      id: crypto.randomUUID(),
      name,
      treatment,
      status: 'waiting',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConnected) {
      const supabase = getSupabaseClient();
      await supabase?.from('patients').insert([
        { 
          name, 
          treatment, 
          status: 'waiting' 
        }
      ]);
      // Note: Realtime subscription will handle state update and notification
    } else {
      const updated = [...patients, newPatient];
      setPatients(updated);
      saveLocalPatients(updated);
      triggerNotification(`새 메모: ${name}`, 'alert');
    }
  };

  const updateStatus = async (id: string, status: Patient['status']) => {
    const patientName = patients.find(p => p.id === id)?.name || '';

    if (status === 'done' && !isSupabaseConnected) {
       deletePatient(id);
       return;
    }
    
    if (status === 'done' && isSupabaseConnected) {
        const supabase = getSupabaseClient();
        await supabase?.from('patients').delete().eq('id', id);
        return;
    }

    if (isSupabaseConnected) {
      const supabase = getSupabaseClient();
      await supabase?.from('patients').update({ status }).eq('id', id);
       // Realtime handles update
    } else {
      const updated = patients.map(p => p.id === id ? { ...p, status } : p);
      setPatients(updated);
      saveLocalPatients(updated);
      
      if (status === 'in-progress') {
        triggerNotification(`확인 중: ${patientName}`, 'success');
      } else {
        triggerNotification(`대기 이동: ${patientName}`, 'info');
      }
    }
  };

  const deletePatient = async (id: string) => {
    if (isSupabaseConnected) {
      const supabase = getSupabaseClient();
      await supabase?.from('patients').delete().eq('id', id);
    } else {
      const updated = patients.filter(p => p.id !== id);
      setPatients(updated);
      saveLocalPatients(updated);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Toast Notification */}
      <Toast 
        message={notification.message} 
        type={notification.type} 
        isVisible={notification.isVisible} 
        onClose={closeNotification} 
      />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md z-40 sticky top-0 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-brand-500/50 shadow-lg">P</div>
             <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white hidden sm:block">PhysioFlow</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
             {/* View Toggles */}
             <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg flex">
                <button
                  onClick={() => setViewMode(ViewMode.DESK)}
                  className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${viewMode === ViewMode.DESK ? 'bg-white dark:bg-gray-600 text-brand-600 dark:text-brand-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'}`}
                >
                  입력 (Desk)
                </button>
                <button
                  onClick={() => setViewMode(ViewMode.BOARD)}
                  className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${viewMode === ViewMode.BOARD ? 'bg-white dark:bg-gray-600 text-brand-600 dark:text-brand-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'}`}
                >
                  현황판 (Board)
                </button>
             </div>

             {/* Reload Button */}
             <button
               onClick={() => window.location.reload()}
               className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
               title="새로고침"
             >
               <span className="material-icons-round">refresh</span>
             </button>

             {/* Dark Mode */}
             <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
             >
               <span className="material-icons-round">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
             </button>

             {/* Settings */}
             <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
             >
               <span className="material-icons-round">settings</span>
               {settings.useSupabase && isSupabaseConnected && (
                 <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-gray-800"></span>
               )}
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
           <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-brand-500/5 rounded-full blur-3xl"></div>
           <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-purple-500/5 rounded-full blur-3xl"></div>
        </div>

        {viewMode === ViewMode.DESK ? (
          <div className="pt-8">
            <DeskView 
              patients={patients} 
              onAddPatient={addPatient} 
              onUpdateStatus={updateStatus}
              onDelete={deletePatient}
              geminiApiKey={settings.geminiApiKey}
            />
          </div>
        ) : (
          <BoardView 
            patients={patients} 
            onUpdateStatus={updateStatus} 
          />
        )}
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}

export default App;