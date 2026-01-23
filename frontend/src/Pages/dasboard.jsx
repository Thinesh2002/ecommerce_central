import React from "react";
import { Link } from "react-router-dom";
import { getStoredUser } from "../config/auth";

const Dashboard = () => {
    const user = getStoredUser();

  return (
    <div className="min-h-screen r justify-center">
      <div className="w-full max-w-4xl px-6">

        <h1 className="text-white text-3xl mb-8 text-center">
          Welcome back <span className="text-[#ffc400] font-bold ">  {user?.name}! </span>
 
                
           

        </h1>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-medium text-white">
              Keyword Analysis
            </h2>
            <p className="text-gray-400 mt-1">
              Get your Demand Keyword 
            </p>
          </div>

          <Link
            to="/Keyword-analysis"
            className="px-6 py-3 rounded-lg bg-white text-gray-900 font-medium hover:bg-gray-200 transition"
          >
            Go to Keyword Analysis
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
