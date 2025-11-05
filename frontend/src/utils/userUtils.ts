export const normalizeUsers = (users: { username: string }[] | string[]): { username: string }[] => {
  if (!Array.isArray(users) || users.length === 0) return [];
  
  const userList = typeof users[0] === "string"
    ? (users as string[]).map((u) => ({ username: u }))
    : (users as { username: string }[]);
  
  const seen = new Set<string>();
  return userList.filter((user) => {
    if (seen.has(user.username)) return false;
    seen.add(user.username);
    return true;
  });
};

