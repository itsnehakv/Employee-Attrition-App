import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Predictionform from "./components/Predictionform";
import { useState } from "react";
import ReportsDashboard from "./components/ReportsDashboard";
import Dashboard from "./components/Dashboard";
import Analytics from "./components/Analytics";

function App() {
  const [globalPrediction, setGlobalPrediction] = useState(null);
  const [prediction, setPrediction] = useState(() => {
    const saved = localStorage.getItem("last_prediction");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (prediction) {
      localStorage.setItem("last_prediction", JSON.stringify(prediction));
    }
  }, [prediction]);

  return (
    <div className="min-h-screen bg-black overflow-x-hidden no-scrollbar">
      <div className="max-w-7xl mx-auto pt-4">
        <Navbar />
      </div>

      <main className="max-w-7xl mx-auto mt-12 px-6">
        <Routes>
          {/* HOME VIEW */}
          <Route
            path="/"
            element={
              <div className="flex flex-col items-center justify-center mt-32 text-center px-4">
                <h1 className="text-6xl font-bold text-white tracking-tight mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  Predict Employee Attrition <br />
                  <span className="text-blue-500">With AI Precision.</span>
                </h1>
                <p className="text-slate-400 max-w-2xl text-lg animate-in fade-in slide-in-from-bottom-6 duration-1000">
                  Upload your workforce data and let our Machine Learning models
                  identify flight risks before they happen.
                </p>
              </div>
            }
          />
          {/* DASHBOARD */}
          <Route path="/dashboard" element={<Dashboard />} />
          {/* PREDICTOR VIEW */}
          <Route
            path="/predictor"
            element={
              <Predictionform
                prediction={prediction}
                setGlobalPrediction={setPrediction}
              />
            }
          />
          {/* REPORTS */}
          <Route
            path="/reports"
            element={<ReportsDashboard prediction={globalPrediction} />}
          />

          {/* ANALYTICS */}
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
