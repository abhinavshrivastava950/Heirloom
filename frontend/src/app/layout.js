// frontend/src/app/layout.js
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Heirloom Digital Will",
  description: "Secure your legacy on the Stellar blockchain.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="container mx-auto max-w-4xl py-10 px-4">
          {children}
        </main>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}