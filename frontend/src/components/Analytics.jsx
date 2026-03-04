import React, { useEffect, useState } from "react";
import { BarChart3, PieChart, Activity, ShieldAlert } from "lucide-react";
import StatCards from "../components/StatCards";
import DeptRiskChart from "../components/DeptRiskChart";
import RiskDistChart from "../components/RiskDistChart";
import AttritionDrivers from "./AttritionDrivers";

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/analytics/summary")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="p-20 text-center text-slate-500">
        Loading Intelligence...
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            Predictive <span className="text-blue-500">Analytics</span>
          </h1>
          <p className="text-slate-500">
            Macro-level attrition vectors and departmental hotspots.
          </p>
        </div>

        {/* Stat Crads */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCards
            title="High Risk Headcount"
            value={data.distribution.High || 0}
            icon={<ShieldAlert size={20} />}
            colorClass="text-red-500"
          />
          <StatCards
            title="Avg Company Risk"
            value={`${(
              data.departments.reduce((acc, curr) => acc + curr.risk, 0) /
              data.departments.length
            ).toFixed(1)}%`}
            icon={<Activity size={20} />}
            colorClass="text-blue-400"
          />
          <StatCards
            title="Active Depts"
            value={data.departments.length}
            icon={<BarChart3 size={20} />}
            colorClass="text-purple-400"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Department Heatmap */}
          <DeptRiskChart data={data.departments} />

          {/* Risk Distribution Doughnut Chart */}
          <RiskDistChart dist={data.distribution} />
        </div>

        {/* Attrition Drivers Section */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-md">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
            <PieChart className="text-blue-500" size={20} />
            Attrition Drivers
          </h3>

          <div className="space-y-4">
            <AttritionDrivers features={data.features} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
