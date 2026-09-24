import { Outlet, NavLink } from "react-router";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface-accent">
      <header className="nav-top-playerduo flex justify-between">
        <NavLink to="/" className="text-h3 text-brand-deep no-underline">
          Player Duo
        </NavLink>
        <NavLink to="/" className="link-playerduo-secondary">
          Về trang chủ
        </NavLink>
      </header>
      <div className="container-playerduo flex min-h-[calc(100vh-56px)] items-center justify-center py-10">
        <Outlet />
      </div>
    </div>
  );
}
