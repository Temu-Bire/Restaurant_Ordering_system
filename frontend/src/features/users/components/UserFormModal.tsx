import { useState, type FormEvent } from "react";

import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import Select from "../../../components/ui/Select";
import { roleOptions, type Role, type User } from "../../../types/user";

export interface UserFormData {
  name: string;
  email: string;
  role: Role;
  active: boolean;
  password?: string; // only when adding a new user
}

interface UserFormModalProps {
  user: User | null; // null = adding a new user
  takenEmails: string[]; // lowercase emails of the other users
  onClose: () => void;
  onSave: (data: UserFormData) => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function UserFormModal({
  user,
  takenEmails,
  onClose,
  onSave,
}: UserFormModalProps) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<Role>(user?.role ?? "staff");
  const [status, setStatus] = useState(
    user && !user.active ? "disabled" : "active"
  );
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  const locked = user?.role === "admin";

  function submit(e: FormEvent) {
    e.preventDefault();

    const next: typeof errors = {};
    if (!name.trim()) next.name = "Full name is required";

    if (!EMAIL_PATTERN.test(email.trim())) {
      next.email = "Enter a valid email address";
    } else if (takenEmails.includes(email.trim().toLowerCase())) {
      next.email = "This email is already used by another user";
    }

    if (!user && password.length < 8) {
      next.password = "Password must be at least 8 characters";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSave({
      name: name.trim(),
      email: email.trim(),
      role,
      active: status === "active",
      password: user ? undefined : password,
    });
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={user ? "Edit User" : "Add User"}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          id="user-name"
          label="Full Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
        <Input
          id="user-email"
          label="Email *"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="user-role"
            label="Role"
            value={role}
            options={roleOptions}
            disabled={locked}
            onChange={(e) => setRole(e.target.value as Role)}
          />
          <Select
            id="user-status"
            label="Status"
            value={status}
            disabled={locked}
            options={[
              { value: "active", label: "Active" },
              { value: "disabled", label: "Disabled" },
            ]}
            onChange={(e) => setStatus(e.target.value)}
          />
        </div>

        {locked && (
          <p className="text-xs text-muted">
            Administrator access can't be changed here.
          </p>
        )}

        {!user && (
          <Input
            id="user-password"
            label="Temporary Password *"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save User</Button>
        </div>
      </form>
    </Modal>
  );
}