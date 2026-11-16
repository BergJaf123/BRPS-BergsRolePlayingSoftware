export const metadata = { title: 'BRPS' };

export default function Layout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'sans-serif', padding: 16 }}>
        {children}
      </body>
    </html>
  );
}
