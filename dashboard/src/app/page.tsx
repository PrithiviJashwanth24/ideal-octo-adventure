"use client";
import { useState, useEffect, useRef } from "react";
import { Upload, Play, CheckCircle, AlertCircle, Clock, Loader2, Video, Cpu, Zap, BarChart3, Download, RefreshCw } from "lucide-react";
import clsx from "clsx";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Agent { name: string; role: string; }
interface Step  { agent: string; action: string; result: any; error: string | null; ts: number; }
interface Job   {
  job_id: string;
  status: "queued" | "running" | "done" | "failed";
  input_video: string;
  output_video: string | null;
  error: string | null;
  steps: Step[];
  metadata: Record<string, any>;
  created_at: number;
  updated_at: number;
}

const STATUS_COLORS = {
  queued:  "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  running: "text-blue-400  bg-blue-400/10  border-blue-400/30",
  done:    "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  failed:  "text-red-400   bg-red-400/10   border-red-400/30",
};
const STATUS_ICONS = {
  queued:  <Clock className="w-4 h-4" />,
  running: <Loader2 className="w-4 h-4 animate-spin" />,
  done:    <CheckCircle className="w-4 h-4" />,
  failed:  <AlertCircle className="w-4 h-4" />,
};

export default function Dashboard() {
  const [agents,    setAgents]    = useState<Agent[]>([]);
  const [jobs,      setJobs]      = useState<Job[]>([]);
  const [selected,  setSelected]  = useState<Job | null>(null);
  const [creating,  setCreating]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [outputs,   setOutputs]   = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchAll = async () => {
    try {
      const [ar, jr, or_] = await Promise.all([
        fetch(`${API}/agents`).then(r => r.json()),
        fetch(`${API}/jobs`).then(r => r.json()),
        fetch(`${API}/output`).then(r => r.json()),
      ]);
      setAgents(ar.agents ?? []);
      setJobs((jr.jobs ?? []).sort((a: Job, b: Job) => b.created_at - a.created_at));
      setOutputs(or_.outputs ?? []);
    } catch { /* API offline */ }
  };

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (selected) {
      const updated = jobs.find(j => j.job_id === selected.job_id);
      if (updated) setSelected(updated);
    }
  }, [jobs]);

  const startDefaultJob = async () => {
    setCreating(true);
    try {
      const res = await fetch(`${API}/jobs/asset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: "blesstech" }),
      });
      const data = await res.json();
      await fetchAll();
      const job = jobs.find(j => j.job_id === data.job_id);
      if (job) setSelected(job);
    } finally { setCreating(false); }
  };

  const uploadVideo = async (file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("brand", "blesstech");
    try {
      await fetch(`${API}/jobs/upload`, { method: "POST", body: form });
      await fetchAll();
    } finally { setUploading(false); }
  };

  return (
    <div className="min-h-screen bg-[#090909] text-white font-sans">
      {/* Top Bar */}
      <header className="border-b border-white/8 bg-[#111]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4A017] to-[#F0C040] flex items-center justify-center">
              <Video className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold text-lg text-[#D4A017]">Blesstech</span>
            <span className="text-white/40 text-sm ml-1">Video Automation</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAll}
              className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" title="API connected" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Agents",  value: agents.length, icon: <Cpu className="w-5 h-5" />,   color: "text-blue-400" },
            { label: "Total Jobs",     value: jobs.length,   icon: <Zap className="w-5 h-5" />,   color: "text-[#D4A017]" },
            { label: "Completed",      value: jobs.filter(j => j.status === "done").length, icon: <CheckCircle className="w-5 h-5" />, color: "text-emerald-400" },
            { label: "Output Videos",  value: outputs.length, icon: <BarChart3 className="w-5 h-5" />, color: "text-purple-400" },
          ].map(stat => (
            <div key={stat.label} className="bg-[#1A1A1A] rounded-2xl border border-white/7 p-5">
              <div className={`${stat.color} mb-3`}>{stat.icon}</div>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-white/40 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: Agents + Actions */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Agent Roster */}
            <div className="bg-[#1A1A1A] rounded-2xl border border-white/7 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-white">Agent Pipeline</h2>
                <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full">
                  {agents.length} agents
                </span>
              </div>
              {agents.length === 0 ? (
                <div className="text-white/30 text-sm text-center py-8">API offline or loading…</div>
              ) : (
                <ol className="space-y-2">
                  {agents.map((ag, i) => (
                    <li key={ag.name} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="w-6 h-6 rounded-full bg-[#D4A017]/20 border border-[#D4A017]/40 flex items-center justify-center text-[10px] font-bold text-[#D4A017]">
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{ag.name}</div>
                        <div className="text-xs text-white/30 capitalize">{ag.role.replace(/_/g, ' ')}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Actions */}
            <div className="bg-[#1A1A1A] rounded-2xl border border-white/7 p-6 space-y-4">
              <h2 className="font-bold text-white">Create Reel</h2>
              <button
                onClick={startDefaultJob}
                disabled={creating}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4A017] to-[#F0C040] text-black font-bold rounded-xl py-3 px-4 hover:opacity-90 transition disabled:opacity-50"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {creating ? "Starting…" : "Process Default Asset"}
              </button>

              <div
                className="border-2 border-dashed border-white/10 rounded-xl p-5 text-center cursor-pointer hover:border-[#D4A017]/50 transition"
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) uploadVideo(f); }}
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#D4A017] mx-auto mb-2" />
                ) : (
                  <Upload className="w-6 h-6 text-white/30 mx-auto mb-2" />
                )}
                <div className="text-sm text-white/40">
                  {uploading ? "Uploading…" : "Drop video or click to upload"}
                </div>
                <div className="text-xs text-white/20 mt-1">MP4, MOV, AVI</div>
              </div>
              <input ref={fileRef} type="file" accept="video/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadVideo(f); }} />
            </div>

            {/* Output Videos */}
            {outputs.length > 0 && (
              <div className="bg-[#1A1A1A] rounded-2xl border border-white/7 p-6">
                <h2 className="font-bold text-white mb-4">Output Files</h2>
                <div className="space-y-2">
                  {outputs.map(o => (
                    <div key={o.filename} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div>
                        <div className="text-xs font-mono text-white/60 truncate max-w-[180px]">{o.filename}</div>
                        <div className="text-xs text-white/30">{o.size_mb} MB</div>
                      </div>
                      <a href={`${API}${o.url}`} download className="p-2 rounded-lg bg-[#D4A017]/10 hover:bg-[#D4A017]/20 text-[#D4A017] transition">
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Job List + Detail */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Jobs */}
            <div className="bg-[#1A1A1A] rounded-2xl border border-white/7 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-white">Jobs</h2>
                <span className="text-xs text-white/40">{jobs.length} total</span>
              </div>
              {jobs.length === 0 ? (
                <div className="text-white/20 text-sm text-center py-12">
                  No jobs yet. Click "Process Default Asset" to start.
                </div>
              ) : (
                <div className="space-y-2">
                  {jobs.map(job => (
                    <button
                      key={job.job_id}
                      onClick={() => setSelected(job)}
                      className={clsx(
                        "w-full text-left p-4 rounded-xl border transition",
                        selected?.job_id === job.job_id
                          ? "border-[#D4A017]/50 bg-[#D4A017]/5"
                          : "border-white/5 bg-white/[0.02] hover:border-white/10"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={clsx("flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border", STATUS_COLORS[job.status])}>
                            {STATUS_ICONS[job.status]}
                            {job.status}
                          </span>
                          <span className="text-xs font-mono text-white/40">{job.job_id}</span>
                        </div>
                        <span className="text-xs text-white/30">
                          {new Date(job.created_at * 1000).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-white/60 truncate">
                        {job.input_video.split('/').pop()}
                      </div>
                      <div className="mt-2 bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={clsx("h-full rounded-full transition-all duration-500",
                            job.status === "done"   ? "bg-emerald-400 w-full" :
                            job.status === "failed" ? "bg-red-400 w-full" :
                            job.status === "running" ? "bg-[#D4A017]" : "bg-white/20 w-0"
                          )}
                          style={job.status === "running" ? { width: `${Math.min(95, (job.steps.length / 8) * 100)}%` } : {}}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Job Detail */}
            {selected && (
              <div className="bg-[#1A1A1A] rounded-2xl border border-white/7 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-white">
                    Job <span className="font-mono text-[#D4A017]">{selected.job_id}</span>
                  </h2>
                  {selected.status === "done" && selected.output_video && (
                    <a
                      href={`${API}/jobs/${selected.job_id}/download`}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4A017] text-black font-bold text-sm hover:opacity-90 transition"
                    >
                      <Download className="w-4 h-4" />
                      Download Reel
                    </a>
                  )}
                </div>

                {/* Metadata */}
                {Object.keys(selected.metadata).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                    {[
                      { k: "Duration", v: selected.metadata.duration ? `${selected.metadata.duration.toFixed(1)}s` : "—" },
                      { k: "Resolution", v: selected.metadata.width ? `${selected.metadata.width}×${selected.metadata.height}` : "—" },
                      { k: "Codec", v: selected.metadata.video_codec ?? "—" },
                    ].map(({ k, v }) => (
                      <div key={k} className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                        <div className="text-xs text-white/30">{k}</div>
                        <div className="text-sm font-medium text-white mt-1">{v}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Steps Timeline */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Pipeline Steps</div>
                  {selected.steps.map((step, i) => (
                    <div key={i} className={clsx(
                      "flex items-start gap-3 p-3 rounded-xl border",
                      step.error ? "border-red-500/20 bg-red-500/5" : "border-white/5 bg-white/[0.02]"
                    )}>
                      <div className={clsx(
                        "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
                        step.error ? "bg-red-400/20 text-red-400" : "bg-emerald-400/20 text-emerald-400"
                      )}>
                        {step.error ? "✗" : "✓"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{step.agent}</span>
                          <span className="text-xs text-white/30 font-mono">{step.action}</span>
                        </div>
                        {step.error && (
                          <div className="text-xs text-red-400 mt-1 font-mono">{step.error}</div>
                        )}
                      </div>
                      <span className="text-xs text-white/20 flex-shrink-0">
                        {new Date(step.ts * 1000).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                  {selected.status === "running" && (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-blue-400/20 bg-blue-400/5">
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
                      <span className="text-sm text-blue-400">Processing…</span>
                    </div>
                  )}
                </div>

                {selected.error && (
                  <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 font-mono">
                    {selected.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
