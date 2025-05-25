
import type React from 'react';

interface CustomInvoiceIconProps extends React.SVGProps<SVGSVGElement> {}

export const CustomInvoiceIcon: React.FC<CustomInvoiceIconProps> = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5" // Standard Lucide stroke width
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Document Body: A rounded rectangle (based on Lucide's 'file' but without the top-right fold) */}
      {/* This path defines a document from x=4 to x=16 (width 12), y=2 to y=22 (height 20) */}
      <path d="M16 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
      
      {/* Lines in document, centered within the document body (x=4 to x=16) */}
      <line x1="7" y1="7" x2="13" y2="7" />
      <line x1="7" y1="10" x2="13" y2="10" />

      {/* Dollar Sign and its line segment */}
      {/* The dollar sign is centered around x=10, y=13 */}
      <line x1="7" y1="13" x2="8.5" y2="13" /> {/* Line before dollar */}
      {/* Dollar 'S' Shape (simplified) */}
      <path d="M10.5 11.5c0-.27.22-.5.5-.5s.5.23.5.5v.5c0 .28-.22.5-.5.5h-.5c-.28 0-.5.22-.5.5v.5c0 .28.22.5.5.5s.5-.22.5-.5" />
      {/* Dollar Vertical Bar */}
      <line x1="10" y1="11.5" x2="10" y2="14.5" />
      <line x1="11.5" y1="13" x2="13" y2="13" /> {/* Line after dollar */}

      {/* Checkmark Circle: Positioned to overlap the document's bottom-right */}
      {/* cx="15.5", cy="16.5", r="3.5" means circle spans x=12 to x=19, y=13 to y=20 */}
      <circle cx="15.5" cy="16.5" r="3.5" />
      {/* Checkmark Path (tick) inside the circle */}
      <path d="M14 16.5l1 1 2-2" />
    </svg>
  );
};
