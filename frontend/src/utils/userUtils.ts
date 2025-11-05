import type { User } from "@/types/socket";

export const normalizeUsers = (users: User[] | string[]): User[] => {
  if (!Array.isArray(users) || users.length === 0) return [];
  
  const userList = typeof users[0] === "string"
    ? (users as string[]).map((u) => ({ username: u }))
    : (users as User[]);
  
  const seen = new Set<string>();
  return userList.filter((user) => {
    if (seen.has(user.username)) return false;
    seen.add(user.username);
    return true;
  });
};

