export function NetworkErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow mb-2">Erreur</p>
      <p className="text-sm text-destructive max-w-sm">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 px-5 py-2.5 rounded-full border border-border text-sm"
        >
          Réessayer
        </button>
      ) : null}
    </div>
  );
}
