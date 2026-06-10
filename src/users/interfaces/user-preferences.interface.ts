export interface UserPreferencesRecord {
  language: string;
  units: string;
  privacy: {
    privateAccount: boolean;
    allowDirectMessages: boolean;
  };
}
