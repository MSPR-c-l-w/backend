export interface IExercise_LogService {
  getGlobalTopExercises(): Promise<any[]>;
  getTopExercises(userId: number): Promise<any[]>;

  runLogsImportPipeline(): Promise<number>;

  getExerciseLogs(): Promise<any[]>;
  getExerciseLogById(id: number): Promise<any>;
}

export interface IExercise_LogController {
  triggerImport(): Promise<{ message: string; count: number }>;
  getGlobalTopExercises(): Promise<any[]>;
  getTopExercises(userId: number): Promise<any[]>;
  getExerciseLogs(): Promise<any[]>;
  getExerciseLogById(id: number): Promise<any>;
}
