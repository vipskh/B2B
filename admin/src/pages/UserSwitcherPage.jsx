import { useQuery } from "@tanstack/react-query";
import { UsersIcon, ShieldIcon, StoreIcon, UserIcon } from "lucide-react";
import { devApi } from "../lib/api";
import { setDevUserId } from "../lib/devUser";

const roleIcon = {
  admin: <ShieldIcon className="size-5" />,
  vendor: <StoreIcon className="size-5" />,
  buyer: <UserIcon className="size-5" />,
};

// Auth is temporarily off — pick a seeded user to impersonate.
function UserSwitcherPage() {
  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ["devUsers"],
    queryFn: devApi.listUsers,
  });

  const pick = (id) => {
    setDevUserId(id);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-xl w-full max-w-md">
        <div className="card-body">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-11 bg-primary rounded-xl flex items-center justify-center">
              <UsersIcon className="size-6 text-primary-content" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Choose a user</h1>
              <p className="text-xs opacity-60">Dev mode — authentication is off</p>
            </div>
          </div>

          {isLoading && (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg" />
            </div>
          )}
          {isError && (
            <div className="alert alert-error text-sm">
              Couldn&apos;t reach the API. Is the backend running and seeded?
            </div>
          )}

          <div className="flex flex-col gap-2 mt-2">
            {users.map((u) => (
              <button
                key={u._id}
                className="btn btn-block justify-start gap-3"
                onClick={() => pick(u._id)}
              >
                <span className="text-primary">{roleIcon[u.role] || roleIcon.buyer}</span>
                <span className="flex-1 text-left">
                  <span className="font-semibold">{u.name}</span>
                  <span className="block text-xs opacity-60">{u.email}</span>
                </span>
                <span className="badge badge-outline">{u.role}</span>
              </button>
            ))}
            {!isLoading && users.length === 0 && !isError && (
              <p className="text-center text-sm opacity-60 py-4">
                No users found — run <code>npm run seed</code> in the backend.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserSwitcherPage;
