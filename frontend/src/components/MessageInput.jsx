import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image as ImageIcon, Send, X, DollarSign } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState("₹");
  const [showMoneyPanel, setShowMoneyPanel] = useState(false);
  const [amount, setAmount] = useState("");
  const [passkey, setPasskey] = useState("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [balance, setBalance] = useState(45000);
  const fileInputRef = useRef(null);
  const { sendMessage, selectedUser } = useChatStore();
  const { authUser, socket } = useAuthStore();

  // Listen for payment notifications
  useEffect(() => {
    if (!socket) return;

    socket.on("paymentReceived", (data) => {
      toast.success(`Received ${selectedCurrency}${formatAmount(data.amount)} from ${data.senderName}`);
      setBalance(data.newBalance);
    });

    return () => {
      socket.off("paymentReceived");
    };
  }, [socket, selectedCurrency]);

  // Get the other user's ID from the chat
  const getReceiverId = () => {
    if (!selectedUser) return null;
    return selectedUser._id;
  };

  // Fetch user's balance when money panel is opened
  const fetchBalance = async () => {
    try {
      const response = await axiosInstance.get(`/payments/balance/${authUser._id}`);
      // Check if response has data and balance property
      if (response.data && typeof response.data.balance === 'number') {
        setBalance(response.data.balance);
      } else {
        console.error("Invalid balance received:", response.data);
        // Set default balance if API fails
        setBalance(45000);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      // Set default balance if API fails
      setBalance(45000);
      toast.error("Failed to fetch balance");
    }
  };

  const handleMoneyPanelToggle = () => {
    if (!showMoneyPanel) {
      const receiverId = getReceiverId();
      if (!receiverId) {
        toast.error("Please select a chat to send money");
        return;
      }
      fetchBalance();
    }
    setShowMoneyPanel(!showMoneyPanel);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and one decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleSendMoney = async (e) => {
    e.preventDefault();
    
    const receiverId = getReceiverId();
    if (!receiverId) {
      toast.error("Please select a chat to send money");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (parseFloat(amount) > balance) {
      toast.error("Insufficient balance");
      return;
    }

    if (!passkey) {
      toast.error("Please enter your passkey");
      return;
    }

    try {
      const response = await axiosInstance.post("/payments/send", {
        senderId: authUser._id,
        receiverId: receiverId,
        amount: parseFloat(amount),
        passkey: passkey
      });

      if (response.data.success) {
        toast.success(`Successfully sent ${selectedCurrency}${formatAmount(amount)}`);
        setBalance(response.data.senderBalance);
        setAmount("");
        setPasskey("");
        setShowMoneyPanel(false);
      } else {
        toast.error(response.data.error || "Failed to send payment");
      }
    } catch (error) {
      console.error("Payment error:", error.response?.data);
      toast.error(error.response?.data?.error || "Failed to send payment");
    }
  };

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
    // Handle NaN, undefined, or null
    if (!value || isNaN(value)) return "0";
    // Format the number with commas
    return new Intl.NumberFormat('en-IN').format(Number(value));
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
              onClick={handleMoneyPanelToggle}
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
          ${showMoneyPanel ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="flex flex-col gap-3 p-3 bg-base-200/50 rounded-lg">
            <div className="flex items-center gap-3">
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
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="Enter amount"
                  />
                </div>
                <div className="text-sm text-base-content/60">
                  Balance: {selectedCurrency}{formatAmount(balance)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="password"
                  className="input input-bordered input-sm w-full"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="Enter your passkey"
                />
              </div>
              <button
                onClick={handleSendMoney}
                disabled={!amount || !passkey || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
                className="btn btn-success btn-sm hover:scale-105 active:scale-95 transition-transform"
              >
                Send Money
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default MessageInput;