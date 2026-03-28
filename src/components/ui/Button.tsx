export const Button = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}) => {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="px-4 py-2 bg-blue-600 text-white rounded">
      {children}
    </button>
  );
};