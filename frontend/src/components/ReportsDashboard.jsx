import React from "react";
import RiskGauge from "./RiskGauge";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BadgeDollarSign,
  SquareUserRound,
  CalendarX2,
  Smile,
  Download,
} from "lucide-react";

const ReportsDashboard = ({ globalPrediction }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const displayData = location.state?.prediction || globalPrediction;

  // Handling if no data exists yet
  if (!displayData || !displayData.input_data) {
    return (
      <div className="min-h-screen bg-black text-white p-6 md:p-10 flex flex-col">
        <div className="w-full max-w-4xl mx-auto mb-4">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 text-slate-500 hover:text-white transition-colors"
          >
            <span className="group-hover:-translate-x-1 transition-transform">
              ←
            </span>
            Back to Predictor
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-lg text-center p-12 border border-slate-800 rounded-[3rem] bg-slate-900/30 backdrop-blur-xl shadow-2xl">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 mx-auto">
              <svg
                className="w-10 h-10 text-blue-500/50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>

            <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">
              No Active Report
            </h3>

            <p className="text-slate-500 leading-relaxed">
              Please run an assessment in the
              <strong className="text-slate-300">Predictor</strong> tab to
              generate this analysis.
            </p>

            <button
              onClick={() => navigate("/predictor")}
              className="mt-8 px-8 py-3 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white border border-blue-600/30 rounded-2xl transition-all duration-300 font-bold"
            >
              Go to Predictor
            </button>
          </div>
        </div>
      </div>
    );
  }
  const metrics = displayData.input_data || {};

  const stats = [
    {
      label: "Monthly Income",
      value: `$${metrics.Salary?.toLocaleString()}`,
      icon: <BadgeDollarSign className="text-green-400" />,
    },
    {
      label: "Employee Age",
      value: `${metrics.Age} Years`,
      icon: <SquareUserRound className="text-blue-400" />,
    },
    {
      label: "Prior Absences",
      value: metrics.Absences,
      icon: <CalendarX2 className="text-yellow-400" />,
    },
    {
      label: "Satisfaction",
      value: `${metrics.EmpSatisfaction}/4`,
      icon: <Smile className="text-orange-400" />,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Back to predictor button */}
      <button
        onClick={() => navigate(-1)}
        className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <span className="group-hover:-translate-x-1 transition-transform">
          ←
        </span>
        Back to Predictor
      </button>

      {/* Header Section */}
      <div className="flex justify-between items-end border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight">
            Intelligence Report
          </h2>
          <p className="text-slate-400 mt-2 text-lg">
            Detailed workforce flight-risk assessment.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">
            Analysis Complete
          </p>
          <p className="text-white font-bold">XGBOOST-V2.4.RC</p>
        </div>
      </div>
      <button
        onClick={() =>
          (window.location.href =
            "http://localhost:8000/api/reports/download-csv")
        }
        className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-6 py-2.5 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest"
      >
        <Download size={16} />
        Export CSV
      </button>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl"
          >
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">
              {stat.label}
            </p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xl font-bold text-white">{stat.value}</span>
              <span className="opacity-50">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Right Section */}
      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Driver Analysis */}
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
          <h4 className="text-slate-500 text-xs font-bold uppercase mb-4 tracking-widest">
            Primary Risk Drivers
          </h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Engagement Score</span>
                <span className="text-white font-mono">
                  {metrics.EngagementSurvey || 0}/5.0
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full"
                  style={{
                    width: `${(metrics.EngagementSurvey / 5) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Satisfaction Level</span>
                <span className="text-white font-mono">
                  {metrics.EmpSatisfaction || 0}/4
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full"
                  style={{
                    width: `${(metrics.EmpSatisfaction / 4) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Model Confidence Score */}
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl flex flex-col justify-center">
          <h4 className="text-slate-500 text-xs font-bold uppercase mb-2 tracking-widest">
            Model Confidence
          </h4>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-bold text-white">94.8</span>
            <span className="text-blue-500 mb-2 font-bold">%</span>
          </div>
          <p className="text-[10px] text-slate-600 mt-4 uppercase font-bold tracking-wider">
            Historical Accuracy Index
          </p>
        </div>

        {/* Recommendation Text */}
        <div className="md:col-span-2 bg-blue-600/10 border border-blue-500/20 p-8 rounded-3xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <h4 className="text-blue-400 text-xs font-bold uppercase tracking-widest">
              AI Strategy Recommendation
            </h4>
          </div>
          <p className="text-slate-200 leading-relaxed italic text-lg">
            "Based on the identified patterns, this employee is classified as{" "}
            <span className="text-white font-bold">
              {displayData.prediction}
            </span>
            .
            {displayData.prediction === "High Risk"
              ? " High attention is required for engagement initiatives. Consider a stay interview within 48 hours to address potential tenure concerns."
              : " No immediate intervention required. Maintain current management path and monitor next performance review cycle."}
            "
          </p>
        </div>
        <div className="pt-10 border-t border-slate-800/50 text-center"></div>
      </div>
    </div>
  );
};

export default ReportsDashboard;
