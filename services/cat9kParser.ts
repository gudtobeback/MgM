export interface ParsedVlan {
  id: number;
  name: string;
}

export interface ParsedInterface {
  name: string;
  shortName: string;
  description: string;
  mode: 'access' | 'trunk' | 'unknown';
  accessVlan: number | null;
  trunkAllowedVlans: string | null;
  nativeVlan: number | null;
  portFast: boolean;
  dot1x: boolean;
}

export interface ParsedAclRule {
  comment: string;
  action: 'permit' | 'deny';
  protocol: string;
  srcCidr: string;
  srcPort: string | null;
  dstCidr: string;
  dstPort: string | null;
}

export interface ParsedAcl {
  name: string;
  rules: ParsedAclRule[];
}

export interface ParsedRadiusServer {
  name: string;
  ip: string;
  authPort: number;
  acctPort: number;
  key: string;
}

export interface ParsedCat9KConfig {
  hostname: string;
  vlans: ParsedVlan[];
  interfaces: ParsedInterface[];
  radiusServers: ParsedRadiusServer[];
  dot1xEnabled: boolean;
  acls: ParsedAcl[];
}

// Extracts the last numeric segment from a port name
// e.g. "GigabitEthernet1/0/24" → "24", "FastEthernet0/1" → "1"
export function extractPortNumber(ifaceName: string): string {
  const parts = ifaceName.split('/');
  return parts[parts.length - 1];
}

// Normalize a CIDR/host string for ACL rules
// "any" stays as-is, "host 10.0.0.1" → "10.0.0.1/32", "10.0.0.0 0.0.0.255" → "10.0.0.0/24"
function normalizeCidr(tokens: string[]): { cidr: string; remaining: string[] } {
  if (!tokens.length) return { cidr: 'any', remaining: [] };
  if (tokens[0] === 'any') return { cidr: 'any', remaining: tokens.slice(1) };
  if (tokens[0] === 'host') {
    return { cidr: `${tokens[1]}/32`, remaining: tokens.slice(2) };
  }
  // wildcard mask
  const ip = tokens[0];
  const mask = tokens[1];
  if (mask) {
    const wildcardParts = mask.split('.').map(Number);
    const bits = wildcardParts.reduce((acc, n) => {
      // count zero bits in each octet of wildcard = network bits
      let b = 0;
      let m = ~n & 0xff;
      while (m & 0x80) { b++; m = (m << 1) & 0xff; }
      return acc + b;
    }, 0);
    // rough CIDR
    const cidr = `${ip}/${bits}`;
    return { cidr, remaining: tokens.slice(2) };
  }
  return { cidr: ip, remaining: tokens.slice(1) };
}

// Parse a port specifier — "eq 80", "range 1024 65535", etc.
function parsePort(tokens: string[]): { port: string | null; remaining: string[] } {
  if (!tokens.length) return { port: null, remaining: [] };
  if (tokens[0] === 'eq') return { port: tokens[1], remaining: tokens.slice(2) };
  if (tokens[0] === 'range') return { port: `${tokens[1]}-${tokens[2]}`, remaining: tokens.slice(3) };
  if (tokens[0] === 'gt') return { port: `>${tokens[1]}`, remaining: tokens.slice(2) };
  if (tokens[0] === 'lt') return { port: `<${tokens[1]}`, remaining: tokens.slice(2) };
  return { port: null, remaining: tokens };
}

function parseAclRule(line: string): ParsedAclRule | null {
  const trimmed = line.trim();
  let comment = '';
  let rest = trimmed;

  // remarks
  const remarkMatch = trimmed.match(/^remark\s+(.+)$/i);
  if (remarkMatch) {
    return null; // skip remark lines in rules — we capture comments separately
  }

  const actionMatch = rest.match(/^(permit|deny)\s+(.+)$/i);
  if (!actionMatch) return null;

  const action = actionMatch[1].toLowerCase() as 'permit' | 'deny';
  let tokens = actionMatch[2].trim().split(/\s+/);
  const protocol = tokens[0];
  tokens = tokens.slice(1);

  // src
  const srcResult = normalizeCidr(tokens);
  const srcCidr = srcResult.cidr;
  tokens = srcResult.remaining;

  // src port
  const srcPortResult = parsePort(tokens);
  const srcPort = srcPortResult.port;
  tokens = srcPortResult.remaining;

  // dst
  const dstResult = normalizeCidr(tokens);
  const dstCidr = dstResult.cidr;
  tokens = dstResult.remaining;

  // dst port
  const dstPortResult = parsePort(tokens);
  const dstPort = dstPortResult.port;

  return { comment, action, protocol, srcCidr, srcPort, dstCidr, dstPort };
}

