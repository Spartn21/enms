import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Loader2 } from "lucide-react";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ChildrenManagement from "./pages/admin/ChildrenManagement";
import ClassesManagement from "./pages/admin/ClassesManagement";
import AdminAccessRequests from "./pages/admin/AdminAccessRequests";
import AttendanceManagement from "./pages/admin/AttendanceManagement";
import FeeManagement from "./pages/admin/FeeManagement";
import FeeTemplates from "./pages/admin/FeeTemplates";
import UsersManagement from "./pages/admin/UsersManagement";
import AdminMessages from "./pages/admin/MessagesPage";
import ReportsPage from "./pages/admin/ReportsPage";
import SettingsPage from "./pages/admin/SettingsPage";

import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherActivities from "./pages/teacher/TeacherActivities";
import TeacherMessages from "./pages/teacher/TeacherMessages";

import ParentDashboard from "./pages/parent/ParentDashboard";
import ParentRequestAccess from "./pages/parent/ParentRequestAccess";
import ParentActivities from "./pages/parent/ParentActivities";
import ParentFees from "./pages/parent/ParentFees";
import ParentMessages from "./pages/parent/ParentMessages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const Loading = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/children" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><ChildrenManagement /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><ClassesManagement /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/access-requests" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminAccessRequests /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AttendanceManagement /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><FeeManagement /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/messages" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminMessages /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><ReportsPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><SettingsPage /></DashboardLayout></ProtectedRoute>} />

            {/* Teacher Routes */}
            <Route path="/teacher" element={<ProtectedRoute allowedRoles={["teacher"]}><DashboardLayout><TeacherDashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/teacher/attendance" element={<ProtectedRoute allowedRoles={["teacher"]}><DashboardLayout><TeacherAttendance /></DashboardLayout></ProtectedRoute>} />
            <Route path="/teacher/activities" element={<ProtectedRoute allowedRoles={["teacher"]}><DashboardLayout><TeacherActivities /></DashboardLayout></ProtectedRoute>} />
            <Route path="/teacher/messages" element={<ProtectedRoute allowedRoles={["teacher"]}><DashboardLayout><TeacherMessages /></DashboardLayout></ProtectedRoute>} />

            {/* Parent Routes */}
            <Route path="/parent" element={<ProtectedRoute allowedRoles={["parent"]}><DashboardLayout><ParentDashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/parent/request-access" element={<ProtectedRoute allowedRoles={["parent"]}><DashboardLayout><ParentRequestAccess /></DashboardLayout></ProtectedRoute>} />
            <Route path="/parent/activities" element={<ProtectedRoute allowedRoles={["parent"]}><DashboardLayout><ParentActivities /></DashboardLayout></ProtectedRoute>} />
            <Route path="/parent/fees" element={<ProtectedRoute allowedRoles={["parent"]}><DashboardLayout><ParentFees /></DashboardLayout></ProtectedRoute>} />
            <Route path="/parent/messages" element={<ProtectedRoute allowedRoles={["parent"]}><DashboardLayout><ParentMessages /></DashboardLayout></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
