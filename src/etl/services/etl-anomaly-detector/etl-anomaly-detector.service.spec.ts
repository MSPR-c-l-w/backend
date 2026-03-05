import { EtlAnomalyDetectorService } from './etl-anomaly-detector.service';

describe('EtlAnomalyDetectorService', () => {
  let service: EtlAnomalyDetectorService;

  beforeEach(() => {
    service = new EtlAnomalyDetectorService();
  });

  it('should return no anomaly for valid nutrition payload', () => {
    const anomalies = service.detectForPipeline('nutrition', {
      name: 'Pomme',
      category: 'Fruit',
      calories_kcal: 52,
      protein_g: 0.3,
      carbohydrates_g: 14,
      fat_g: 0.2,
      fiber_g: 2.4,
      sugar_g: 10.4,
      sodium_mg: 1,
      cholesterol_mg: 0,
      water_intake_ml: 85,
    });

    expect(anomalies).toEqual([]);
  });

  it('should detect required and numeric anomalies for nutrition', () => {
    const anomalies = service.detectForPipeline('nutrition', {
      name: '',
      category: null,
      calories_kcal: -12,
      protein_g: 'abc',
      carbohydrates_g: -1,
      fat_g: -2,
      fiber_g: -3,
      sugar_g: -4,
      sodium_mg: -5,
      cholesterol_mg: -6,
      water_intake_ml: -7,
    });

    const codes = (anomalies as Array<{ code: string }>).map((a) => a.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        'NAME_REQUIRED',
        'CATEGORY_REQUIRED',
        'CALORIES_INVALID',
        'PROTEIN_INVALID',
        'CARBOHYDRATES_INVALID',
        'FAT_INVALID',
        'FIBER_INVALID',
        'SUGAR_INVALID',
        'SODIUM_INVALID',
        'CHOLESTEROL_INVALID',
        'WATER_INTAKE_INVALID',
      ]),
    );
  });

  it('should detect array anomalies for exercise', () => {
    const anomalies = service.detectForPipeline('exercise', {
      name: '',
      instructions: [],
      primary_muscles: 'pecs',
      secondary_muscles: [1, 2],
      image_urls: null,
    });

    const codes = (anomalies as Array<{ code: string }>).map((a) => a.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        'NAME_REQUIRED',
        'INSTRUCTIONS_INVALID_EMPTY',
        'PRIMARY_MUSCLES_INVALID',
        'SECONDARY_MUSCLES_INVALID',
        'IMAGE_URLS_INVALID',
      ]),
    );
  });

  it('should detect health-profile boundaries and user_id', () => {
    const anomalies = service.detectForPipeline('health-profile', {
      user_id: 0,
      bmi: 7,
      weight: 900,
      daily_calories_target: 20000,
    });

    const codes = (anomalies as Array<{ code: string }>).map((a) => a.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        'USER_ID_INVALID',
        'BMI_OUT_OF_RANGE',
        'WEIGHT_OUT_OF_RANGE',
        'DAILY_CALORIES_OUT_OF_RANGE',
      ]),
    );
  });

  it('should allow nullable optional health-profile fields', () => {
    const anomalies = service.detectForPipeline('health-profile', {
      user_id: 12,
      bmi: null,
      weight: '',
      daily_calories_target: undefined,
    });

    expect(anomalies).toEqual([]);
  });
});
