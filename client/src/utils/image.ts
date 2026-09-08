const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL || '';
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    envUrl.includes('localhost')
  ) {
    return '';
  }
  return envUrl;
};
const API_BASE = getApiBase();

export const getImageUrl = (path: string | undefined | null): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  
  // Only convert relative local upload paths (e.g. /uploads/ or uploads/) to absolute backend server URLs
  const isUpload = path.startsWith('/uploads') || path.startsWith('uploads');
  if (isUpload) {
    const serverHost = API_BASE.replace('/api', '');
    return `${serverHost}${path.startsWith('/') ? '' : '/'}${path}`;
  }
  
  // Statically served frontend assets (e.g., /menu-sketches/...) remain relative to the client host
  return path;
};
