export function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function getMimeTypeFromDataUrl(dataUrl: string): string {
  if (!dataUrl.startsWith('data:')) {
    return 'image/jpeg';
  }

  const [header] = dataUrl.split(';');
  const [, mimeType] = header.split(':');
  return mimeType || 'image/jpeg';
}

export function scaleToMaxDimension(width: number, height: number, maxDim = 1600) {
  if (width <= 0 || height <= 0) {
    return { width: maxDim, height: maxDim };
  }

  let nextWidth = width;
  let nextHeight = height;

  if (nextWidth > nextHeight) {
    if (nextWidth > maxDim) {
      nextHeight *= maxDim / nextWidth;
      nextWidth = maxDim;
    }
  } else if (nextHeight > maxDim) {
    nextWidth *= maxDim / nextHeight;
    nextHeight = maxDim;
  }

  return {
    width: Math.round(nextWidth),
    height: Math.round(nextHeight),
  };
}

export function isApiKeyErrorMessage(message: string): boolean {
  return (
    message.includes('chave da API') ||
    message.includes('API key') ||
    message.includes('not valid') ||
    message.includes('API_KEY_NOT_FOUND')
  );
}

export function isAiOverloadedErrorMessage(message: string): boolean {
  return (
    message.includes('503') ||
    message.includes('UNAVAILABLE') ||
    message.includes('high demand') ||
    message.includes('overloaded')
  );
}

export function isQuotaErrorMessage(message: string): boolean {
  return (
    message.includes('429') ||
    message.includes('QUOTA_EXCEEDED') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('quota')
  );
}
