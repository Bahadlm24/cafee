import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

/**
 * Creates a cropped image from the original using canvas
 */
function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}

export default function ImageCropper({ imageSrc, onCropDone, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [aspect, setAspect] = useState(4 / 3);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  async function handleDone() {
    if (!croppedAreaPixels) return;
    const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
    const croppedFile = new File([croppedBlob], 'cropped.jpg', { type: 'image/jpeg' });
    onCropDone(croppedFile);
  }

  const aspects = [
    { label: '4:3', value: 4 / 3 },
    { label: '1:1', value: 1 },
    { label: '16:9', value: 16 / 9 },
    { label: 'Serbest', value: null },
  ];

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal-content" style={{ maxWidth: '550px', height: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 className="modal-title" style={{ fontSize: '1rem' }}>Görseli Kırp</h3>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>

        {/* Crop Area */}
        <div style={{ position: 'relative', flex: 1, background: '#000' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Controls */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
          {/* Aspect Ratio */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', justifyContent: 'center' }}>
            {aspects.map(a => (
              <button
                key={a.label}
                className={`btn btn-sm ${aspect === a.value ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setAspect(a.value)}
                style={{ fontSize: '0.75rem', padding: '5px 12px' }}
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* Zoom Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Yakınlaştır</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--primary)' }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>
              İptal
            </button>
            <button className="btn btn-primary" onClick={handleDone} style={{ flex: 1 }}>
              ✂️ Kırp ve Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
