export interface ISessionExerciseService {
  getGlobalTopExercises(): Promise<any[]>;
  getTopExercises(userId: number): Promise<any[]>;

  runLogsImportPipeline(): Promise<number>;

  getSessionExercises(): Promise<any[]>;
  getSessionExerciseById(sessionId: number, exerciseId: number): Promise<any>;
}

export interface ISessionExerciseController {
  triggerImport(): Promise<{ message: string; count: number }>;
  getGlobalTopExercises(): Promise<any[]>;
  getTopExercises(userId: number): Promise<any[]>;
  getSessionExercises(): Promise<any[]>;
  getSessionExerciseById(sessionId: number, exerciseId: number): Promise<any>;
}
