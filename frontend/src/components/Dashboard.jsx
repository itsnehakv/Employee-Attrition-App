import React, { useEffect, useState } from "react";
import StatCards from "../components/StatCards";
import { Users, AlertCircle, TrendingUp, Zap } from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    highRisk: 0,
    avgRisk: "0%",
    topDept: "...",
  });

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/dashboard-stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("Stats Fetch Error:", err));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-bold text-blue-400 mb-2">
              Retention Overview
            </h1>
            <p className="text-slate-500 text-sm font-medium tracking-wide italic">
              Monitoring Attrition Probability Vectors
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full uppercase font-black">
              Live Database Connection
            </span>
          </div>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCards
            title="Total Scanned"
            value={stats.total}
            icon={<Users size={24} />}
            colorClass="text-blue-400"
          />
          <StatCards
            title="High Risk Alerts"
            value={stats.highRisk}
            icon={<AlertCircle size={24} />}
            colorClass="text-orange-500"
          />
          <StatCards
            title="Avg Risk Score"
            value={stats.avgRisk}
            icon={<TrendingUp size={24} />}
            colorClass="text-emerald-400"
          />
          <StatCards
            title="Risk Hotspot"
            value={stats.topDept}
            icon={<Zap size={24} />}
            colorClass="text-purple-400"
          />
        </div>

        {/* Placeholder for History Table */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">
            Recent Prediction Log
          </h2>
          <div className="text-slate-500 text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl italic">
            Ready to implement History Table here...
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
