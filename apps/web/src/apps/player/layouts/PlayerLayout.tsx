import { Outlet } from "react-router";

export default function PlayerLayout() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Outlet />
    </div>
  );
}
