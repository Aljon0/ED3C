import UserHeader from "../components/UserHeader.jsx";
import UserSideBar from "../components/UserSideBar.jsx";

function Orders(){

    return(<>
            <UserHeader/>
            <UserSideBar/>
            <main className="ml-64 p-8 mt-16">
            {/*Container for Order Status*/}
            <div className="w-[950px] h-[670px] bg-[#FAFAFA] rounded-md p-6">
                {/*Title*/}
                <span className="text-4xl text-[#2F424B] font-semibold mb-4 block">ORDER STATUS</span>
                
                {/*Table for Order Details*/}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ITEM NAME</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE ORDERED</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PRICE</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EXPECTED DATE/TIME</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Gravestone</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">07-31-2024</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">500</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">FINISHED</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500 cursor-pointer">CANCEL / DELETE</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
        
          </>)
}
export default Orders;