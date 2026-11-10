import { useState } from "react";

import PageHeader from "../../components/layout/PageHeader";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import DataTable, { type Column } from "../../components/ui/DataTable";
import FilterTabs from "../../components/ui/FilterTabs";
import UserFormModal, {
  type UserFormData,
} from "../../features/users/components/UserFormModal";
import { users as initialUsers } from "../../mocks/users";
import { ROLE_LABEL, type Role, type User } from "../../types/user";

type Filter = "all" | Role;

export default function UsersPage() {
  const [list, setList] = useState<User[]>(initialUsers);
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<User | "new" | null>(null);

  const visible = list.filter((u) => filter === "all" || u.role === filter);

  const takenEmails = list
    .filter((u) => editing === "new" || u.id !== editing?.id)
    .map((u) => u.email.toLowerCase());

  // TEMP: local state. Later these call usersApi
  function saveUser(data: UserFormData) {
    const { password, ...fields } = data;
    void password; // the real API hashes and stores this

    if (editing && editing !== "new") {
      setList((prev) =>
        prev.map((u) => (u.id === editing.id ? { ...u, ...fields } : u))
      );
    } else {
      setList((prev) => [...prev, { id: crypto.randomUUID(), ...fields }]);
    }
  }

  function deleteUser(user: User) {
    if (window.confirm(`Delete ${user.name}? This can't be undone.`)) {
      setList((prev) => prev.filter((u) => u.id !== user.id));
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
            className="hover:text-foreground"
          >
            ✎
          </button>
          {u.role !== "admin" && (
            <button
              onClick={() => deleteUser(u)}
              aria-label={`Delete ${u.name}`}
              className="hover:text-danger"
            >
              🗑
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        description="Manage customers, staff and administrators"
      />

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
        <Button onClick={() => setEditing("new")}>+ Add User</Button>
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
    </>
  );
}