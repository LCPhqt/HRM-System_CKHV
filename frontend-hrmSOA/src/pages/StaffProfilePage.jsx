import React from "react";
import ProfilePage from "./ProfilePage";
import StaffSidebar from "../components/StaffSidebar";

export default function StaffProfilePage() {
  return (
    <div className="min-h-screen bg-slate-100 flex">
      <StaffSidebar />
      <main className="flex-1 p-10">
        <ProfilePage />
      </main>
    </div>
  );
}
