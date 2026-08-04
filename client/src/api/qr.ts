import apiClient from './client';

export async function getQRInfo() {
  return apiClient.get('/qr/info');
}

export async function downloadQR(params?: {
  format?: 'png' | 'svg';
  size?: number;
  fgColor?: string;
  bgColor?: string;
}) {
  return apiClient.get('/qr/download', {
    params,
    responseType: 'blob',
  });
}
