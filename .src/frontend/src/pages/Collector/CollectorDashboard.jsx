import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import { ROLES, normalizeRole } from "../../constants/roles";


export default function CollectorDashboard() {
const navigate = useNavigate();
const [user, setUser] = useState(null);

useEffect(() => {

    const currentUser = authService.getCurrentUser();

    if (!currentUser) {
        navigate("/login");
        return;
    }

    if (
        normalizeRole(currentUser.role)
        !== ROLES.COLLECTOR
    ) {
        navigate("/");
        return;
    }

    setUser(currentUser);

}, [navigate]);

    const assignedRoutes = [
        {
            id: 1,
            routeName: "Tuyến Hải Châu",
            time: "07:00",
            status: "Assigned"
        },
        {
            id: 2,
            routeName: "Tuyến Sơn Trà",
            time: "09:00",
            status: "Assigned"
        }
    ];

    const complaints = [
        {
            id: 1,
            location: "Nguyễn Văn Linh",
            issue: "Rác tồn đọng"
        },
        {
            id: 2,
            location: "Cầu Rồng",
            issue: "Điểm tập kết quá tải"
        }
    ];
if (!user) {
    return (
        <div className="flex justify-center items-center h-screen">
            <h2>Loading...</h2>
        </div>
    );
}
    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-6xl mx-auto">

                <div className="mb-6">

    <h1 className="text-3xl font-bold">
        Collector Dashboard
    </h1>

    <p className="text-gray-500 mt-2">
        Xin chào, {user.fullName}
    </p>

</div>

                {/* Statistics */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">

                    <div className="bg-white rounded-xl p-5 shadow">
                        <h3 className="font-semibold">
                            Today's Routes
                        </h3>

                        <p className="text-3xl mt-2">
                            {assignedRoutes.length}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-5 shadow">
                        <h3 className="font-semibold">
                            Pending Tasks
                        </h3>

                        <p className="text-3xl mt-2">
                            {complaints.length}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-5 shadow">
                        <h3 className="font-semibold">
                            Completed
                        </h3>

                        <p className="text-3xl mt-2">
                            0
                        </p>
                    </div>

                </div>

                {/* Assigned Routes */}
                <div className="bg-white rounded-xl p-5 shadow mb-6">

                    <h2 className="text-xl font-bold mb-4">
                        Assigned Routes
                    </h2>

                    {
                        assignedRoutes.map(item => (
                            <div
                                key={item.id}
                                className="border rounded-lg p-4 mb-3"
                            >
                                <p>
                                    <strong>Tuyến:</strong> {item.routeName}
                                </p>

                                <p>
                                    <strong>Giờ:</strong> {item.time}
                                </p>

                                <p>
                                    <strong>Trạng thái:</strong> {item.status}
                                </p>
                            </div>
                        ))
                    }

                </div>

                {/* Complaints */}
                <div className="bg-white rounded-xl p-5 shadow mb-6">

                    <h2 className="text-xl font-bold mb-4">
                        Complaints Assigned
                    </h2>

                    {
                        complaints.map(item => (
                            <div
                                key={item.id}
                                className="border p-3 rounded-lg mb-3"
                            >
                                <p>
                                    <strong>Vị trí:</strong> {item.location}
                                </p>

                                <p>
                                    <strong>Vấn đề:</strong> {item.issue}
                                </p>

                                <button
                                    className="bg-blue-500 text-white px-3 py-1 rounded mt-2"
                                >
                                    Bắt đầu xử lý
                                </button>
                            </div>
                        ))
                    }

                </div>

                {/* Incident Report */}
                <div className="bg-white rounded-xl p-5 shadow">

                    <h2 className="text-xl font-bold mb-4">
                        Report Incident
                    </h2>

                    <textarea
                        className="w-full border p-3 rounded"
                        rows="4"
                        placeholder="Nhập nội dung sự cố..."
                    />

                    <button
                        className="bg-red-500 text-white px-4 py-2 rounded mt-3"
                    >
                        Gửi báo cáo
                    </button>

                </div>

            </div>
        </div>
    );
}