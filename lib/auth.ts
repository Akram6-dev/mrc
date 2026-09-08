export interface User {
  id: string
  username: string
  name: string
  role: "super_admin" | "admin"
}

class AuthService {
  private readonly STORAGE_KEY = "school_borrowing_user"

  async login(username: string, password: string): Promise<User> {
    // Fetch admin credentials from /api/settings
    const res = await fetch("/api/settings")
    if (!res.ok) throw new Error("Gagal mengambil data admin")
    const settings = await res.json()
    const users = [
      ...(settings.users || []),
      { id: "1", username: settings.admin.username, password: settings.admin.password, role: "super_admin" },
    ]
    const account = users.find(
      (user: { username: string; password: string }) => user.username === username && user.password === password,
    )

    if (account) {
      const user: User = {
        id: account.id,
        username: account.username,
        name: settings.siteName,
        role: account.role,
      }
      if (typeof window !== "undefined") {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user))
      }
      return user
    } else {
      throw new Error("Username atau password salah")
    }
  }

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.STORAGE_KEY)
    }
  }

  getCurrentUser(): User | null {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem(this.STORAGE_KEY)
      if (!userData) return null

      const user = JSON.parse(userData)
      return { ...user, role: user.role || "super_admin" }
    }
    return null
  }

  getAuthHeaders(): Record<string, string> {
    const user = this.getCurrentUser()
    return user ? { "x-user-name": user.username, "x-user-role": user.role } : {}
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }

  canAccess(pathname: string): boolean {
    const user = this.getCurrentUser()
    if (!user) return false
    if (user.role === "super_admin") return true

    return ["/", "/peminjaman", "/pengembalian", "/booking", "/riwayat"].includes(pathname)
  }
}

export const auth = new AuthService()
