import { FirebaseAuthError } from './firebase-error-codes';

export function getFirebaseAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case FirebaseAuthError.EmailAlreadyExists:
      return 'The email address is already in use by another account.';
    case FirebaseAuthError.InvalidEmail:
      return 'The email address is not valid.';
    case FirebaseAuthError.MissingEmail:
      return 'The email address cannot be empty.';
    case FirebaseAuthError.MissingPassword:
      return 'The password cannot be empty.';
    case FirebaseAuthError.InvalidCredential:
      return 'The password is invalid.';
    case FirebaseAuthError.WeakPassword:
      return 'The password must be at least 6 characters long.';
    default:
      return 'An unknown error occurred. Please try again.';
  }
}
