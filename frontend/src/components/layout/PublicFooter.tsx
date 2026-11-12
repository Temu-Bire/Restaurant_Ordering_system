import { Link } from "react-router-dom";

import { restaurantInfo } from "../../mocks/settings";

export default function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary font-bold text-white">
              R
            </span>
            <span className="text-xl font-bold">{restaurantInfo.name}</span>
          </div>
          <p className="mt-3 max-w-xs text-[13px] text-muted">
            Order your favorite meals easily, at your table, to take away or
            delivered to your door.
          </p>
        </div>

        <div className="text-[13px]">
          <h2 className="mb-2 font-bold">Contact</h2>
          <p className="text-muted">{restaurantInfo.address}</p>
          <p className="text-muted">{restaurantInfo.phone}</p>
        </div>

        <div className="text-[13px]">
          <h2 className="mb-2 font-bold">Account</h2>
          <ul className="space-y-1">
            <li>
              <Link to="/login" className="text-muted hover:text-foreground">
                Log in
              </Link>
            </li>
            <li>
              <Link to="/register" className="text-muted hover:text-foreground">
                Create an account
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <p className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {restaurantInfo.name}. All rights reserved.
      </p>
    </footer>
  );
}