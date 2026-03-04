import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

{
  /* 
  * RADAR CHART COMPONENT FOR ATTRITION DRIVERS 
  * We get the features from api/analytics/summary
  * features is a python dict with "feature" and "importance" keys
  
*/
}

const AttritionDrivers = ({ features = [] }) => {
  const chartData = features.map((f) => ({
    subject: f.feature,
    A: f.importance * 100, // Turn importance into a percentage
    fullMark: 100,
  }));

  return (
    <div className="w-full h-[400px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="#1e293b" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
          />
          {/* Hide the numbers on the radius */}
          <PolarRadiusAxis
            angle={30}
            domain={[0, 15]}
            tick={false}
            axisLine={false}
          />

          <Radar
            name="Risk Factor"
            dataKey="A"
            stroke="#3b82f6"
            strokeWidth={3}
            fill="#3b82f6"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttritionDrivers;
