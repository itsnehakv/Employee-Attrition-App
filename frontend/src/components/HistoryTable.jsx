import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Search, Trash2, Eye } from "lucide-react";

const HistoryTable = ({ history, setHistory }) => {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState("");
  const displayedHistory = history.filter((item) => {
    const query = search.toLowerCase();
    return (
      item.input_data?.Position?.toLowerCase().includes(query) ||
      item.input_data?.Department?.toLowerCase().includes(query) ||
      item.prediction?.toLowerCase().includes(query)
    );
  });

  const handleDelete = async (reportId) => {
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/delete-report/${reportId}`,
        { method: "DELETE" }
      );

      // Removes record from UI if deletion was successful
      if (response.ok) {
        setHistory((prev) => prev.filter((item) => item._id !== reportId));

        const refreshRes = await fetch(`${API_BASE_URL}/api/get-history`);
        const newData = await refreshRes.json();
        setHistory(newData);
      }
    } catch (error) {
      console.error("Delete/Refill failed:", error);
    }
  };

  // Change badge color based on risk
  const getRiskBadge = (percent, prediction) => {
    if (percent >= 70 || prediction === "High Risk") {
      return "bg-red-500/10 text-red-500 border-red-500/20";
    }
    if (percent > 30) {
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    }
    return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">Assessment History</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-800/30">
              <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                Position
              </th>
              <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                Department
              </th>
              <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                Risk Status
              </th>
              <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {displayedHistory.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="p-10 text-center text-slate-500 italic"
                >
                  No historical data found.
                </td>
              </tr>
            ) : (
              displayedHistory.map((record) => (
                <tr
                  key={record._id}
                  className="hover:bg-slate-800/20 transition-colors group"
                >
                  {/* Position */}
                  <td className="p-5 text-sm text-white">
                    {record.input_data?.Position || "N/A"}
                  </td>

                  {/* Department */}
                  <td className="p-5 text-sm text-slate-400">
                    {record.input_data?.Department || "N/A"}
                  </td>

                  {/* Risk Badge */}
                  <td className="p-5">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getRiskBadge(
                        record.attrition_risk_percent,
                        record.prediction
                      )}`}
                    >
                      {record.prediction || "Unknown"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() =>
                          navigate("/reports", {
                            state: { prediction: record },
                          })
                        }
                        className="p-2 hover:bg-blue-500/10 rounded-lg text-blue-400 transition-all hover:scale-110"
                        title="View Full Report"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(record._id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryTable;
