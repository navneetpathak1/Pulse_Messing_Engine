import User from "../models/user.model.js";
import mongoose from "mongoose";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const sendPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { senderId, receiverId, amount, passkey } = req.body;

    // Validate required fields
    if (!senderId || !receiverId || !amount || !passkey) {
      await session.abortTransaction();
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate amount
    if (amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    // Get sender and receiver
    const sender = await User.findById(senderId).session(session);
    const receiver = await User.findById(receiverId).session(session);

    if (!sender || !receiver) {
      await session.abortTransaction();
      return res.status(404).json({ error: "User not found" });
    }

    // Validate passkey
    if (sender.passkey !== passkey) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Invalid passkey" });
    }

    // Check sender's balance
    if (sender.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Update balances
    sender.balance -= amount;
    receiver.balance += amount;

    await sender.save({ session });
    await receiver.save({ session });

    await session.commitTransaction();

    // Notify receiver about the payment
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("paymentReceived", {
        amount,
        senderName: sender.fullName,
        newBalance: receiver.balance
      });
    }

    // Return updated balances
    res.status(200).json({
      success: true,
      senderBalance: sender.balance,
      receiverBalance: receiver.balance
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in sendPayment:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    session.endSession();
  }
};

export const getBalance = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('balance');

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Ensure balance is a number
    const balance = typeof user.balance === 'number' ? user.balance : 45000;

    res.status(200).json({ balance });
  } catch (error) {
    console.error("Error in getBalance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}; 