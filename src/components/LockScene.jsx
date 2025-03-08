function LockScene({ isLocked, onToggleLock }) {
  return (
    <div className="absolute top-60 ml-4 transform -translate-y-1/2 flex flex-col gap-2 bg-[#2F424B] p-2 rounded-lg cursor-pointer hover:bg-[#435964]" onClick={onToggleLock}>
      <img
        src={isLocked ? "/assets/ic--baseline-lock.svg" : "/assets/basil--unlock-solid.svg"}
        alt={isLocked ? "Locked" : "Unlocked"}
        className="w-full h-full"
      />
    </div>
  );
}
export default LockScene;