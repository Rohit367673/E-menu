const API_BASE = import.meta.env.VITE_API_URL || '';

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
