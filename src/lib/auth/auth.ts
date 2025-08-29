import { LoginCredentials, RegisterData, AuthResponse, User } from "../types";

// TODO: Replace with actual API endpoints
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // TODO: Implement actual login API call
    console.log("Logging in with:", credentials);
    
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          user: {
            id: "1",
            name: "John Doe",
            email: credentials.email,
            avatar: "/avatars/john.jpg",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          token: "mock-jwt-token",
        });
      }, 1000);
    });
  }

  static async register(data: RegisterData): Promise<AuthResponse> {
    // TODO: Implement actual registration API call
    console.log("Registering with:", data);
    
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          user: {
            id: "1",
            name: data.name,
            email: data.email,
            avatar: "/avatars/default.jpg",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          token: "mock-jwt-token",
        });
      }, 1000);
    });
  }

  static async logout(): Promise<void> {
    // TODO: Implement actual logout API call
    console.log("Logging out");
    
    // Clear local storage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
  }

  static async getCurrentUser(): Promise<User | null> {
    // TODO: Implement actual current user API call
    const token = localStorage.getItem("auth_token");
    const userStr = localStorage.getItem("user");
    
    if (!token || !userStr) {
      return null;
    }
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  static setAuthData(authResponse: AuthResponse): void {
    localStorage.setItem("auth_token", authResponse.token);
    localStorage.setItem("user", JSON.stringify(authResponse.user));
  }

  static getAuthToken(): string | null {
    return localStorage.getItem("auth_token");
  }

  static isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}
