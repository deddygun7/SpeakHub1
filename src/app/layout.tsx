import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEON DRAM — виски-бар в неоновой сети",
  description:
    "Чат-бар в стиле виски и киберпанка: залы, личные сообщения, бармен-бот, уровни, достижения, закрытые комнаты и неон до утра.",
  keywords: ["чат", "общение", "виски", "киберпанк", "бар", "сообщество"],
  openGraph: {
    title: "NEON DRAM",
    description: "Виски-бар в неоновой сети. Заходи, наливай, общайся.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#090608",
  width: "device-width",
  initialScale: 1,
};

const themeInit = `
(function(){try{
  var t=localStorage.getItem('nd_theme')||'amber';
  document.documentElement.setAttribute('data-theme',t);
  if(localStorage.getItem('nd_crt')==='1'){document.documentElement.classList.add('crt');}
}catch(e){}})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" data-theme="amber" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,600;1,500;1,600&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
