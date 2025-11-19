import Contact from "../schemas/Contact.js";

export const createContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const doc = new Contact({ name, email, subject, message });
    await doc.save();

    // Optionally: send an email to support or create admin notification here

    return res.status(201).json({ message: "Message received" });
  } catch (err) {
    console.error("Contact POST error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
