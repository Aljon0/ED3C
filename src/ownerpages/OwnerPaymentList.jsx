import OwnerHeader from "../components/OwnerHeader.jsx";
import OwnerSideBar from "../components/OwnerSideBar.jsx";

function OwnerPaymentList(){

    return(<>
          <OwnerHeader/>
          <OwnerSideBar/>
          <main className="ml-64 p-8 mt-16">
            <div className="w-[950px] h-[335px] bg-[#FAFAFA] rounded-md p-6">
                <span className="font-bold text-[#37474F] text-4xl">Partial Payment List</span>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NO.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NAME</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ITEM NAME</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PRICE</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">1.</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Al-jon Santiago</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Gravestone</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">550</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="w-[950px] h-[335px] bg-[#FAFAFA] rounded-md p-6 mt-8">
                <span className="font-bold text-[#37474F] text-4xl">Full Payment List</span>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NO.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NAME</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ITEM NAME</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PRICE</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">1.</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Yvan Tobis</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Table Signs</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">550</td>
                        </tr>
                    </tbody>
                </table>
            </div>
          </main>
          </>)
}
export default OwnerPaymentList;