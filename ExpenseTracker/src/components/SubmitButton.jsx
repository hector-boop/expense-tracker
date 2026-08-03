export const SubmitButton = ({
  loading = false,
  children,
  loadingText,
  icon: Icon,
  className = '',
  disabled = false,
  type = 'submit',
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`flex items-center justify-center gap-2 font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-2xl shadow-md border-2 border-rose-700 transition-all cursor-pointer ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
          {loadingText ? <span>{loadingText}</span> : <span>{children}</span>}
        </>
      ) : (
        <>
          {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};
