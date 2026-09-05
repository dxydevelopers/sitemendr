// backend/routes/portfolioAdminRoutes.js
// Admin-only CRUD for portfolio projects. Mounted at /api/admin/portfolio
// (parallel to /api/admin/notification-rules).
//
// Images are managed as part of the project payload: the client sends the
// full ordered image list on every save, and this replaces the project's
// images wholesale in a transaction — simpler than granular per-image
// endpoints, and matches how few images a single project realistically has.

const express = require("express");
const router = express.Router();
const { prisma } = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");

router.use(authenticate, requireAdmin);

// GET /api/admin/portfolio/projects
// Every project, published and draft, for the admin list view.
router.get("/projects", async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      include: {
        images: { orderBy: { displayOrder: "asc" } },
      },
    });
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load projects" });
  }
});

// GET /api/admin/portfolio/projects/:id
router.get("/projects/:id", async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { images: { orderBy: { displayOrder: "asc" } } },
    });
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load project" });
  }
});

// POST /api/admin/portfolio/projects
// body: { title, slug, category, summary, problem, decision, result,
//         liveUrl, featured, published, images: [{ url, description, displayOrder }] }
router.post("/projects", async (req, res) => {
  try {
    const { images = [], ...projectData } = req.body;

    const project = await prisma.project.create({
      data: {
        ...projectData,
        images: {
          create: images.map((img, i) => ({
            url: img.url,
            description: img.description,
            displayOrder: img.displayOrder ?? i,
          })),
        },
      },
      include: { images: { orderBy: { displayOrder: "asc" } } },
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ success: false, message: "That slug is already in use" });
    }
    res.status(500).json({ success: false, message: "Failed to create project" });
  }
});

// PUT /api/admin/portfolio/projects/:id
// Same body shape as POST. Images are replaced wholesale.
router.put("/projects/:id", async (req, res) => {
  try {
    const { images = [], ...projectData } = req.body;
    const { id } = req.params;

    const project = await prisma.$transaction(async (tx) => {
      await tx.projectImage.deleteMany({ where: { projectId: id } });

      return tx.project.update({
        where: { id },
        data: {
          ...projectData,
          images: {
            create: images.map((img, i) => ({
              url: img.url,
              description: img.description,
              displayOrder: img.displayOrder ?? i,
            })),
          },
        },
        include: { images: { orderBy: { displayOrder: "asc" } } },
      });
    });

    res.json({ success: true, data: project });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ success: false, message: "That slug is already in use" });
    }
    res.status(500).json({ success: false, message: "Failed to update project" });
  }
});

// POST /api/admin/portfolio/projects/:id/publish
// Quick toggle from the list view — doesn't require the full form payload.
// (POST, not PATCH — apiClient.ts only exposes get/post/put/delete generically.)
router.post("/projects/:id/publish", async (req, res) => {
  try {
    const { published } = req.body;
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { published: Boolean(published) },
    });
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update publish status" });
  }
});

// DELETE /api/admin/portfolio/projects/:id
// ProjectImage rows cascade-delete via the schema's onDelete: Cascade.
router.delete("/projects/:id", async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Project deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete project" });
  }
});

module.exports = router;