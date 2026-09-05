// backend/routes/portfolioRoutes.js
// Public routes — no auth required, only published projects are ever returned.

const express = require("express");
const router = express.Router();
const { prisma } = require("../config/db");

// GET /api/portfolio/projects?category=BUSINESS
// Returns published projects, optionally filtered by category, for the grid.
router.get("/projects", async (req, res) => {
  try {
    const { category } = req.query;

    const projects = await prisma.project.findMany({
      where: {
        published: true,
        ...(category && category !== "ALL" ? { category } : {}),
      },
      orderBy: [{ featured: "desc" }, { displayOrder: "asc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        summary: true,
        featured: true,
        images: {
          orderBy: { displayOrder: "asc" },
          take: 1,
          select: { url: true },
        },
      },
    });

    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load projects" });
  }
});

// GET /api/portfolio/projects/:slug
// Returns one published project with its full ordered image + description narrative.
router.get("/projects/:slug", async (req, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: { slug: req.params.slug, published: true },
      include: {
        images: { orderBy: { displayOrder: "asc" } },
      },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load project" });
  }
});

module.exports = router;