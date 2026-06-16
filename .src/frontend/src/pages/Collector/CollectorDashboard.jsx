import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import { ROLES, normalizeRole } from "../../constants/roles";

export default function CollectorDashboard() {

    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    const [assignedRoutes, setAssignedRoutes] = useState([
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
    ]);

    const [complaints, setComplaints] = useState([
        {
            id: 1,
            location: "Nguyễn Văn Linh",
            issue: "Rác tồn đọng",
            status: "Chưa xử lý"
        },
        {
            id: 2,
            location: "Cầu Rồng",
            issue: "Điểm tập kết quá tải",
            status: "Chưa xử lý"
        }
    ]);
    const [incidentReport, setIncidentReport] = useState("");

    useEffect(() => {

        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            navigate("/login");
            return;
        }

        if (
            normalizeRole(currentUser.role) !== ROLES.COLLECTOR
        ) {
            navigate("/");
            return;
        }

        setUser(currentUser);

    }, [navigate]);

    const handleLogout = async () => {

        await authService.logout();
        navigate("/login");

    };
    const handleSendReport = () => {

    if (!incidentReport.trim()) {
        alert("Vui lòng nhập nội dung sự cố");
        return;
    }

    alert("Báo cáo đã được gửi!");

    console.log("Incident Report:", incidentReport);

    setIncidentReport("");
};

    const handleStartComplaint = (id) => {

        const updatedComplaints = complaints.map(item => {

            if (item.id === id) {
                return {
                    ...item,
                    status: "Đang xử lý"
                };
            }

            return item;
        });

        setComplaints(updatedComplaints);

    };

    const handleCompleteRoute = (id) => {

    const updatedRoutes = assignedRoutes.map(route => {

        if (route.id === id) {
            return {
                ...route,
                status: "Completed"
            };
        }

        return route;
    });

    setAssignedRoutes(updatedRoutes);

};

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

                {/* Header */}
                <div className="mb-6 flex justify-between items-center">

                    <div>

                        <h1 className="text-3xl font-bold">
                            Collector Dashboard
                        </h1>

                        <p className="text-gray-500 mt-2">
                            Xin chào, {user.fullName}
                        </p>

                    </div>

                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                    >
                        Đăng xuất
                    </button>

                </div>

                {/* Statistics */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">

                    <div className="bg-white rounded-xl p-5 shadow">

                        <h3 className="font-semibold">
                            Today's Routes
                        </h3>

                       <p className="text-3xl mt-2">
    {
        assignedRoutes.filter(
            route => route.status === "Completed"
        ).length
    }
</p>

                    </div>

                    <div className="bg-white rounded-xl p-5 shadow">

                        <h3 className="font-semibold">
                            Pending Tasks
                        </h3>

                        <p className="text-3xl mt-2">
                            {
                                complaints.filter(
                                    item => item.status === "Chưa xử lý"
                                ).length
                            }
                        </p>

                    </div>

                    <div className="bg-white rounded-xl p-5 shadow">

                        <h3 className="font-semibold">
                            Completed
                        </h3>

                        <p className="text-3xl mt-2">
                            {
                                complaints.filter(
                                    item => item.status === "Đang xử lý"
                                ).length
                            }
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
<button
    onClick={() => handleCompleteRoute(item.id)}
    disabled={item.status === "Completed"}
    className="bg-green-500 text-white px-3 py-1 rounded mt-2 disabled:bg-gray-400"
>
    {
        item.status === "Completed"
            ? "Đã hoàn thành"
            : "Hoàn thành tuyến"
    }
</button>
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

                                <p>
                                    <strong>Trạng thái:</strong> {item.status}
                                </p>

                                <button
                                    onClick={() => handleStartComplaint(item.id)}
                                    disabled={item.status === "Đang xử lý"}
                                    className="bg-blue-500 text-white px-3 py-1 rounded mt-2 disabled:bg-gray-400"
                                >
                                    {
                                        item.status === "Đang xử lý"
                                            ? "Đang xử lý"
                                            : "Bắt đầu xử lý"
                                    }
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
    value={incidentReport}
    onChange={(e) => setIncidentReport(e.target.value)}
/>

                   <button
    onClick={handleSendReport}
    className="bg-red-500 text-white px-4 py-2 rounded mt-3"
>
    Gửi báo cáo
</button>
                </div>

            </div>

        </div>
    );
}