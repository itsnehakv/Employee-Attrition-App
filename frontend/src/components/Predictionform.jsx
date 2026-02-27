import React, { useState } from "react";

const POSITIONS = [
  "Production Technician I",
  "Sr. DBA",
  "Production Technician II",
  "Software Engineer",
  "IT Support",
  "Data Analyst",
  "Database Administrator",
  "Enterprise Architect",
  "Sr. Accountant",
  "Production Manager",
  "Accountant I",
  "Area Sales Manager",
  "Software Engineering",
  "BI Director",
  "Director of Operations",
  "Sr. Network Engineer",
  "Sales Manager",
  "BI Developer",
  "IT Manager - Support",
  "Network Engineer",
  "IT Director",
  "Director of Sales",
  "Administrative Assistant",
  "President & CEO",
  "Senior BI Developer",
  "Shared Services Manager",
  "IT Manager - Infra",
  "Principal Data Architect",
  "Data Architect",
  "IT Manager - DB",
  "CIO",
];

const SOURCES = [
  "LinkedIn",
  "Indeed",
  "Google Search",
  "Employee Referral",
  "Diversity Job Fair",
  "On-line Web application",
  "CareerBuilder",
  "Website",
  "Other",
];

const PredictorForm = () => {
  const [formData, setFormData] = useState({
    Salary: 5000,
    Sex: 0,
    EngagementSurvey: 0.0,
    EmpSatisfaction: 3,
    SpecialProjectsCount: 0,
    DaysLateLast30: 0,
    Absences: 0,
    Age: 0,
    Department: "production",
    Position: "",
    RecruitmentSource: "",
    PerformanceScore: "Fully Meets",
  });
  const [posQuery, setPosQuery] = useState("");
  const [sourceQuery, setSourceQuery] = useState("");
  const [activeList, setActiveList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const filteredPositions =
    posQuery === ""
      ? []
      : POSITIONS.filter((p) =>
          p.toLowerCase().includes(posQuery.toLowerCase())
        );

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ensure numbers are sent as numbers, not strings
    const payload = {
      ...formData,
      Salary: parseInt(formData.Salary),
      Age: parseInt(formData.Age),
      SpecialProjectsCount: parseInt(formData.SpecialProjectsCount),
      DaysLateLast30: parseInt(formData.DaysLateLast30),
      Absences: parseInt(formData.Absences),
      EngagementSurvey: parseFloat(formData.EngagementSurvey),
    };
    console.log("Payload for main.py:", payload);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-3xl text-white shadow-2xl">
      <h2 className="text-2xl font-bold mb-6 text-blue-400">
        Employee Risk Assessment
      </h2>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Department Select */}
        <div className="flex flex-col gap-2 relative group">
          <label className="text-sm font-medium text-slate-400">
            Department
          </label>
          <div className="relative">
            <select
              className="w-full bg-black/40 border border-slate-600 p-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition appearance-none cursor-pointer text-white"
              onChange={(e) =>
                setFormData({ ...formData, Department: e.target.value })
              }
            >
              <option className="bg-slate-900" value="Production       ">
                Production
              </option>
              <option className="bg-slate-900" value="it/is">
                IT/IS
              </option>
              <option className="bg-slate-900" value="software engineering">
                Software Engineering
              </option>
              <option className="bg-slate-900" value="admin offices">
                Admin Offices
              </option>
              <option className="bg-slate-900" value="sales">
                Sales
              </option>
              <option className="bg-slate-900" value="executive office">
                Executive Office
              </option>
            </select>

            {/* Chevron Arrow */}
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Position w/ Autocomplete */}
        <div className="flex flex-col gap-2 relative">
          <label className="text-sm font-medium text-slate-400">Position</label>
          <input
            type="text"
            value={posQuery}
            onFocus={() => setActiveList("pos")}
            className="bg-black/40 border border-slate-600 p-3 rounded-xl outline-none"
            placeholder="Search position..."
            onChange={(e) => {
              setPosQuery(e.target.value);
              setFormData({ ...formData, Position: e.target.value });
            }}
          />
          {activeList === "pos" && filteredPositions.length > 0 && (
            <ul className="absolute z-20 w-full top-20 bg-slate-800 border border-slate-700 rounded-xl max-h-40 overflow-y-auto">
              {filteredPositions.map((p, i) => (
                <li
                  key={i}
                  className="p-3 hover:bg-blue-600 cursor-pointer text-sm"
                  onClick={() => {
                    setPosQuery(p);
                    setFormData({ ...formData, Position: p });
                    setActiveList(null);
                  }}
                >
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Monthly Income */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-400">
            Monthly Income ($)
          </label>
          <input
            type="number"
            className="bg-black/40 border border-slate-600 p-3 rounded-xl focus:outline-none focus:border-blue-500 transition"
            placeholder="e.g. 5000"
            onChange={(e) =>
              setFormData({ ...formData, Salary: e.target.value })
            }
          />
        </div>

        {/* Age Input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-400">
            Employee Age
          </label>
          <input
            type="number"
            className="bg-black/40 border border-slate-600 p-3 rounded-xl focus:outline-none focus:border-blue-500 transition"
            placeholder="e.g. 34"
            onChange={(e) => setFormData({ ...formData, Age: e.target.value })}
          />
        </div>

        {/* Sex */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-400">Sex</label>
          <div className="flex bg-black/40 p-1 rounded-xl border border-slate-600">
            {[0, 1].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setFormData({ ...formData, Sex: val })}
                className={`flex-1 py-2 rounded-lg transition ${
                  formData.Sex === val ? "bg-blue-600" : "text-slate-400"
                }`}
              >
                {val === 0 ? "Male" : "Female"}
              </button>
            ))}
          </div>
        </div>

        {/* Recruitment Source */}
        <div className="flex flex-col gap-2 relative group">
          <label className="text-sm font-medium text-slate-400">
            Recruitment Source
          </label>
          <div className="relative">
            <select
              className="w-full bg-black/40 border border-slate-600 p-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition appearance-none cursor-pointer text-white"
              onChange={(e) =>
                setFormData({ ...formData, RecruitmentSource: e.target.value })
              }
            >
              <option className="bg-slate-900" value="">
                Select Source
              </option>
              <option className="bg-slate-900" value="LinkedIn">
                LinkedIn
              </option>
              <option className="bg-slate-900" value="Indeed">
                Indeed
              </option>
              <option className="bg-slate-900" value="Google Search">
                Google Search
              </option>
              <option className="bg-slate-900" value="Employee Referral">
                Employee Referral
              </option>
              <option className="bg-slate-900" value="Diversity Job Fair">
                Diversity Job Fair
              </option>
              <option className="bg-slate-900" value="On-line Web application">
                On-line Web application
              </option>
              <option className="bg-slate-900" value="CareerBuilder">
                CareerBuilder
              </option>
              <option className="bg-slate-900" value="Website">
                Website
              </option>
              <option className="bg-slate-900" value="Other">
                Other
              </option>
            </select>

            {/* Chevron Arrow */}
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Performance Score */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-400">
            Performance Score
          </label>
          <select
            className="bg-black/40 border border-slate-600 p-3 rounded-xl focus:border-blue-500 outline-none appearance-none"
            onChange={(e) =>
              setFormData({ ...formData, PerformanceScore: e.target.value })
            }
          >
            <option value="Fully Meets">Fully Meets</option>
            <option value="Exceeds">Exceeds</option>
            <option value="Needs Improvement">Needs Improvement</option>
            <option value="PIP">PIP</option>
          </select>
        </div>

        {/* Absences */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-400">Absences</label>
          <input
            type="number"
            className="bg-black/40 border border-slate-600 p-3 rounded-xl focus:border-blue-500 outline-none"
            value={formData.Absences}
            onChange={(e) =>
              setFormData({ ...formData, Absences: e.target.value })
            }
          />
        </div>

        {/* Days Late */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-400">
            Days Late (Last 30)
          </label>
          <input
            type="number"
            className="bg-black/40 border border-slate-600 p-3 rounded-xl focus:border-blue-500 outline-none"
            value={formData.DaysLateLast30}
            onChange={(e) =>
              setFormData({ ...formData, DaysLateLast30: e.target.value })
            }
          />
        </div>

        {/* Special Projects */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-400">
            Special Projects Count
          </label>
          <input
            type="number"
            className="bg-black/40 border border-slate-600 p-3 rounded-xl focus:border-blue-500 outline-none"
            value={formData.SpecialProjectsCount}
            onChange={(e) =>
              setFormData({ ...formData, SpecialProjectsCount: e.target.value })
            }
          />
        </div>

        {/* Engagement Survey */}
        <div className="flex flex-col gap-4 p-4 bg-black/20 rounded-2xl border border-slate-800">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-400">
              Engagement Survey Score
            </label>
            {/* Dynamic Decimal Badge */}
            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30">
              {parseFloat(formData.EngagementSurvey).toFixed(1)} / 5.0
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="5"
            step="0.1" // Decimal increments
            value={formData.EngagementSurvey}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
            onChange={(e) =>
              setFormData({ ...formData, EngagementSurvey: e.target.value })
            }
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-medium uppercase tracking-wider">
            <span>Low Engagement</span>
            <span>Highly Engaged</span>
          </div>
        </div>

        {/* Employee Satisfaction */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-slate-400">
            Employee Satisfaction{" "}
          </label>
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((level) => (
              <button
                key={level}
                type="button" // prevents form submission on click
                onClick={() =>
                  setFormData({ ...formData, EmpSatisfaction: level })
                }
                className={`w-10 h-10 rounded-full border-2 transition-all duration-300 flex items-center justify-center font-bold
          ${
            formData.EmpSatisfaction >= level
              ? "bg-blue-500 border-blue-400 text-white shadow-[0px_0px_15px_rgba(59,130,246,0.6)]"
              : "bg-transparent border-slate-600 text-slate-500 hover:border-slate-400"
          }`}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 italic">
            {formData.EmpSatisfaction === 1 && "Poor"}
            {formData.EmpSatisfaction === 2 && "Fair"}
            {formData.EmpSatisfaction === 3 && "Good"}
            {formData.EmpSatisfaction === 4 && "Excellent"}
          </p>
        </div>

        <div className="md:col-span-2 mt-4">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-[0px_0px_20px_rgba(37,99,235,0.4)] transition duration-300"
          >
            Analyze Retention Risk
          </button>
        </div>
      </form>
    </div>
  );
};

export default PredictorForm;
