import express, { Express, json } from 'express';
import cors from 'cors';
import fetch, { RequestInit, HeadersInit } from 'node-fetch';
import dotenv from 'dotenv';
import authRoutes from './src/routes/auth';
import snapshotsRoutes from './src/routes/snapshots';
import organizationsRoutes from './src/routes/organizations';
import driftRoutes from './src/routes/drift';
import bulkRoutes from './src/routes/bulk';
import analyticsRoutes from './src/routes/analytics';
import securityRoutes from './src/routes/security';
import docsRoutes from './src/routes/docs';
import schedulesRoutes from './src/routes/schedules';
import crossRegionRoutes from './src/routes/crossregion';
import adminRoutes from './src/routes/admin';
import companyRoutes from './src/routes/company';
import { authMiddleware } from './src/middleware/auth';
import { requireRole } from './src/middleware/role';
import { SchedulerService } from './src/services/SchedulerService';
import { query as dbQuery } from './src/config/database';

// Load environment variables
dotenv.config();

// FIX: Explicitly type `app` as `Express` to resolve TypeScript overload issues with `app.use()`.
const app: Express = express();
const port = process.env.PORT || 8787;

app.use(cors());
// FIX: Use the named export `json` from express to avoid overload resolution issues with `app.use`.
app.use(json());

// Known Meraki regional API base URLs.
// If a region code is not found here, the value is treated as a direct API base URL
// (used for custom/unlisted regions entered by the user).
const MERAKI_REGION_BASES: Record<string, string> = {
  com: 'https://api.meraki.com/api/v1',   // Global / Americas
  in:  'https://api.meraki.in/api/v1',    // India
  cn:  'https://api.meraki.cn/api/v1',    // China (verify domain before use)
  ca:  'https://api.meraki.ca/api/v1',    // Canada (verify domain before use)
  uk:  'https://api.meraki.uk/api/v1',    // United Kingdom (verify domain before use)
  eu:  'https://api.meraki.eu/api/v1',    // Europe (verify domain before use)
  au:  'https://api.meraki.au/api/v1',    // Australia (verify domain before use)
};

// Falls back to treating the value as a direct base URL for unlisted / custom regions.
const getBaseUrl = (region: string): string =>
  MERAKI_REGION_BASES[region] ?? region;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// New API routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/organizations', snapshotsRoutes);
app.use('/api/organizations', driftRoutes);
app.use('/api/organizations', bulkRoutes);
app.use('/api/organizations', securityRoutes);
app.use('/api/organizations', docsRoutes);
app.use('/api/organizations', schedulesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/cross-region', crossRegionRoutes);
app.use('/api/admin', authMiddleware, requireRole('super_admin'), adminRoutes);
app.use('/api/company', authMiddleware, requireRole('company_admin', 'super_admin'), companyRoutes);

// Existing Meraki proxy endpoint
app.post('/api/proxy', async (req, res) => {
    try {
        const { apiKey, region, endpoint, method, body } = req.body as { apiKey: string; region: string; endpoint: string; method: string; body?: Record<string, any> };

        if (!apiKey || !region || !endpoint || !method) {
            return res.status(400).json({ error: 'Missing required parameters in proxy request' });
        }

        const baseUrl = getBaseUrl(region);
        const merakiUrl = `${baseUrl}${endpoint}`;

        const merakiRequestHeaders: HeadersInit = {
            'X-Cisco-Meraki-API-Key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        const merakiRequestOptions: RequestInit = {
            method: method,
            headers: merakiRequestHeaders,
        };

        if (body && Object.keys(body).length > 0) {
            merakiRequestOptions.body = JSON.stringify(body);
        }

        const merakiResponse = await fetch(merakiUrl, merakiRequestOptions);
        
        // Forward headers like 'Retry-After'
        if (merakiResponse.headers.has('Retry-After')) {
            res.setHeader('Retry-After', merakiResponse.headers.get('Retry-After')!);
        }

        // Forward content-type
        res.setHeader('Content-Type', merakiResponse.headers.get('Content-Type') || 'application/json');
        
        const responseBody = await merakiResponse.text();
        // Check if response body is valid JSON before sending
        try {
            res.status(merakiResponse.status).send(JSON.parse(responseBody));
        } catch (e) {
            // If not JSON, send as text
            res.status(merakiResponse.status).send(responseBody);
        }

    } catch (error) {
        console.error('Error in proxy server:', error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        res.status(500).json({ error: `An internal server error occurred: ${errorMessage}` });
    }
});

app.listen(port, () => {
    console.log(`Meraki API proxy server listening on http://127.0.0.1:${port}`);
});

// ── Background Scheduler ────────────────────────────────────────────────────
// Runs every hour; takes snapshots for any org whose schedule is due.
const SCHED_BASES: Record<string, string> = {
  com: 'https://api.meraki.com/api/v1',
  in:  'https://api.meraki.in/api/v1',
};

async function runScheduledSnapshots(): Promise<void> {
  try {
    const due = await SchedulerService.getDueOrganizations();
    if (due.length === 0) return;
    console.log(`[Scheduler] ${due.length} org(s) due for snapshot`);

    for (const org of due) {
      try {
        const baseUrl = SCHED_BASES[org.region] ?? SCHED_BASES.com;
        const headers = { 'X-Cisco-Meraki-API-Key': org.apiKey };

        const [networksRes, devicesRes] = await Promise.allSettled([
          fetch(`${baseUrl}/organizations/${org.merakiOrgId}/networks`, { headers }),
          fetch(`${baseUrl}/organizations/${org.merakiOrgId}/devices`,  { headers }),
        ]);

        const networks = networksRes.status === 'fulfilled' && networksRes.value.ok
          ? await networksRes.value.json() : [];
        const devices  = devicesRes.status  === 'fulfilled' && devicesRes.value.ok
          ? await devicesRes.value.json()  : [];

        const snapshotData = { networks, devices, vlans: [], ssids: [], l3FirewallRules: [] };
        const sizeBytes    = JSON.stringify(snapshotData).length;

        await dbQuery(
          `INSERT INTO config_snapshots (organization_id, snapshot_type, snapshot_data, size_bytes, notes)
           VALUES ($1, 'scheduled', $2, $3, $4)`,
          [org.id, JSON.stringify(snapshotData), sizeBytes, `Auto snapshot — ${org.config.frequency}`]
        );

        await SchedulerService.pruneOldSnapshots(org.id, org.config.retainCount);
        console.log(`[Scheduler] Snapshot saved for "${org.name}"`);
      } catch (err: any) {
        console.error(`[Scheduler] Failed for "${org.name}":`, err.message);
      }
    }
  } catch (err: any) {
    console.error('[Scheduler] Cron error:', err.message);
  }
}

// Run immediately on startup, then every hour
runScheduledSnapshots();
setInterval(runScheduledSnapshots, 60 * 60 * 1000);