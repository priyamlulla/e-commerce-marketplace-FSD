const express = require("express");
const { body, matchedData } = require("express-validator");
const Product = require("../models/Product");
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

const validateProduct = [
  body("name").isString().withMessage("Name must be a string").bail().trim().notEmpty().withMessage("Name is required"),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a non-negative number").toFloat(),
  body("category").isString().withMessage("Category must be a string").bail().trim().notEmpty().withMessage("Category is required"),
  body("description").optional().isString().withMessage("Description must be a string").trim(),
  body("stock").isInt({ min: 0 }).withMessage("Stock must be a non-negative integer").toInt(),
];

function validateProductId(req, res, next) {
  if (!/^[0-9a-f]{24}$/i.test(req.params.id)) {
    return res.status(400).json({ message: "Invalid product id" });
  }

  return next();
}

router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  validateProduct,
  validateRequest,
  async (req, res) => {
    const product = await Product.create(matchedData(req, { locations: ["body"] }));
    res.status(201).json(product);
  }
);

router.get("/", async (req, res) => {
  const products = await Product.find();
  res.status(200).json(products);
});

router.get("/:id", validateProductId, async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    const error = new Error("Not found");
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json(product);
});

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  validateProductId,
  validateProduct,
  validateRequest,
  async (req, res) => {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: matchedData(req, { locations: ["body"] }) },
      { new: true, runValidators: true }
    );

    if (!product) {
      const error = new Error("Not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json(product);
  }
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  validateProductId,
  async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      const error = new Error("Not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      message: "Product deleted successfully",
      product,
    });
  }
);

module.exports = router;
