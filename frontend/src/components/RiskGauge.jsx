import React from "react";

const RiskGauge = ({ percentage = 0 }) => {
  const radius = 80;
  const circumference = Math.PI * radius; // Half circle
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine color based on risk - Emerald, Amber, Red
  const getRiskColor = (p) => {
    if (p < 30) return "#10b981";
    if (p < 70) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 200 120">
        {/* Background Track */}
        <path
          d="M20,110 A80,80 0 0,1 180,110"
          fill="none"
          stroke="#334155"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Progress Track */}
        <path
          d="M20,110 A80,80 0 0,1 180,110"
          fill="none"
          stroke={getRiskColor(percentage)}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Percentage Text */}
      <div className="text-center -mt-8">
        <span className="text-4xl font-bold text-white">{percentage}%</span>
        <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mt-1">
          Attrition Risk
        </p>
      </div>
    </div>
  );
};

export default RiskGauge;
