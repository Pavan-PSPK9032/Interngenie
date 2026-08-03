const router = require("express").Router();
const {
  getMyCertificates,
  getPublicCertificates,
  addCertificate,
  updateCertificate,
  deleteCertificate,
  getCategories,
} = require("../controllers/certificateController");

router.get("/", getMyCertificates);
router.get("/categories", getCategories);
router.post("/", addCertificate);
router.patch("/:id", updateCertificate);
router.delete("/:id", deleteCertificate);
router.get("/public/:userId", getPublicCertificates);

module.exports = router;
