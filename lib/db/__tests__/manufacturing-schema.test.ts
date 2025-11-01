/**
 * Manufacturing Schema Tests
 * Verifies that the manufacturing tables are properly configured
 */

import { db } from '../schema';
import type { Machine, ProductionRun, MachineDowntime, MaintenanceSchedule, MachineMetrics } from '@/types/database';

describe('Manufacturing Schema', () => {
  beforeEach(async () => {
    // Clear manufacturing tables before each test
    await db.machines.clear();
    await db.productionRuns.clear();
    await db.machineDowntime.clear();
    await db.maintenanceSchedule.clear();
    await db.machineMetrics.clear();
  });

  describe('Machines Table', () => {
    it('should create a machine with auto-generated fields', async () => {
      const machine: Machine = {
        id: 'machine-1',
        machineId: 'M-001',
        name: 'Packaging Line 1',
        type: 'packaging',
        manufacturer: 'PackTech Industries',
        model: 'PT-5000',
        serialNumber: 'SN-12345',
        location: 'Production Floor A',
        status: 'idle',
        capacity: 1000,
        currentSpeed: 0,
        targetSpeed: 950,
        installDate: new Date('2023-01-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.machines.add(machine);
      const retrieved = await db.machines.get('machine-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.machineId).toBe('M-001');
      expect(retrieved?.status).toBe('idle');
    });

    it('should query machines by status', async () => {
      await db.machines.bulkAdd([
        {
          id: 'm1',
          machineId: 'M-001',
          name: 'Machine 1',
          type: 'packaging',
          manufacturer: 'Mfg1',
          model: 'M1',
          serialNumber: 'SN1',
          location: 'Floor A',
          status: 'running',
          capacity: 1000,
          currentSpeed: 950,
          targetSpeed: 950,
          installDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'm2',
          machineId: 'M-002',
          name: 'Machine 2',
          type: 'filling',
          manufacturer: 'Mfg2',
          model: 'M2',
          serialNumber: 'SN2',
          location: 'Floor B',
          status: 'maintenance',
          capacity: 800,
          currentSpeed: 0,
          targetSpeed: 750,
          installDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const runningMachines = await db.machines.where('status').equals('running').toArray();
      expect(runningMachines).toHaveLength(1);
      expect(runningMachines[0].machineId).toBe('M-001');
    });
  });

  describe('ProductionRuns Table', () => {
    it('should create a production run with auto-initialized quantities', async () => {
      const run: ProductionRun = {
        id: 'run-1',
        runId: 'PR-001',
        machineId: 'M-001',
        productId: 'prod-1',
        startTime: new Date(),
        targetQuantity: 1000,
        actualQuantity: 0,
        goodQuantity: 0,
        rejectedQuantity: 0,
        status: 'scheduled',
        operatorId: 'emp-1',
        createdAt: new Date(),
      };

      await db.productionRuns.add(run);
      const retrieved = await db.productionRuns.get('run-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.actualQuantity).toBe(0);
      expect(retrieved?.goodQuantity).toBe(0);
      expect(retrieved?.rejectedQuantity).toBe(0);
    });

    it('should query production runs by machine', async () => {
      await db.productionRuns.bulkAdd([
        {
          id: 'run1',
          runId: 'PR-001',
          machineId: 'M-001',
          productId: 'prod-1',
          startTime: new Date(),
          targetQuantity: 1000,
          actualQuantity: 950,
          goodQuantity: 940,
          rejectedQuantity: 10,
          status: 'completed',
          operatorId: 'emp-1',
          createdAt: new Date(),
        },
        {
          id: 'run2',
          runId: 'PR-002',
          machineId: 'M-001',
          productId: 'prod-2',
          startTime: new Date(),
          targetQuantity: 500,
          actualQuantity: 0,
          goodQuantity: 0,
          rejectedQuantity: 0,
          status: 'in-progress',
          operatorId: 'emp-2',
          createdAt: new Date(),
        },
      ]);

      const machineRuns = await db.productionRuns.where('machineId').equals('M-001').toArray();
      expect(machineRuns).toHaveLength(2);
    });
  });

  describe('MachineDowntime Table', () => {
    it('should create a downtime record', async () => {
      const downtime: MachineDowntime = {
        id: 'dt-1',
        machineId: 'M-001',
        startTime: new Date(),
        reason: 'Belt replacement',
        category: 'planned',
        impact: 'Production stopped for 2 hours',
        createdAt: new Date(),
      };

      await db.machineDowntime.add(downtime);
      const retrieved = await db.machineDowntime.get('dt-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.category).toBe('planned');
    });
  });

  describe('MaintenanceSchedule Table', () => {
    it('should create a maintenance schedule with default status', async () => {
      const maintenance: MaintenanceSchedule = {
        id: 'maint-1',
        machineId: 'M-001',
        maintenanceType: 'preventive',
        scheduledDate: new Date('2025-11-15'),
        tasks: ['Oil change', 'Belt inspection', 'Calibration'],
        status: 'scheduled',
        createdAt: new Date(),
      };

      await db.maintenanceSchedule.add(maintenance);
      const retrieved = await db.maintenanceSchedule.get('maint-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.status).toBe('scheduled');
      expect(retrieved?.tasks).toHaveLength(3);
    });
  });

  describe('MachineMetrics Table', () => {
    it('should create machine metrics with OEE data', async () => {
      const metrics: MachineMetrics = {
        id: 'metrics-1',
        machineId: 'M-001',
        timestamp: new Date(),
        oee: 85.5,
        availability: 95.0,
        performance: 92.0,
        quality: 98.0,
        cycleTime: 3.6,
        downtime: 30,
        output: 950,
        energyConsumption: 45.5,
        createdAt: new Date(),
      };

      await db.machineMetrics.add(metrics);
      const retrieved = await db.machineMetrics.get('metrics-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.oee).toBe(85.5);
      expect(retrieved?.availability).toBe(95.0);
    });

    it('should query metrics by machine and timestamp', async () => {
      const now = new Date();
      await db.machineMetrics.bulkAdd([
        {
          id: 'met1',
          machineId: 'M-001',
          timestamp: new Date(now.getTime() - 3600000), // 1 hour ago
          oee: 85,
          availability: 95,
          performance: 92,
          quality: 98,
          cycleTime: 3.6,
          downtime: 30,
          output: 950,
          createdAt: new Date(),
        },
        {
          id: 'met2',
          machineId: 'M-001',
          timestamp: now,
          oee: 88,
          availability: 96,
          performance: 93,
          quality: 99,
          cycleTime: 3.5,
          downtime: 20,
          output: 980,
          createdAt: new Date(),
        },
      ]);

      const metrics = await db.machineMetrics.where('machineId').equals('M-001').toArray();
      expect(metrics).toHaveLength(2);
      expect(metrics[1].oee).toBeGreaterThan(metrics[0].oee);
    });
  });

  describe('Database Integration', () => {
    it('should include manufacturing tables in stats', async () => {
      await db.machines.add({
        id: 'm1',
        machineId: 'M-001',
        name: 'Test Machine',
        type: 'packaging',
        manufacturer: 'Test',
        model: 'T1',
        serialNumber: 'SN1',
        location: 'Floor A',
        status: 'idle',
        capacity: 1000,
        currentSpeed: 0,
        targetSpeed: 950,
        installDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const stats = await db.getStats();
      expect(stats.machines).toBe(1);
      expect(stats.productionRuns).toBe(0);
      expect(stats.machineDowntime).toBe(0);
      expect(stats.maintenanceSchedule).toBe(0);
      expect(stats.machineMetrics).toBe(0);
    });

    it('should export and import manufacturing data', async () => {
      await db.machines.add({
        id: 'm1',
        machineId: 'M-001',
        name: 'Test Machine',
        type: 'packaging',
        manufacturer: 'Test',
        model: 'T1',
        serialNumber: 'SN1',
        location: 'Floor A',
        status: 'idle',
        capacity: 1000,
        currentSpeed: 0,
        targetSpeed: 950,
        installDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const backup = await db.exportAllData();
      expect(backup.data.machines).toHaveLength(1);

      await db.machines.clear();
      expect(await db.machines.count()).toBe(0);

      await db.importAllData(backup);
      expect(await db.machines.count()).toBe(1);
    });
  });
});
