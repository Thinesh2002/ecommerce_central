import { useState } from "react";
import Sidebar from "./builder/Sidebar";
import Preview from "./builder/Preview";
import { initialState } from "./data/templateState";

export default function App() {
  const [state, setState] = useState(initialState);

  return (
    <div className="h-screen flex flex-col">

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar state={state} setState={setState} />
        <Preview state={state} />
      </div>
    </div>
  );
}
