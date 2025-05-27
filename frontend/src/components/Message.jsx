import { format } from "date-fns";
import UserAvatar from "./UserAvatar";

const Message = ({ message, isOwnMessage }) => {
  return (
    <div className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
      <UserAvatar 
        user={message.sender} 
        size="sm"
        className="flex-shrink-0"
      />
      
      <div className={`flex flex-col gap-1 ${isOwnMessage ? "items-end" : ""}`}>
        {!isOwnMessage && (
          <span className="text-sm font-medium text-base-content/80">
            {message.sender.fullName}
          </span>
        )}
        
        <div className="flex items-end gap-2">
          <div
            className={`rounded-2xl px-4 py-2 max-w-[80%] break-words
              ${isOwnMessage 
                ? "bg-primary text-primary-content" 
                : "bg-base-200 text-base-content"
              }`}
          >
            {message.text}
            {message.image && (
              <img
                src={message.image}
                alt="Message attachment"
                className="mt-2 rounded-lg max-w-full"
              />
            )}
          </div>
          <span className="text-xs text-base-content/60">
            {format(new Date(message.timestamp), "HH:mm")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Message; 