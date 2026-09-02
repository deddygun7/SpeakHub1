import React, { useState } from 'react';

export default function FounderBadgeAnimated({ nick }: { nick?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block founder-badge" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <div className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-black founder-border-gradient shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-black" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.293a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.293c.3.921-.755 1.688-1.54 1.118L10 13.347l-2.81 1.966c-.784.57-1.838-.197-1.539-1.118l1.07-3.293a1 1 0 00-.364-1.118L3.566 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.293z" />
        </svg>
        FOUNDER
      </div>

      {/* tiny sparkle accent */}
      <svg className="absolute -top-2 -right-2 h-4 w-4 sparkle" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2l1.176 3.588L17 7l-3.824 1.412L12 12l-1.176-3.588L7 7l3.824-1.412L12 2z" fill="#FFD166" />
      </svg>

      {open && (
        <div className="absolute z-50 mt-2 right-0 founder-popover">
          <div className="text-sm font-semibold">{nick ?? 'Founder'}</div>
          <div className="text-xs text-gray-300 mt-1">Основатель проекта — имеет полный доступ и права управления. Спасибо, что вы здесь 🎖️</div>
          <div className="mt-2 text-xs text-yellow-200">Нажмите, чтобы узнать больше</div>
        </div>
      )}
    </div>
  );
}
