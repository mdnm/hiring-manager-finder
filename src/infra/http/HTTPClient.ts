export abstract class HTTPClient {
  abstract get<T>(url: string, auth?: string): Promise<T>;
  abstract post<T>(url: string, body: any, auth?: string): Promise<T>;
  abstract put<T>(url: string, body: any, auth?: string): Promise<T>;
  abstract patch<T>(url: string, body: any, auth?: string): Promise<T>;
  abstract delete<T>(url: string, auth?: string): Promise<T>;
}
