import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock firebase/auth
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  signInAnonymously: vi.fn(),
  signInWithPopup: vi.fn(),
  GithubAuthProvider: vi.fn(),
  linkWithCredential: vi.fn(),
  EmailAuthProvider: { credential: vi.fn() },
  connectAuthEmulator: vi.fn(),
}));

// Mock firebase/app
vi.mock("@/lib/firebase", () => ({
  app: {},
  auth: {},
}));

// Mock createPortal so SignInModal renders inline
vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return { ...actual, createPortal: (children: any) => children };
});

// Simple stub for next/dynamic — renders the real SignInModal via import
let SignInModalComp: any = null;
vi.mock("next/dynamic", () => ({
  default: vi.fn(() => {
    return function DynamicStub(props: any) {
      // Lazily resolve the actual module at render time
      if (!SignInModalComp) {
        // Use dynamic import to get the real component
        import("../src/components/auth/SignInModal").then(
          (mod) => (SignInModalComp = mod.default)
        );
      }
      if (!SignInModalComp) return null;
      const { createElement } = require("react");
      return createElement(SignInModalComp, props);
    };
  }),
}));

import { AuthButton } from "@/components/auth/AuthButton";
import SignInModal from "@/components/auth/SignInModal";
import { useAuth } from "@/contexts/AuthContext";

// Mock AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("SignInModal", () => {
  const mockSignIn = vi.fn();
  const mockSignUp = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email and password fields when open", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      loading: false,
      isAnonymous: false,
      signIn: mockSignIn,
      signUp: mockSignUp,
      signInAnonymous: vi.fn(),
      signInGitHub: vi.fn(),
      logOut: vi.fn(),
      upgradeAnonymous: vi.fn(),
    });

    render(<SignInModal open={true} onOpenChange={mockOnClose} />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();

    const signInElements = screen.getAllByText("Sign In");
    expect(signInElements.length).toBeGreaterThan(0);
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      loading: false,
      isAnonymous: false,
      signIn: mockSignIn,
      signUp: mockSignUp,
      signInAnonymous: vi.fn(),
      signInGitHub: vi.fn(),
      logOut: vi.fn(),
      upgradeAnonymous: vi.fn(),
    });

    const { container } = render(
      <SignInModal open={false} onOpenChange={mockOnClose} />
    );

    expect(container.innerHTML).toBe("");
  });

  it("renders anonymous and GitHub sign-in options", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      loading: false,
      isAnonymous: false,
      signIn: mockSignIn,
      signUp: mockSignUp,
      signInAnonymous: vi.fn(),
      signInGitHub: vi.fn(),
      logOut: vi.fn(),
      upgradeAnonymous: vi.fn(),
    });

    render(<SignInModal open={true} onOpenChange={mockOnClose} />);

    expect(screen.getByText("Continue as guest")).toBeInTheDocument();
    expect(screen.getByText("Continue with GitHub")).toBeInTheDocument();
  });
});

describe("AuthButton", () => {
  const mockLogOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 'Sign In to Sync' when signed out", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      loading: false,
      isAnonymous: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signInAnonymous: vi.fn(),
      signInGitHub: vi.fn(),
      logOut: mockLogOut,
      upgradeAnonymous: vi.fn(),
    });

    render(<AuthButton />);

    expect(screen.getByText("Sign In to Sync")).toBeInTheDocument();
  });

  it("renders user email when signed in", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { email: "test@example.com", displayName: null },
      loading: false,
      isAnonymous: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signInAnonymous: vi.fn(),
      signInGitHub: vi.fn(),
      logOut: mockLogOut,
      upgradeAnonymous: vi.fn(),
    });

    render(<AuthButton />);

    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("renders 'Guest' when anonymous user", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { email: null, displayName: null, isAnonymous: true },
      loading: false,
      isAnonymous: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signInAnonymous: vi.fn(),
      signInGitHub: vi.fn(),
      logOut: mockLogOut,
      upgradeAnonymous: vi.fn(),
    });

    render(<AuthButton />);

    expect(screen.getByText("Guest")).toBeInTheDocument();
  });

  it("shows loading state during auth initialization", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      loading: true,
      isAnonymous: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signInAnonymous: vi.fn(),
      signInGitHub: vi.fn(),
      logOut: mockLogOut,
      upgradeAnonymous: vi.fn(),
    });

    render(<AuthButton />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
