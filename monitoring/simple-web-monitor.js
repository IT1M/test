#!/usr/bin/env node

/**
 * 📊 Simple Web Monitor for Saudi Mais Inventory System
 * A lightweight alternative to Uptime Kuma that runs without Docker
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  port: 3001,
  checkInterval: 30000, // 30 seconds
  targets: [
    {
      name: 'Saudi Mais Main App',
      url: 'http://localhost:3000/api/health',
      timeout: 5000
    },
    {
      name: 'Detailed Health API',
      url: 'http://localhost:3000/api/health/detailed',
      timeout: 10000
    }
  ],
  logFile: './monitoring/monitor.log',
  dataFile: './monitoring/monitor-data.json'
};

// Ensure monitoring directory exists
const monitoringDir = './monitoring';
if (!fs.existsSync(monitoringDir)) {
  fs.mkdirSync(monitoringDir, { recursive: true });
}

// Monitoring data storage
let monitoringData = {
  checks: [],
  stats: {},
  alerts: []
};

// Load existing data
function loadData() {
  try {
    if (fs.existsSync(CONFIG.dataFile)) {
      const data = fs.readFileSync(CONFIG.dataFile, 'utf8');
      monitoringData = JSON.parse(data);
    }
  } catch (error) {
    console.log('Starting with fresh monitoring data');
  }
}

// Save data
function saveData() {
  try {
    fs.writeFileSync(CONFIG.dataFile, JSON.stringify(monitoringData, null, 2));
  } catch (error) {
    console.error('Failed to save monitoring data:', error);
  }
}

// Log function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  
  console.log(message);
  
  try {
    fs.appendFileSync(CONFIG.logFile, logMessage);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

// Check a single target
function checkTarget(target) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const url = new URL(target.url);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      timeout: target.timeout
    };
    
    const req = http.request(options, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const result = {
          name: target.name,
          url: target.url,
          status: res.statusCode >= 200 && res.statusCode < 300 ? 'up' : 'down',
          statusCode: res.statusCode,
          responseTime: responseTime,
          timestamp: new Date().toISOString(),
          data: data.length > 1000 ? data.substring(0, 1000) + '...' : data
        };
        
        resolve(result);
      });
    });
    
    req.on('error', (error) => {
      const result = {
        name: target.name,
        url: target.url,
        status: 'down',
        statusCode: 0,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error.message
      };
      
      resolve(result);
    });
    
    req.on('timeout', () => {
      req.destroy();
      const result = {
        name: target.name,
        url: target.url,
        status: 'down',
        statusCode: 0,
        responseTime: target.timeout,
        timestamp: new Date().toISOString(),
        error: 'Timeout'
      };
      
      resolve(result);
    });
    
    req.end();
  });
}

// Run all checks
async function runChecks() {
  log('Running health checks...');
  
  const results = await Promise.all(
    CONFIG.targets.map(target => checkTarget(target))
  );
  
  // Store results
  monitoringData.checks.push({
    timestamp: new Date().toISOString(),
    results: results
  });
  
  // Keep only last 1000 checks
  if (monitoringData.checks.length > 1000) {
    monitoringData.checks = monitoringData.checks.slice(-1000);
  }
  
  // Update stats
  results.forEach(result => {
    if (!monitoringData.stats[result.name]) {
      monitoringData.stats[result.name] = {
        totalChecks: 0,
        upChecks: 0,
        downChecks: 0,
        avgResponseTime: 0,
        lastStatus: 'unknown'
      };
    }
    
    const stats = monitoringData.stats[result.name];
    stats.totalChecks++;
    
    if (result.status === 'up') {
      stats.upChecks++;
    } else {
      stats.downChecks++;
      
      // Create alert if status changed from up to down
      if (stats.lastStatus === 'up') {
        const alert = {
          timestamp: new Date().toISOString(),
          service: result.name,
          message: `Service went down: ${result.error || 'HTTP ' + result.statusCode}`,
          type: 'down'
        };
        
        monitoringData.alerts.push(alert);
        log(`🚨 ALERT: ${alert.message}`);
      }
    }
    
    // Update average response time
    stats.avgResponseTime = Math.round(
      (stats.avgResponseTime * (stats.totalChecks - 1) + result.responseTime) / stats.totalChecks
    );
    
    stats.lastStatus = result.status;
    stats.lastCheck = result.timestamp;
  });
  
  // Keep only last 100 alerts
  if (monitoringData.alerts.length > 100) {
    monitoringData.alerts = monitoringData.alerts.slice(-100);
  }
  
  saveData();
  
  // Log summary
  const summary = results.map(r => `${r.name}: ${r.status.toUpperCase()} (${r.responseTime}ms)`).join(', ');
  log(`Check completed - ${summary}`);
}

// Generate HTML dashboard
function generateDashboard() {
  const now = new Date();
  const uptime = process.uptime();
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Saudi Mais System Monitor</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status-up { color: #16a34a; font-weight: bold; }
        .status-down { color: #dc2626; font-weight: bold; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .metric { display: flex; justify-content: space-between; margin: 10px 0; }
        .alert { background: #fef2f2; border: 1px solid #fecaca; padding: 10px; border-radius: 4px; margin: 5px 0; }
        .refresh-btn { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        .timestamp { color: #666; font-size: 0.9em; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; }
    </style>
    <script>
        function refreshPage() { location.reload(); }
        setInterval(refreshPage, 30000); // Auto-refresh every 30 seconds
    </script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Saudi Mais System Monitor</h1>
            <p>Real-time monitoring dashboard • Last updated: ${now.toLocaleString()}</p>
            <button class="refresh-btn" onclick="refreshPage()">🔄 Refresh</button>
        </div>
        
        <div class="grid">
            ${CONFIG.targets.map(target => {
              const stats = monitoringData.stats[target.name] || {};
              const uptime = stats.totalChecks > 0 ? ((stats.upChecks / stats.totalChecks) * 100).toFixed(2) : 0;
              const lastCheck = monitoringData.checks.length > 0 ? 
                monitoringData.checks[monitoringData.checks.length - 1].results.find(r => r.name === target.name) : null;
              
              return `
                <div class="card">
                    <h3>${target.name}</h3>
                    <div class="metric">
                        <span>Status:</span>
                        <span class="status-${lastCheck ? lastCheck.status : 'down'}">
                            ${lastCheck ? lastCheck.status.toUpperCase() : 'UNKNOWN'}
                        </span>
                    </div>
                    <div class="metric">
                        <span>Uptime:</span>
                        <span>${uptime}%</span>
                    </div>
                    <div class="metric">
                        <span>Response Time:</span>
                        <span>${lastCheck ? lastCheck.responseTime + 'ms' : 'N/A'}</span>
                    </div>
                    <div class="metric">
                        <span>Total Checks:</span>
                        <span>${stats.totalChecks || 0}</span>
                    </div>
                    <div class="metric">
                        <span>URL:</span>
                        <span style="font-size: 0.9em;">${target.url}</span>
                    </div>
                    ${lastCheck && lastCheck.error ? `
                    <div class="alert">
                        <strong>Error:</strong> ${lastCheck.error}
                    </div>
                    ` : ''}
                </div>
              `;
            }).join('')}
        </div>
        
        <div class="card">
            <h3>📈 System Information</h3>
            <div class="metric">
                <span>Monitor Uptime:</span>
                <span>${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m</span>
            </div>
            <div class="metric">
                <span>Total Checks:</span>
                <span>${monitoringData.checks.length}</span>
            </div>
            <div class="metric">
                <span>Total Alerts:</span>
                <span>${monitoringData.alerts.length}</span>
            </div>
        </div>
        
        ${monitoringData.alerts.length > 0 ? `
        <div class="card">
            <h3>🚨 Recent Alerts</h3>
            ${monitoringData.alerts.slice(-10).reverse().map(alert => `
                <div class="alert">
                    <strong>${alert.service}</strong>: ${alert.message}
                    <div class="timestamp">${new Date(alert.timestamp).toLocaleString()}</div>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="card">
            <h3>📊 Recent Checks</h3>
            <table>
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Service</th>
                        <th>Status</th>
                        <th>Response Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${monitoringData.checks.slice(-20).reverse().map(check => 
                      check.results.map(result => `
                        <tr>
                            <td class="timestamp">${new Date(result.timestamp).toLocaleTimeString()}</td>
                            <td>${result.name}</td>
                            <td class="status-${result.status}">${result.status.toUpperCase()}</td>
                            <td>${result.responseTime}ms</td>
                        </tr>
                      `).join('')
                    ).join('')}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>
  `;
}

// HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(generateDashboard());
  } else if (req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(monitoringData, null, 2));
  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Start monitoring
function startMonitoring() {
  log('🚀 Starting Saudi Mais System Monitor');
  log(`📊 Dashboard available at: http://localhost:${CONFIG.port}`);
  
  // Load existing data
  loadData();
  
  // Start HTTP server
  server.listen(CONFIG.port, () => {
    log(`🌐 Web dashboard listening on port ${CONFIG.port}`);
  });
  
  // Run initial check
  runChecks();
  
  // Schedule regular checks
  setInterval(runChecks, CONFIG.checkInterval);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    log('📊 Shutting down monitor...');
    saveData();
    server.close(() => {
      log('👋 Monitor stopped');
      process.exit(0);
    });
  });
}

// Start the monitor
startMonitoring();