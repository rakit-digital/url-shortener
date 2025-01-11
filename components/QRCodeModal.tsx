import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode } from 'lucide-react';

interface QRCodeModalProps {
    url: string;
    title?: string;
}

export function QRCodeModal({ url, title }: QRCodeModalProps) {
    const downloadQRCode = () => {
        const svg = document.querySelector('.qr-code-svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL('image/png');
            
            const downloadLink = document.createElement('a');
            downloadLink.download = `qr-code-${title || 'url'}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                    <QrCode className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>QR Code</DialogTitle>
                    <DialogDescription>
                        Scan this QR code to access the shortened URL
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center space-y-4 p-4">
                    <QRCodeSVG
                        value={url}
                        size={256}
                        level="H"
                        className="qr-code-svg"
                        includeMargin
                    />
                    <Button onClick={downloadQRCode} className="w-full">
                        Download QR Code
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
