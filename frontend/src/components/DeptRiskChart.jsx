import React from "react";

const DeptRiskChart = ({ data }) => {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-md">
      <h3 className="text-lg font-bold text-white mb-6">
        Departmental Risk Heatmap
      </h3>
      <div className="space-y-5">
        {data.map((dept, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between text-xs font-medium uppercase tracking-wider">
              <span className="text-slate-400">{dept.name || "UNKNOWN"}</span>
              <span className="text-white">{dept.risk}% Risk</span>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-out rounded-full ${
                  dept.risk > 60
                    ? "bg-red-500"
                    : dept.risk > 30
                    ? "bg-yellow-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${dept.risk}%` }}
              />
            </div>

            <div className="text-[10px] text-slate-600 text-right">
              Based on {dept.count} assessments
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeptRiskChart;
