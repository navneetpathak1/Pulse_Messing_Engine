import { User } from "lucide-react";

const Avatar = ({ src, alt, size = "md" }) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8"
  };

  if (!src) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden`}>
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center">
          <User className={`${iconSizes[size]} text-primary/70`} />
        </div>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden`}>
      <img
        src={src}
        alt={alt || "User avatar"}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default Avatar; 