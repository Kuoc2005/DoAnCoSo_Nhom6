import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { HubLayout } from "./layouts/HubLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { ProfileLayout } from "./layouts/ProfileLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { AuthProvider } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import PlayerPublicPage from "./pages/PlayerPublicPage";
import ProfileHubPage from "./pages/profile/ProfileHubPage";
import ProfileAccountPage from "./pages/profile/ProfileAccountPage";
import ProfileGamingPage from "./pages/profile/ProfileGamingPage";
import ProfileListingPage from "./pages/profile/ProfileListingPage";
import ProviderStudioPage from "./pages/profile/ProviderStudioPage";
import WalletPage from "./pages/profile/WalletPage";
import AdminOverviewPage from "./pages/admin/AdminOverviewPage";
import AdminRevenuePage from "./pages/admin/AdminRevenuePage";
import AdminProvidersPage from "./pages/admin/AdminProvidersPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminSeekersPage from "./pages/admin/AdminSeekersPage";
import AdminHubListingsPage from "./pages/admin/AdminHubListingsPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminMessagesPage from "./pages/admin/AdminMessagesPage";
import MessagesPage from "./pages/MessagesPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import BecomeProviderPage from "./pages/BecomeProviderPage";
import SigninPage from "./pages/SigninPage";
import SignupPage from "./pages/SignupPage";
import { Toaster } from "sonner";

function App() {
  return (
    <>
      <Toaster richColors />

      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<HubLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/explore/game/:gameSlug" element={<ExplorePage />} />
              <Route path="/players/:username" element={<PlayerPublicPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/profile" element={<ProfileLayout />}>
                <Route index element={<ProfileHubPage />} />
                <Route path="account" element={<ProfileAccountPage />} />
                <Route path="wallet" element={<WalletPage />} />
                <Route path="gaming" element={<ProfileGamingPage />} />
                <Route path="listing" element={<ProfileListingPage />} />
                <Route path="provider-studio" element={<ProviderStudioPage />} />
                <Route path="become-provider" element={<BecomeProviderPage />} />
              </Route>
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/become-provider" element={<Navigate to="/profile/become-provider" replace />} />
            </Route>

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverviewPage />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="revenue" element={<AdminRevenuePage />} />
              <Route path="providers" element={<AdminProvidersPage />} />
              <Route path="hub-listings" element={<AdminHubListingsPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="seekers" element={<AdminSeekersPage />} />
              <Route path="messages" element={<AdminMessagesPage />} />
            </Route>

            <Route element={<AuthLayout />}>
              <Route path="/signin" element={<SigninPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
