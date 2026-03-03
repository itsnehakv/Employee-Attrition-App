import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Github } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = ["Dashboard", "Predictor", "Reports", "Analytics"];

  return (
    <nav className="flex items-center border mx-4 mt-4 max-md:w-full max-md:justify-between border-slate-700 px-6 py-4 rounded-full text-white text-sm bg-black/50 backdrop-blur-md relative z-50">
      {/* Logo */}
      <NavLink to="/" className="flex items-center gap-2 group">
        <span className="text-xl font-bold tracking-tighter text-white transition-colors group-hover:text-blue-400">
          RETAIN
          <span className="text-blue-500 group-hover:text-white">.AI</span>
        </span>
      </NavLink>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-6 ml-7">
        {navItems.map((item) => (
          <NavLink
            key={item}
            to={`/${item.toLowerCase()}`}
            className={({ isActive }) =>
              `relative overflow-hidden h-6 group transition-colors ${
                isActive ? "text-blue-400 font-bold" : "text-white"
              }`
            }
          >
            {/*Text Animation */}
            <span className="block group-hover:-translate-y-full transition-transform duration-300">
              {item}
            </span>
            <span className="block absolute top-full left-0 group-hover:translate-y-[-100%] transition-transform duration-300">
              {item}
            </span>
          </NavLink>
        ))}
      </div>

      {/* Desktop Buttons */}
      <div className="hidden ml-auto md:flex items-center gap-4">
        <a
          href="https://github.com/itsnehakv/Employee-Attrition-App.git"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 hover:bg-slate-700 transition-colors border border-slate-700 text-sm font-medium"
        >
          <Github size={18} />
          <span>Visit Repo</span>
        </a>
        <a
          href="https://www.linkedin.com/in/nehakvallappil"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white hover:shadow-[0px_0px_30px_14px] shadow-[0px_0px_30px_7px] hover:shadow-white/50 shadow-white/50 text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-100 transition duration-300"
        >
          Contact
        </a>
      </div>

      {/* Mobile Menu Toggle */}
      <button onClick={() => setIsOpen(!isOpen)} className="md:hidden">
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </nav>
  );
};

export default Navbar;
