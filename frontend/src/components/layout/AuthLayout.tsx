import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Left: brand panel (hidden on mobile) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-orange-400 via-primary to-orange-800 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-white font-bold text-primary">
            R
          </div>
          <span className="text-2xl font-bold">RestroGo</span>
        </div>

        <div>
          <h1 className="text-5xl font-extrabold leading-tight">
            Delicious Food,
            <br />
            Great Experience!
          </h1>
          <p className="mt-4 text-sm text-white/90">
            Order your favorite meals easily.
          </p>
        </div>

        <div />
      </div>

      {/* Right: form area */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}