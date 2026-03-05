import { EtlController } from './etl.controller';
import { EtlStagingService } from 'src/etl/services/etl-staging/etl-staging.service';
import { EtlService } from 'src/etl/services/etl/etl.service';

describe('EtlController', () => {
  let controller: EtlController;
  let etlStagingService: {
    findPendingWithoutAnomalies: jest.Mock;
    findPendingWithAnomalies: jest.Mock;
    updateStatus: jest.Mock;
    updateCleanedDataAndRecheck: jest.Mock;
  };
  let etlService: { getAllPipelineStatuses: jest.Mock };

  const now = new Date('2026-01-02T10:00:00.000Z');

  beforeEach(() => {
    etlStagingService = {
      findPendingWithoutAnomalies: jest.fn(),
      findPendingWithAnomalies: jest.fn(),
      updateStatus: jest.fn(),
      updateCleanedDataAndRecheck: jest.fn(),
    };
    etlService = {
      getAllPipelineStatuses: jest.fn(),
    };
    controller = new EtlController(
      etlStagingService as unknown as EtlStagingService,
      etlService as unknown as EtlService,
    );
  });

  it('should return pipelines status', () => {
    etlService.getAllPipelineStatuses.mockReturnValue({
      nutrition: false,
      exercise: true,
      'health-profile': false,
    });

    const result = controller.getPipelinesStatus();

    expect(result).toEqual({
      nutrition: false,
      exercise: true,
      'health-profile': false,
    });
  });

  it('should return mapped rows without anomalies and parse pagination params', async () => {
    etlStagingService.findPendingWithoutAnomalies.mockResolvedValue({
      items: [
        {
          id: 'n1',
          cleaned_data: { name: 'Pomme' },
          anomalies: [],
          status: 'PENDING',
          created_at: now,
          updated_at: now,
        },
      ],
      total: 1,
    });

    const result = await controller.getStagingPendingWithoutAnomalies(
      'nutrition',
      'pomme',
      '2',
      '25',
    );

    expect(etlStagingService.findPendingWithoutAnomalies).toHaveBeenCalledWith(
      'nutrition',
      'pomme',
      2,
      25,
    );
    expect(result.items[0]).toEqual({
      id: 'n1',
      cleaned_data: { name: 'Pomme' },
      anomalies: [],
      status: 'PENDING',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    });
  });

  it('should clamp invalid pagination values', async () => {
    etlStagingService.findPendingWithoutAnomalies.mockResolvedValue({
      items: [],
      total: 0,
    });

    await controller.getStagingPendingWithoutAnomalies(
      'exercise',
      undefined,
      '-1',
      '0',
    );

    expect(etlStagingService.findPendingWithoutAnomalies).toHaveBeenCalledWith(
      'exercise',
      undefined,
      1,
      20,
    );
  });

  it('should return mapped rows with anomalies', async () => {
    etlStagingService.findPendingWithAnomalies.mockResolvedValue({
      items: [
        {
          id: 'e1',
          cleaned_data: { name: 'Squat' },
          anomalies: [{ code: 'X' }],
          status: 'PENDING',
          created_at: now,
          updated_at: now,
        },
      ],
      total: 1,
    });

    const result = await controller.getStagingPendingWithAnomalies(
      'exercise',
      undefined,
      undefined,
      undefined,
    );

    expect(etlStagingService.findPendingWithAnomalies).toHaveBeenCalledWith(
      'exercise',
      undefined,
      1,
      20,
    );
    expect(result.items[0].anomalies).toEqual([{ code: 'X' }]);
  });

  it('should update staging status', async () => {
    etlStagingService.updateStatus.mockResolvedValue(3);

    const result = await controller.updateStagingStatus({
      pipeline: 'nutrition',
      ids: ['a', 'b', 'c'],
      status: 'APPROVED',
    });

    expect(etlStagingService.updateStatus).toHaveBeenCalledWith(
      'nutrition',
      ['a', 'b', 'c'],
      'APPROVED',
    );
    expect(result).toEqual({ updated: 3 });
  });

  it('should update cleaned_data and return mapped row', async () => {
    etlStagingService.updateCleanedDataAndRecheck.mockResolvedValue({
      id: 'h1',
      cleaned_data: { user_id: 12 },
      anomalies: [{ code: 'BMI_OUT_OF_RANGE' }],
      status: 'PENDING',
      created_at: now,
      updated_at: now,
    });

    const result = await controller.updateStagingCleanedData({
      pipeline: 'health-profile',
      id: 'h1',
      cleaned_data: { user_id: 12 },
    });

    expect(etlStagingService.updateCleanedDataAndRecheck).toHaveBeenCalledWith(
      'health-profile',
      'h1',
      { user_id: 12 },
    );
    expect(result.item).toEqual({
      id: 'h1',
      cleaned_data: { user_id: 12 },
      anomalies: [{ code: 'BMI_OUT_OF_RANGE' }],
      status: 'PENDING',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    });
  });
});
