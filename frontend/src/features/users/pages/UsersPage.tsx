import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";

import PageHeader from "../../../shared/components/layout/PageHeader";
import Badge from "../../../shared/components/ui/Badge";
import Button from "../../../shared/components/ui/Button";
import Card from "../../../shared/components/ui/Card";
import DataTable, { type Column } from "../../../shared/components/ui/DataTable";
import FilterTabs from "../../../shared/components/ui/FilterTabs";
import UserFormModal, {
  type UserFormData,
} from "../components/UserFormModal";
import * as usersApi from "../api/usersApi";
import { ROLE_LABEL, type Role, type User } from "../../../shared/types/user";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import ConfirmDialog from "../../../shared/components/ui/ConfirmDialog";

type Filter = "all" | Role;

export default function UsersPage() {
  const { t } = useTranslation();
  const [list, setList] = useState<User[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<User | "new" | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    usersApi
      .listUsers()
      .then((users) => {
        if (active) setList(users);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Could not load users");
        }
      });
    return () => {
      active = false;
    };
  }, []);


  const takenEmails = list
    .filter((u) => editing === "new" || u.id !== editing?.id)
    .map((u) => u.email.toLowerCase());

  async function saveUser(data: UserFormData) {
    if (editing && editing !== "new") {
      const saved = await usersApi.updateUser(editing.id, data);
      setList((prev) => prev.map((u) => (u.id === saved.id ? saved : u)));
      return;
    }

    const created = await usersApi.createUser({
      ...data,
      password: data.password ?? "",
    });
    setList((prev) => [created, ...prev]);
  }
    const [search, setSearch] = useState("");
    const [toDelete, setToDelete] = useState<User | null>(null);

    const q = search.trim().toLowerCase();
    const visible = list.filter(
      (u) =>
        (filter === "all" || u.role === filter) &&
        (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );

    const deleteUser = (user: User) => setToDelete(user); // opens the dialog

    async function confirmDelete() {
      if (!toDelete) return;
      try {
        await usersApi.deleteUser(toDelete.id);
        setList((prev) => prev.filter((u) => u.id !== toDelete.id));
        setToDelete(null);
        setLoadError("");
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Could not delete this user");
        setToDelete(null);
      }
    }

  

  const columns: Column<User>[] = [
    { header: "Name", cell: (u) => <span className="font-medium">{u.name}</span> },
    { header: "Email", cell: (u) => u.email },
    {
      header: "Role",
      cell: (u) => <Badge variant={u.role}>{ROLE_LABEL[u.role]}</Badge>,
    },
    {
      header: "Status",
      cell: (u) =>
        u.active ? (
          <Badge variant="active">Active</Badge>
        ) : (
          <Badge variant="disabled">Disabled</Badge>
        ),
    },
    {
      header: "Actions",
      cell: (u) => (
        <div className="flex gap-4 text-muted">
          <button
            onClick={() => setEditing(u)}
            aria-label={`Edit ${u.name}`}
            className="hover:text-foreground transition-colors"
          >
            <Pencil className="size-4" />
          </button>
          {u.role !== "admin" && (
            <button
              onClick={() => deleteUser(u)}
              aria-label={`Delete ${u.name}`}
              className="hover:text-danger transition-colors"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t("navUsers")}
        description="Manage customers, staff and administrators"
        search={{ value: search, onChange: setSearch }}
      />

      {loadError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-semibold text-danger" role="alert">
          <AlertCircle className="size-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { value: "all", label: "All" },
            { value: "customer", label: "Customers" },
            { value: "staff", label: "Staff" },
            { value: "admin", label: "Admins" },
          ]}
        />
        <Button onClick={() => setEditing("new")} className="inline-flex items-center gap-1.5">
          <Plus className="size-4" />
          <span>Add User</span>
        </Button>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={visible}
          getRowKey={(u) => u.id}
          emptyMessage="No users in this group."
        />
      </Card>

      {editing && (
        <UserFormModal
          key={editing === "new" ? "new" : editing.id}
          user={editing === "new" ? null : editing}
          takenEmails={takenEmails}
          onClose={() => setEditing(null)}
          onSave={saveUser}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete user"
          message={`Delete ${toDelete.name}? This can't be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}