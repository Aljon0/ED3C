import OwnerHeader from "../components/OwnerHeader";
import OwnerSideBar from "../components/OwnerSideBar";
import DashboardCharts from "../components/DashboardCharts";

function Dashboard() {
    return (
        <>
            <OwnerHeader />
            <OwnerSideBar />
            <main className="ml-64 p-8">
                <DashboardCharts />
            </main>
        </>
    );
}

export default Dashboard;