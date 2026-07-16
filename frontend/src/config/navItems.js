import { menuSections } from "../compnents/menuConfig";
import { hasPermission, isAdmin } from "./permissions";
import { PAGE_PERMISSIONS, ADMIN_ONLY_PATHS } from "./pageAccess";

function canViewPath(path, user) {
  if (ADMIN_ONLY_PATHS.includes(path)) return isAdmin(user);
  const requiredPermission = PAGE_PERMISSIONS[path];
  if (!requiredPermission) return true;
  return hasPermission(user, requiredPermission);
}

// One entry per top-level tab (Dashboard, Research, Accounts, ...), each carrying
// the sub-links a user is actually permitted to see. Shared by the top TabBar and
// the Header's quick-search so both reflect the same access rules.
export function buildTopLevelNav(user) {
  const items = [];

  menuSections.forEach((section) => {
    (section.items || []).forEach((item) => {
      const rawLinks = item.subLinks?.length ? item.subLinks : [{ to: item.to, label: item.label }];
      const subLinks = rawLinks.filter((link) => canViewPath(link.to, user));
      if (!subLinks.length) return;

      items.push({
        key: `${section.title}-${item.label}`,
        label: item.label,
        to: subLinks[0].to,
        subLinks,
      });
    });
  });

  return items;
}

export function buildSearchableNav(user) {
  const flat = [];
  buildTopLevelNav(user).forEach((item) => {
    item.subLinks.forEach((link) => {
      // A single-sublink tab (e.g. "Channel Accounts" -> "Manage Accounts") is really one
      // page - show the tab's own name, but let the query match either label.
      const label = item.subLinks.length > 1 ? link.label : item.label;
      flat.push({ label, to: link.to, group: item.label, searchText: `${item.label} ${link.label}`.toLowerCase() });
    });
  });
  return flat;
}
