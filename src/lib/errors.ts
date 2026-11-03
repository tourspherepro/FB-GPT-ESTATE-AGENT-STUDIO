
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public readonly context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const prettyContext = JSON.stringify(
      context,
      (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (key === 'requestResourceData' && value.password) {
            return { ...value, password: '[REDACTED]' };
          }
        }
        return value;
      },
      2
    );

    super(
      `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${prettyContext}`
    );

    this.name = 'FirestorePermissionError';
    this.context = context;

    // This is to make the error message more readable in the console.
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, FirestorePermissionError);
    }
  }
}
