import axios from 'axios';

// Turns any backend error into one readable string
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Cannot reach the server. Try again.';
    const message = error.response.data?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
  }
  return 'Something went wrong. Try again.';
}