import React from "react";

const StatCards = ({ title, value, icon, colorClass }) => {
  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 p-6 rounded-3xl shadow-2xl flex items-center space-x-4 transition-all hover:border-slate-500 group">
      <div
        className={`p-4 rounded-2xl bg-black/40 border border-slate-800 transition-transform group-hover:scale-110 ${colorClass}`}
      >
        {icon}
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-slate-500 font-black mb-1">
          {title}
        </p>
        <h3 className="text-2xl font-bold text-white tracking-tight">
          {value}
        </h3>
      </div>
    </div>
  );
};

export default StatCards;
