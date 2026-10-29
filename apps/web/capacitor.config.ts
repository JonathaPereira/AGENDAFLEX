import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.agendaflex.ross',
  appName: 'Ross Barbearia',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  backgroundColor: '#100d0a',
  ios: { contentInset: 'automatic' },
};
export default config;
