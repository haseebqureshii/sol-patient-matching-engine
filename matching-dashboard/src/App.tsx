import { useState, useEffect } from 'react';
import { 
  HeartPulse, CheckCircle, Clock, ShieldAlert, ArrowLeft, 
  Users, Zap, Terminal, BookOpen, LayoutDashboard, Database, Server, Lock 
} from 'lucide-react';
import systemInfographic from './assets/sol-matching-engine-arch.png';
// It uses the Vite environment variable if it exists, otherwise falls back to localhost.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface Patient {
  patient_id: string;
  name: string;
  condition: string;
}

interface Match {
  advocateId: string;
  name: string;
  specialty: string;
  matchScore: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'app' | 'docs'>('app');
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingState, setBookingState] = useState<Record<string, 'idle' | 'loading' | 'success' | 'conflict'>>({});
  const [logs, setLogs] = useState<string[]>(['System Ready. Select a patient to begin.']);

  // Fetch Patients on Load
  useEffect(() => {
    fetch(`${API_BASE}/matches/patients`)
      .then((res) => res.json())
      .then((data) => {
        setPatients(data);
        setLoading(false);
      })
      .catch((err) => console.error("Failed to fetch patients:", err));
  }, []);

  // Fetch Matches when a Patient is Selected
  useEffect(() => {
    if (!selectedPatient) return;
    setLoading(true);
    fetch(`${API_BASE}/matches?patientId=${selectedPatient.patient_id}`)
      .then((res) => res.json())
      .then((data) => {
        setMatches(data);
        setLoading(false);
        addLog(`Loaded matches for ${selectedPatient.name}.`);
      })
      .catch((err) => console.error("Failed to fetch matches:", err));
  }, [selectedPatient]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].slice(0, 11)} - ${message}`].slice(-4));
  };

  const handleBook = async (advocateId: string) => {
    if (!selectedPatient) return;
    setBookingState(prev => ({ ...prev, [advocateId]: 'loading' }));
    addLog(`Acquiring mutex lock for advocate ${advocateId.split('-')[0]}...`);

    try {
      const response = await fetch(`${API_BASE}/matches/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: selectedPatient.patient_id, advocateId }),
      });

      if (response.status === 409) {
        setBookingState(prev => ({ ...prev, [advocateId]: 'conflict' }));
        addLog(`[BLOCKED] Race condition prevented.`);
      } else if (response.ok) {
        setBookingState(prev => ({ ...prev, [advocateId]: 'success' }));
        addLog(`[SUCCESS] Database committed.`);
      }
    } catch (error) {
      setBookingState(prev => ({ ...prev, [advocateId]: 'idle' }));
    }
  };

  const runConcurrencyStressTest = async () => {
  if (matches.length === 0 || !selectedPatient) return;
  const testAdvocate = matches[0].advocateId; 
  
  addLog(`[SYSTEM] Initiating 50-Thread Micro-Burst...`);
  setBookingState(prev => ({ ...prev, [testAdvocate]: 'loading' }));

  // Create an array of 50 identical, simultaneous fetch promises
  const burstRequests = Array.from({ length: 50 }).map(() => 
    fetch(`${API_BASE}/matches/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: selectedPatient.patient_id, advocateId: testAdvocate }),
    })
  );

  try {
    // Fire all 50 requests at the exact same time
    const startTime = performance.now();
    const responses = await Promise.all(burstRequests);
    const endTime = performance.now();

    // Tally the results
    let successCount = 0;
    let conflictCount = 0;
    let errorCount = 0;

    responses.forEach(res => {
      if (res.status === 201) successCount++;
      else if (res.status === 409) conflictCount++;
      else errorCount++;
    });

    const duration = (endTime - startTime).toFixed(0);

    // Output the mathematical proof to the UI
    addLog(`[RESULT] 50 requests processed in ${duration}ms.`);
    addLog(`[METRIC] Lock Acquired (201 Created): ${successCount}`);
    addLog(`[METRIC] Mutex Deflections (409 Conflict): ${conflictCount}`);
    
    if (errorCount > 0) {
       addLog(`[ERROR] Gateway Failures (500+): ${errorCount}`);
    }

    if (successCount === 1 && conflictCount === 49) {
      addLog(`[PASS] Absolute data integrity maintained.`);
      setBookingState(prev => ({ ...prev, [testAdvocate]: 'success' }));
    } else {
      addLog(`[FAIL] Race condition detected.`);
      setBookingState(prev => ({ ...prev, [testAdvocate]: 'conflict' }));
    }
  } catch (err) {
    addLog(`[FATAL] Network collapse during burst.`);
  }
};

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg text-white shadow-md">
              <HeartPulse size={20} />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-800">High-Concurrency Patient-Advocate Matching Engine</span>
          </div>
          
          <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button 
              onClick={() => setActiveTab('app')}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md flex items-center gap-2 transition-all ${activeTab === 'app' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutDashboard size={16} /> Live App
            </button>
            <button 
              onClick={() => setActiveTab('docs')}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md flex items-center gap-2 transition-all ${activeTab === 'docs' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <BookOpen size={16} /> Under the Hood
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6 md:p-8">
        
        {/* ========================================= */}
        {/* TAB 1: SYSTEM ARCHITECTURE & DOMAIN DOCS  */}
        {/* ========================================= */}
        {activeTab === 'docs' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Header */}
            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">High-Concurrency Medical Matching</h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
                A systems engineering showcase demonstrating how to safely allocate limited healthcare resources (medical advocates) to patients at scale, preventing database collisions using a distributed Redis mutex.
              </p>
            </div>

            {/* The Stack */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <Database className="text-indigo-500 mb-4" size={32} />
                <h3 className="font-bold text-lg mb-2">1. The Dataset</h3>
                <p className="text-sm text-slate-600">A 1.5-million-row PostgreSQL database hosted on Neon. It stores heavily indexed patient records and advocate profiles, connected via UUIDs.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <Server className="text-purple-500 mb-4" size={32} />
                <h3 className="font-bold text-lg mb-2">2. The API Gateway</h3>
                <p className="text-sm text-slate-600">A NestJS (Node.js) backend running natively on an Arizona State University HPC compute node, handling complex similarity matching algorithms.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <Lock className="text-rose-500 mb-4" size={32} />
                <h3 className="font-bold text-lg mb-2">3. The Mutex</h3>
                <p className="text-sm text-slate-600">A locally compiled Redis server acting as a Distributed Lock Manager. It prevents race conditions during high-volume appointment bookings.</p>
              </div>
            </div>

            {/* Transaction Lifecycle Breakdown */}
            <div className="bg-slate-900 text-slate-50 rounded-2xl p-8 shadow-xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Zap className="text-amber-400"/> Transaction Lifecycle (Under the Hood)</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold">1</div>
                  <div>
                    <h4 className="font-bold text-lg text-indigo-300">The "Book" Button is Pressed</h4>
                    <p className="text-sm text-slate-400 mt-1">The React frontend fires an HTTP POST request containing the <code className="bg-slate-800 px-1.5 py-0.5 rounded">patientId</code> and <code className="bg-slate-800 px-1.5 py-0.5 rounded">advocateId</code> to the NestJS backend.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold">2</div>
                  <div>
                    <h4 className="font-bold text-lg text-indigo-300">Redis Lock Acquisition (NX PX)</h4>
                    <p className="text-sm text-slate-400 mt-1">Before touching PostgreSQL, NestJS attempts to set a unique key in Redis: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-rose-300">lock:advocate:[ID]</code>. If it succeeds, the transaction proceeds. If the key already exists, another thread is actively booking this advocate, and the server immediately aborts, throwing a <code className="text-amber-400">409 Conflict</code>.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold">3</div>
                  <div>
                    <h4 className="font-bold text-lg text-indigo-300">Database Commit & Release</h4>
                    <p className="text-sm text-slate-400 mt-1">With the lock secured, NestJS writes the new appointment to the PostgreSQL database. Once the write is confirmed, the Redis lock is deleted, freeing the advocate for future queries. All of this occurs in milliseconds.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'docs' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* ... Header ... */}
            {/* ... The Stack ... */}
            {/* ... Transaction Lifecycle Breakdown ... */}

            {/* NEW: Infographic Section */}
            <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-200 mt-12 overflow-hidden">
              <div className="bg-slate-50 rounded-xl p-4 sm:p-8 flex justify-center items-center">
                 <img 
                   src={systemInfographic} 
                   alt="System Architecture and Concurrency Flow Diagram" 
                   className="w-full max-w-4xl h-auto rounded-lg shadow-sm border border-slate-200 object-contain"
                 />
              </div>
            </div>

          </div>
        )}

        {/* NEW: Infographic Section */}
            <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-200 mt-12 overflow-hidden">
              <div className="bg-slate-50 rounded-xl p-4 sm:p-8 flex justify-center items-center">
                 <img 
                   src={systemInfographic} 
                   alt="System Architecture and Concurrency Flow Diagram" 
                   className="w-full max-w-4xl h-auto rounded-lg shadow-sm border border-slate-200 object-contain"
                 />
              </div>
            </div>

            {/* NEW: Why This Matters Section */}
            <div className="max-w-3xl mx-auto space-y-6 text-slate-700 leading-relaxed pb-12">
                <h3 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                  Why is this so complicated?
                </h3>
                
                <p>
                  At first glance, matching a patient to an advocate sounds simple: find someone available and connect them. But behind the scenes, healthcare matching is incredibly complex, especially when dealing with scale.
                </p>

                <p>
                  Imagine a popular concert. When tickets go on sale, thousands of people try to buy the exact same seat at the exact same millisecond. If the ticketing system isn’t designed perfectly, two people might successfully "buy" the same seat, leading to a massive problem at the venue. This is called a <strong>race condition</strong>.
                </p>

                <p>
                  In this application, we aren't dealing with concert tickets; we are dealing with medical advocates. When a patient needs help, the system searches a database of 1.5 million records to find the best possible match based on highly specific criteria. 
                </p>

                <p>
                  The challenge arises when <em>multiple</em> patients need help at the exact same time, and the system identifies the <em>same</em> highly qualified advocate for both of them. If the system isn't robust, it might accidentally assign that single advocate to two different patients simultaneously.
                </p>

                <div className="bg-indigo-50 border-l-4 border-indigo-500 p-6 rounded-r-xl my-8">
                  <h4 className="font-bold text-indigo-900 mb-2">The Solution: The Distributed Lock</h4>
                  <p className="text-sm text-indigo-800">
                    To solve this, we use a "Mutex" (Mutual Exclusion) powered by Redis. Think of it like the speaking conch in <em>Lord of the Flies</em>. Only the person holding the conch is allowed to speak. 
                  </p>
                  <p className="text-sm text-indigo-800 mt-2">
                    When our system tries to book an advocate, it first grabs the "digital conch" for that specific advocate. Any other request that tries to book that advocate while the conch is held is instantly blocked (resulting in the <code className="bg-indigo-100 px-1 rounded text-indigo-900">409 Conflict</code> you see in the logs). Once the database safely records the appointment, the system puts the conch down, making the advocate available for the next search.
                  </p>
                </div>

                <p>
                  This ensures that no matter how many requests hit the server simultaneously, data integrity is guaranteed. Every patient gets the dedicated attention they need, without scheduling conflicts or system errors.
                </p>
            </div>

        {/* ========================================= */}
        {/* TAB 2: LIVE APPLICATION                   */}
        {/* ========================================= */}
        {activeTab === 'app' && (
          <div className="max-w-3xl mx-auto">
            {!selectedPatient ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                  <Users size={20} className="text-indigo-600" /> Patient Directory
                </h2>
                <p className="text-sm text-slate-500 mb-6">Select a patient record to execute the similarity matching algorithm against the database.</p>
                
                {loading ? (
                  <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">Connecting to Postgres… the database is currently being thawed from cryosleep.</div>
                ) : (
                  <div className="grid gap-3">
                    {patients.map(patient => (
                      <button 
                        key={patient.patient_id}
                        onClick={() => setSelectedPatient(patient)}
                        className="w-full text-left bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all flex items-center justify-between group"
                      >
                        <div>
                          <div className="font-bold text-lg text-slate-900 group-hover:text-indigo-700 transition-colors">{patient.name || "Unknown Patient"}</div>
                          <div className="text-sm font-medium text-slate-500 mt-0.5">{patient.condition || "General Practice"}</div>
                        </div>
                        <div className="text-xs font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-50 px-2 py-1 rounded">
                          ID: {patient.patient_id.split('-')[0]}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              
              /* Patient Feed & Testing Console */
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                
                <button 
                  onClick={() => { setSelectedPatient(null); setMatches([]); setBookingState({}); }}
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft size={16} /> Back to Directory
                </button>

                {/* Dashboard Header */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                  
                  <div className="relative z-10">
                    <div className="text-xs text-indigo-500 font-bold uppercase tracking-wider mb-1">Active Session Target</div>
                    <div className="text-2xl font-extrabold text-slate-900">{selectedPatient.name}</div>
                    <div className="text-sm font-medium text-slate-500">{selectedPatient.condition}</div>
                  </div>
                  
                  {/* The Console Mini-Widget */}
                  <div className="bg-slate-900 text-slate-300 rounded-2xl p-4 w-full md:w-72 flex flex-col justify-between font-mono text-[10px] shadow-inner relative z-10">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                      <span className="flex items-center gap-1.5 font-bold text-slate-100"><Terminal size={12} className="text-indigo-400"/> System Output</span>
                      <button 
                        onClick={runConcurrencyStressTest} 
                        disabled={bookingState[matches[0]?.advocateId] === 'success'}
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-colors disabled:opacity-50"
                      >
                        <Zap size={10}/> Trigger Stress Test
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-24 overflow-y-auto">
                      {logs.map((log, i) => (
                        <div key={i} className={`leading-tight ${log.includes('SUCCESS') || log.includes('PASS') ? 'text-emerald-400' : log.includes('BLOCKED') ? 'text-amber-400' : 'text-slate-400'}`}>
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Feed List */}
                <div className="space-y-3">
                  {loading ? (
                    <div className="p-12 text-center text-slate-400">Executing database joins...</div>
                  ) : (
                    matches.map((match) => (
                      <div key={match.advocateId} className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition-shadow group">
                        
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">{match.name}</h3>
                          <p className="text-xs font-medium text-slate-500 mt-0.5 bg-slate-100 inline-block px-2 py-1 rounded-md">{match.specialty}</p>
                        </div>

                        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-right">
                            <div className="font-black text-xl text-slate-800 group-hover:text-indigo-600 transition-colors">{(match.matchScore * 100).toFixed(1)}%</div>
                            <div className="text-[9px] text-slate-400 uppercase font-extrabold tracking-widest">Similarity</div>
                          </div>

                          <div className="w-32">
                            {bookingState[match.advocateId] === 'success' ? (
                              <div className="w-full py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs flex justify-center items-center gap-1.5">
                                <CheckCircle size={14} /> Confirmed
                              </div>
                            ) : bookingState[match.advocateId] === 'conflict' ? (
                              <div className="w-full py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-bold text-xs flex justify-center items-center gap-1.5">
                                <ShieldAlert size={14} /> Blocked
                              </div>
                            ) : (
                              <button 
                                onClick={() => handleBook(match.advocateId)}
                                disabled={bookingState[match.advocateId] === 'loading'}
                                className="w-full py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs transition-colors flex justify-center items-center gap-1.5 shadow-sm"
                              >
                                {bookingState[match.advocateId] === 'loading' ? <Clock className="animate-spin" size={14} /> : 'Allocate Lock'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
