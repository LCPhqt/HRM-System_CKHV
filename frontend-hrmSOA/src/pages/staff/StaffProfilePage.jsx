import React, { useState } from "react";
import ProfilePage from "../ProfilePage";
import StaffSidebar from "../../components/StaffSidebar";

export default function StaffProfilePage() {
  const [editMode, setEditMode] = useState(false);

  return (
    <div className="h-screen bg-slate-100 flex overflow-hidden">
      <StaffSidebar />
      <main className="flex-1 overflow-y-auto">
        <ProfilePage
          readOnly={!editMode}
          actionSlot={
            <button
              onClick={() => setEditMode((p) => !p)}
              className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-700"
            >
              {editMode ? "Quay lại xem" : "Chỉnh sửa thông tin"}
            </button>
          }
        />
      </main>
    </div>
  );
}
