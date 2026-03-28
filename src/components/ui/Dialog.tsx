export const Dialog = ({ children }: { children: React.ReactNode }) => {
  return <div className="fixed inset-0 bg-black/30 flex items-center justify-center">{children}</div>;
};