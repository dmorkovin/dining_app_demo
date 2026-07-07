export const biometrics = {
  isAvailable: async (): Promise<boolean> => false,
  getBiometryType: async (): Promise<string> => 'Face ID',
  authenticate: async (_reason: string): Promise<boolean> => false,
};
