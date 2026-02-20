import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Slider } from '@mui/material';
import { X, Check } from 'lucide-react';

interface ImageCropperModalProps {
    isOpen: boolean;
    imageSrc: string | null;
    onCancel: () => void;
    onCropComplete: (croppedImage: string) => void;
    aspect?: number; // Default 1 for square
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ isOpen, imageSrc, onCancel, onCropComplete, aspect = 1 }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async (imageSrc: string, pixelCrop: any) => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return null;
        }

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

        return canvas.toDataURL('image/jpeg');
    };

    const handleSave = async () => {
        if (imageSrc && croppedAreaPixels) {
            try {
                const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
                if (croppedImage) {
                    onCropComplete(croppedImage);
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    if (!isOpen || !imageSrc) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0160C9] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col h-[80vh] md:h-[600px]">
                <div className="flex justify-between items-center p-4 border-b border-white/10 bg-[#0041C7]">
                    <h3 className="text-white font-bold text-lg">Adjust Image</h3>
                    <button onClick={onCancel} className="text-gray-300 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="relative flex-1 bg-black">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteHandler}
                        onZoomChange={onZoomChange}
                    />
                </div>

                <div className="p-6 bg-[#0041C7] border-t border-white/10 flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-white uppercase">Zoom</span>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#3ACBE8]"
                        />
                    </div>

                    <div className="flex gap-3 mt-2">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 py-3 rounded-xl font-bold text-[#0041C7] bg-[#3ACBE8] hover:bg-white transition shadow-lg shadow-[#3ACBE8]/20 flex items-center justify-center gap-2"
                        >
                            <Check size={18} /> Apply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageCropperModal;
