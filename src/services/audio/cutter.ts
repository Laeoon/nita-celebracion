/**
 * Servicio de procesamiento y recorte físico de audio en cliente.
 * Extrae 30 segundos usando Web Audio API para no transferir MP3s completos por redes móviles.
 */

export async function recortarAudioEnCliente(
  audioFile: File,
  inicioSegundos: number,
  duracionSegundos: number = 30
): Promise<Blob> {
  const arrayBuffer = await audioFile.arrayBuffer();
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextClass();

  try {
    const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    
    // Validar rango
    const maxDuracion = decodedBuffer.duration;
    const start = Math.max(0, Math.min(inicioSegundos, maxDuracion));
    const duracionReal = Math.min(duracionSegundos, maxDuracion - start);

    const sampleRate = 22050; // Tasa optimizada para voz/música móvil (muy liviana)
    const totalSamples = Math.floor(duracionReal * sampleRate);

    // Renderizar a mono optimizado con OfflineAudioContext
    const offlineCtx = new OfflineAudioContext(1, totalSamples, sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;

    source.connect(offlineCtx.destination);
    source.start(0, start, duracionReal);

    const renderedBuffer = await offlineCtx.startRendering();

    // Codificar a WAV mono de 16-bit (compatible universalmente en iOS Safari y Android)
    const wavBlob = audioBufferToWav(renderedBuffer);
    return wavBlob;
  } finally {
    if (audioCtx.state !== 'closed') {
      await audioCtx.close();
    }
  }
}

/**
 * Convierte un AudioBuffer en un Blob formato WAV (PCM 16-bit)
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const channelData = buffer.getChannelData(0);
  const dataSize = channelData.length * bytesPerSample;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Escribir muestras PCM 16-bit
  let offset = 44;
  for (let i = 0; i < channelData.length; i++) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
