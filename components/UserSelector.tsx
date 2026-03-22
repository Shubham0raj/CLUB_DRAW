"use client";

import { useEffect, useState } from "react";

export default function UserSelector({ onChange }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users);
        if (data.users.length > 0) {
          setUserId(data.users[0].id);
          onChange(data.users[0].id);
        }
      });
  }, []);

  return (
    <select
      value={userId}
      onChange={(e) => {
        setUserId(e.target.value);
        onChange(e.target.value);
      }}
      className="border p-2 rounded"
    >
      {users.map((user) => (
        <option key={user.id} value={user.id}>
          {user.email}
        </option>
      ))}
    </select>
  );
}