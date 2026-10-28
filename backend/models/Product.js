const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    catalogId: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
    stock: {
      type: Number,
      required: true,
    },
    stockVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    stockMode: {
      type: String,
      enum: ["verified", "demo", "unknown"],
      default: "unknown",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index(
  { catalogId: 1 },
  {
    unique: true,
    partialFilterExpression: { catalogId: { $type: "string" } },
  }
);

module.exports = mongoose.model("Product", productSchema);