export function parseCat9KConfig(raw: string): ParsedCat9KConfig {
  const result: ParsedCat9KConfig = {
    hostname: '',
    vlans: [],
    interfaces: [],
    radiusServers: [],
    dot1xEnabled: false,
    acls: [],
  };

  // Normalize line endings
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into blocks by "!" delimiter
  const blocks = normalized.split(/^!\s*$/m);

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trimEnd());
    if (!lines.length) continue;

    // Find first non-empty line
    const firstLine = lines.find(l => l.trim().length > 0) ?? '';
    const firstTrimmed = firstLine.trim();

    // hostname
    const hostnameMatch = firstTrimmed.match(/^hostname\s+(\S+)/i);
    if (hostnameMatch) {
      result.hostname = hostnameMatch[1];
      continue;
    }

    // dot1x system-auth-control (global line, may appear alone)
    if (/dot1x\s+system-auth-control/i.test(block)) {
      result.dot1xEnabled = true;
    }

    // vlan <id> block
    const vlanMatch = firstTrimmed.match(/^vlan\s+(\d+)$/i);
    if (vlanMatch) {
      const vid = parseInt(vlanMatch[1], 10);
      // Skip reserved VLANs
      if (vid === 1 || (vid >= 1002 && vid <= 1005)) continue;
      let name = `VLAN${vid}`;
      for (const line of lines.slice(1)) {
        const nm = line.trim().match(/^name\s+(.+)$/i);
        if (nm) { name = nm[1].trim(); break; }
      }
      result.vlans.push({ id: vid, name });
      continue;
    }

    // interface block — only physical switch ports
    const ifaceMatch = firstTrimmed.match(/^interface\s+(GigabitEthernet|FastEthernet|TenGigabitEthernet|TwentyFiveGigE|FortyGigabitEthernet|HundredGigE)(\S+)/i);
    if (ifaceMatch) {
      const fullName = firstTrimmed.replace(/^interface\s+/i, '').trim();
      // Build short name
      const abbrevMap: Record<string, string> = {
        gigabitethernet: 'Gi', fastethernet: 'Fa', tengigabitethernet: 'Te',
        twentyfivegige: 'Twe', fortygigabitethernet: 'Fo', hundredgige: 'Hu',
      };
      const prefix = ifaceMatch[1].toLowerCase();
      const abbrev = abbrevMap[prefix] ?? ifaceMatch[1].substring(0, 2);
      const shortName = `${abbrev}${ifaceMatch[2]}`;

      const iface: ParsedInterface = {
        name: fullName,
        shortName,
        description: '',
        mode: 'unknown',
        accessVlan: null,
        trunkAllowedVlans: null,
        nativeVlan: null,
        portFast: false,
        dot1x: false,
      };

      for (const line of lines.slice(1)) {
        const t = line.trim();
        const descMatch = t.match(/^description\s+(.+)$/i);
        if (descMatch) { iface.description = descMatch[1].trim(); continue; }

        if (/^switchport\s+mode\s+access/i.test(t)) { iface.mode = 'access'; continue; }
        if (/^switchport\s+mode\s+trunk/i.test(t)) { iface.mode = 'trunk'; continue; }

        const accVlanMatch = t.match(/^switchport\s+access\s+vlan\s+(\d+)/i);
        if (accVlanMatch) { iface.accessVlan = parseInt(accVlanMatch[1], 10); continue; }

        const trunkAllowedMatch = t.match(/^switchport\s+trunk\s+allowed\s+vlan\s+(.+)$/i);
        if (trunkAllowedMatch) { iface.trunkAllowedVlans = trunkAllowedMatch[1].trim(); continue; }

        const nativeVlanMatch = t.match(/^switchport\s+trunk\s+native\s+vlan\s+(\d+)/i);
        if (nativeVlanMatch) { iface.nativeVlan = parseInt(nativeVlanMatch[1], 10); continue; }

        if (/^spanning-tree\s+portfast/i.test(t)) { iface.portFast = true; continue; }
        if (/^dot1x\s+pae\s+authenticator/i.test(t) || /^authentication\s+port-control/i.test(t)) {
          iface.dot1x = true; continue;
        }
      }

      result.interfaces.push(iface);
      continue;
    }

    // radius server <name> block
    const radiusMatch = firstTrimmed.match(/^radius\s+server\s+(.+)$/i);
    if (radiusMatch) {
      const serverName = radiusMatch[1].trim();
      const srv: ParsedRadiusServer = {
        name: serverName,
        ip: '',
        authPort: 1812,
        acctPort: 1813,
        key: '',
      };
      for (const line of lines.slice(1)) {
        const t = line.trim();
        const addrMatch = t.match(/^address\s+ipv4\s+(\S+)\s+auth-port\s+(\d+)\s+acct-port\s+(\d+)/i);
        if (addrMatch) {
          srv.ip = addrMatch[1];
          srv.authPort = parseInt(addrMatch[2], 10);
          srv.acctPort = parseInt(addrMatch[3], 10);
          continue;
        }
        const addrSimple = t.match(/^address\s+ipv4\s+(\S+)/i);
        if (addrSimple) { srv.ip = addrSimple[1]; continue; }

        const authPortMatch = t.match(/^auth-port\s+(\d+)/i);
        if (authPortMatch) { srv.authPort = parseInt(authPortMatch[1], 10); continue; }

        const acctPortMatch = t.match(/^acct-port\s+(\d+)/i);
        if (acctPortMatch) { srv.acctPort = parseInt(acctPortMatch[1], 10); continue; }

        const keyMatch = t.match(/^key\s+(\d+)?\s*(\S+)$/i);
        if (keyMatch) { srv.key = keyMatch[2] ?? keyMatch[1] ?? ''; continue; }
      }
      if (srv.ip) result.radiusServers.push(srv);
      continue;
    }

    // ip access-list extended <name> block
    const aclMatch = firstTrimmed.match(/^ip\s+access-list\s+extended\s+(\S+)/i);
    if (aclMatch) {
      const aclName = aclMatch[1];
      const acl: ParsedAcl = { name: aclName, rules: [] };
      let currentComment = '';
      for (const line of lines.slice(1)) {
        const t = line.trim();
        if (!t) continue;
        const remarkMatch = t.match(/^(?:\d+\s+)?remark\s+(.+)$/i);
        if (remarkMatch) { currentComment = remarkMatch[1].trim(); continue; }
        // strip leading sequence number if present
        const stripped = t.replace(/^\d+\s+/, '');
        const rule = parseAclRule(stripped);
        if (rule) {
          rule.comment = currentComment;
          currentComment = '';
          acl.rules.push(rule);
        }
      }
      if (acl.rules.length > 0) result.acls.push(acl);
      continue;
    }
  }

  return result;
}
