import React from 'react';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export const Table: React.FC<TableProps> = ({ children, className = '', ...props }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-loom-beige bg-loom-cream shadow-md">
      <table className={`w-full text-left border-collapse font-body text-base ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <thead className={`bg-loom-wood text-loom-cream font-heading text-lg border-b border-loom-gold/50 ${className}`}>
    {children}
  </thead>
);

export const TableBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <tbody className={`divide-y divide-loom-beige/40 ${className}`}>{children}</tbody>
);

export const TableRow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <tr className={`hover:bg-loom-sand/10 transition-colors ${className}`}>{children}</tr>
);

export const TableHead: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <th className={`p-4 font-semibold tracking-wide border-b border-loom-gold/20 ${className}`}>{children}</th>
);

export const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <td className={`p-4 text-loom-ink ${className}`}>{children}</td>
);
