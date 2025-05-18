import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image as ImageIcon, Send, X, DollarSign } from "lucide-react";
import toast from "react-hot-toast";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState("₹");
  const [showMoneyPanel, setShowMoneyPanel] = useState(false);
  const [amount, setAmount] = useState(15000);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target.result;

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Maintain aspect ratio while resizing
            if (width > height) {
              if (width > 800) {
                height = Math.round((height * 800) / width);
                width = 800;
              }
            } else {
              if (height > 800) {
                width = Math.round((width * 800) / height);
                height = 800;
              }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to JPEG with reduced quality
            const compressedImage = canvas.toDataURL('image/jpeg', 0.6);
            
            // Verify the compressed size
            const base64str = compressedImage.split('base64,')[1];
            const decoded = atob(base64str);
            const compressedSize = decoded.length;
            
            if (compressedSize > MAX_FILE_SIZE) {
              reject(new Error('Image is too large even after compression'));
              return;
            }
            
            resolve(compressedImage);
          } catch (error) {
            reject(error);
          }
        };
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
    });
  };

  const handleImageChange = async (e) => {
    try {
      setIsProcessingImage(true);
      const file = e.target.files[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error("Image size should be less than 1MB");
        return;
      }

      // Compress image before preview
      const compressedImage = await compressImage(file);
      setImagePreview(compressedImage);
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error(error.message || "Failed to process image. Please try again.");
      removeImage();
    } finally {
      setIsProcessingImage(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      const messageData = {
        text: text.trim(),
        image: imagePreview,
      };

      await sendMessage(messageData);

      // Clear form
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  };

  const formatAmount = (value) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  const handleSendMoney = (e) => {
    e.preventDefault();
    const formattedAmount = formatAmount(amount);
    
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
        max-w-md w-full bg-base-100 shadow-lg rounded-lg pointer-events-auto 
        flex ring-1 ring-black ring-opacity-5`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-success" />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-base-content">
                Money Sent Successfully!
              </p>
              <p className="mt-1 text-sm text-base-content/60">
                {selectedCurrency}{formattedAmount} has been sent
              </p>
            </div>
          </div>
        </div>
      </div>
    ), { duration: 3000 });

    setAmount(prev => Math.max(0, prev - 5000));
    setTimeout(() => setShowMoneyPanel(false), 1000);
  };

  return (
    <div className="p-4 w-full space-y-4">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-base-300"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center hover:bg-base-content/20 transition-colors"
              type="button"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              className="w-full input input-bordered rounded-lg input-sm sm:input-md"
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
              disabled={isProcessingImage}
            />

            <button
              type="button"
              className={`hidden sm:flex btn btn-circle btn-sm sm:btn-md
                       ${isProcessingImage ? "loading" : ""} 
                       ${imagePreview ? "text-success" : "text-base-content/40"}`}
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingImage}
            >
              {!isProcessingImage && <ImageIcon className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMoneyPanel(!showMoneyPanel)}
              className={`btn btn-circle btn-sm sm:btn-md ${showMoneyPanel ? 'btn-primary' : 'btn-ghost'} 
              hover:scale-105 active:scale-95 transition-transform`}
            >
              <DollarSign className="w-5 h-5" />
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-circle btn-sm sm:btn-md"
              disabled={(!text.trim() && !imagePreview) || isProcessingImage}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Send Money Panel */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out
          ${showMoneyPanel ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
            <div className="flex-1 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="select select-sm select-bordered"
                >
                  <option value="₹">₹ INR</option>
                  <option value="$">$ USD</option>
                  <option value="€">€ EUR</option>
                </select>
                <input
                  type="text"
                  className="input input-bordered input-sm w-28"
                  value={`${formatAmount(amount)}`}
                  readOnly
                />
              </div>
            </div>
            <button
              onClick={handleSendMoney}
              disabled={amount <= 0}
              className="btn btn-success btn-sm hover:scale-105 active:scale-95 transition-transform"
            >
              Send Money
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default MessageInput;