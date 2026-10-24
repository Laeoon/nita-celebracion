/**
 * Servicio de compresión de imágenes en el cliente mediante Canvas.
 * Reduce fotos de cámara móvil (4-10 MB) a archivos ligeros (~150-250 KB)
 * respetando el aspecto original y cuidando los datos móviles en Venezuela.
 */

export async function comprimirImagenEnCliente(
  archivoImagen: File,
  maxDimension: number = 1200,
  calidad: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular escalado proporcional
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el contexto 2D de Canvas'));
          return;
        }

        // Suavizado de imagen de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Preferir WebP, fallback a JPEG
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              // Fallback directo si webp no fuera soportado
              canvas.toBlob(
                (fallbackBlob) => {
                  if (fallbackBlob) resolve(fallbackBlob);
                  else reject(new Error('Fallo al exportar el Blob comprimido'));
                },
                'image/jpeg',
                calidad
              );
            }
          },
          'image/webp',
          calidad
        );
      };

      img.onerror = () => reject(new Error('Error al cargar la imagen seleccionada'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
    reader.readAsDataURL(archivoImagen);
  });
}
