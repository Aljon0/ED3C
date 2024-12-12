import Tooltip from "./Tooltip";

function SaveButton(){
    return(<>
        <div className="absolute top-4 right-28 flex gap-2 bg-[#2F424B] p-2 rounded-lg">
            <div className="relative">
                <Tooltip text="Save">
                    <img
                    src="/assets/material-symbols--save.svg"
                    alt=""
                    className="w-8 h-8"
                    />
                </Tooltip>
            </div>
        </div>
    </>)
}
export default SaveButton;