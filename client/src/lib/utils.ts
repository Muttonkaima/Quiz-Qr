import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}`);
}

export function isQuizStarted(quiz: any): boolean {
  if (!quiz.startDate || !quiz.startTime) return false;
  const startDateTime = formatDateTime(quiz.startDate, quiz.startTime);
  return new Date() >= startDateTime;
}

export function getTimeUntilStart(quiz: any): number {
  if (!quiz.startDate || !quiz.startTime) return 0;
  const startDateTime = formatDateTime(quiz.startDate, quiz.startTime);
  const now = new Date();
  return Math.max(0, Math.floor((startDateTime.getTime() - now.getTime()) / 1000));
}

export function generateQRCodeDataURL(text: string): string {
  // This would normally use a QR code library
  // For now, return a placeholder SVG
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="white"/>
      <rect x="10" y="10" width="20" height="20" fill="black"/>
      <rect x="40" y="10" width="20" height="20" fill="black"/>
      <rect x="70" y="10" width="20" height="20" fill="black"/>
      <rect x="10" y="40" width="20" height="20" fill="black"/>
      <rect x="70" y="40" width="20" height="20" fill="black"/>
      <rect x="10" y="70" width="20" height="20" fill="black"/>
      <rect x="40" y="70" width="20" height="20" fill="black"/>
      <rect x="70" y="70" width="20" height="20" fill="black"/>
      <text x="100" y="100" font-family="Arial" font-size="12" fill="black">QR Code</text>
      <text x="100" y="120" font-family="Arial" font-size="8" fill="gray">${text.substring(0, 20)}...</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
