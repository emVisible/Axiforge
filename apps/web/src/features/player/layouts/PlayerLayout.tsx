import { Outlet } from "react-router";

import { playerScreenClass } from "@/shared/lib/playerTheme";

export default function PlayerLayout() {
  return (
    <div className={playerScreenClass}>
      <Outlet />
    </div>
  );
}
