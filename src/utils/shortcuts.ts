import { execSync } from "child_process";

export const listShortcuts = (): { label: string, value: string }[] => {
  const shortcuts = execSync('shortcuts list')
    .toString()
    .split('\n')
    .map((s) => s.trim()).filter((s) => s.length > 0);

  return shortcuts.map((s) => ({ label: s, value: s }));
};
