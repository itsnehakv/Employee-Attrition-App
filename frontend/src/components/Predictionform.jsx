import React, { useState, useRef, useEffect } from "react";
import RiskGauge from "./RiskGauge";
import { useNavigate } from "react-router-dom";

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

/* setGlobalPrediction is passed down from App.jsx to allow the Predictionform to update the global state with 
the latest prediction, which is then accessed by the ReportsDashboard to display data */
const Predictionform = ({
  prediction: globalPrediction,
  setGlobalPrediction,
}) => {
  const [formData, setFormData] = useState({
    Salary: 5000,
    Sex: 0,
    EngagementSurvey: 0.0,
    EmpSatisfaction: 3,
    SpecialProjectsCount: 0,
    DaysLateLast30: 0,
    Absences: 0,
    Age: 0,
    Department: "Production",
    Position: "",
    RecruitmentSource: "",
    PerformanceScore: "Fully Meets",
  });
  const [posQuery, setPosQuery] = useState("");
  const [activeList, setActiveList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(globalPrediction || null);
  const [isUploading, setIsUploading] = useState(false); // For Upload PDF

  const resultsRef = useRef(null);

  const navigate = useNavigate();

  const filteredPositions =
    posQuery === ""
      ? []
      : POSITIONS.filter((p) =>
          p.toLowerCase().includes(posQuery.toLowerCase())
        );

  // Scroll to results when prediction is received/prediction state changes
  useEffect(() => {
    if (globalPrediction) {
      setPrediction(globalPrediction);
    }
    if (prediction && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [globalPrediction, prediction]);

  const handleReset = () => {
    // Reset Form Fields
    setFormData({
      Salary: 5000,
      Sex: 0,
      EngagementSurvey: 0.0,
      EmpSatisfaction: 3,
      SpecialProjectsCount: 0,
      DaysLateLast30: 0,
      Absences: 0,
      Age: 0,
      Department: "Production",
      Position: "",
      RecruitmentSource: "",
      PerformanceScore: "Fully Meets",
    });
    setPosQuery(""); // Clear the autocomplete text
    setPrediction(null); // Hide gauge

    setGlobalPrediction?.(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return; // If already loading, prevent multiple submissions

    setLoading(true);

    // To ensure datatype is as required by backend/model
    const payload = {
      Salary: Number(formData.Salary) || 0,
      Sex: Number(formData.Sex) || 0,
      EngagementSurvey: Number(formData.EngagementSurvey) || 0,
      EmpSatisfaction: Number(formData.EmpSatisfaction) || 0,
      SpecialProjectsCount: Number(formData.SpecialProjectsCount) || 0,
      DaysLateLast30: Number(formData.DaysLateLast30) || 0,
      Absences: Number(formData.Absences) || 0,
      Age: Number(formData.Age) || 0,
      Department: String(formData.Department),
      Position: String(formData.Position),
      RecruitmentSource: String(formData.RecruitmentSource),
      PerformanceScore: String(formData.PerformanceScore),
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/predictor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Prediction failed");

      const data = await response.json();

      const fullReport = {
        ...data, // Includes prediction and risk percent
        input_data: payload, // Attach the inputs so they can be displayed in the reports dashboard
        timestamp: new Date().toISOString(),
      };

      console.log("Saving to Global State:", fullReport);

      // Update local and global state
      setPrediction(fullReport);
      setGlobalPrediction?.(fullReport);

      const dbResponse = await fetch("http://127.0.0.1:8000/api/save-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullReport),
      });

      if (dbResponse.ok) {
        console.log("✅ Report saved to Database");
      }
    } catch (error) {
      console.error("Submission Error:", error);
    } finally {
      setLoading(false); // Button goes back to normal state/clickable
    }
  };

  /*------------------------------------------------------------------------------------------------*/
  // UPLOAD PDF
  const handleFileUpload = async (e) => {
    if (isUploading) return;
    const file = e.target.files[0];
    if (!file) return;

    console.log("🚀 Starting upload for:", file.name);
    setIsUploading(true);

    const uploadData = new FormData();
    uploadData.append("file", file);

    //If uploading takes longer than 15 seconds, abort the request to prevent hanging
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const response = await fetch("http://127.0.0.1:8000/api/upload-pdf", {
        method: "POST",
        body: uploadData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server Error: ${errorText}`);
      }

      const extractedData = await response.json();
      console.log("✅ Data extracted successfully:", extractedData);

      const normalizedData = {
        Position: extractedData.Position || extractedData.position,
        Department: extractedData.Department || extractedData.department,
        Salary: extractedData.Salary || extractedData.salary,
        Age: extractedData.Age || extractedData.age,
        Sex:
          extractedData.Sex !== undefined
            ? extractedData.Sex
            : extractedData.sex,
      };

      // 1. Safety Guard: If extractedData is null/undefined, stop here.
      if (!normalizedData) {
        console.error("❌ Backend returned empty data");
        return;
      }
      console.log("Type of data:", typeof normalizedData);
      console.log("Keys in data:", Object.keys(normalizedData || {}));
      // 2. Safe State Update
      setFormData((prev) => ({
        ...prev,
        // Using ?. (Optional Chaining) ensures it won't crash even if nested
        Salary: normalizedData?.Salary ?? prev.Salary,
        Age: normalizedData?.Age ?? prev.Age,
        Department: normalizedData?.Department ?? prev.Department,
        Position: normalizedData?.Position ?? prev.Position,
        Sex: normalizedData?.Sex ?? prev.Sex,
      }));

      if (normalizedData?.Position) {
        setPosQuery(normalizedData.Position);
      }
    } catch (error) {
      console.error("❌ PDF Upload Error:", error);
      // Check if it's the rate limit (429)
      if (error.message.includes("429")) {
        alert(
          "Gemini API Rate Limit hit! Please wait 60 seconds and try again."
        );
      } else {
        alert(`Upload failed: ${error.message}`);
      }
    } finally {
      setIsUploading(false);
      console.log("🏁 Loading state cleared.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-3xl text-white shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-400">
          Employee Risk Assessment
        </h2>

        {/* Reset Button */}
        <button
          type="button"
          onClick={handleReset}
          className="text-xs uppercase tracking-widest text-slate-500 hover:text-orange-800 transition-colors font-bold"
        >
          [ Reset Form ]
        </button>
      </div>

      {/* Upload PDF */}
      <div className="mb-8 p-6 border-2 border-dashed border-slate-800 rounded-[2rem] bg-slate-900/20 hover:bg-slate-800/40 transition-all group relative">
        <input
          type="file"
          id="pdf-upload"
          className="hidden"
          onChange={handleFileUpload}
          accept=".pdf"
        />
        <label
          htmlFor="pdf-upload"
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            {isUploading ? (
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className="w-6 h-6 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            )}
          </div>
          <span className="text-sm font-bold text-white tracking-wide">
            {isUploading
              ? "Processing AI Extraction..."
              : "Upload PDF to Auto-Fill Form"}
          </span>
          <span className="text-xs text-slate-500 mt-1">
            Supports PDF format • Max 5MB
          </span>
        </label>
      </div>

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
              value={formData.Department}
              onChange={(e) =>
                setFormData({ ...formData, Department: e.target.value })
              }
            >
              <option className="bg-slate-900" value="Production">
                Production
              </option>
              <option className="bg-slate-900" value="IT/IS">
                IT/IS
              </option>
              <option className="bg-slate-900" value="Software Engineering">
                Software Engineering
              </option>
              <option className="bg-slate-900" value="Admin Offices">
                Admin Offices
              </option>
              <option className="bg-slate-900" value="Sales">
                Sales
              </option>
              <option className="bg-slate-900" value="Executive Office">
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
                  value={formData.Position}
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
            value={formData.Salary}
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
            value={formData.Age}
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
                  formData.Sex === val ? "bg-blue-700" : "text-slate-400"
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
              value={formData.RecruitmentSource}
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
            <option
              value="Fully Meets"
              className="
            bg-slate-900"
            >
              Fully Meets
            </option>

            <option
              value="Needs Improvement"
              className="
            bg-slate-900"
            >
              Needs Improvement
            </option>
            <option value="PIP" className="bg-slate-900">
              PIP
            </option>
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
            disabled={loading}
            className={`w-full font-bold py-4 rounded-2xl shadow-lg transition duration-300 ${
              loading
                ? "bg-slate-700 cursor-not-allowed"
                : "bg-blue-700 hover:bg-blue-500 text-white"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing AI Insights...
              </span>
            ) : (
              "Analyze Retention Risk"
            )}
          </button>
        </div>
      </form>
      <div ref={resultsRef} className="mt-12 pt-8 border-t border-slate-800">
        {prediction && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 flex flex-col items-center">
            <h3 className="text-slate-400 uppercase text-xs font-black tracking-widest mb-8">
              AI Analysis Result
            </h3>
            <RiskGauge
              percentage={prediction.attrition_risk_percent}
              riskLevel={prediction.prediction}
            />

            {/* Actionable Button to go to the full Reports page */}
            <button
              className="mt-8 text-blue-400 hover:text-blue-300 text-sm font-s emibold underline underline-offset-4"
              onClick={() => {
                setGlobalPrediction(prediction);
                navigate("/reports", {
                  state: { prediction: prediction },
                });
              }}
            >
              View Full Detailed Report →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Predictionform;
