const Table = ({ children, className = '' }) => {
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
        {children}
      </table>
    </div>
  );
};

const TableHeader = ({ children }) => {
  return (
    <thead className="bg-gray-50">
      {children}
    </thead>
  );
};

const TableBody = ({ children }) => {
  return (
    <tbody className="bg-white divide-y divide-gray-200">
      {children}
    </tbody>
  );
};

const TableRow = ({ children, className = '' }) => {
  return (
    <tr className={`hover:bg-gray-50 ${className}`}>
      {children}
    </tr>
  );
};

const TableCell = ({ children, className = '', header = false }) => {
  const baseClasses = 'px-6 py-4 text-sm';
  const cellClasses = header 
    ? `${baseClasses} font-medium text-gray-900 tracking-wider uppercase`
    : `${baseClasses} text-gray-900`;

  return (
    <td className={`${cellClasses} ${className}`}>
      {children}
    </td>
  );
};

Table.Header = TableHeader;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Cell = TableCell;

export default Table;