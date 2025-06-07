import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Download, Copy, QrCode } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { generateQRCodeDataURL } from "@/lib/utils";

interface QRModalProps {
  quizId: number;
  onClose: () => void;
}

export default function QRModal({ quizId, onClose }: QRModalProps) {
  const { toast } = useToast();
  const [qrDataURL, setQrDataURL] = useState("");

  const { data: qrData } = useQuery({
    queryKey: [`/api/quizzes/${quizId}/qr`],
    enabled: !!quizId,
  });

  useEffect(() => {
    if (qrData?.qrData) {
      const dataURL = generateQRCodeDataURL(qrData.qrData);
      setQrDataURL(dataURL);
    }
  }, [qrData]);

  const handleCopyURL = () => {
    if (qrData?.url) {
      navigator.clipboard.writeText(qrData.url);
      toast({
        title: "URL Copied!",
        description: "Quiz URL has been copied to clipboard.",
      });
    }
  };

  const handleDownloadQR = () => {
    if (qrDataURL) {
      const link = document.createElement("a");
      link.href = qrDataURL;
      link.download = `quiz-${quizId}-qr.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "QR Code Downloaded!",
        description: "QR code has been saved to your downloads.",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md animate-in fade-in-50 slide-in-from-bottom-4 duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <QrCode className="mr-2 h-5 w-5" />
              Quiz QR Code
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-gray-600 text-sm">
            Participants can scan this code to join the quiz
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code Display */}
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            {qrDataURL ? (
              <img 
                src={qrDataURL} 
                alt="Quiz QR Code" 
                className="w-48 h-48 mx-auto border-2 border-gray-200 rounded-lg bg-white"
              />
            ) : (
              <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
          
          {/* Quiz URL */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Quiz URL:</div>
            <div className="font-mono text-sm text-primary break-all">
              {qrData?.url || "Loading..."}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={handleDownloadQR}
              disabled={!qrDataURL}
              className="flex-1 bg-primary text-white hover:bg-blue-600"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button
              onClick={handleCopyURL}
              disabled={!qrData?.url}
              variant="outline"
              className="flex-1"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy URL
            </Button>
          </div>
          
          <div className="text-center">
            <Badge variant="outline" className="text-xs">
              Quiz ID: {quizId}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
