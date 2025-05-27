import Avatar from "./Avatar";

const UserAvatar = ({ user, showStatus = false, size = "md", className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      <Avatar 
        src={user?.photoURL} 
        alt={user?.fullName} 
        size={size}
      />
      
      {showStatus && user?.isOnline && (
        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-success ring-2 ring-base-100" />
      )}
    </div>
  );
};

export default UserAvatar; 