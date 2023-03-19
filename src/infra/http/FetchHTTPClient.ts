import { HTTPClient } from "./HTTPClient";

export class FetchHTTPClient extends HTTPClient {
  private getHeaders(auth?: string | undefined) {
    const headers = new Headers({
      "Content-Type": "application/json",
    })

    if (auth) {
      headers.append("Authorization", `Bearer ${auth}`)
    }

    return headers
  }


  async get<T>(url: string, auth?: string | undefined): Promise<T> {
    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(auth),
    })

    return response.json()
  }

  async post<T>(url: string, body: any, auth?: string | undefined): Promise<T> {
    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(auth),
      body: JSON.stringify(body),
    })

    return response.json()
  }

  async put<T>(url: string, body: any, auth?: string | undefined): Promise<T> {
    const response = await fetch(url, {
      method: "PUT",
      headers: this.getHeaders(auth),
      body: JSON.stringify(body),
    })

    return response.json()
  }

  async patch<T>(url: string, body: any, auth?: string | undefined): Promise<T> {
    const response = await fetch(url, {
      method: "PATCH",
      headers: this.getHeaders(auth),
      body: JSON.stringify(body),
    })

    return response.json()
  }

  async delete<T>(url: string, auth?: string | undefined): Promise<T> {
    const response = await fetch(url, {
      method: "DELETE",
      headers: this.getHeaders(auth),
    })

    return response.json()
  }
}