import React from "react";

const RiskDistChart = ({ dist = {} }) => {
  const high = dist.High || 0;
  const med = dist.Medium || 0;
  const low = dist.Low || 0;
  const total = high + med + low;

  // Calculate percentages
  const getPct = (val) => (total > 0 ? (val / total) * 100 : 0);

  const lowPct = getPct(low);
  const medPct = getPct(med);
  const highPct = getPct(high);

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-md h-full">
      <h3 className="text-lg font-bold text-white mb-6">Risk Distribution</h3>

      <div className="flex flex-col items-center">
        {/* Doughnut */}
        <div className="relative w-48 h-48">
          <svg
            viewBox="0 0 36 36"
            className="w-full h-full transform -rotate-90"
          >
            {/* Background Track */}
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="transparent"
              stroke="#1e293b"
              strokeWidth="3"
            />

            {/* Low Risk (Green) */}
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="transparent"
              stroke="#088908 "
              strokeWidth="3"
              strokeDasharray={`${lowPct} ${100 - lowPct}`}
              strokeDashoffset="0"
            />

            {/* Med Risk (Yellow) */}
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="transparent"
              stroke="#eab308"
              strokeWidth="3"
              strokeDasharray={`${medPct} ${100 - medPct}`}
              strokeDashoffset={-lowPct}
            />

            {/* High Risk (Red) */}
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="transparent"
              stroke="#C71111"
              strokeWidth="3"
              strokeDasharray={`${highPct} ${100 - highPct}`}
              strokeDashoffset={-(lowPct + medPct)}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white">{total}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">
              Total
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-4 mt-8 w-full">
          <LegendItem
            label="High"
            count={high}
            color="bg-red-500"
            pct={highPct.toFixed(0)}
          />
          <LegendItem
            label="Med"
            count={med}
            color="bg-yellow-500"
            pct={medPct.toFixed(0)}
          />
          <LegendItem
            label="Low"
            count={low}
            color="bg-emerald-500"
            pct={lowPct.toFixed(0)}
          />
        </div>
      </div>
    </div>
  );
};

const LegendItem = ({ label, count, color, pct }) => (
  <div className="text-center">
    <div className="flex items-center justify-center gap-2 mb-1">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs text-slate-400">{label}</span>
    </div>
    <div className="text-lg font-bold text-white">{count}</div>
    <div className="text-[10px] text-slate-500">{pct}%</div>
  </div>
);

export default RiskDistChart;
