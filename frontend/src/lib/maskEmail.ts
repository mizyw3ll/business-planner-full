export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) return "••••••••";
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const showLocal = local.length <= 2 ? local[0] + "•" : local.slice(0, 2) + "••••";
  const domainParts = domain.split(".");
  const tld = domainParts.length > 1 ? domainParts.pop()! : "";
  const name = domainParts.join(".") || domain;
  const showDomain = name.length <= 1 ? "•••" : name[0] + "•••" + (tld ? `.${tld}` : "");
  return `${showLocal}@${showDomain}`;
}
