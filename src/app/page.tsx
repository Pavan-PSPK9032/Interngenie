"use client";
import { useEffect } from "react";
import { useApp } from "@/lib/store";
import { Navbar } from "@/components/app/navbar";
import { Footer } from "@/components/app/footer";
import { BottomNav } from "@/components/app/bottom-nav";
import { Chatbot } from "@/components/app/chatbot";
import { ToastContainer } from "@/components/app/toast-container";

import { LandingPage } from "@/components/app/landing-page";
import { AuthView } from "@/components/app/auth-view";
import { StudentDashboard } from "@/components/app/student-dashboard";
import { InternshipSearch } from "@/components/app/internship-search";
import { InternshipDetail } from "@/components/app/internship-detail";
import { StudentProfile } from "@/components/app/student-profile";
import { StudentApplications } from "@/components/app/student-applications";
import { CompanyDashboard } from "@/components/app/company-dashboard";
import { PostInternship } from "@/components/app/post-internship";
import { CompanyApplicants } from "@/components/app/company-applicants";
import { AdminDashboard } from "@/components/app/admin-dashboard";
import { AdminCompanies } from "@/components/app/admin-companies";
import { AdminUsers } from "@/components/app/admin-users";

export default function Home() {
  const { view, user, navigate } = useApp();

  // Route guard — redirect to auth if accessing protected views without login
  useEffect(() => {
    const protectedViews = [
      "student-dashboard", "student-profile", "student-applications",
      "company-dashboard", "company-post-internship", "company-applicants",
      "admin-dashboard", "admin-companies", "admin-internships",
    ];
    if (!user && protectedViews.includes(view)) {
      navigate("auth");
    }
    // Role-based guard
    if (user) {
      const studentViews = ["student-dashboard", "student-profile", "student-applications"];
      const companyViews = ["company-dashboard", "company-post-internship", "company-applicants"];
      const adminViews = ["admin-dashboard", "admin-companies", "admin-internships"];
      if (user.role === "STUDENT" && (companyViews.includes(view) || adminViews.includes(view))) {
        navigate("student-dashboard");
      } else if (user.role === "COMPANY" && (studentViews.includes(view) || adminViews.includes(view))) {
        navigate("company-dashboard");
      } else if (user.role === "ADMIN" && (studentViews.includes(view) || companyViews.includes(view))) {
        navigate("admin-dashboard");
      }
    }
  }, [view, user, navigate]);

  // Render the appropriate view
  const renderView = () => {
    switch (view) {
      case "home":
        return <LandingPage />;
      case "auth":
        return <AuthView />;
      case "internships":
        return <InternshipSearch />;
      case "internship-detail":
        return <InternshipDetail />;
      case "student-dashboard":
        return user ? <StudentDashboard /> : <AuthView />;
      case "student-profile":
        return user ? <StudentProfile /> : <AuthView />;
      case "student-applications":
        return user ? <StudentApplications /> : <AuthView />;
      case "company-dashboard":
        return user ? <CompanyDashboard /> : <AuthView />;
      case "company-post-internship":
        return user ? <PostInternship /> : <AuthView />;
      case "company-applicants":
        return user ? <CompanyApplicants /> : <AuthView />;
      case "admin-dashboard":
        return user ? <AdminDashboard /> : <AuthView />;
      case "admin-companies":
        return user ? <AdminCompanies /> : <AuthView />;
      case "admin-internships":
        return user ? <AdminUsers /> : <AuthView />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0">{renderView()}</main>
      <Footer />
      <BottomNav />
      <Chatbot />
      <ToastContainer />
    </div>
  );
}
