import { NavLink } from 'react-router-dom';

function OwnerSideBar() {
    return (
        <>
            <div className="flex">
                <aside className="fixed top-0 left-0 w-64 h-full bg-[#37474F] text-white pt-24 overflow-y-auto">
                    <div className="flex flex-col items-center mb-10">
                        <img src="/assets/mingcute--user-4-line.svg" alt="User Image" className="rounded-full w-20 h-20 mb-4" />
                        <h2 className="text-xl font-semibold text-white leading-3">Owner</h2>
                    </div>
                    <nav className="flex flex-col space-y-2 px-4">
                        <NavLink
                            to="/owner/messages"
                            className={({ isActive }) =>
                                `group flex items-center text-base font-medium p-2 rounded-md ${
                                    isActive ? 'bg-[#576c75] text-white' : 'text-gray-200 hover:bg-[#576c75] hover:text-white'
                                }`
                            }
                        >
                            <img src="/assets/mi--message.svg" className="w-6 h-6 mr-2 group-hover:fill-current group-hover:text-white" />Message
                        </NavLink>
                        <NavLink
                            to="/owner/CustomizeDesign"
                            className={({ isActive }) =>
                                `group flex items-center text-base font-medium p-2 rounded-md ${
                                    isActive ? 'bg-[#576c75] text-white' : 'text-gray-200 hover:bg-[#576c75] hover:text-white'
                                }`
                            }
                        >
                            <img
                                src="/assets/ic--outline-design-services.svg"
                                className="w-6 h-6 mr-2 group-hover:fill-current group-hover:text-white"
                            />
                            CustomizeDesign
                        </NavLink>
                        <NavLink
                            to="/owner/orders"
                            className={({ isActive }) =>
                                `group flex items-center text-base font-medium p-2 rounded-md ${
                                    isActive ? 'bg-[#576c75] text-white' : 'text-gray-200 hover:bg-[#576c75] hover:text-white'
                                }`
                            }
                        >
                            <img src="/assets/mdi--cart-outline.svg" className="w-6 h-6 mr-2 group-hover:fill-current group-hover:text-white" />Orders
                        </NavLink>
                        <NavLink
                            to="/owner/inventory"
                            className={({ isActive }) =>
                                `group flex items-center text-base font-medium p-2 rounded-md ${
                                    isActive ? 'bg-[#576c75] text-white' : 'text-gray-200 hover:bg-[#576c75] hover:text-white'
                                }`
                            }
                        >
                            <img
                                src="/assets/material-symbols--inventory-2-outline.svg"
                                className="w-6 h-6 mr-2 group-hover:fill-current group-hover:text-white"
                            />
                            Inventory
                        </NavLink>
                        <NavLink
                            to="/owner/UserAccount"
                            className={({ isActive }) =>
                                `group flex items-center text-base font-medium p-2 rounded-md ${
                                    isActive ? 'bg-[#576c75] text-white' : 'text-gray-200 hover:bg-[#576c75] hover:text-white'
                                }`
                            }
                        >
                            <img
                                src="/assets/ri--user-settings-line.svg"
                                className="w-6 h-6 mr-2 group-hover:fill-current group-hover:text-white"
                            />
                            User Accounts
                        </NavLink>
                        <NavLink
                            to="/owner/design"
                            className={({ isActive }) =>
                                `group flex items-center text-base font-medium p-2 rounded-md ${
                                    isActive ? 'bg-[#576c75] text-white' : 'text-gray-200 hover:bg-[#576c75] hover:text-white'
                                }`
                            }
                        >
                            <img
                                src="/assets/ic--outline-design-services.svg"
                                className="w-6 h-6 mr-2 group-hover:fill-current group-hover:text-white"
                            />
                            Designs
                        </NavLink>
                        <NavLink
                            to="/owner/PaymentList"
                            className={({ isActive }) =>
                                `group flex items-center text-base font-medium p-2 rounded-md ${
                                    isActive ? 'bg-[#576c75] text-white' : 'text-gray-200 hover:bg-[#576c75] hover:text-white'
                                }`
                            }
                        >
                            <img
                                src="/assets/solar--bill-list-outline.svg"
                                className="w-6 h-6 mr-2 group-hover:fill-current group-hover:text-white"
                            />
                            Payment List
                        </NavLink>
                        <NavLink
                            to="/owner/reports"
                            className={({ isActive }) =>
                                `group flex items-center text-base font-medium p-2 rounded-md ${
                                    isActive ? 'bg-[#576c75] text-white' : 'text-gray-200 hover:bg-[#576c75] hover:text-white'
                                }`
                            }
                        >
                            <img
                                src="/assets/mdi--chart-box-multiple-outline.svg"
                                className="w-6 h-6 mr-2 group-hover:fill-current group-hover:text-white"
                            />
                            Reports
                        </NavLink>
                        <NavLink
                            to="/owner/PaymentAccess"
                            className={({ isActive }) =>
                                `group flex items-center text-base font-medium p-2 rounded-md ${
                                    isActive ? 'bg-[#576c75] text-white' : 'text-gray-200 hover:bg-[#576c75] hover:text-white'
                                }`
                            }
                        >
                            <img
                                src="/assets/ri--secure-payment-line.svg"
                                className="w-6 h-6 mr-2 group-hover:fill-current group-hover:text-white"
                            />
                            Payment Access
                        </NavLink>
                    </nav>
                </aside>
            </div>
        </>
    );
}

export default OwnerSideBar;
