import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import axios from "axios";

const PaymentPage = () => {
  const { authUser } = useAuthStore();
  const [balance, setBalance] = useState(0);
  const [receiverId, setReceiverId] = useState("");
  const [amount, setAmount] = useState("");
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await axios.get(`/api/payments/balance/${authUser._id}`);
      setBalance(response.data.balance);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate passkey
    if (passkey !== "1234") {
      setError("Invalid passkey");
      return;
    }

    // Validate amount
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (amountNum > balance) {
      setError("Insufficient balance");
      return;
    }

    try {
      const response = await axios.post("/api/payments/send", {
        senderId: authUser._id,
        receiverId,
        amount: amountNum,
      });

      setSuccess("Payment sent successfully!");
      setBalance(response.data.senderBalance);
      setReceiverId("");
      setAmount("");
      setPasskey("");
    } catch (error) {
      setError(error.response?.data?.error || "Failed to send payment");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-base-100 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Send Payment</h2>
      
      <div className="mb-6 p-4 bg-base-200 rounded-lg">
        <p className="text-sm text-base-content/70">Available Balance</p>
        <p className="text-2xl font-bold">₹{balance.toLocaleString()}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Receiver ID</label>
          <input
            type="text"
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            className="input input-bordered w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input input-bordered w-full"
            min="0.01"
            step="0.01"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Passkey</label>
          <input
            type="password"
            value={passkey}
            onChange={(e) => setPasskey(e.target.value)}
            className="input input-bordered w-full"
            required
          />
        </div>

        {error && (
          <div className="text-error text-sm">{error}</div>
        )}

        {success && (
          <div className="text-success text-sm">{success}</div>
        )}

        <button
          type="submit"
          className="btn btn-primary w-full"
        >
          Send Payment
        </button>
      </form>
    </div>
  );
};

export default PaymentPage; 