import './globals.css';

export const metadata = { title: 'BRPS' };

export default function Layout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
