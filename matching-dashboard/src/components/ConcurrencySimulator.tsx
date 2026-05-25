import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Lock, Server, Users, Zap, ShieldAlert, RefreshCcw, AlertOctagon, CheckCircle } from 'lucide-react';

export default function ConcurrencySimulator() {
  const [reqCount, setReqCount] = useState(5);
  const [lockTimeout, setLockTimeout] = useState(200);
  const [dbWriteTime, setDbWriteTime] = useState(150);

  const [isRunning, setIsRunning] = useState(false);
  const [systemState, setSystemState] = useState<'idle' | 'processing'>('idle');
  const [redisLocked, setRedisLocked] = useState(false);
  const [dbWriting, setDbWriting] = useState(false);

  const [metrics, setMetrics] = useState({ total: 0, success: 0, conflict: 0, dirty: 0 });
  const [activeRequests, setActiveRequests] = useState<{ id: number; status: string }[]>([]);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const triggerBurst = () => {
    if (isRunning) return;
    setIsRunning(true);
    setSystemState('processing');
    setMetrics({ total: reqCount, success: 0, conflict: 0, dirty: 0 });
    
    // Spawn initial requests
    const initialReqs = Array.from({ length: reqCount }).map((_, i) => ({ id: i, status: 'spawned' }));
    setActiveRequests(initialReqs);

    let isCurrentlyLocked = false;
    let lockExpiryTime = 0;

    // Simulate concurrent arrival
    initialReqs.forEach((req, index) => {
      const delay = index * 20; // 20ms stagger to mimic slight network jitter

      timers.current.push(setTimeout(() => {
        const now = Date.now();
        const lockHasExpired = now > lockExpiryTime && lockExpiryTime !== 0;
        
        if (lockHasExpired) {
           isCurrentlyLocked = false; // Lock naturally expired
           setRedisLocked(false);
        }

        if (!isCurrentlyLocked) {
          // 1. Acquire Lock
          isCurrentlyLocked = true;
          lockExpiryTime = now + lockTimeout;
          setRedisLocked(true);
          
          setActiveRequests(prev => prev.map(p => p.id === req.id ? { ...p, status: 'locking' } : p));

          // 2. Write to DB
          timers.current.push(setTimeout(() => {
            setDbWriting(true);
            setActiveRequests(prev => prev.map(p => p.id === req.id ? { ...p, status: 'writing' } : p));
            
            // 3. Complete DB Write
            timers.current.push(setTimeout(() => {
              setDbWriting(false);
              const writeFinishTime = Date.now();
              
              if (writeFinishTime > lockExpiryTime) {
                // Dirty Write (Lock expired before DB finished)
                setMetrics(m => ({ ...m, dirty: m.dirty + 1 }));
                setActiveRequests(prev => prev.map(p => p.id === req.id ? { ...p, status: 'dirty' } : p));
              } else {
                // Clean Success
                setMetrics(m => ({ ...m, success: m.success + 1 }));
                setActiveRequests(prev => prev.map(p => p.id === req.id ? { ...p, status: 'success' } : p));
                // Release Lock early on clean write
                isCurrentlyLocked = false;
                setRedisLocked(false);
              }

              // Check if simulation is done
              if (index === initialReqs.length - 1) setIsRunning(false);
            }, dbWriteTime));

          }, 100)); // Network travel time to DB

        } else {
          // Lock is held by someone else -> Deflect!
          setActiveRequests(prev => prev.map(p => p.id === req.id ? { ...p, status: 'conflict' } : p));
          setMetrics(m => ({ ...m, conflict: m.conflict + 1 }));
          if (index === initialReqs.length - 1) setIsRunning(false);
        }
      }, delay));
    });
  };

  const resetState = () => {
    clearTimers();
    setIsRunning(false);
    setSystemState('idle');
    setRedisLocked(false);
    setDbWriting(false);
    setMetrics({ total: 0, success: 0, conflict: 0, dirty: 0 });
    setActiveRequests([]);
  };

  return (
    <div className="bg-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl mt-12 border border-slate-800 text-slate-100">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 mb-8">
        <h2 className="text-2xl font-black text-white flex items-center gap-3">
          <Zap className="text-amber-400" /> Interactive Mutex Simulation
        </h2>
        <p className="text-slate-400 mt-2 text-sm max-w-2xl">
          Adjust the latencies to see how the system handles concurrent loads. If the Database Write Time exceeds the Redis Lock Timeout, the lock drops prematurely, simulating a catastrophic dirty write race condition.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-1 space-y-6 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
          <div>
            <label className="text-xs font-bold tracking-widest text-slate-400 uppercase flex justify-between">
              <span>Concurrent Threads</span> <span className="text-white">{reqCount}</span>
            </label>
            <input type="range" min="1" max="10" value={reqCount} onChange={(e) => setReqCount(Number(e.target.value))} disabled={isRunning} className="w-full mt-2 accent-indigo-500" />
          </div>
          <div>
            <label className="text-xs font-bold tracking-widest text-slate-400 uppercase flex justify-between">
              <span>Lock Timeout (ms)</span> <span className="text-white">{lockTimeout}ms</span>
            </label>
            <input type="range" min="50" max="500" step="10" value={lockTimeout} onChange={(e) => setLockTimeout(Number(e.target.value))} disabled={isRunning} className="w-full mt-2 accent-rose-500" />
          </div>
          <div>
            <label className="text-xs font-bold tracking-widest text-slate-400 uppercase flex justify-between">
              <span>DB Write Time (ms)</span> <span className="text-white">{dbWriteTime}ms</span>
            </label>
            <input type="range" min="50" max="500" step="10" value={dbWriteTime} onChange={(e) => setDbWriteTime(Number(e.target.value))} disabled={isRunning} className="w-full mt-2 accent-emerald-500" />
          </div>

          <div className="pt-4 space-y-3">
            <button onClick={triggerBurst} disabled={isRunning} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
              {isRunning ? <RefreshCcw className="animate-spin" size={18} /> : <Zap size={18} />}
              Fire Micro-Burst
            </button>
            <button onClick={resetState} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-700">
              Reset State
            </button>
          </div>
        </div>

        {/* Right Column: Visualization & Metrics */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Architecture Diagram */}
          <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-6 relative overflow-hidden flex flex-col justify-between items-center min-h-[300px]">
            
            {/* Tier 1: Clients */}
            <div className="w-full flex justify-center gap-2 mb-8 z-10">
              <div className="bg-slate-800 px-6 py-3 rounded-xl flex items-center gap-3 border border-slate-700">
                <Users className="text-indigo-400" /> <span className="font-bold">React Clients</span>
              </div>
            </div>

            {/* Moving Particles (Abstract representation) */}
            <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
              <AnimatePresence>
                {activeRequests.map((req) => (
                  <motion.div
                    key={req.id}
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ 
                      y: req.status === 'spawned' ? -40 : req.status === 'writing' ? 60 : req.status === 'conflict' ? -40 : 100,
                      x: req.status === 'conflict' ? (Math.random() * 100 - 50) : 0,
                      opacity: req.status === 'success' || req.status === 'dirty' ? 0 : 1,
                      scale: req.status === 'locking' ? 1.2 : 1
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 100 }}
                    className={`w-3 h-3 rounded-full absolute ${req.status === 'conflict' ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : req.status === 'dirty' ? 'bg-red-500' : 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]'}`}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Tier 2: Gateway */}
            <div className={`w-64 bg-slate-800 py-4 rounded-xl flex justify-center items-center gap-3 border transition-colors z-10 ${systemState === 'processing' ? 'border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)]' : 'border-slate-700'}`}>
              <Server className={systemState === 'processing' ? 'text-indigo-400' : 'text-slate-500'} /> 
              <span className="font-bold">NestJS Gateway</span>
            </div>

            {/* Tier 3: Mutex & DB */}
            <div className="w-full flex justify-around mt-8 z-10 gap-4">
              {/* Redis Mutex */}
              <div className={`flex-1 flex flex-col items-center p-4 rounded-xl border transition-all ${redisLocked ? 'bg-rose-950/50 border-rose-500 shadow-[0_0_30px_rgba(243,24,113,0.3)]' : 'bg-slate-800/50 border-slate-700'}`}>
                <Lock className={redisLocked ? 'text-rose-400' : 'text-slate-600'} size={32} />
                <span className="font-bold mt-2">Upstash Redis</span>
                <span className={`text-[10px] uppercase tracking-widest mt-1 ${redisLocked ? 'text-rose-400 font-bold' : 'text-slate-600'}`}>{redisLocked ? 'LOCKED (NX)' : 'IDLE'}</span>
              </div>
              
              {/* Postgres DB */}
              <div className={`flex-1 flex flex-col items-center p-4 rounded-xl border transition-all ${dbWriting ? 'bg-emerald-950/50 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'bg-slate-800/50 border-slate-700'}`}>
                <Database className={dbWriting ? 'text-emerald-400' : 'text-slate-600'} size={32} />
                <span className="font-bold mt-2">Neon PostgreSQL</span>
                <span className={`text-[10px] uppercase tracking-widest mt-1 ${dbWriting ? 'text-emerald-400 font-bold' : 'text-slate-600'}`}>{dbWriting ? 'COMMITTING...' : 'IDLE'}</span>
              </div>
            </div>
          </div>

          {/* Metrics Dashboard */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="text-slate-400 text-xs font-bold uppercase mb-1">Total Payload</div>
              <div className="text-2xl font-black">{metrics.total}</div>
            </div>
            <div className="bg-emerald-950/30 p-4 rounded-xl border border-emerald-900/50">
              <div className="text-emerald-500 text-xs font-bold uppercase mb-1 flex items-center gap-1"><CheckCircle size={12}/> Success (201)</div>
              <div className="text-2xl font-black text-emerald-400">{metrics.success}</div>
            </div>
            <div className="bg-amber-950/30 p-4 rounded-xl border border-amber-900/50">
              <div className="text-amber-500 text-xs font-bold uppercase mb-1 flex items-center gap-1"><ShieldAlert size={12}/> Deflections (409)</div>
              <div className="text-2xl font-black text-amber-400">{metrics.conflict}</div>
            </div>
            <div className="bg-red-950/30 p-4 rounded-xl border border-red-900/50">
              <div className="text-red-500 text-xs font-bold uppercase mb-1 flex items-center gap-1"><AlertOctagon size={12}/> Dirty Writes</div>
              <div className="text-2xl font-black text-red-400">{metrics.dirty}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}