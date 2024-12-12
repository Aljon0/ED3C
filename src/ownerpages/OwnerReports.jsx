import OwnerHeader from "../components/OwnerHeader.jsx";
import OwnerSideBar from "../components/OwnerSideBar.jsx";

function OwnerReports(){
    
    return(<>
        <OwnerHeader/>
        <OwnerSideBar/>
        <main className="ml-64 p-8 mt-16">
            {/*Container for Order Status*/}
            <div className="w-[950px] h-[670px] bg-[#FAFAFA] rounded-md p-6">
                {/*Title*/}
                <div className="flex">
                    <span className="text-4xl text-[#2F424B] font-semibold mb-4 block">REPORTS</span>
                    <span className="text-[#333333] text-4xl ml-96">Generate Reports</span>
                    <img src="/assets/fluent--document-data-24-regular.svg" className="cursor-pointer ml-2 mb-2"/>
                    <hr className="border-2 border-solid border-[#333333]"/>
                </div>
                {/*Table for Order Details*/}
                
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CUSTOMER'S NAME</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ITEM NAME</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE ORDERED</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PAYMENT TYPE</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EXPECTED DATE/TIME</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Al-jon Santiago</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Gravestone</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">07-31-2024</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">FULL PAYMENT</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">FINISHED</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500 cursor-pointer">CANCEL / DELETE</td>
                            </tr>
                        </tbody>
                    </table>
            </div>
        </main>
          </>)
}
export default OwnerReports;