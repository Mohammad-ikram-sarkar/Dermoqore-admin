class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

class ApiClient {
  private getAuthHeaders(): Record<string, string> {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async post<T = unknown>(path: string, body?: unknown) {
    const res = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Request failed" }));
      throw new ApiError(res.status, error.message || "Request failed");
    }

    const data: T = await res.json();
    return { data, status: res.status };
  }

  async get<T = unknown>(path: string) {
    const res = await fetch(path, {
      method: "GET",
      headers: {
        ...this.getAuthHeaders(),
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Request failed" }));
      throw new ApiError(res.status, error.message || "Request failed");
    }

    const data: T = await res.json();
    return { data, status: res.status };
  }

  async put<T = unknown>(path: string, body?: unknown) {
    const res = await fetch(path, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Request failed" }));
      throw new ApiError(res.status, error.message || "Request failed");
    }

    const data: T = await res.json();
    return { data, status: res.status };
  }

  async delete<T = unknown>(path: string) {
    const res = await fetch(path, {
      method: "DELETE",
      headers: {
        ...this.getAuthHeaders(),
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Request failed" }));
      throw new ApiError(res.status, error.message || "Request failed");
    }

    const data: T = res.status !== 204 ? await res.json() : undefined;
    return { data, status: res.status };
  }
}

export const api = new ApiClient();
export { ApiError };
